import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function listMarkdown(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  return readdirSync(absoluteDir)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => path.join(relativeDir, file).replaceAll("\\", "/"));
}

const required = [
  "README.md",
  "astro.config.mjs",
  "src/content/docs/index.mdx",
  "src/content/docs/handbook/index.md",
  "src/content/docs/curriculum/overview.md",
  "src/content/docs/references/course-design.md",
  "templates/research-note.md",
  "templates/decision-audit-report.md",
  "rubrics/weekly-lab-rubric.md",
  "data/synthetic_drawdown.csv"
];

for (const relativePath of required) {
  assert.ok(existsSync(path.join(root, relativePath)), `Missing ${relativePath}`);
}

const labs = listMarkdown("src/content/docs/labs");
assert.equal(labs.length, 8, "Expected 8 lab pages");

for (const lab of labs) {
  const content = read(lab);
  for (const keyword of ["學習目標", "本週任務", "繳交成果", "通過標準", "給學生的提醒"]) {
    assert.ok(content.includes(keyword), `${lab} missing ${keyword}`);
  }
  assert.doesNotMatch(content, /^:::/m, `${lab} should not use Starlight aside blocks`);
}

const combined = [
  "README.md",
  ...listMarkdown("src/content/docs/handbook"),
  ...listMarkdown("src/content/docs/curriculum"),
  ...labs,
  ...listMarkdown("src/content/docs/references")
]
  .map(read)
  .join("\n");

const unsupportedPatterns = [
  /保證\s*投稿成功/,
  /保證\s*上頂大/,
  /完整\s*LDL\s*解析解/,
  /現地\s*驗證\s*資料/,
  /field-validated/i,
  /guaranteed/i
];

for (const pattern of unsupportedPatterns) {
  assert.doesNotMatch(combined, pattern, `Unsupported claim found: ${pattern}`);
}

assert.match(combined, /合成資料|synthetic teaching dataset/i);
assert.match(combined, /教學簡化|teaching simplification/i);

console.log("Handbook verification passed.");
