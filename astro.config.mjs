import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://aar246860.github.io",
  base: "/lin-lab-new-student-handbook",
  integrations: [
    starlight({
      title: "林穎凡研究室新生手冊",
      description: "給專題生、研究生與研究助理的地下水研究、AI agent 工作流與論文訓練手冊。",
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: false
      },
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/aar246860/lin-lab-new-student-handbook"
        }
      ],
      editLink: {
        baseUrl: "https://github.com/aar246860/lin-lab-new-student-handbook/edit/main/"
      },
      sidebar: [
        {
          label: "開始",
          items: [
            { label: "手冊首頁", slug: "index" },
            { label: "快速入門", slug: "handbook" },
            { label: "8 週路線圖", slug: "curriculum/overview" }
          ]
        },
        {
          label: "研究室手冊",
          items: [
            { label: "總覽", slug: "lab-handbook" },
            { label: "來源邊界", slug: "lab-handbook/source-boundary" },
            { label: "來源對照表", slug: "lab-handbook/source-derived-outline" },
            { label: "來源覆蓋率", slug: "lab-handbook/source-coverage" },
            { label: "去識別完整稿", slug: "lab-handbook/redacted-full-draft" },
            { label: "日常運作", slug: "lab-handbook/operations" },
            { label: "研究訓練", slug: "lab-handbook/research-training" },
            { label: "論文與發表", slug: "lab-handbook/writing-publication" },
            { label: "AI Agent 工作流", slug: "lab-handbook/ai-workflow" },
            { label: "Skill Pack", slug: "lab-handbook/skill-pack" }
          ]
        },
        {
          label: "每週 Lab",
          items: [{ autogenerate: { directory: "labs" } }]
        },
        {
          label: "設計依據",
          items: [{ label: "課程設計來源", slug: "references/course-design" }]
        }
      ]
    }),
    mdx()
  ]
});
