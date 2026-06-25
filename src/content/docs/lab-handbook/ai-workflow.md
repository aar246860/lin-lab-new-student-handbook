---
title: AI Agent 工作流
description: Codex、技能、證據稽核、研究迴圈與學生使用 AI 的規範。
---

# AI Agent 工作流

AI Agent 可以大幅提高研究速度，但前提是你要把它放在正確位置。它適合幫你做資料整理、程式檢查、文獻摘要、圖表重畫、論文語氣檢查與研究流程管理；它不適合替你決定什麼是真的。

## 基本原則

1. 先定義任務，再叫 AI 做事。
2. 每個輸出都要能追到來源。
3. 重要結論要由人檢查，不由 AI 直接背書。
4. 研究資料、程式、圖與文字要分資料夾管理。
5. 涉及投稿、學生、合作、經費或個資的內容要特別小心。

## 可以交給 AI 的任務

- 整理資料欄位與缺值。
- 產生可重現的 Python 繪圖程式。
- 檢查 markdown、LaTeX、citation 與 figure captions。
- 比較 reviewer comments 與修稿內容。
- 把口語筆記改成正式段落。
- 產生研究計畫 checklist。
- 協助設計抽水試驗 benchmark。
- 建立 source-to-claim table。

## 不可以交給 AI 的任務

- 編造不存在的文獻。
- 把合成資料描述成現地資料。
- 替你決定一個模型是否物理正確。
- 在未檢查資料前宣稱方法優於傳統方法。
- 把 reviewer 的意見簡化成陰謀或人身判斷。
- 直接公開含有個資、學生資料或未投稿論文內容的輸出。

## 推薦 prompt 格式

```text
目標：
目前資料或檔案：
你要產出的格式：
不能做的事：
需要檢查的證據：
完成前要跑的驗證：
```

如果是研究任務，務必加上：

```text
請區分：已被資料支持、只是合理假設、只是示意、尚未確認。
```

## Agent 迴圈

一個成熟的 agent 迴圈通常包括：

1. Scout：找資料、文獻或相似案例。
2. Builder：寫程式、整理表格或產生初稿。
3. Critic：檢查誇大、錯誤、漏洞與未支持 claim。
4. Polisher：整理文字、圖表與提交格式。
5. Archivist：把來源、版本與結論放回資料夾。

不要讓同一個 agent 同時當作者、審稿人與證據保管人。角色分開，錯誤比較容易被抓到。

## 研究資料夾與 AI 輸出

建議每個專案都保留：

```text
agent_runs/
  YYYYMMDD_task/
    prompt.md
    output.md
    checked.md
    accepted_changes.md
```

`output.md` 是 AI 原始輸出；`checked.md` 是你檢查後留下的版本。正式文章只能引用或採用 checked 版本。

## 使用 skills

Codex skills 適合保存重複任務的標準流程，例如：

- 論文證據稽核。
- 週報摘要。
- 抽水試驗 benchmark 設計。
- review response 檢查。
- Lin Lab 語氣改寫。

本 repo 的 `skill-drafts/` 是草稿，不等於已安裝技能。正式安裝前，還需要用壓力情境測試它是否會阻止 AI 做出錯誤行為。
