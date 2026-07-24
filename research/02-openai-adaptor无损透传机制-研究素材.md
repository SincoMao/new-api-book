# OpenAI / Responses 适配器 — 无损透传机制研究素材

> ⚠️ **来源与置信度**：本报告来自一个**并行深挖 agent**（task-id `abe9beb210606a78b`，名为"深挖 openai adaptor"），**并非我直接派发的 6 个主研究 agent 之一**。其结论与我已从 `advancedcustom/adaptor.go` 一手读到的"converter=none 原生直通"一致，可信度较高；但其中最关键的 `PassThroughRequestEnabled` 机制**必须亲自交叉验证**（见同目录 `03-PassThrough验证.md`）。
> 归档日期：2026-07-22

---

## 核心结论（对全书主线决定性）

**OpenAI→OpenAI 路径在"标准 OpenAI 渠道 + 非 o系列/GPT-5/OpenRouter 模型 + 上游返回了 usage"时，基本是"解析→原样重发"，近乎无损。** 但存在多处**条件性改写**，且 SSE 帧会被重新生成。**真正的字节级无损唯一保证是全局/渠道级 `PassThroughRequestEnabled` 开关**。

### ⚠️ 命门权衡（全书核心实战的基石）
- `PassThroughRequestEnabled = true` → 绕过整个 `Convert→Marshal→RemoveDisabledFields→ParamOverride` 链，**直接发原始请求体**，100% 无损。
- 但 PassThrough 模式会**跳过 body 级参数微调**（如改 max_tokens）。
- **因此"无损 + 个别模型改 max_tokens"必须分渠道实现**：
  - 大多数模型/客户端 → 开启 PassThrough 的渠道（完全无损）
  - GLM5.2 等需改参数的模型 → 单独渠道，**不开** PassThrough，用 ParamOverride / 渠道设置改参数
- > 待验证：PassThrough 与 ParamOverride 的确切互斥关系、是否有"PassThrough 之外仍能改个别字段"的机制（如 header_override 改 header 不受影响）。

---

## 1. ConvertOpenAIRequest（adaptor.go:244-367）
- Native 直通：末尾 `return request, nil`（adaptor.go:366）原样返回 DTO，不做跨格式转换。
- 条件性改写（仅特定渠道/模型触发）：
  - 非 OpenAI/Azure 渠道：清空 `StreamOptions`（adaptor.go:248-249）
  - **OpenRouter**（adaptor.go:251-327）：注入 `usage={"include":true}`；`-thinking` 后缀→改 reasoning；`THINKING`(anthropic)→reasoning
  - **o系列/GPT-5**（adaptor.go:328-364）：`MaxTokens`→`MaxCompletionTokens`；清 Temperature/TopP/LogProbs；第一条 system 改名 developer
- 返回**同一个 DTO 指针**，改动落到被上层 `common.Marshal`（compatible_handler.go:157）序列化的对象上 → **DTO 未定义的字段会在 Marshal 时丢失**（非直通模式最大丢字段风险）。

## 2. Header 处理（adaptor.go:183-242 / api_request.go:45-57）
- `SetupApiRequestHeader` 仅拷贝客户端 Content-Type、Accept；流式 Accept 空则设 `text/event-stream`。
- 上游请求 header **默认不继承客户端任何其他 header**；要透传客户端 header 只能靠渠道 `header_override` 的 `pass_headers` 规则。
- 默认设 `Authorization: Bearer <ApiKey>`，但先检查 header_override 是否含 Authorization。
- header_override 在 `DoApiRequest`（api_request.go:325-329）执行，**优先级最高**，可覆盖默认 Authorization。

## 3. DoApiRequest（api_request.go:307-335）
- `http.NewRequest(c.Request.Method, fullRequestURL, requestBody)` —— requestBody 原样透传、方法沿用客户端。
- 顺序：拼URL → 建req → 设ContentLength → SetupRequestHeader → header_override → doRequest。

## 4. DoResponse 非流式（relay-openai.go:190-299）
- 读上游整包 → Unmarshal 成 simpleResponse（**仅提取 usage/检测 content_filter，不作为回写源**）。
- **默认原样透传字节**：`RelayFormat==OpenAI && !usageModified && !forceFormat` → `IOCopyBytesGracefully`（:296）直接写原始字节，不丢字段不重排。
- 改写 body 的两种情况：
  - `usageModified`（上游 prompt_tokens==0）：重算 usage 经 map 改写再 Marshal（map 不丢字段，但 JSON 格式变化）
  - `forceFormat`（渠道开关）：用强类型 DTO 重新 Marshal → **丢未知字段**

## 5. DoResponse 流式（relay-openai.go:104-188）
- 逐行解析上游 SSE `data:` 行，`!forceFormat && !thinkingToContent` 时 `helper.StringData` 原样转发 data 字符串。
- **SSE 帧被重新生成（重打包）**：仅 `data:` 后 JSON 内容字符串保留；上游 `event:` 行、注释行、多行 data、原始空白换行**都不保留**。
- **末帧延迟 + usage 注入**：上游无 usage 且 `ShouldIncludeUsage` 时**合成一个上游没有的 usage chunk** 发给客户端。
- `thinkingToContent=true`（渠道开关）：把 reasoning 改写成 `<think>...</think>` 包裹的普通 content。

## 6. 可能在无损转发中"偷偷改动"的环节清单
| 环节 | file:line | 说明 |
|---|---|---|
| DTO 序列化丢字段 | compatible_handler.go:157 + adaptor.go:366 | 非直通把请求 Marshal 成强类型 DTO，**未声明字段丢失**；无损唯一保证是 PassThroughRequestEnabled |
| o系列/GPT-5 改写 | adaptor.go:330-363 | MaxTokens→MaxCompletionTokens 等，非直通时无条件发生 |
| OpenRouter 注入 | adaptor.go:252-325 | 注入 usage、改 reasoning |
| 非 OpenAI/Azure 清 StreamOptions | adaptor.go:248-249 | 旁路渠道丢 stream_options |
| header 默认不透传 | api_request.go:45-57 | 需渠道配 pass_headers |
| header_override 覆盖鉴权 | api_request.go:325-329 | 优先级最高，可静默替换 Authorization |
| 流式 SSE 重打包 | relay-openai.go:126 + helper.go:28 | event/注释/换行丢失 |
| 流式 usage 帧注入 | helper.go:168-172 | 合成额外 chunk |
| 非流式 usage 改写 | relay-openai.go:237-265 | prompt_tokens==0 时改写 body |
| forceFormat 重序列化 | relay-openai.go:266-270 | 丢未知字段 |
| ParamOverride/RemoveDisabledFields | compatible_handler.go:163,170 | Marshal 后用 sjson 改/删字段；直通模式跳过 |

---

## 待验证 / 待补充
- [ ] `PassThroughRequestEnabled` 的定义、默认值、作用位置（亲自 grep）
- [ ] PassThrough 与 ParamOverride 的确切互斥关系
- [ ] 是否存在"PassThrough 同时改个别字段"的机制
- [ ] relay-core 主报告回来后交叉比对
