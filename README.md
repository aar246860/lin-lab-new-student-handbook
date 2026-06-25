# 林穎凡研究室新生手冊

這個 repo 收錄林穎凡研究室的新生手冊、暑期訓練教材與 AI agent 工作流。它從一份 2013 年版地下水研究室手冊的章節精神出發，改寫成適合目前研究方向的版本：地下水水井力學、Lagging Darcy / Lagging Theory、轉移不確定性、決策可靠度、論文寫作與可追蹤的 AI 協作。

## 使用定位

- 對象：大三以上專題生、碩士新生、博士生、研究助理。
- 目的：讓新加入的人知道研究室如何整理資料、讀文獻、寫週報、做圖、使用 AI agent、準備 seminar 與撰寫論文。
- 產出：一份可搜尋的網站手冊、一條 8 週入門路線、可重複使用的報告模板與 skill drafts。
- 邊界：舊手冊照片與 OCR 只留在本機私有資料夾，不會直接放到公開網站或 GitHub。

## 使用邊界

教材中的抽水試驗資料是合成教學資料。Theis 與 Cooper-Jacob 只作為入門練習，不等於完整的現地模型分析。Lagging Darcy 章節也只介紹基本概念與 normalized response；教材圖解不能被描述為完整 LDL 發表解或校正過的現地案例。

舊手冊來源只能作為章節設計與訓練制度的參考。公開內容必須改寫、去識別，並符合目前研究室的工具與研究風格。

## 開發

```bash
npm install
npm run dev
npm run verify
```

## 主要資料夾

- `src/content/docs/`：Astro Starlight 教材頁面。
- `src/content/docs/lab-handbook/`：完整研究室手冊。
- `templates/`：研究筆記與決策稽核報告模板。
- `rubrics/`：每週作業評分與通過標準。
- `data/`：入門合成資料。
- `scripts/`：教材完整性檢查。
- `skill-drafts/`：尚未安裝的 Codex skill 草稿。
- `.gwguide-private/`：本機 OCR 與來源對照輸出，已排除版本控制。

## 課程設計來源

課程設計參考 backward design、constructive alignment、high-structure course design、TILT 透明作業，以及 AI 素養培養。完整來源列在網站的「課程設計來源」頁。
