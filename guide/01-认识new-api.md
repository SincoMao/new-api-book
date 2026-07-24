# 第 1 章 · 认识 new-api

> 本章目标：让你在 10 分钟内建立对 new-api 的整体认知——它是什么、解决什么问题、核心概念有哪些、它和你听过的 One API 是什么关系。细节留给后续章节，这里只画地图。

---

## 1.1 new-api 是什么

一句话：**new-api 是一个开源的 AI 网关与 AI 资产管理系统**。

把它拆开理解：

- **AI 网关（Gateway）**：它站在你的应用/客户端和一堆 AI 上游（上游 = 真正提供模型服务的官方 API，如 OpenAI、Anthropic、智谱、DeepSeek）之间。你的客户端不再直连各家上游，而是统一连到 new-api；new-api 负责把请求转发到正确的上游，再把结果返回给你。
- **资产管理（Asset Management）**：除了转发，它还管"谁能用、能用多少、花了多少钱"——用户、令牌、分组、额度、计费倍率、用量日志、数据看板，一应俱全。

它的官方定位原话是：

> "New API 是面向合法授权场景的 AI API 网关与用量管理系统……默认面向自用、团队内部和企业私有化部署。"〔research/06〕

本书基于源码 commit `1721144221ec5c94dd87891a7ae1bee228e7bb63`（2026-07-21）撰写。技术栈（来自项目自带 `AGENTS.md`，已用 `go.mod` 等校准）：

- **后端**：Go 1.25.1+（见 `go.mod`；`AGENTS.md` 标的 1.22+ 已过时，以 `go.mod` 为准）、Gin web 框架、GORM v2 ORM
- **前端**：React 19、TypeScript、Rsbuild、Base UI、Tailwind CSS（单一工程，位于 `web/`）
- **数据库**：同时支持 SQLite / MySQL / PostgreSQL（三种必须都能跑）
- **缓存**：Redis（可选，不开也能跑）
- **许可证**：AGPLv3（基于 One API 的 MIT 二次开发）

## 1.2 它解决什么问题

假设你是一个团队的技术负责人，手下有 5 个开发，分别用 claude code、cursor、自己的脚本调 AI。如果各自直连上游，你会面临一堆麻烦，而 new-api 正是逐个解决它们：

| 痛点 | 不用 new-api | 用 new-api |
|---|---|---|
| **密钥管理** | 每人手里一把上游 Key，泄露/轮换/收回都是噩梦 | 上游 Key 只存在 new-api；开发用 newapi 发的"令牌" |
| **多上游聚合** | 想同时用 OpenAI + Claude + 国产模型，客户端要分别对接 | 统一入口，一个令牌访问所有上游 |
| **用量与成本** | 谁用了多少、花了多少，全凭各平台账单拼凑 | 统一计费倍率、按用户/模型/分组的用量日志与看板 |
| **负载与容灾** | 一个上游挂了，应用跟着挂 | 多渠道加权随机 + 失败自动重试/切换 + 自动禁用故障渠道 |
| **协议适配** | 客户端只懂 OpenAI 格式，却想用 Claude 模型 | newapi 可做格式转换（**但注意：本书主线是避免转换、追求无损**） |
| **私有化与合规** | 数据出公网、无法审计 | 私有部署、日志留存、内部鉴权 |

⚠️ **一个本书要反复强调的认知**：上表第 5 行说的是**跨协议格式转换**（如客户端用 OpenAI 格式去调 Claude 模型，需要 OpenAI↔Claude 的字段结构映射）——**这种跨协议转换是有损的**。但只要让客户端走**自身原生协议端点**对接**同类型渠道**（Claude 客户端→`/v1/messages`→Anthropic 渠道），就根本不发生转换，配合"直通"还能做到**请求体**的字节级无损（非流式响应亦字节级；流式为事件内容等价，header 鉴权覆盖不可避免，详见第 5 章）。所以本书主线不是"回避转换"，而是"从源头走原生协议，让转换根本不发生"。

## 1.3 核心概念速览

这几个词在全书反复出现，先建立最小定义。每个的深度讲解在对应章节。

### 渠道（Channel）—— 第 4 章详解
一条"上游连接"。一个渠道 = 一个上游**类型**（决定走哪种协议的适配器，如 OpenAI / Anthropic / Gemini——**选错类型 = 走错转换路径**）+ 上游**地址（BaseURL）** + 一把 Key + 它支持的模型 + 归属的分组 + 调度参数（优先级/权重）+ 改写规则。**这是透明无损转发的核心配置对象。**
> 例：一个"OpenAI 官方渠道"（类型=OpenAI，Key=sk-xxx，模型=gpt-4o,…）、一个"Anthropic 渠道"（类型=Anthropic，模型=claude-…）。

### 令牌（Token）—— 第 7 章详解
newapi 发给客户端的"调用钥匙"。客户端用它代替上游 Key。令牌可限制：能用哪些模型、额度上限、有效期、IP 白名单、归属分组。**令牌字符串**在创建时前端会弹窗提示复制一次，但**并非只能看一次**——完整 Key 可随时在控制台通过"复制 Key"重新获取（`POST /api/token/:id/key`，详见第 7 章 7.2）。注意："令牌字符串"与渠道里那把"上游 Key"是两回事，别混淆。
> 例：给 claude code 签发一个"仅限 claude 模型、额度无限"的令牌。

### 用户与分组（User / Group）—— 第 7 章详解
用户是 newapi 的账号；分组是渠道的集合，决定"这个用户能用到哪些渠道"，并可设差异化计费倍率。令牌绑定分组；令牌也可绑定名为 `auto` 的特殊分组，由系统在「管理员配置的自动分组 ∩ 该用户可用分组」中自动挑选可用渠道（跨分组容灾——某分组没可用渠道时，自动换到其他分组继续服务）。

### 模型倍率（Ratio）—— 第 8 章详解
计费的核心。配额公式（〔research/06〕）：
- **按量**：`配额 = (输入token + 输出token × 补全倍率) × 模型倍率 × 分组倍率`
- **按次**：`配额 = 固定价 × 分组倍率 × 500000`
- 换算：**1 美元 = 500,000 配额点数**
- 注：**补全倍率** = 输出 token 相对输入 token 的计费系数，通常 >1（生成比读取贵）；**模型倍率**按模型定价，**分组倍率**按用户分组折扣。

### 日志（Log）—— 第 9 章详解
每次请求都记录：谁（用户/令牌）、用了什么模型、命中哪个渠道、消耗多少配额、是否成功、耗时。管理员日志还含用户名/渠道名。可独立日志库（如 ClickHouse）。

### 转发（Relay）—— 第 5 章详解 ★核心
newapi 最核心的动作。客户端请求 → newapi → 上游 → 响应回写。本书主线就是讲清楚这一路上发生了什么、怎么做到无损。

## 1.4 能力一览

newapi 的能力边界（综合 README 与〔research/06〕）：

**聚合的上游（`relay/channel/` 下 38 个适配器目录；支持 40+ 上游服务商，据 `AGENTS.md`；research/06 综述作 30+，以 AGENTS.md 为准）**：
openai、claude(Anthropic)、gemini、aws(Bedrock)、vertex、zhipu(智谱GLM)、zhipu_4v、ali(通义)、baidu、baidu_v2、tencent、deepseek、moonshot、minimax、xai、volcengine(火山)、xunfei(讯飞)、ollama、openrouter、perplexity、cohere、mistral、cloudflare、codex、coze、dify、siliconflow、xinference、lingyiwanwu、jina、jimeng、mokaai、palm、replicate、ai360、advancedcustom(高级自定义)、task、submodel…
> 注：Azure 由 openai 适配器以子模式承载（非独立目录）；上面每个名字对应 `relay/channel/` 下一个目录。

**支持的 API 协议/端点**（〔research/06、09〕）：
- OpenAI 兼容：`/v1/chat/completions`、`/v1/completions`、`/v1/embeddings`、`/v1/images/*`、`/v1/audio/*`、`/v1/moderations`、`/v1/rerank`
- OpenAI Responses：`/v1/responses`
- OpenAI Realtime：`/v1/realtime`（WebSocket）
- **原生 Claude**：`/v1/messages`
- **原生 Gemini**：`/v1beta/models/{model}:{action}`
- Midjourney、Suno、视频（Sora/Kling/即梦）

**管理能力**：智能路由（加权随机/故障切换）、多 Key 轮询、三层倍率计费、令牌权限、用户分组、数据看板、兑换码、多支付网关、订阅、邀请返利、2FA/Passkey/WebAuthn、多 OAuth + 自定义 OIDC、Telegram 登录、性能监控、渠道自动禁用/恢复、上游模型与倍率自动同步。

> ⚠️ 另有一类**本质上会改写请求、有损**的能力（**默认不启用**，一旦配置即破坏纯透传）：参数覆盖系统、模型映射、跨格式转换、思考转内容（`thinking_to_content`）、`ChatCompletionsToResponsesPolicy`（自动把请求转 Responses 格式）等。它们很有用，但与无损主线相悖，需在第 6 章学会后审慎使用（无损模式下应确认关闭或走非直通渠道隔离）。

## 1.5 与 One API 的关系

new-api 是 **One API（songquanpeng/one-api，MIT 许可证）的二次开发版**（fork）：

- **数据库兼容**：完全兼容原版 One API 数据库，可从 one-api 平滑迁移。
- **增强**：在 one-api 基础上加了全新 UI、数据看板、更多上游适配器、参数覆盖系统、Advanced Custom 渠道、Realtime/Responses/Gemini 原生端点、WebAuthn、性能监控等大量能力。
- **许可证变化**：one-api 是 MIT，new-api 改为 **AGPLv3**（对企业使用有开源义务要求；若组织政策不允许 AGPLv3，可联系 support@quantumnous.com 商业授权）。

> 对本书读者：你如果是 one-api 老用户，数据库和大部分概念通用；但 new-api 的无损透传能力（PassThrough、AdvancedCustom、原生端点）是它的"增量价值"所在，也是本书重点。

## 1.6 适用场景与合规定位

**适合**：
- 个人/团队/企业的**私有化 AI 网关**——统一密钥、统一计费、统一日志。
- 多上游聚合 + 负载均衡 + 容灾。
- **透明无损转发**（本书主线）——给 claude code/cursor 等客户端做一个"不改质量的中间层"。

**不适合 / 须谨慎**：
- 面向公众的生成式 AI 服务转售——须先完成备案、内容安全、实名、日志留存、税务、支付、上游授权等合规义务。
- 任何未合法取得上游授权的使用。

⚠️ 再次强调：**"透明无损转发"是技术能力，不改变你对上游服务条款与法律法规的合规责任。**

## 1.7 本章小结

- new-api = 开源 AI 网关 + 资产管理系统，聚合 38+ 上游，统一入口/鉴权/计费/日志。
- 核心概念：**渠道**（上游连接）、**令牌**（调用钥匙）、**用户/分组**（权限与计费隔离）、**倍率**（计费）、**日志**（审计）、**转发**（核心动作）。
- 它 fork 自 One API，兼容其数据库，许可证为 AGPLv3。
- 它"能做格式转换"，但**本书主线是无损转发——尽量不转换**。

下一章我们钻进它的内部，看它的**技术架构**是怎么组织的——这会为你理解后续所有章节打下地基。

➡️ 继续：[第 2 章 · 技术架构全景](02-技术架构全景.md)
