import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

const chapterPages = [
  ["src/content/docs/lab-handbook/chapter-1-rules.md", "第 1 章：規則與辦法", "001", "019", 19],
  ["src/content/docs/lab-handbook/chapter-2-writing.md", "第 2 章：論文撰寫", "020", "047", 28],
  ["src/content/docs/lab-handbook/chapter-3-writing-references.md", "第 3 章：寫作書籍精簡內容", "048", "095", 48],
  ["src/content/docs/lab-handbook/chapter-4-tools.md", "第 4 章：研究相關輔助資料", "096", "134", 39],
  ["src/content/docs/lab-handbook/chapter-5-methods.md", "第 5 章：方法篇", "135", "161", 27],
  ["src/content/docs/lab-handbook/chapter-6-memos.md", "第 6 章：備忘", "162", "165", 4]
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
  /D:IGw|D:E-journal|C:\\|C:WINDOWS|C:\\TEC/
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

function pageHeadingCount(markdown) {
  return [...markdown.matchAll(/^## 頁 [0-9]{3}：/gm)].length;
}

test("source-first handbook pages exist and expose the chapterized redacted draft", () => {
  const handbookPages = [
    "src/content/docs/lab-handbook/index.md",
    "src/content/docs/lab-handbook/source-boundary.md",
    "src/content/docs/lab-handbook/source-derived-outline.md",
    "src/content/docs/lab-handbook/source-coverage.md",
    "src/content/docs/lab-handbook/redacted-full-draft.md",
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
    "研究室手冊總覽",
    "去識別完整稿",
    "完整去識別母稿",
    "OCR source pages 001-019",
    "OCR source pages 020-047",
    "OCR source pages 048-095",
    "OCR source pages 096-134",
    "OCR source pages 135-161",
    "OCR source pages 162-165",
    "第 1 章：規則與辦法",
    "第 2 章：論文撰寫",
    "第 3 章：寫作書籍精簡內容",
    "第 4 章：研究相關輔助資料",
    "第 5 章：方法篇",
    "第 6 章：備忘",
    "[REDACTED_PAGE:contact_directory]",
    "Group Seminar",
    "Presentation",
    "Author Guide",
    "cover letter",
    "AI Agent",
    "Lagging Darcy"
  ]) {
    assert.ok(combined.includes(requiredPhrase), `handbook missing ${requiredPhrase}`);
  }
});

test("chapter pages preserve source page ranges from the redacted mother draft", () => {
  let totalPages = 0;

  for (const [relativePath, title, firstPage, lastPage, expectedCount] of chapterPages) {
    const content = read(relativePath);
    assert.match(content, new RegExp(`# ${title}`), `${relativePath} missing chapter title`);
    assert.match(content, new RegExp(`OCR source pages ${firstPage}-${lastPage}`), `${relativePath} missing source range`);
    assert.match(content, new RegExp(`## 頁 ${firstPage}：`), `${relativePath} missing first source page`);
    assert.match(content, new RegExp(`## 頁 ${lastPage}：`), `${relativePath} missing last source page`);
    assert.equal(pageHeadingCount(content), expectedCount, `${relativePath} has wrong page count`);
    totalPages += expectedCount;
  }

  assert.equal(totalPages, 165, "chapterized public pages should cover all 165 OCR source pages");
  assert.match(read("src/content/docs/lab-handbook/chapter-1-rules.md"), /地下水研究室手册/, "chapter 1 should preserve the cover source text");
  assert.match(
    read("src/content/docs/lab-handbook/chapter-6-memos.md"),
    /\[REDACTED_PAGE:contact_directory\]/,
    "chapter 6 must preserve contact-directory redaction markers"
  );
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
  assert.ok(exists("scripts/publish-redacted-handbook-chapters.mjs"), "redacted chapter publisher is missing");
  assert.match(
    read("scripts/publish-redacted-handbook-chapters.mjs"),
    /redacted-complete-ocr-working-draft\.md/,
    "chapter publisher must use the redacted source draft"
  );
  assert.match(
    read("package.json"),
    /publish-handbook/,
    "package scripts should expose a one-command handbook regeneration path"
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
    "lab-handbook/chapter-6-memos",
    "lab-handbook/redacted-full-draft",
    "lab-handbook/source-boundary",
    "lab-handbook/source-derived-outline",
    "lab-handbook/source-coverage"
  ]) {
    assert.match(config, new RegExp(slug.replaceAll("/", "\\/")), `Starlight sidebar must expose ${slug}`);
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
