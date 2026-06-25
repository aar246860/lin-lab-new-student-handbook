import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

test("Lin Lab handbook publishes detailed public pages without exposing private source material", () => {
  const handbookPages = [
    "src/content/docs/lab-handbook/index.md",
    "src/content/docs/lab-handbook/source-boundary.md",
    "src/content/docs/lab-handbook/operations.md",
    "src/content/docs/lab-handbook/research-training.md",
    "src/content/docs/lab-handbook/writing-publication.md",
    "src/content/docs/lab-handbook/ai-workflow.md",
    "src/content/docs/lab-handbook/skill-pack.md",
  ];

  for (const relativePath of handbookPages) {
    assert.ok(exists(relativePath), `${relativePath} is missing`);
  }

  const combined = handbookPages.map(read).join("\n");
  for (const requiredPhrase of [
    "來源邊界",
    "新生暑期工作",
    "檔案與程式管理",
    "Group Seminar",
    "論文撰寫",
    "AI Agent",
    "Lagging Darcy",
    "轉移不確定性",
    "決策可靠度",
  ]) {
    assert.ok(combined.includes(requiredPhrase), `handbook missing ${requiredPhrase}`);
  }

  for (const privateOrObsolete of [
    /C:\\\\?Users/i,
    /D:\\\\?GW/i,
    /葉弘德/,
    /黃金寶/,
    /三孔夾/,
    /自然輸入法\s*2003/,
    /Visual\s+Fortran/i,
    /Tecplot/i,
  ]) {
    assert.doesNotMatch(combined, privateOrObsolete, `public handbook exposes source-only detail: ${privateOrObsolete}`);
  }
});

test("OCR pipeline and private-source ignore rules are present", () => {
  assert.ok(exists("scripts/gwguide_ocr.py"), "OCR script is missing");
  assert.match(read("scripts/gwguide_ocr.py"), /RapidOCR/, "OCR script should use the available local RapidOCR engine");

  const gitignore = read(".gitignore");
  assert.match(gitignore, /^\.gwguide-private\/$/m, "private OCR output must be gitignored");
  assert.match(gitignore, /^\.tmp_gwguide_preview\/$/m, "temporary previews must be gitignored");
});

test("skill drafts exist as drafts and carry trigger, evidence, and limitation language", () => {
  const skillDrafts = [
    "skill-drafts/lin-lab-onboarding-map/SKILL.md",
    "skill-drafts/research-evidence-auditor/SKILL.md",
    "skill-drafts/ai-agent-research-workflow-coach/SKILL.md",
    "skill-drafts/lin-lab-manuscript-polisher/SKILL.md",
    "skill-drafts/transformation-uncertainty-benchmark-builder/SKILL.md",
    "skill-drafts/reliability-decision-endpoint-framer/SKILL.md",
    "skill-drafts/groundwater-well-hydraulics-tutor/SKILL.md",
  ];

  for (const relativePath of skillDrafts) {
    assert.ok(exists(relativePath), `${relativePath} is missing`);
    const content = read(relativePath);
    assert.match(content, /^---\nname: [a-z0-9-]+\ndescription: Use when /, `${relativePath} needs valid skill frontmatter`);
    assert.match(content, /## Evidence Boundary|## 證據邊界/, `${relativePath} must state evidence limits`);
    assert.match(content, /## Do Not|## 不要做/, `${relativePath} must state what the skill should not do`);
  }
});

test("handbook navigation is registered in Astro Starlight config", () => {
  const config = read("astro.config.mjs");
  assert.match(config, /研究室手冊/, "Starlight sidebar must expose the detailed handbook");
  assert.match(config, /lab-handbook\/source-boundary/, "source-boundary page must be linked");
  assert.match(config, /lab-handbook\/skill-pack/, "skill-pack page must be linked");
});
