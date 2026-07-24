# new-api 通透说明书

> **从零到精通 · 以「透明无损转发」为主线** · 面向小白、力求让你彻底读懂 [new-api](https://github.com/QuantumNous/new-api) 的架构、功能与每一个配置环节。

🌐 **在线阅读**：部署后访问 **https://sincomao.github.io/new-api-book**

---

## ⚠️ 版本与时效（重要）

- 本书基于 **new-api 源码 `commit 1721144221ec5c94dd87891a7ae1bee228e7bb63`（2026-07-21）** 撰写。
- **new-api 迭代极快**，UI / 配置项 / 默认值都可能变化。所有结论都标注了源码 `文件:行号`，**若你的版本不同，请以对应源码位置为准**。
- 本书用 git tag 锁定版本（如 `newapi-2026-07-21`）；后续 new-api 更新会发新 tag 对应。

## 核心主线

把 newapi 配置成**透明无损转发网关**：原封不动转发 claude code / cursor / openclaw / hermes 等客户端到原生上游，**不做兼容转换**；对 GLM-5.2 等个别模型微调 `max_tokens`。**铁律：经过 newapi 必须等同直连官方 API，不能有一丁点质量下降。**

无损三定律：① 协议匹配端点 ② 同类型渠道 ③ 直通优先（PassThrough 字节级透传）。详见[前言 / 在线版第 5 章](guide/05-转发核心机制-透明无损原理.md)。

## 目录

- **前言 + 第 1-11 章 + 附录 A-F**：见 [guide/ 目录](https://github.com/SincoMao/new-api-book/tree/main/guide)（或站内左侧侧边栏）。
- **研究底稿（10 份带 `文件:行号` 的源码报告）**：见 [research/ 目录](https://github.com/SincoMao/new-api-book/tree/main/research)。
- **写作规范**：[`guide/写作规范.md`](guide/写作规范.md)。

## 本地预览

```bash
npm install
npm run dev      # 本地 http://localhost:5173
npm run build    # 构建到 .vitepress/dist
```

## 本地构建与部署

- push 到 `main` 分支后，GitHub Actions 自动构建 VitePress 并部署到 GitHub Pages。
- 需在仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

## 质量保证

每章经多维度独立子 agent 交叉审查（技术准确性 / 无损红线 / 可读性 / 可复现性 / 完整性，核心章加强对抗验证 + 完整性批评家），并做全书一致性校对。审查揪出并修正了一连串硬伤（如 `web/default` 事实错误、`CRYPTO_SECRET` 定性、AdvancedCustom JSON 路径 `advanced_routes`、`converter=none` 无损边界、Cursor base_url、限流默认值等），每次回源码核实。

## 合规

new-api 采用 AGPLv3，本书仅供学习研究；使用者须合法取得上游授权并遵守服务条款与法律法规。
