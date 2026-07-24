# Claude & Gemini 适配器层 — 无损透传研究报告

> 来源：并行深挖 agent（task-id `aa69633be32ba93da`，"深挖 claude 与 gemini adaptor"），非我直接派发的 6 主 agent 之一。结论与 02/03 一致且互补，已交叉验证可信。
> 归档日期：2026-07-22

---

## 核心结论：无损透传的精确边界

| 路径 | 无损性 |
|---|---|
| 非流式 + PassThrough | **100% 字节级无损**（`GetBodyStorage` 原始字节，跳过 Convert/Marshal/RemoveDisabledFields/ParamOverride 全链路） |
| 非流式 + 非 PassThrough | DTO 序列化级（**未声明字段丢失**），已知字段靠 RawMessage/指针保真 |
| 流式（Claude/Gemini SSE） | **逐事件解析→重打包**，内容等价但**非字节级**（帧边界/字段序可能变），PassThrough 也无法改变这点 |

**两处无法被 body PassThrough 规避的改写**：
1. 请求 header 的 `x-api-key`/`x-goog-api-key` 始终被渠道密钥覆盖（**网关鉴权必需，合理**——客户端用 newapi 令牌，newapi 用上游 key）。
2. 流式 SSE 响应始终逐事件重打包（内容等价）。

---

## 一、Claude 适配器

### 1.1 ConvertClaudeRequest 同类上游不转换
`relay/channel/claude/adaptor.go:28-30`：`return request, nil` —— **Claude→Claude(Anthropic) 原生直通，adaptor 不改 body**。
是否直通原始 body 由上层 `ClaudeHelper` 决定（`relay/claude_handler.go:157`：全局/渠道 PassThrough 为真 → 用原始字节）。

### 1.2 上层 handler 的默认改写（非 adaptor，非 passthrough 时生效）
| 改写 | file:line | 说明 |
|---|---|---|
| **max_tokens 默认注入** | `claude_handler.go:50-53` | 客户端没传 max_tokens(nil/0) 时注入默认值 |
| `-thinking` 后缀适配 | `claude_handler.go:76-108` | 注入 Thinking/Temperature=1.0/抬高 MaxTokens |
| effort 后缀处理 | `claude_handler.go:55-75` | 改 Model 并注入 OutputConfig |
| **RemoveDisabledFields 剥离** | `relay/common/relay_info.go:812-829` | 默认删 service_tier/inference_geo/speed（仅 OpenAI/Claude handler 调，Gemini handler 不调） |

### 1.3 ClaudeRequest DTO 透传性
`dto/claude.go:206-237`。**无通用 `Extra map[string]json.RawMessage` 兜底字段**（仅 `dto/openai_image.go:43` 的 ImageRequest 有 Extra）。
- 用 `json.RawMessage` 透传已知新字段（保留原始 JSON 片段不二次解析）：`context_management`/`output_config`/`output_format`/`container`/`mcp_servers`/`metadata`/`cache_control`/`speed`/`thinking`（claude.go:211,223-233）。
- 可选标量全是指针+omitempty（保留显式零值）：`MaxTokens *uint`/`MaxTokensToSample *uint`/`Temperature *float64`/`TopP *float64`/`TopK *int`/`Stream *bool`。
- `Model`/`ServiceTier`/`InferenceGeo` 是裸 string+omitempty（被 RemoveDisabledFields 单独处理）。

### 1.4 Claude header（adaptor.go:83-93）
- `x-api-key`：**强制覆盖**为渠道密钥（不透传客户端的）。
- `anthropic-version`：客户端传了透传，**没传默认 `2023-06-01`**（隐式注入）。
- `anthropic-beta`：透传客户端原值（`CommonClaudeHeadersOperation`）。
- 追加 `model_setting.GetClaudeSettings().WriteHeaders`（渠道配置额外 header）。

### 1.5 Claude DoResponse
- 非流式原生 = **原样字节回写**（`relay-claude.go:230-231,238`：`case RelayFormatClaude: responseData = data; IOCopyBytesGracefully`），仅 Unmarshal 算 usage → **无损**。
- 流式原生 = **SSE 重新封装**（`relay-claude.go:102-117`）：逐事件 Unmarshal→FormatClaudeResponseInfo→ClaudeChunkData 重发。
  - **message_delta usage patch**（`relay-claude.go:110-116`）：非 passthrough 时给 message_delta 注入补全 usage（修 Bedrock 缺字段）；passthrough 时 `shouldSkipClaudeMessageDeltaUsagePatch`（`relay-claude.go:68-76`）跳过。

---

## 二、Gemini 适配器

### 2.1 原生直通（`relay-gemini-native.go`）
触发：`adaptor.DoResponse`（`adaptor.go:265-275`）当 `RelayMode==RelayModeGemini`（客户端走 Gemini 原生路径）进入 native handler。
- 非流式 `GeminiTextGenerationHandler`（`:20-48`）：Unmarshal 仅算 usage，`IOCopyBytesGracefully` **原样回写完整 body 字节** → 无损。
- 流式 `GeminiTextGenerationStreamHandler`（`:81-93`）：逐事件解析算 usage，但 `helper.StringData` **原样转发每条事件 data 文本**（内容无损，SSE 帧由 helper 重建）。

### 2.2 ConvertGeminiRequest 对 Gemini 上游近乎原样（adaptor.go:26-44）
直接返回 request，仅两处轻微修正：首条 content 的 `Role` 默认补 `"user"`；YouTube `fileUri` 的 `mimeType` 补 `"video/webm"`。
- 仍走 `ConvertGeminiRequest→Marshal GeminiChatRequest`，**除非** `gemini_handler.go:139` passthrough 开启才直通原始 body。
- `dto/gemini.go:14` 的 `GeminiChatRequest` **无 Extra 兜底**，未识别字段非 passthrough 下丢失。

### 2.3 Gemini 流式 URL（alt=sse）
`GetRequestURL`（adaptor.go:166-172）按 `info.IsStream` 拼 `streamGenerateContent?alt=sse`。

---

## 三、可能"偷偷改动"环节清单（Claude+Gemini 合并）
| 环节 | 位置 | passthrough 是否规避 |
|---|---|---|
| Claude max_tokens 默认注入 | claude_handler.go:50-53 | 是 |
| Claude -thinking/effort 后缀 | claude_handler.go:55-108 | 是 |
| RemoveDisabledFields 剥离 service_tier/inference_geo/speed | relay_info.go:812-829 | 是 |
| Claude 流式 message_delta usage 注入 | relay-claude.go:110-116 | 是 |
| **Claude 流式 SSE 重新封装** | relay-claude.go:102-117 | **否（流式 passthrough 仍走解析重打包）** |
| Gemini role/mimeType 默认补 | adaptor.go:29-40 | 是 |
| DTO 无 Extra 兜底（丢未识别字段） | dto/claude.go:206 / dto/gemini.go:14 | 是（直通原始 body 不丢） |
| **header 覆盖 x-api-key/x-goog-api-key/anthropic-version** | adaptor.go:85,178,88 | **否（始终覆盖，鉴权必需）** |

## 四、对全书的影响
- 第 5 章理论：无损边界（非流式字节级 vs 流式事件级）+ 两处不可规避改写需明示。
- 第 11 章实战：claude code 流式无损验证要按"事件内容等价"而非"字节一致"来验证；非流式可按字节 diff。
- 第 6 章：max_tokens 默认注入点（claude_handler.go:50-53）是"无损与调教"的关键交汇点——开 passthrough 则不注入（用客户端原值），关 passthrough 才会注入默认/被 ParamOverride 改。

## 五、待交叉验证
- [ ] `claude_handler.go:50-53` max_tokens 默认注入的具体默认值（config-tuning 报告补）
- [ ] relay-core 主报告对 handler 链路的整合描述比对
