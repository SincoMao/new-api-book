# 附录 B · 转发端点完整表

> newapi 暴露的全部转发端点（综合 `router/relay-router.go`、`router/video-router.go` 与〔research/09〕）。"无损渠道类型"指：客户端打该端点时，命中此类型渠道才不触发跨格式转换。

## 核心文本/多模态端点

| 端点 | 方法 | RelayFormat | 无损渠道类型 | 鉴权头 |
|---|---|---|---|---|
| `/v1/chat/completions` | POST | OpenAI | OpenAI(1)/DeepSeek(43)/xAI(48) 等 OpenAI 兼容 | Bearer |
| `/v1/completions` | POST | OpenAI | OpenAI 兼容 | Bearer |
| `/v1/moderations` | POST | OpenAI | OpenAI | Bearer |
| `/v1/responses` | POST | OpenAIResponses | 支持 Responses 的上游 | Bearer |
| `/v1/responses/compact` | POST | OpenAIResponsesCompaction | Responses 压缩变体 | Bearer |
| `/v1/messages` | POST | **Claude** | **Anthropic(14)** | `x-api-key`+`anthropic-version` |
| `/v1beta/models/{model}:{action}` | POST | **Gemini** | **Gemini(24)** | `?key=`或`x-goog-api-key` |
| `/v1/models/*path` | POST | Gemini | Gemini（OpenAI 风格兼容入口） | Bearer |
| `/v1/engines/:model/embeddings` | POST | Gemini | Gemini embedding | Bearer |

## 向量/重排序

| `/v1/embeddings` | POST | Embedding | 支持向量化的上游 | Bearer |
| `/v1/rerank` | POST | Rerank | Cohere/Jina | Bearer |

## 图像/音频

| `/v1/images/generations`、`/v1/images/edits`、`/v1/edits` | POST | OpenAIImage | OpenAI/Midjourney 等 | Bearer |
| `/v1/audio/transcriptions`(STT)、`/v1/audio/translations`、`/v1/audio/speech`(TTS) | POST | OpenAIAudio | OpenAI Whisper/TTS | Bearer |

## 实时

| `/v1/realtime` | GET(WebSocket) | OpenAIRealtime | OpenAI/Azure Realtime | `Sec-WebSocket-Protocol` |

## 模型列表（按请求头自动切协议）

| `/v1/models` | GET | — | 带 `x-api-key`+`anthropic-version`→Anthropic 格式；`x-goog-api-key`/`?key=`→Gemini；否则 OpenAI |
| `/v1/models/:model` | GET | — | 同上 |
| `/v1beta/models` | GET | — | Gemini |
| `/v1beta/openai/models` | GET | — | OpenAI（Gemini 兼容层） |

## 异步任务

| `/mj/*`、`/:mode/mj/*` | GET/POST | — | Midjourney Proxy 协议 | `mj-api-secret`兜底 |
| `/suno/submit/:action`、`/suno/fetch`、`/suno/fetch/:id` | POST/GET | — | Suno | Bearer |
| `/v1/videos`、`/v1/videos/:task_id` | POST/GET | — | OpenAI 兼容 Video(Sora) | Bearer |
| `/v1/video/generations`、`/v1/videos/:video_id/remix` | POST | — | 视频生成 | Bearer |
| `/kling/v1/videos/*` | POST/GET | — | Kling | Bearer |
| `/jimeng/` | POST | — | 即梦 | Bearer |

## 未实现（返回 501）

`/v1/images/variations`、`/v1/files*`、`/v1/fine-tunes*`、`DELETE /v1/models/:model`、`/v1/messages/count_tokens`（404，Claude Code token 预估会命中此缺口）。

## 内置操练场

`/pg/chat/completions`（POST，`UserAuth`+`Distribute`，非令牌鉴权）。
