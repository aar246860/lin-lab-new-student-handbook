import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) return fallback;
  return process.argv[index + 1];
}

const ocrDir = path.resolve(root, argValue("--ocr-dir", ".gwguide-private/ocr/pages"));
const imageDir = path.resolve(argValue("--image-dir", "C:/Users/YFLin/Desktop/GW guide"));
const outDir = path.resolve(root, argValue("--out-dir", ".gwguide-private/canonical"));
const publicDocsDir = path.resolve(root, "src/content/docs/lab-handbook");

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(text) {
  return text
    .replace(/[ \t\r\n，。、「」『』（）()：:；;,.·`'"“”‘’\-–—_/\\]+/g, "")
    .toLowerCase();
}

function extractOcrLines(markdown) {
  const lines = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const match = rawLine.match(/^- `([0-9.]+)`\s?(.*)$/);
    if (!match) continue;
    lines.push({
      confidence: Number(match[1]),
      text: match[2].trim()
    });
  }
  return lines;
}

function extractSectionCandidates(pageName, lines) {
  const candidates = [];
  for (const line of lines) {
    const match = line.text.match(/^([0-9]+(?:\.[0-9]+){0,3})\s*([^\n]*)$/);
    if (!match) continue;
    const title = match[2].trim();
    if (!title) continue;
    candidates.push({
      page: pageName,
      section: match[1],
      title,
      confidence: line.confidence
    });
  }
  return candidates;
}

function publicHandbookText() {
  if (!existsSync(publicDocsDir)) return "";
  const chunks = [];
  for (const fileName of readdirSync(publicDocsDir).filter((name) => name.endsWith(".md")).sort()) {
    chunks.push(readText(path.join(publicDocsDir, fileName)));
  }
  return chunks.join("\n");
}

function imageNameFromOcrName(ocrName) {
  return ocrName.replace(/^[0-9]+_/, "").replace(/\.md$/, ".jpg");
}

function pageNumberFromName(fileName) {
  const match = fileName.match(/^([0-9]+)_/);
  return match ? Number(match[1]) : null;
}

const fullyRedactedPageNumbers = new Set([164, 165]);

const privateNamePattern = /葉弘德|黃彦祯|黄彦祯|黃彥禎|黄彥禎|陳彦如|陳彥如|張雅琪/g;

const redactionPatterns = [
  {
    name: "email",
    pattern: /[A-Z0-9._%+-]+\s*@\s*[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    replacement: "[REDACTED_EMAIL]"
  },
  {
    name: "mobile_phone",
    pattern: /09[0-9]{2}[-\s：:]*[0-9]{3}[-\s：:]*[0-9]{3}/g,
    replacement: "[REDACTED_MOBILE]"
  },
  {
    name: "landline_phone",
    pattern: /(?:\([OH]\)\s*)?0[0-9]{1,3}[-\s](?:[0-9]{6,8}|[0-9]{3,4}[-\s][0-9]{3,4})\??/gi,
    replacement: "[REDACTED_PHONE]"
  },
  {
    name: "mailbox_field",
    pattern: /Mail信箱/g,
    replacement: "[REDACTED_MAILBOX_FIELD]"
  },
  {
    name: "local_filesystem_path",
    pattern: /[A-Z]:[A-Za-z0-9_./\\\-\u4e00-\u9fff]+/g,
    replacement: "[REDACTED_LOCAL_PATH]"
  },
  {
    name: "private_name",
    pattern: privateNamePattern,
    replacement: "[REDACTED_PERSON_NAME]"
  }
];

const wholeLineRedactionRules = [
  {
    name: "personal_data_form",
    pattern: /個人資料表.*(電話|地址|聯絡)/
  },
  {
    name: "internal_network_or_contact_system",
    pattern: /(IP address|老師網|Gw team 通訊|GW通錄|通訊资料|通訊資料)/
  },
  {
    name: "internal_duty_file",
    pattern: /(工作分配表單|duty\.doc)/
  },
  {
    name: "standalone_address_field",
    pattern: /^(地址|住址)[.。．…]*$/
  }
];

function redactLine(text) {
  const reasons = [];
  for (const rule of wholeLineRedactionRules) {
    if (rule.pattern.test(text)) {
      return {
        text: `[REDACTED_LINE:${rule.name}]`,
        reasons: [rule.name]
      };
    }
  }

  let redacted = text;
  for (const rule of redactionPatterns) {
    const before = redacted;
    redacted = redacted.replace(rule.pattern, rule.replacement);
    if (redacted !== before) reasons.push(rule.name);
  }

  return { text: redacted, reasons };
}

if (!existsSync(ocrDir)) {
  console.error(`OCR directory not found: ${ocrDir}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const pages = [];
for (const fileName of readdirSync(ocrDir).filter((name) => name.endsWith(".md")).sort()) {
  const filePath = path.join(ocrDir, fileName);
  const markdown = readText(filePath);
  const lines = extractOcrLines(markdown);
  const confidenceValues = lines.map((line) => line.confidence).filter((value) => Number.isFinite(value));
  const averageConfidence =
    confidenceValues.length === 0
      ? null
      : confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length;
  const lowConfidenceLines = lines.filter((line) => line.confidence < 0.9);
  const imageName = imageNameFromOcrName(fileName);
  pages.push({
    fileName,
    imageName,
    imageExists: existsSync(path.join(imageDir, imageName)),
    lineCount: lines.length,
    averageConfidence,
    lowConfidenceCount: lowConfidenceLines.length,
    markdown,
    lines,
    sectionCandidates: extractSectionCandidates(fileName, lines)
  });
}

const fullWithConfidence = [
  "# Private Full OCR Transcript",
  "",
  "> Private working artifact. Do not publish raw. This is OCR-derived text, not proofread verbatim source.",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- OCR pages: ${pages.length}`,
  `- Image directory: ${imageDir}`,
  ""
];

const textOnly = [
  "# Private Full OCR Text-Only Draft",
  "",
  "> Private working artifact. This strips OCR confidence values for proofreading convenience. It is not certified one-to-one until manually checked against page images.",
  ""
];

const rawOcrPages = [
  "# Private Raw OCR Pages Concatenated",
  "",
  "> Private unredacted artifact. This preserves every OCR page markdown file as stored under `.gwguide-private/ocr/pages`.",
  "> Do not publish. Use this as the no-deletion OCR archive before any sensitive-information pass.",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- OCR pages: ${pages.length}`,
  ""
];

const unredactedWorkingDraft = [
  "# Private Unredacted Complete OCR Working Draft",
  "",
  "> Private unredacted artifact. This is the mother draft before sensitive-information deletion.",
  "> It includes every parsed OCR text line from all 165 source pages in source order.",
  "> Status: OCR-complete, not manually proofread. Do not call this certified verbatim until each page is checked against the images.",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- OCR pages: ${pages.length}`,
  `- Source image directory: ${imageDir}`,
  ""
];

const redactedWorkingDraft = [
  "# Private Redacted Complete OCR Working Draft",
  "",
  "> Private artifact derived from the unredacted OCR working draft.",
  "> Sensitive contact information, internal network/contact-system references, and private-name examples have been removed or replaced with redaction markers.",
  "> Status: OCR-complete, redacted by deterministic rules, not manually proofread.",
  "",
  `- Generated: ${new Date().toISOString()}`,
  `- OCR pages: ${pages.length}`,
  ""
];

const redactionReportRows = [
  [
    "page",
    "source_image",
    "line_index",
    "redaction_reasons",
    "original_text",
    "redacted_text"
  ].join("\t")
];

const statusRows = [
  [
    "page",
    "source_image",
    "image_exists",
    "ocr_lines",
    "average_confidence",
    "low_confidence_lines",
    "status",
    "notes"
  ].join("\t")
];

for (const page of pages) {
  const pageNumber = pageNumberFromName(page.fileName);
  rawOcrPages.push(`<!-- BEGIN ${page.fileName} | ${page.imageName} -->`, "", page.markdown.trimEnd(), "", `<!-- END ${page.fileName} -->`, "");
  fullWithConfidence.push(
    `## ${page.fileName}`,
    "",
    `- Source image: ${page.imageName}`,
    `- Image found: ${page.imageExists ? "yes" : "no"}`,
    `- OCR lines: ${page.lineCount}`,
    `- Average confidence: ${page.averageConfidence === null ? "n/a" : page.averageConfidence.toFixed(3)}`,
    `- Low-confidence lines: ${page.lowConfidenceCount}`,
    ""
  );
  textOnly.push(`## ${page.fileName}`, "");
  unredactedWorkingDraft.push(
    `## ${page.fileName}`,
    "",
    `Source image: ${page.imageName}`,
    `Image found: ${page.imageExists ? "yes" : "no"}`,
    `OCR lines: ${page.lineCount}`,
    `Average confidence: ${page.averageConfidence === null ? "n/a" : page.averageConfidence.toFixed(3)}`,
    `Manual proofreading status: not checked`,
    ""
  );
  redactedWorkingDraft.push(
    `## ${page.fileName}`,
    "",
    `Source image: ${page.imageName}`,
    `Image found: ${page.imageExists ? "yes" : "no"}`,
    `OCR lines: ${page.lineCount}`,
    `Average confidence: ${page.averageConfidence === null ? "n/a" : page.averageConfidence.toFixed(3)}`,
    `Redaction status: deterministic sensitive-information pass applied`,
    ""
  );

  if (fullyRedactedPageNumbers.has(pageNumber)) {
    const marker = "[REDACTED_PAGE:contact_directory]";
    redactedWorkingDraft.push(marker, "");
    redactionReportRows.push(
      [
        page.fileName,
        page.imageName,
        "ALL",
        "contact_directory_page",
        "[entire page omitted]",
        marker
      ].join("\t")
    );
  }

  for (const [lineIndex, line] of page.lines.entries()) {
    fullWithConfidence.push(`- ${line.confidence.toFixed(3)} ${line.text}`);
    textOnly.push(line.text);
    unredactedWorkingDraft.push(line.text);
    if (!fullyRedactedPageNumbers.has(pageNumber)) {
      const redactedLine = redactLine(line.text);
      redactedWorkingDraft.push(redactedLine.text);
      if (redactedLine.reasons.length > 0) {
        redactionReportRows.push(
          [
            page.fileName,
            page.imageName,
            lineIndex + 1,
            redactedLine.reasons.join(","),
            line.text.replaceAll("\t", " "),
            redactedLine.text.replaceAll("\t", " ")
          ].join("\t")
        );
      }
    }
  }
  fullWithConfidence.push("");
  textOnly.push("");
  unredactedWorkingDraft.push("");
  redactedWorkingDraft.push("");
  statusRows.push(
    [
      page.fileName,
      page.imageName,
      page.imageExists ? "yes" : "no",
      page.lineCount,
      page.averageConfidence === null ? "n/a" : page.averageConfidence.toFixed(3),
      page.lowConfidenceCount,
      "ocr_complete_unproofread",
      page.lowConfidenceCount > 0 ? "manual image check required" : "manual image check still required"
    ].join("\t")
  );
}

writeFileSync(path.join(outDir, "full-ocr-transcript-with-confidence.md"), fullWithConfidence.join("\n"), "utf8");
writeFileSync(path.join(outDir, "full-ocr-text-only-draft.md"), textOnly.join("\n"), "utf8");
writeFileSync(path.join(outDir, "raw-ocr-pages-concatenated.md"), rawOcrPages.join("\n"), "utf8");
writeFileSync(path.join(outDir, "unredacted-complete-ocr-working-draft.md"), unredactedWorkingDraft.join("\n"), "utf8");
writeFileSync(path.join(outDir, "redacted-complete-ocr-working-draft.md"), redactedWorkingDraft.join("\n"), "utf8");
writeFileSync(path.join(outDir, "redaction-report.tsv"), redactionReportRows.join("\n"), "utf8");
writeFileSync(path.join(outDir, "verbatim-status.tsv"), statusRows.join("\n"), "utf8");

const publicTextNormalized = normalize(publicHandbookText());
const sectionLedger = pages.flatMap((page) =>
  page.sectionCandidates.map((candidate) => {
    const normalizedTitle = normalize(candidate.title);
    const titleProbe = normalizedTitle.slice(0, 8);
    return {
      ...candidate,
      publicHasSectionNumber: publicTextNormalized.includes(normalize(candidate.section)),
      publicHasApproxTitle: titleProbe.length >= 4 && publicTextNormalized.includes(titleProbe)
    };
  })
);

const pageIndex = pages.map((page) => ({
  fileName: page.fileName,
  imageName: page.imageName,
  imageExists: page.imageExists,
  lineCount: page.lineCount,
  averageConfidence: page.averageConfidence,
  lowConfidenceCount: page.lowConfidenceCount,
  sectionCandidates: page.sectionCandidates
}));

writeFileSync(path.join(outDir, "page-index.json"), JSON.stringify(pageIndex, null, 2), "utf8");
writeFileSync(path.join(outDir, "source-section-ledger.json"), JSON.stringify(sectionLedger, null, 2), "utf8");

const highRiskPages = [...pages]
  .sort((a, b) => b.lowConfidenceCount - a.lowConfidenceCount || a.fileName.localeCompare(b.fileName))
  .slice(0, 25);

const uncoveredSections = sectionLedger.filter(
  (section) => !section.publicHasSectionNumber || !section.publicHasApproxTitle
);

const audit = [
  "# Private Source Coverage Audit",
  "",
  "> Private working artifact generated from OCR. Use this to decide which source pages still need manual correction and public-safe adaptation.",
  "",
  "## Summary",
  "",
  `- OCR pages: ${pages.length}`,
  `- OCR lines: ${pages.reduce((sum, page) => sum + page.lineCount, 0)}`,
  `- Missing source images: ${pages.filter((page) => !page.imageExists).length}`,
  `- Section candidates: ${sectionLedger.length}`,
  `- Section candidates not clearly represented in public text: ${uncoveredSections.length}`,
  "",
  "## Highest Manual-Check Priority Pages",
  "",
  "| Page | OCR lines | Avg. confidence | Low-confidence lines |",
  "|---|---:|---:|---:|",
  ...highRiskPages.map((page) =>
    `| ${page.fileName} | ${page.lineCount} | ${page.averageConfidence === null ? "n/a" : page.averageConfidence.toFixed(3)} | ${page.lowConfidenceCount} |`
  ),
  "",
  "## Uncovered Or Weakly Covered Section Candidates",
  "",
  "| Page | Section | OCR title | Number in public | Title approx. in public |",
  "|---|---|---|---:|---:|",
  ...uncoveredSections
    .slice(0, 200)
    .map(
      (section) =>
        `| ${section.page} | ${section.section} | ${section.title.replaceAll("|", "\\|")} | ${section.publicHasSectionNumber ? "yes" : "no"} | ${section.publicHasApproxTitle ? "yes" : "no"} |`
    ),
  "",
  uncoveredSections.length > 200
    ? `Only the first 200 uncovered candidates are shown. Full ledger: ${path.join(outDir, "source-section-ledger.json")}`
    : "Full uncovered list shown."
];

writeFileSync(path.join(outDir, "coverage-audit.md"), audit.join("\n"), "utf8");

console.log(`Wrote ${path.join(outDir, "full-ocr-transcript-with-confidence.md")}`);
console.log(`Wrote ${path.join(outDir, "full-ocr-text-only-draft.md")}`);
console.log(`Wrote ${path.join(outDir, "raw-ocr-pages-concatenated.md")}`);
console.log(`Wrote ${path.join(outDir, "unredacted-complete-ocr-working-draft.md")}`);
console.log(`Wrote ${path.join(outDir, "redacted-complete-ocr-working-draft.md")}`);
console.log(`Wrote ${path.join(outDir, "redaction-report.tsv")}`);
console.log(`Wrote ${path.join(outDir, "verbatim-status.tsv")}`);
console.log(`Wrote ${path.join(outDir, "coverage-audit.md")}`);
console.log(`OCR pages: ${pages.length}`);
console.log(`Section candidates: ${sectionLedger.length}`);
console.log(`Uncovered/weakly covered candidates: ${uncoveredSections.length}`);
