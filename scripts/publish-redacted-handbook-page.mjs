import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const inputPath = path.join(root, ".gwguide-private/canonical/redacted-complete-ocr-working-draft.md");
const outputPath = path.join(root, "internal/lab-handbook-sources/redacted-full-draft.md");

if (!existsSync(inputPath)) {
  console.error(`Missing redacted source draft: ${inputPath}`);
  console.error("Run: node scripts/build-gwguide-source-corpus.mjs");
  process.exit(1);
}

function pageTitle(pageHeading) {
  const match = pageHeading.match(/^##\s+([0-9]{3})_(.+)$/);
  if (!match) return pageHeading.replace(/^##\s+/, "頁面");
  return `## 頁 ${match[1]}：${match[2].replace(/\.md$/, "")}`;
}

function parsePages(markdown) {
  const lines = markdown.split(/\r?\n/);
  const pages = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) pages.push(current);
      current = { heading: line, meta: [], body: [], inBody: false };
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

const source = readFileSync(inputPath, "utf8");
const pages = parsePages(source);

const output = [
  "---",
  "title: 去識別完整稿",
  "description: 由舊手冊 OCR 完整稿去除敏感資訊後產生的最小調整公開稿。",
  "---",
  "",
  "# 去識別完整稿",
  "",
  "這一頁由 private redacted OCR mother draft 產生。處理原則是最小限度修改：保留來源頁序與文字內容，只移除或替換敏感資訊、舊本機路徑、內部通訊資料與通訊錄頁。",
  "",
  "請注意：這不是人工逐頁校對後的一字不差正式稿。它是 OCR 完整、已去識別、尚待人工校對的公開工作稿。若要作為正式手冊內容，仍需逐頁對照原始照片修正 OCR 錯字。",
  "",
  "## 使用方式",
  "",
  "1. 需要查原手冊內容時，先在本頁搜尋關鍵字。",
  "2. 若某段要整理成正式手冊頁，先回到 private 母稿與原始照片確認。",
  "3. 若看到 `[REDACTED_*]` 標記，代表原文包含敏感資訊或不宜公開內容。",
  "",
  `## 頁面索引`,
  "",
  `本頁包含 ${pages.length} 個來源頁區塊。`,
  ""
];

for (const page of pages) {
  output.push(pageTitle(page.heading), "");
  const metaLines = page.meta.filter((line) => line.trim() !== "");
  if (metaLines.length > 0) {
    output.push(...metaLines.map((line) => `- ${line}`), "");
  }
  output.push("~~~text");
  output.push(...page.body);
  output.push("~~~", "");
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output.join("\n"), "utf8");

console.log(`Wrote ${outputPath}`);
console.log(`Pages: ${pages.length}`);
