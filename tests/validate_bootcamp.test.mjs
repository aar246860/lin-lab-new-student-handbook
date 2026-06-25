import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

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

test("bootcamp contains required public-facing learning artifacts", () => {
  const requiredPaths = [
    "README.md",
    "package.json",
    "astro.config.mjs",
    "src/content/docs/index.mdx",
    "src/content/docs/handbook/index.md",
    "src/content/docs/curriculum/overview.md",
    "src/content/docs/references/course-design.md",
    "templates/research-note.md",
    "templates/decision-audit-report.md",
    "rubrics/weekly-lab-rubric.md",
    "scripts/verify-bootcamp.mjs",
    "data/synthetic_drawdown.csv",
  ];

  for (const relativePath of requiredPaths) {
    assert.ok(existsSync(path.join(root, relativePath)), `${relativePath} is missing`);
  }
});

test("curriculum provides a complete 8-week summer pathway", () => {
  const weeklyLabs = listMarkdown("src/content/docs/labs");
  assert.equal(weeklyLabs.length, 8, "expected exactly eight weekly lab pages");

  weeklyLabs.forEach((relativePath, index) => {
    const content = read(relativePath);
    assert.match(content, /## 學習目標/, `${relativePath} must state learning purpose in zh-TW`);
    assert.match(content, /## 本週任務/, `${relativePath} must state tasks in zh-TW`);
    assert.match(content, /## 繳交成果/, `${relativePath} must state deliverables in zh-TW`);
    assert.match(content, /## 通過標準/, `${relativePath} must state completion criteria in zh-TW`);
    assert.match(content, /## 給學生的提醒/, `${relativePath} must include a student-friendly hint in zh-TW`);
    assert.doesNotMatch(content, /^## (Purpose|Tasks|Deliverable|Criteria|Friendly Hint)/m, `${relativePath} should not use English-first lab headings`);
    assert.match(content, new RegExp(`Week ${index + 1}|第\\s*${index + 1}\\s*週`), `${relativePath} must identify its week`);
  });
});

test("evidence and claim-boundary notes are present", () => {
  const references = read("src/content/docs/references/course-design.md");
  const expectedSources = [
    "MIT Teaching + Learning Lab",
    "University of Waterloo",
    "NC State DELTA",
    "Ohio State",
    "UNESCO",
    "Astro Starlight",
  ];

  for (const sourceName of expectedSources) {
    assert.ok(references.includes(sourceName), `${sourceName} is not cited in course-design references`);
  }

  const overview = read("src/content/docs/curriculum/overview.md");
  assert.match(overview, /合成資料|synthetic/i, "overview must label synthetic teaching datasets");
  assert.match(overview, /教學簡化|teaching simplification/i, "overview must describe simplified teaching models");
});

test("public claims avoid overstatement and unsupported guarantees", () => {
  const allMarkdown = [
    "README.md",
    ...listMarkdown("src/content/docs/handbook"),
    ...listMarkdown("src/content/docs/curriculum"),
    ...listMarkdown("src/content/docs/labs"),
    ...listMarkdown("src/content/docs/references"),
  ];

  const bannedPatterns = [
    /保證\s*投稿成功/,
    /保證\s*上頂大/,
    /完整\s*LDL\s*解析解/,
    /現地\s*驗證\s*資料/,
    /field-validated/i,
    /guaranteed/i,
  ];

  for (const relativePath of allMarkdown) {
    const content = read(relativePath);
    for (const pattern of bannedPatterns) {
      assert.doesNotMatch(content, pattern, `${relativePath} contains unsupported claim: ${pattern}`);
    }
  }
});

test("synthetic dataset is explicitly marked and machine-readable", () => {
  const dataset = read("data/synthetic_drawdown.csv").trim().split(/\r?\n/);
  assert.match(dataset[0], /synthetic teaching dataset/i, "dataset must start with a synthetic-data note");
  assert.match(dataset[1], /time_min,drawdown_m,pumping_rate_m3_day/, "dataset must include required columns");
  assert.ok(dataset.length >= 12, "dataset must include enough rows for a starter plot");
});

test("public pages avoid Starlight aside syntax that exposes inline SVG in copied text", () => {
  const publicPages = [
    "src/content/docs/index.mdx",
    ...listMarkdown("src/content/docs/handbook"),
    ...listMarkdown("src/content/docs/curriculum"),
    ...listMarkdown("src/content/docs/labs"),
    ...listMarkdown("src/content/docs/references")
  ];

  for (const relativePath of publicPages) {
    assert.doesNotMatch(
      read(relativePath),
      /^:::/m,
      `${relativePath} should use plain headings or cards instead of ::: aside blocks`
    );
  }
});

test("zh-TW learning copy avoids obvious translationese and English-first terms", () => {
  const publicCopy = [
    "README.md",
    "templates/research-note.md",
    "templates/decision-audit-report.md",
    "rubrics/weekly-lab-rubric.md",
    "src/content/docs/index.mdx",
    ...listMarkdown("src/content/docs/handbook"),
    ...listMarkdown("src/content/docs/curriculum"),
    ...listMarkdown("src/content/docs/labs"),
    ...listMarkdown("src/content/docs/references")
  ];

  const awkwardPatterns = [
    /本教材會/,
    /本訓練採用/,
    /每位學生需要交付/,
    /比較樸素/,
    /通過測試/,
    /AI literacy scaffold/i,
    /model-conditioned/i,
    /decision endpoint/i,
    /Claim Boundary/i
  ];

  for (const relativePath of publicCopy) {
    const content = read(relativePath);
    for (const pattern of awkwardPatterns) {
      assert.doesNotMatch(content, pattern, `${relativePath} contains translation-like copy: ${pattern}`);
    }
  }
});
