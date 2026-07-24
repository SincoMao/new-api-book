# 附录 F · 故障排查 FAQ

> 按场景分类的速查。详细原理见对应章节。

## 部署
- **首访找不到管理员密码？** → 新版用初始化向导（非 root/123456）。误跳过则备份数据库后删 `setups` 表当条记录重新触发（第 3 章 3.3）。
- **容器起不来？** → `docker compose logs -f new-api` 看日志：密码不一致（SQL_DSN/POSTGRES_PASSWORD/redis requirepass）/MySQL 字符集不达标 panic/3000 端口被占（第 3 章 3.8）。
- **`CRYPTO_SECRET` 是什么？丢了怎样？** → 缓存键 HMAC 密钥（**非加密密钥**）；换了只让旧缓存键失效（缓存重建），不致数据不可读；多节点共享 Redis 必须一致。
- **升级后配置丢了？** → 配置存 `options` 表，不会丢；若加密敏感字段异常，检查 `CRYPTO_SECRET` 是否改了。

## 渠道
- **渠道被自动禁用？** → 上游报错触发 AutoBan。调试期关 `AutoBan` 或全局 `AutomaticDisableChannelEnabled`（第 4 章 4.10）。
- **渠道地址报错？** → 默认 BaseURL 为空的类型（Azure/Custom/Aws/Vertex/AdvancedCustom）必须手填。
- **多 Key 怎么配？** → Key 填多行 + 新建时 `Mode=multi_to_single` 或编辑时 `KeyMode=append/replace`（第 4 章 4.10）。

## 转发 / 无损
- **经 newapi 后质量下降/变笨？** → ①渠道类型错配（Claude 客户端命中 OpenAI 渠道→转换有损）：日志核对命中渠道类型；②没开 PassThrough 触发字段裁剪/注入：开 `PassThroughBodyEnabled`（第 5 章 5.8）。
- **某些字段（如 service_tier）丢失？** → `RemoveDisabledFields` 默认删；开 PassThrough 全保留，或渠道开对应 `Allow*`（第 5 章 5.4/附录D）。
- **响应和直连不完全一样？** → 非流式可字节级一致；流式是事件内容等价（SSE 重打包，非字节级）——这是物理上限（第 5 章 5.7）。
- **改了 max_tokens 不生效（GLM）？** → 该渠道开了 PassThrough（ParamOverride 被跳过）。GLM 单独建非直通渠道配 ParamOverride（第 6 章 6.8）。

## 客户端对接
- **客户端 404？** → base_url 多/少了 `/v1`；或端点不存在（如 `/v1/messages/count_tokens` 故意未实现）。
- **客户端 401？** → 令牌无效/过期；或鉴权头格式不对（newapi 接受 Bearer/x-api-key/?key=/x-goog-api-key）。
- **Claude Code 提示 count_tokens 失败？** → 已知缺口（404），SDK 会优雅降级，不影响对话（第 11 章 11.4）。
- **Cursor 覆盖 base_url 后模型不可用？** → 2025 已知 bug；先关 Override 验证连通，或删 Key 重启 Cursor 重配（第 11 章 11.5）。

## 计费
- **报"倍率或价格未配置"？** → 计费模式下该模型未设倍率；去系统设置→计费倍率配置（第 8 章）。
- **消耗异常偏多？** → 可能请求被注入 SystemPrompt 或跨格式转换放大；查日志 token 数；开 PassThrough 避免。
- **出现负扣费？** → 不应出现（有饱和保护）；若见，检查是否绕过了 `quota_math`（第 8 章 8.4）。

## 无损验证
- **怎么确认真的无损？** → ①对账法（直连 vs 经 newapi，对比质量+token）；②抓包 diff（非流式字节级一致）；③日志核对（渠道类型/模型/token）（第 9 章 9.6、第 11 章 11.9）。
