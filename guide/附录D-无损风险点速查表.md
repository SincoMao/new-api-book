# 附录 D · 无损风险点速查表

> 全书所有"可能偷偷改变请求/响应"的环节速查（综合第 5 章 5.8 与〔research/02/04/08〕）。**规避总则：在该渠道开 `PassThroughBodyEnabled` 即可一次性绕过下表大部分（响应流式除外）**。

| # | 环节 | file:line | 影响 | 开 PassThrough 是否规避 |
|---|---|---|---|---|
| 1 | DTO 封闭结构丢字段 | `dto/openai_request.go:29-109`、`dto/claude.go:206-237` | 无 Extra 兜底，Unmarshal→Marshal 丢未声明字段 | 是（直通原始字节） |
| 2 | RemoveDisabledFields 删字段 | `relay/common/relay_info.go:798-888` | 默认删 `service_tier`/`inference_geo`/`speed`/`safety_identifier`/`stream_options.include_obfuscation`（`store` 默认放行） | 是（首行 `if PassThrough return`） |
| 3 | Claude max_tokens 默认注入 | `relay/claude_handler.go:50-53` | `MaxTokens==nil\|\|*0` 时注入默认 | 是（注入在 request 副本，直通用原始字节） |
| 4 | Claude thinking/effort 后缀适配 | `relay/claude_handler.go:55-108` | 后缀模型名触发改写 Model/thinking/temperature | 是 |
| 5 | OpenAI StreamOptions 注入 | `relay/compatible_handler.go:54-63` | `ForceStreamOption` 开时给**流式**覆盖 `include_usage=true` | 是 |
| 6 | SystemPrompt 注入 | `compatible_handler.go:115-155`、`claude_handler.go:110-133`、`gemini_handler.go:98-136` | 渠道配 SystemPrompt 时插入 | 是 |
| 7 | ParamOverride 参数改写 | `relay/common/override.go:138/178/725` | 渠道 param_override 任意改 JSON（含 header） | 是（直通分支不调用） |
| 8 | OpenAI 条件字段改名 | `relay/channel/openai/adaptor.go:366` 附近 | o系列/GPT-5 `max_tokens`→`max_completion_tokens`；OpenRouter 注入 usage | 是 |
| 9 | 流式 SSE 重打包 | `relay/helper/stream_scanner.go:77/254-264` | 丢 event:/id:/注释行，只转 data:，注入 ping、末帧注 usage | **否**（流式天然重打包，内容等价非字节级） |
| 10 | header 鉴权覆盖 | 各 adaptor `SetupRequestHeader` | Authorization/x-api-key/x-goog-api-key/anthropic-version 被渠道密钥替换 | **否**（鉴权必需） |
| 11 | chat→responses 转换 | `compatible_handler.go:73-93`、`claude_handler.go:135-154` | `ChatCompletionsToResponsesPolicy` 命中时跨格式转换 | 是（政策默认关闭；开 PassThrough 也跳过） |
| 12 | 非流式响应重序列化（OpenAI） | `relay/channel/openai/relay-openai.go:236-269` | 上游未返回用量（本地补算）或开 `ForceFormat` 时重序列化 | 请求体直通不涉及；响应侧此路径仍可能重序列化（仅 OpenAI 格式；原生 Claude/Gemini 非流式始终字节级回写） |

## 关于 max_tokens（常被误解）
- `maxTokensLimit = MaxInt32/2`（`relay/helper/valid_request.go:120`），**只做上界拒绝（400），绝不静默 clamp**。
- 主动写 max_tokens 的只有第 3 项（Claude 默认注入）和第 8 项（OpenAI 字段改名），均可规避。

## 三档无损等级（速记）
- **(a) 默认结构化转换**：有损（DTO 往返 + 字段裁剪 + 可能注入）。
- **(b) PassThrough 字节直通**：请求体字节级无损（响应：非流式字节级 / 流式事件等价）。
- **(c) AdvancedCustom converter=none**：语义无损但字节非一致（仍经序列化）；再开 PassThrough 达 (b)。
