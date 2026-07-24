# 附录 E · 术语表

> 全书术语，中英对照 + 定义。

| 术语 | 英文/标识符 | 定义 |
|---|---|---|
| 上游 | upstream | 真正提供模型服务的官方 API（OpenAI/Anthropic/智谱…） |
| 渠道 | Channel | newapi 里一条指向上游的连接配置（类型+地址+密钥+模型+分组+调度+改写） |
| 令牌 | Token | newapi 发给客户端的调用钥匙（代替上游 Key） |
| 用户 | User | newapi 账号（普通/管理员/Root） |
| 分组 | Group | 渠道集合，决定可用渠道与计费倍率；`auto` 是跨组容灾的特殊聚合组 |
| 倍率 | Ratio | 计费系数：模型倍率/补全倍率/分组倍率 |
| 配额 | quota | 内部计费单位，1 美元 = 500,000 配额 |
| 直连 | — | 客户端不经 newapi、直接打官方 API（基准态） |
| 直通 | PassThrough | 网关原样转发请求体的模式（`PassThroughBodyEnabled` 渠道级 / `PassThroughRequestEnabled` 全局） |
| 端点 | endpoint | 客户端访问的 URL 路径（如 `/v1/messages`） |
| RelayFormat | RelayFormat | newapi 内部对请求协议的格式标签（OpenAI/Claude/Gemini/Responses/…） |
| 适配器 | Adaptor | `relay/channel/` 下对应某上游的协议转换器（openai/claude/gemini…） |
| 中间件 | Middleware | 请求链上按顺序执行的"关卡"（鉴权/限流/选渠道…） |
| AdvancedCustom | ChannelTypeAdvancedCustom(58) | 高级自定义渠道，路由表+转换器+鉴权，任意上游透明直通 |
| ParamOverride | param_override | 渠道级参数覆盖引擎（operations DSL，第 6 章） |
| HeaderOverride | header_override | 渠道级请求头覆盖 |
| ModelMapping | model_mapping | 渠道级模型名映射 |
| RemoveDisabledFields | — | 非直通下默认删 service_tier 等字段的机制（`relay_info.go:798-888`） |
| BodyStorage | — | 请求体原始字节快照（`common/gin.go:36`），解析/直通/重试共用，互不污染 |
| converter | — | AdvancedCustom 的协议转换器；`none`=原生格式**结构化**直通（语义无损但字节非一致，非字节级；区别于 PassThrough） |
| SSE | Server-Sent Events | 流式响应的传输方式；newapi 会逐事件重打包（内容等价非字节级） |
| DTO | Data Transfer Object | 请求/响应的结构体（如 `GeneralOpenAIRequest`、`ClaudeRequest`） |
| ability 表 | — | `(Group,Model,ChannelId)` 联合主键，表示某渠道在某分组支持某模型 |
| ChannelSettings | setting(单数列) | 渠道设置结构体（含 PassThroughBodyEnabled/ForceFormat/SystemPrompt） |
| ChannelOtherSettings | settings(复数列) | 渠道其他设置（含 Allow*/AdvancedCustom/UpstreamModelUpdate） |
| 预扣/结算 | PreConsume/PostConsume | 请求前按预估扣费 / 响应后按真实 usage 差额结算 |
| 自用模式 | SelfUseModeEnabled | 初始化向导选项，仅供内部使用 |
| 编程包 | coding-plan | glm/kimi/doubao-coding-plan 等预设 Claude/OpenAI 双格式 BaseURL 的模型 |
