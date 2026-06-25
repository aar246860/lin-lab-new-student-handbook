import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

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

test("Lin Lab handbook publishes detailed public pages without exposing private source material", () => {
  const handbookPages = [
    "src/content/docs/lab-handbook/index.md",
    "src/content/docs/lab-handbook/source-boundary.md",
    "src/content/docs/lab-handbook/source-derived-outline.md",
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
    "舊手冊對應",
    "OCR 頁",
    "每週師生會面",
    "研究內容整理、分析與圖表",
    "問題與可能解決途徑",
    "程式 readme",
    "echo print input",
    "四層命名",
    "工具自評",
    "每張不超過八行",
    "學術研究最重要的是真實",
    "追蹤修訂",
    "1.1 老師給的備忘",
    "1.1.1 每週師生會面要點",
    "1.2 新生暑期工作",
    "1.5.1 程式",
    "2.2.2 中文論文大綱",
    "2.3 論文撰寫內容",
    "2.5.2 撰寫科技英文句子應注意事項",
    "2.5.6 長方程式的縮減",
    "2.5.8 圖表",
    "2.9.1 自行校稿改稿",
    "2.11.3 期刊論文 Word 檔案上傳前後 SOP",
    "Author Guide",
    "suggested reviewers",
    "opposed reviewers",
    "cover letter",
    "合併檔",
    "List of Figures",
    "Figure Captions",
    "讀書報告",
    "不懂、尚可、熟悉",
    "學長姊或自己以前的論文語句，不可以照抄",
  ]) {
    assert.ok(combined.includes(requiredPhrase), `handbook missing ${requiredPhrase}`);
  }

  for (const privateOrObsolete of [
    /C:\\\\?Users/i,
    /D:\\\\?GW/i,
    /葉弘德/,
    /黃金寶/,
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
  assert.match(config, /lab-handbook\/source-derived-outline/, "source-derived-outline page must be linked");
  assert.match(config, /lab-handbook\/skill-pack/, "skill-pack page must be linked");
});

test("project Pages internal links do not escape the repository base path", () => {
  const contentFiles = walkFiles("src/content/docs", [".md", ".mdx"]);
  const forbiddenRootAbsoluteLinks = [
    /^\s*link:\s*\/(?!\/)/m,
    /\]\(\/(?!\/)/m,
    /href=["']\/(?!\/)/m,
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
