---
title: 來源覆蓋率
description: 說明舊手冊完整轉錄、公開版最小調整與尚未人工校對範圍。
---

# 來源覆蓋率

本頁用來避免手冊被改成過度精簡的 AI 摘要。原則是先建立完整私有稿，再由完整稿產生公開版。公開版若需要刪除、改寫或現代化，必須知道它對應到哪一頁來源。

## 目前狀態

| 項目 | 狀態 |
|---|---|
| 原始照片 | 165 張，保存在本機 `GW guide` 資料夾，不放入公開 repo。 |
| OCR 頁 | 165 頁，保存在 `.gwguide-private/ocr/pages`。 |
| Private 完整 OCR 稿 | 已可由腳本產生，保存在 `.gwguide-private/canonical/`。 |
| 公開去識別完整稿 | 已產生「去識別完整稿」頁，包含 165 個來源頁區塊。 |
| 公開章節版 | 已由去識別完整稿切成第 1 到第 6 章，頁碼範圍完整覆蓋 001-165。 |
| 公開整理手冊 | 降級為輔助訓練材料，不再視為原手冊逐字或完整版本。 |
| 逐字校對 | 尚未完成。OCR 文字不能直接宣稱為一字不差。 |

## 已建立的 private corpus

執行：

```bash
node scripts/build-gwguide-source-corpus.mjs
```

會產生：

| 檔案 | 用途 |
|---|---|
| `.gwguide-private/canonical/full-ocr-transcript-with-confidence.md` | 每頁 OCR 文字與信心分數，用於校對。 |
| `.gwguide-private/canonical/full-ocr-text-only-draft.md` | 移除信心分數後的完整 OCR 草稿，方便人工修稿。 |
| `.gwguide-private/canonical/page-index.json` | 每頁 OCR 行數、平均信心分數、低信心行數與章節候選。 |
| `.gwguide-private/canonical/source-section-ledger.json` | 章節候選與公開手冊覆蓋情形。 |
| `.gwguide-private/canonical/coverage-audit.md` | 人工校對優先頁、可能缺漏章節與覆蓋率摘要。 |
| `.gwguide-private/canonical/redacted-complete-ocr-working-draft.md` | 去除敏感資訊後的完整 OCR 工作稿。 |
| `.gwguide-private/canonical/redaction-report.tsv` | 每一筆刪除或替換的紀錄。 |

公開頁可由下列指令重建：

```bash
node scripts/publish-redacted-handbook-page.mjs
node scripts/publish-redacted-handbook-chapters.mjs
```

章節版頁面目前採用下列切分：

| 章節頁 | OCR source pages | 公開檔案 |
|---|---:|---|
| 第 1 章：規則與辦法 | 001-019 | `src/content/docs/lab-handbook/chapter-1-rules.md` |
| 第 2 章：論文撰寫 | 020-047 | `src/content/docs/lab-handbook/chapter-2-writing.md` |
| 第 3 章：寫作書籍精簡內容 | 048-095 | `src/content/docs/lab-handbook/chapter-3-writing-references.md` |
| 第 4 章：研究相關輔助資料 | 096-134 | `src/content/docs/lab-handbook/chapter-4-tools.md` |
| 第 5 章：方法篇 | 135-161 | `src/content/docs/lab-handbook/chapter-5-methods.md` |
| 第 6 章：備忘 | 162-165 | `src/content/docs/lab-handbook/chapter-6-memos.md` |

## 這不是什麼

1. 這不是未刪敏感資訊的公開 OCR 原文庫。
2. 這不是保證一字不差的手工校正版。
3. 這不是把舊手冊私人內容全部公開。
4. 這不是重新創作的新生手冊摘要。

## 逐字稿的標準

若要宣稱「一字不差」，必須完成下列步驟：

1. 每頁 OCR 文字逐行對照原始照片。
2. 修正 OCR 錯字、漏字、錯行、標點與表格錯位。
3. 標記私人資訊、舊內部權責、舊路徑、聯絡資訊與不宜公開內容。
4. 標記外部教材、書籍摘要或可能不適合全文公開的段落。
5. 產生兩份稿：private verbatim transcript 與 public minimal-adaptation version。
6. 公開版每一段都能回溯到 private 稿的頁碼。

## 公開版處理規則

| 來源內容 | 公開處理 |
|---|---|
| 原手冊研究室規則、流程、檢核清單 | 儘量保留原章節、原條列與原手冊語氣。 |
| OCR 明顯錯字 | 修正後公開，不保留亂碼。 |
| 私人聯絡資訊、地址、電話、舊內部權責 | 不公開，只保留可泛化的操作原則。 |
| 舊工具操作 | 保留訓練脈絡，必要時補目前替代工具。 |
| 外部書籍、教材或長篇引用 | 不逐字公開，只保留研究室如何使用該材料的功能。 |
| 林研究室新增內容 | 明確標示為新版新增，不混成舊手冊原文。 |

## 下一步工作順序

1. 先校對第 1 章與第 2 章，因為它們是新生最常用的研究室規則與論文寫作 SOP。
2. 第 3 章多為寫作書籍精簡內容，先標記來源屬性與可公開範圍，不急著逐字公開。
3. 第 4 章工具資料需分成「仍有用」「改成現代工具」「只保留歷史脈絡」三類。
4. 第 5 章方法篇可整理為研究習慣與學習方法，但要避免把外部材料整段公開。
5. 第 6 章備忘多含舊設備與通訊錄，優先做隱私篩選，不做原樣公開。

這個頁面的目的，是讓後續每一次改稿都能回答同一個問題：這段文字是從哪一頁來的，是否已經校對，是否適合公開。
