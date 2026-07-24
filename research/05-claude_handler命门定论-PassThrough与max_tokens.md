# claude_handler.go 命门定论 — PassThrough 与 max_tokens 的精确交互

> 验证人：主 agent 本人，亲自精读 `relay/claude_handler.go:24-175`
> 验证日期：2026-07-22
> 这是全书"无损 vs 调教"权衡的代码级最终答案。

---

## 一、ClaudeHelper 流程（`/v1/messages` 入口）

`ClaudeHelper`（claude_handler.go:24）处理 Claude 协议请求，顺序：
1. `InitChannelMeta`（:26）初始化渠道元数据
2. 取 `*dto.ClaudeRequest` 并 `DeepCopy`（:28-37）
3. `ModelMappedHelper`（:39）—— **ModelMapping 模型映射在此生效**
4. 取适配器并 `Init`（:44-48）
5. **max_tokens 默认注入**（:50-53）
6. **effort/thinking 后缀适配**（:55-108）
7. **渠道 SystemPrompt 注入**（:110-133）
8. **ShouldChatCompletionsUseResponsesGlobal → 转 OpenAI Responses 走**（:135-154，条件性）
9. **构造 requestBody**：PassThrough 分支（:157-163）or 非 PassThrough 分支（:164+）

## 二、★决定性逻辑（PassThrough 与改写的关系）

```go
// 行157-163：PassThrough 分支
if PassThroughRequestEnabled || ChannelSetting.PassThroughBodyEnabled {
    storage, _ := common.GetBodyStorage(c)        // ★原始客户端请求体字节
    info.UpstreamRequestBodySize = storage.Size()
    requestBody = common.ReaderOnly(storage)      // ★直接用原始字节，不用 request 对象
} else {
    // 行164+：非 PassThrough，用被改写后的 request 序列化
    convertedRequest, _ := adaptor.ConvertClaudeRequest(c, info, request)
    jsonData, _ := common.Marshal(convertedRequest)
    // 行175: remove disabled fields for Claude API (RemoveDisabledFields)
}
```

**关键洞察**：第 5/6/7/8 步的所有改写都作用于 **`request` 对象**；而 PassThrough 分支**根本不使用 `request` 对象序列化**，用的是 `GetBodyStorage` 的原始字节。因此——

> **开启 PassThrough（全局或渠道）后，max_tokens 注入、thinking 适配、SystemPrompt 注入、Responses 格式转换、RemoveDisabledFields 全部对"实际发往上游的 body"无效。客户端原始请求体被字节级透传。**

## 三、★无损 vs 调教 的最终答案（核心主线定论）

| 目标 | 配置 | max_tokens 行为 | 无损性 |
|---|---|---|---|
| **极致无损**（claude code 等） | 开 `PassThroughBodyEnabled`(渠道) 或全局 | **客户端原 max_tokens 原样透传**（即使是 nil/0 也原样发，不注入） | 字节级无损 |
| **需改 max_tokens**（个别模型调教） | **关** PassThrough | 客户端没传时注入 `GetDefaultMaxTokens(model)`（可按模型配）；或 ParamOverride | DTO 级（接受 service_tier 等被删 + max_tokens 被改） |

**因此"无损 + 个别模型改 max_tokens"的工程实现**：
- claude code 等客户端 → 其对接渠道**开 PassThrough** → 100% 无损。
- 需调教的模型 → **单独建渠道、关 PassThrough** → 用 `GetDefaultMaxTokens(模型)` 设默认 max_tokens 或 ParamOverride。
- 两者通过**不同渠道 + 模型映射**隔离，互不影响。

## 四、claude code 对接的无损保证（第 11 章基石）
- claude code 打 `/v1/messages` → ClaudeHelper。
- 渠道开 PassThroughBodyEnabled → 客户端发的 max_tokens（claude code 默认会发一个值，如 32000/64000）原样透传到上游 Anthropic → 无损。
- 唯一不可规避：header 的 `x-api-key` 被渠道密钥覆盖（鉴权必需）、`anthropic-version` 未传时默认 2023-06-01（claude code 会传，故无影响）、流式 SSE 逐事件重打包（内容等价）。

## 五、GetDefaultMaxTokens 已确认（按模型可配的官方机制）✅
grep 确认 `setting/model_setting/claude.go`：
- `:19` `DefaultMaxTokens map[string]int json:"default_max_tokens"`
- `:28` 初始默认 map；`:45-46` 无 "default" 键时补 8192
- `:84-88` `GetDefaultMaxTokens(model)`：先查 model，回落 "default"
- **前端入口**：`web/src/features/system-settings/models/claude-settings-card.tsx` →「系统设置 → 模型设置 → Claude」卡片，字段 `claude.default_max_tokens` 是 **JSON map 字符串**（textarea 编辑），如 `{"default":8192,"claude-opus-4-8":32000}`。
- ⚠️ **仅 Claude 路径生效**（claude_handler.go / oai→claude 转换，:51）。开 PassThrough 时不生效（用原值）；仅在客户端没传 max_tokens 时才注入 → 对正常发值的客户端（如 claude code）安全无害。

## 六、仍待确认（等 config-tuning 主报告）
- [ ] GLM5.2 走 OpenAI 兼容路径（compatible_handler.go）的 max_tokens 默认/覆盖机制——是否有 openai 侧按模型默认？或靠渠道 ParamOverride？或 GetDefaultMaxTokens 在 OpenAI 路径也复用？待 config-tuning 定。
- [ ] config-tuning 主报告回来后比对 setting/model_setting 全貌与 OpenAI 路径 max_tokens 注入点。
