# 附录 C · 渠道类型枚举表

> 渠道类型枚举（`constant/channel.go:3-61`），默认 URL 表 `ChannelBaseURLs`（:63-123），名称表（:125-181）。**选错类型 = 走错转换路径 = 有损**。

## 主流类型

| 值 | 常量 | 名称 | 默认 BaseURL | 备注 |
|---|---|---|---|---|
| 1 | OpenAI | OpenAI | api.openai.com | 基准，OpenAI 兼容（含 Azure 子模式） |
| 3 | Azure | Azure | （空，必填） | OpenAI 兼容，URL/版本特殊 |
| 8 | Custom | Custom | （空，必填） | 老式自定义，整个 BaseURL 当 URL，仅 OpenAI 格式 |
| 14 | Anthropic | Anthropic | api.anthropic.com | Claude Messages 格式 |
| 15 | Baidu | 百度 | — | — |
| 16 | Zhipu | 智谱 | open.bigmodel.cn | GLM |
| 17 | Ali | 阿里 | dashscope.aliyuncs.com | 通义 |
| 18 | Xunfei | 讯飞 | — | `Other`=api_version |
| 19 | 360 | 360 | — | — |
| 20 | OpenRouter | OpenRouter | — | — |
| 23 | Tencent | 腾讯 | — | — |
| 24 | Gemini | Gemini | generativelanguage.googleapis.com | Gemini 格式 |
| 25 | Moonshot | 月之暗面 | — | — |
| 27 | Perplexity | Perplexity | — | — |
| 33 | Aws | AWS | （空，必填） | Bedrock，AKSK |
| 34 | Cohere | Cohere | — | — |
| 35 | MiniMax | MiniMax | — | — |
| 37 | Dify | Dify | — | ChatFlow |
| 39 | Cloudflare | Cloudflare | — | `Other`=api_version |
| 40 | SiliconFlow | 硅基流动 | — | OpenAI 兼容 |
| 41 | VertexAi | Vertex | （空，必填） | GCP，`Other`=region JSON |
| 42 | Mistral | Mistral | — | — |
| 43 | DeepSeek | DeepSeek | api.deepseek.com | OpenAI 兼容 |
| 45 | VolcEngine | 火山 | — | 豆包 |
| 46 | BaiduV2 | 百度 v2 | — | — |
| 47 | Xinference | Xinference | — | — |
| 48 | Xai | xAI | api.x.ai | OpenAI 兼容 |
| 49 | Coze | Coze | — | `Other`=bot_id |
| 50 | Kling | 快手 Kling | — | 视频 |
| 51 | Jimeng | 即梦 | — | 视频 |
| 57 | Codex | ChatGPT 订阅 | chatgpt.com | OAuth 凭证 |
| **58** | **AdvancedCustom** | **Advanced Custom** | （空，必填） | **任意上游透明直通**（`advanced_routes`；converter=none 为**结构化直通**，语义无损但字节非一致，要字节级需再开 PassThrough） |

## 特殊

- **`ChannelSpecialBases`**（`constant/channel.go:195-212`）：为 `glm-coding-plan`、`glm-coding-plan-international`、`kimi-coding-plan`、`doubao-coding-plan` 等"编程包"模型预设 Claude/OpenAI 双格式 BaseURL。
- `ChannelTypeDummy`：计数哨兵。

## 默认 BaseURL 为空的类型（必须手填）

Azure(3)、Custom(8)、Aws(33)、VertexAi(41)、AdvancedCustom(58) 等——不填则请求期 `GetBaseURL()` 拿到空地址失败。
