---
title: Skill Pack
description: 從新生手冊萃取出的 Codex skill 草稿與使用邊界。
---

# Skill Pack

舊手冊的價值不只在文字內容，也在它把研究室常見任務拆得很細。新版手冊會把這些任務轉成 Codex skill drafts，讓未來你或學生可以在不同電腦上使用相同流程。

## 草稿技能

| Skill | 目的 | 狀態 |
|---|---|---|
| `lin-lab-onboarding-map` | 產生新生入門路線、週任務與自評 | 草稿 |
| `research-evidence-auditor` | 檢查 claim、圖、表、程式與來源是否對得上 | 草稿 |
| `ai-agent-research-workflow-coach` | 設計 Codex/agent 研究迴圈 | 草稿 |
| `lin-lab-manuscript-polisher` | 用林研究室風格修論文，不加入未支持 claim | 草稿 |
| `transformation-uncertainty-benchmark-builder` | 設計抽水試驗轉移不確定性 benchmark | 草稿 |
| `reliability-decision-endpoint-framer` | 把參數差異推到工程決策端點 | 草稿 |
| `groundwater-well-hydraulics-tutor` | 協助學生學習水井力學與解析模型 | 草稿 |

## 為什麼先放草稿

正式 skill 會影響未來 agent 的行為。若草稿沒有測試，可能會讓 AI：

- 過度簡化研究問題。
- 編造研究室規則。
- 把示意計算寫成現地驗證。
- 把學生狀態做不適當推論。
- 在論文中加入不自然的 AI 語氣。

所以目前先放在 repo 裡，作為共同審閱與未來安裝的材料。

## 安裝前檢查

每個 skill 正式安裝前要檢查：

1. YAML frontmatter 是否有效。
2. description 是否只寫使用情境，不偷寫流程摘要。
3. 是否有 Evidence Boundary。
4. 是否有 Do Not。
5. 是否至少經過一個壓力情境測試。
6. 是否不含私人路徑、學生個資或未公開研究細節。

## 與手冊的關係

手冊給人讀，skill 給 agent 用。兩者不能完全一樣。

手冊可以有背景、理由與教學語氣；skill 要更像任務規格，清楚指出何時使用、輸出格式、禁止事項與驗證方式。當手冊更新時，不代表 skill 自動更新；需要另外檢查 skill 是否也要修。
