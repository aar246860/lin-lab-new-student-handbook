import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(root, ".gwguide-private/canonical/redacted-complete-ocr-working-draft.md");
const outputDir = path.join(root, "src/content/docs/lab-handbook");

const chapters = [
  {
    slug: "chapter-1-rules",
    title: "第 1 章：規則與辦法",
    description: "研究室規則、暑期工作、檔案管理與簡報規範。",
    range: [1, 19],
    focus: "研究室基本規則、暑期與開學準備、離校交接、檔案程式管理、工具自評、Group Seminar、Presentation 與學術倫理。"
  },
  {
    slug: "chapter-2-writing",
    title: "第 2 章：論文撰寫",
    description: "論文撰寫、校稿、研討會發表與期刊投稿流程。",
    range: [20, 47],
    focus: "論文進度、論文大綱、內容架構、撰寫次序、校稿、英文時態、AGU/WRR references、研討會與期刊投稿。"
  },
  {
    slug: "chapter-3-writing-references",
    title: "第 3 章：寫作書籍精簡內容",
    description: "寫作參考書、研究報告寫作與技術文件寫作摘要。",
    range: [48, 95],
    focus: "研究報告寫作、科學論文寫作、技術文件寫作、中文作者英文科技寫作與寫作參考書摘要。"
  },
  {
    slug: "chapter-4-tools",
    title: "第 4 章：研究相關輔助資料",
    description: "研究工具、資料管理、數值與文件處理輔助資料。",
    range: [96, 134],
    focus: "研究工具、資料管理、數值與文件處理輔助資料；舊工具名保留為歷史脈絡，實際使用前需更新。"
  },
  {
    slug: "chapter-5-methods",
    title: "第 5 章：方法篇",
    description: "研究方法、學習方法、閱讀與寫作工作習慣。",
    range: [135, 161],
    focus: "研究方法、學習方法、問題拆解、閱讀與寫作工作習慣。"
  },
  {
    slug: "chapter-6-memos",
    title: "第 6 章：備忘",
    description: "研究室備忘、設備使用與舊工具操作記錄。",
    range: [162, 165],
    focus: "設備使用、紙張與列印操作、舊工具備忘。"
  }
];

if (!existsSync(inputPath)) {
  console.error(`Missing redacted source draft: ${inputPath}`);
  console.error("Run: node scripts/build-gwguide-source-corpus.mjs");
  process.exit(1);
}

function parsePages(markdown) {
  const lines = markdown.split(/\r?\n/);
  const pages = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+([0-9]{3})_(.+)$/);
    if (headingMatch) {
      if (current) pages.push(current);
      current = {
        number: Number(headingMatch[1]),
        numberText: headingMatch[1],
        fileStem: headingMatch[2].replace(/\.md$/, ""),
        heading: line,
        meta: [],
        body: [],
        inBody: false
      };
      continue;
    }

    if (!current) continue;
    if (!current.inBody) {
      if (line.trim() === "") {
        current.inBody = current.meta.length > 0;
        continue;
      }
      current.meta.push(line);
    } else {
      current.body.push(line);
    }
  }

  if (current) pages.push(current);
  return pages;
}

function yamlString(value) {
  return JSON.stringify(value);
}

function cleanStudentLine(line) {
  if (line.includes("[REDACTED_PAGE:")) return null;
  if (line.includes("[REDACTED_LINE:")) return null;
  if (line.includes("[REDACTED_PHONE]")) return null;

  let cleaned = line
    .replaceAll("[REDACTED_EMAIL]", "作者電子信箱")
    .replaceAll("[REDACTED_LOCAL_PATH]", "指定資料夾")
    .replaceAll("[REDACTED_MAILBOX_FIELD]", "信箱欄位")
    .replaceAll("[REDACTED_MOBILE]", "聯絡電話")
    .replaceAll("[REDACTED_PERSON_NAME]", "姓名");

  if (/^姓名\s*謹識$/.test(cleaned.trim())) return null;
  if (/^姓名\s*[0-9/.-]*\s*(改)?$/.test(cleaned.trim())) return null;
  if (/^摘述者：姓名$/.test(cleaned.trim())) return null;

  return cleaned;
}

function renderPageBlock(page) {
  const bodyLines = page.body
    .map(cleanStudentLine)
    .filter((line) => line !== null);
  const hasVisibleText = bodyLines.some((line) => line.trim() !== "");
  const output = [`<!-- source-page:${page.numberText} -->`];
  if (hasVisibleText) {
    output.push("", "~~~text", ...bodyLines, "~~~", "");
  } else {
    output.push("");
  }
  return output;
}

function renderChapter(chapter, selectedPages) {
  const [start, end] = chapter.range;
  const output = [
    "---",
    `title: ${yamlString(chapter.title)}`,
    `description: ${yamlString(chapter.description)}`,
    "---",
    "",
    `# ${chapter.title}`,
    "",
    `本章重點：${chapter.focus}`,
    `<!-- source-range:${String(start).padStart(3, "0")}-${String(end).padStart(3, "0")} -->`,
    "",
  ];

  for (const page of selectedPages) {
    output.push(...renderPageBlock(page));
  }

  return output.join("\n");
}

const source = readFileSync(inputPath, "utf8");
const pages = parsePages(source);
mkdirSync(outputDir, { recursive: true });

for (const chapter of chapters) {
  const [start, end] = chapter.range;
  const selectedPages = pages.filter((page) => page.number >= start && page.number <= end);
  if (selectedPages.length !== end - start + 1) {
    console.error(`${chapter.slug} expected ${end - start + 1} pages, found ${selectedPages.length}`);
    process.exit(1);
  }
  const outputPath = path.join(outputDir, `${chapter.slug}.md`);
  writeFileSync(outputPath, renderChapter(chapter, selectedPages), "utf8");
  console.log(`Wrote ${outputPath} (${selectedPages.length} pages)`);
}
