---
layout: home

hero:
  name: new-api 通透说明书
  text: 从零到精通 · 以透明无损转发为主线
  tagline: 基于 new-api 源码 commit 1721144221（2026-07-21）撰写 · 以源码为唯一事实依据
  actions:
    - theme: brand
      text: 开始阅读（前言）
      link: /guide/00-前言
    - theme: alt
      text: 🚀 快速部署
      link: /guide/03-部署与运维
    - theme: alt
      text: 🎯 搭无损网关
      link: /guide/05-转发核心机制-透明无损原理

features:
  - icon: 🛡️
    title: 透明无损转发
    details: claude code / cursor / openclaw / hermes 等经 newapi 无损转发到原生上游——非流式请求体字节级无损，流式事件内容等价。
    link: /guide/05-转发核心机制-透明无损原理
  - icon: ⚙️
    title: GLM-5.2 等微调 max_tokens
    details: 无损与调参分渠道隔离：绝大多数开 PassThrough，GLM 单独非直通渠道用 ParamOverride + keep_origin。
    link: /guide/06-配置与参数调教
  - icon: 🔌
    title: 客户端对接实战
    details: Claude Code / Cursor / Gemini 等端到端配置 + 无损验证方法论 + 故障排查。
    link: /guide/11-客户端透明无损对接实战
  - icon: 📡
    title: 端点 ↔ 协议 ↔ 渠道映射
    details: 原生 Claude/Gemini/OpenAI/Responses 端点与渠道类型一一对应，避免跨格式转换有损。
    link: /guide/02-技术架构全景
  - icon: 🔬
    title: 以源码为唯一依据
    details: 每条结论附源码 文件:行号；官方文档与源码冲突时以源码为准，并说明差异。
    link: /guide/写作规范
  - icon: 🗂️
    title: 研究底稿可追溯
    details: 10 份带 file:line 的源码研究报告归档，每条无损声明可追溯到代码证据。
    link: /research/00-说明书大纲-初稿
---
