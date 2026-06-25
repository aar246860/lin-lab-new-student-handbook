import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

const chapterPages = [
  ["src/content/docs/lab-handbook/chapter-1-rules.md", "第一章 規則與辦法（須知）"],
  ["src/content/docs/lab-handbook/chapter-2-writing.md", "第二章 論文撰寫"],
  ["src/content/docs/lab-handbook/chapter-3-writing-references.md", "第三章 寫作參考"],
  ["src/content/docs/lab-handbook/chapter-4-tools.md", "第四章 研究相關輔助資料"],
  ["src/content/docs/lab-handbook/chapter-5-methods.md", "第五章 方法篇"],
  ["src/content/docs/lab-handbook/chapter-6-memos.md", "第六章 備忘"]
];

const sensitivePatterns = [
  /[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /09[0-9]{8}/,
  /0[0-9]{1,3}[- ][0-9]{6,8}/,
  /0[0-9]{1,3}[- ][0-9]{3,4}[- ][0-9]{3,4}/,
  /葉弘德/,
  /黃彦祯|黄彦祯|黃彥禎|黄彥禎/,
  /陳彦如|陳彥如/,
  /張雅琪/,
  /GW通錄/,
  /IP address/,
  /duty\.doc/,
  /D:IGw|D:E-journal|C:\\|C:WINDOWS|C:\\TEC/,
  /\[REDACTED_/
];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function walkFiles(relativeDir, extensions) {
  const start = path.join(root, relativeDir);
  const files = [];
  for (const entry of readdirSync(start)) {
    const absolutePath = path.join(start, entry);
    const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
    if (statSync(absolutePath).isDirectory()) {
      files.push(...walkFiles(relativePath, extensions));
    } else if (extensions.includes(path.extname(entry))) {
      files.push(relativePath);
    }
  }
  return files;
}

test("student-facing handbook pages exist without exposing maintenance notes", () => {
  const handbookPages = [
    "src/content/docs/lab-handbook/index.md",
    "src/content/docs/lab-handbook/operations.md",
    "src/content/docs/lab-handbook/research-training.md",
    "src/content/docs/lab-handbook/writing-publication.md",
    "src/content/docs/lab-handbook/ai-workflow.md",
    "src/content/docs/lab-handbook/skill-pack.md",
    ...chapterPages.map(([relativePath]) => relativePath)
  ];

  for (const relativePath of handbookPages) {
    assert.ok(exists(relativePath), `${relativePath} is missing`);
  }

  const combined = handbookPages.map(read).join("\n");
  for (const requiredPhrase of [
    "新生入門",
    "第一週先完成",
    "第一個月要練會",
    "問問題前先準備",
    "交資料的基本要求",
    "第 1 章：規則與辦法",
    "第 2 章：論文撰寫",
    "第 3 章：寫作書籍精簡內容",
    "第 4 章：研究相關輔助資料",
    "第 5 章：方法篇",
    "第 6 章：備忘",
    "Group Seminar",
    "Presentation",
    "Author Guide",
    "cover letter",
    "AI Agent",
    "Lagging Darcy"
  ]) {
    assert.ok(combined.includes(requiredPhrase), `handbook missing ${requiredPhrase}`);
  }

  for (const maintenancePhrase of [
    "去識別完整稿",
    "完整去識別母稿",
    "來源狀態",
    "章節邊界",
    "OCR source pages",
    "source-page:",
    "source-range:",
    "Source image:",
    "Average confidence:",
    "Redaction status:",
    "[REDACTED_",
    "PXL_20260625",
    "~~~text",
    "超人氣",
    "地下水研究室手册"
  ]) {
    assert.ok(!combined.includes(maintenancePhrase), `student-facing handbook exposes ${maintenancePhrase}`);
  }
});

test("chapter pages are formatted as readable handbook chapters, not raw OCR dumps", () => {
  for (const [relativePath, title] of chapterPages) {
    const content = read(relativePath);
    assert.match(content, new RegExp(`# ${title}`), `${relativePath} missing chapter title`);
    assert.match(content, /^## /m, `${relativePath} should contain section headings`);
    assert.doesNotMatch(content, /~~~text|<!-- source-page:|<!-- source-range:|^## 頁 [0-9]{3}：/m, `${relativePath} still looks like a raw OCR page`);
  }

  assert.match(read("src/content/docs/lab-handbook/chapter-1-rules.md"), /每週師生會面要點/, "chapter 1 should contain cleaned meeting guidance");
  assert.match(read("src/content/docs/lab-handbook/chapter-2-writing.md"), /論文撰寫須提早規劃/, "chapter 2 should contain cleaned writing guidance");
  assert.match(read("src/content/docs/lab-handbook/chapter-6-memos.md"), /列印與掃描/, "chapter 6 should contain cleaned operations guidance");
});

test("redacted public handbook pages do not expose known private identifiers", () => {
  const publicHandbookFiles = walkFiles("src/content/docs/lab-handbook", [".md", ".mdx"]);
  for (const relativePath of publicHandbookFiles) {
    const content = read(relativePath);
    for (const sensitivePattern of sensitivePatterns) {
      assert.doesNotMatch(content, sensitivePattern, `${relativePath} exposes ${sensitivePattern}`);
    }
  }
});

test("OCR publishing pipeline and private-source ignore rules are present", () => {
  assert.ok(exists("scripts/gwguide_ocr.py"), "OCR script is missing");
  assert.match(read("scripts/gwguide_ocr.py"), /RapidOCR/, "OCR script should use the available local RapidOCR engine");
  assert.ok(exists("scripts/build-gwguide-source-corpus.mjs"), "source corpus builder is missing");
  assert.ok(exists("scripts/publish-redacted-handbook-page.mjs"), "redacted full-draft publisher is missing");
  assert.ok(exists("scripts/publish-redacted-handbook-chapters.mjs"), "internal redacted chapter draft publisher is missing");
  assert.ok(exists("internal/lab-handbook-sources/redacted-full-draft.md"), "internal redacted full draft is missing");
  assert.ok(exists("internal/lab-handbook-sources/source-boundary.md"), "internal source boundary note is missing");
  assert.ok(exists("internal/lab-handbook-sources/source-derived-outline.md"), "internal source outline note is missing");
  assert.ok(exists("internal/lab-handbook-sources/source-coverage.md"), "internal source coverage note is missing");
  assert.match(
    read("scripts/publish-redacted-handbook-chapters.mjs"),
    /internal\/lab-handbook-sources\/redacted-chapter-drafts/,
    "redacted chapter draft publisher must write to internal notes, not public docs"
  );
  assert.match(
    read("package.json"),
    /publish-handbook/,
    "package scripts should expose a one-command handbook regeneration path"
  );
  assert.doesNotMatch(
    read("package.json"),
    /publish-redacted-handbook-chapters/,
    "publish-handbook must not overwrite cleaned public chapters with OCR drafts"
  );
  assert.match(
    read("scripts/publish-redacted-handbook-page.mjs"),
    /internal\/lab-handbook-sources\/redacted-full-draft\.md/,
    "full draft publisher must write to internal notes, not public docs"
  );

  const gitignore = read(".gitignore");
  assert.match(gitignore, /^\.gwguide-private\/$/m, "private OCR output must be gitignored");
  assert.match(gitignore, /^\.tmp_gwguide_preview\/$/m, "temporary previews must be gitignored");
});

test("handbook navigation is registered in Astro Starlight config", () => {
  const config = read("astro.config.mjs");
  for (const slug of [
    "lab-handbook/chapter-1-rules",
    "lab-handbook/chapter-2-writing",
    "lab-handbook/chapter-3-writing-references",
    "lab-handbook/chapter-4-tools",
    "lab-handbook/chapter-5-methods",
    "lab-handbook/chapter-6-memos"
  ]) {
    assert.match(config, new RegExp(slug.replaceAll("/", "\\/")), `Starlight sidebar must expose ${slug}`);
  }

  for (const hiddenSourceSlug of [
    "lab-handbook/redacted-full-draft",
    "lab-handbook/source-boundary",
    "lab-handbook/source-derived-outline",
    "lab-handbook/source-coverage"
  ]) {
    assert.doesNotMatch(config, new RegExp(hiddenSourceSlug.replaceAll("/", "\\/")), `student sidebar should not expose ${hiddenSourceSlug}`);
  }
});

test("project Pages internal links do not escape the repository base path", () => {
  const contentFiles = walkFiles("src/content/docs", [".md", ".mdx"]);
  const forbiddenRootAbsoluteLinks = [
    /^\s*link:\s*\/(?!\/)/m,
    /\]\(\/(?!\/)/m,
    /href=["']\/(?!\/)/m
  ];

  for (const relativePath of contentFiles) {
    const content = read(relativePath);
    for (const pattern of forbiddenRootAbsoluteLinks) {
      assert.doesNotMatch(
        content,
        pattern,
        `${relativePath} contains a root-absolute internal link that breaks GitHub project Pages`
      );
    }
  }
});
