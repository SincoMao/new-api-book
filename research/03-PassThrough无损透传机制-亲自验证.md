# PassThrough 无损透传机制 — 亲自验证记录

> 验证人：主 agent 本人（grep 源码亲自确认）
> 验证日期：2026-07-22
> 触发：收到并行深挖 agent 报告（见 `02-…`）提到 `PassThroughRequestEnabled`，因来源非我直接派发的主 agent，**亲自 grep 交叉验证**。
> 结论：机制真实存在且比并行报告描述的更强大、更精细。

---

## 一、核心开关：两级 PassThrough

### 1. 全局开关（默认关闭！）
- 定义：`setting/model_setting/global.go:36`
  `PassThroughRequestEnabled bool json:"pass_through_request_enabled"`
- 默认值：`setting/model_setting/global.go:43` → **`false`**

### 2. 渠道级开关
- 定义：`dto/channel_settings.go:17`
  `PassThroughBodyEnabled bool json:"pass_through_body_enabled,omitempty"`
- 即：可全局开，也可**按渠道单独开**。

## 二、全原生格式均支持 PassThrough（关键！）
每个格式 handler 入口都有相同的两级判断 `全局 || 渠道`：
- OpenAI 兼容：`relay/compatible_handler.go:73`
- Claude（`/v1/messages`）：`relay/claude_handler.go:135, 157`
- Gemini（`/v1beta`）：`relay/gemini_handler.go:139`
- Responses（`/v1/responses`）：`relay/responses_handler.go:84`
- Rerank：`relay/rerank_handler.go:45`
- Image：`relay/image_handler.go:49`
- 汇总判定：`relay/common/relay_info.go:799`

→ **结论：claude code（Claude 端点）、Cursor（OpenAI 端点）、Gemini 客户端等所有原生协议，都能享受字节级无损 PassThrough。**

## 三、字段级透传控制（Field passthrough controls）—— 更精细的第三层
即使**不开全局 PassThrough**，前端也有"字段透传控制"面板，可逐字段决定是否透传到上游（i18n 键佐证）：
- Allow Claude beta query passthrough（Claude beta 查询透传）
- Allow include usage obfuscation passthrough
- Allow inference geography / inference_geo passthrough
- Allow safety_identifier passthrough
- Allow service_tier passthrough
- Allow speed passthrough
- Disable store passthrough
- 面板名：`"Field passthrough controls"`（zh.json:1946）

→ **这层机制让"保真"不必非黑即白**：可在走 DTO 序列化的同时，把客户端发的非标准字段（如 service_tier、inference_geo、anthropic-beta 特性等）显式透传，避免被强类型 DTO 吞掉。

## 四、header 透传规则（`relay/channel/api_request.go:185-242`）
- 规则语法：`"*"` 全透传（排除 unsafe）；`"re:<regex>"`/`"regex:<regex>"` 按正则透传。
- 安全黑名单 `passthroughSkipHeaderNamesLower`（api_request.go:67）：不透传凭证类 header。
- → 客户端自定义 header 要进上游，靠渠道 header_override 配置透传规则。

---

## 五、对全书核心主线（命门）的修正与定论

**并行报告（02）的"PassThrough 与 ParamOverride 二选一"说法过于简化。** 实际 newapi 提供三层无损保证：

| 层级 | 机制 | 粒度 | 默认 | 适用 |
|---|---|---|---|---|
| L1 字节直通 | `PassThroughRequestEnabled`(全局) / `PassThroughBodyEnabled`(渠道) | 整个请求体 | off | 极致无损，跳过 Convert/Marshal/ParamOverride |
| L2 字段透传控制 | Field passthrough controls | 逐字段 | 各异 | 走 DTO 但保留非标准字段 |
| L3 header 透传 | header_override pass_headers / regex | 逐 header | off | 保留客户端自定义 header |

**用户诉求"无损转发 + 个别模型改 max_tokens"的落地架构（待主报告细化后定稿）**：
- 路线 A（极致无损）：绝大多数渠道开 `PassThroughBodyEnabled` → 100% 字节无损。
- 路线 B（需改参数）：GLM5.2 等单独渠道**不开** PassThrough，改用渠道级 ParamOverride / model_setting 改 max_tokens；同时必要时配 L2 字段透传补偿。
- 路线 C（混合）：开 PassThrough 但依赖上游本身接受合理默认 max_tokens（不改）。

## 六、待交叉验证（主报告回来后补）
- [ ] `compatible_handler.go` PassThrough 分支的精确逻辑（开了之后是否完全跳过 Convert/Marshal/ParamOverride）
- [ ] L1 与"改 max_tokens"是否真互斥（还是 L1 开了仍可通过 header/sjson 改）
- [ ] Field passthrough controls 的前端配置路径与对应后端常量
- [ ] relay-core 主报告对同一机制描述的交叉比对
