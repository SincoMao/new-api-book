# 附录 A · 环境变量完整表

> 主要入口：`common/init.go`、`common/constants.go`、`constant/env.go`。按 8 大类整理；完整列表以源码为准（部分项随版本变化）。

## ① 数据库
| 变量 | 默认 | 作用 |
|---|---|---|
| `SQL_DSN` | 空(SQLite) | 主库连接串（按前缀判定 SQLite/PG/MySQL，`model/main.go:127-179`） |
| `LOG_SQL_DSN` | 空 | 独立日志库（可 ClickHouse） |
| `LOG_SQL_CLICKHOUSE_TTL_DAYS` | 0 | ClickHouse 日志留存天数（0=不清） |

## ② 缓存
| `REDIS_CONN_STRING` | 空 | Redis 连接串（可选；不开回退内存+DB） |
| `MEMORY_CACHE_ENABLED` | — | 内存缓存（开 Redis 时强制开） |

## ③ 服务
| `TZ` | — | 时区（如 `Asia/Shanghai`） |
| `NODE_NAME` | — | 节点名（审计标识） |
| `NODE_TYPE` | master | `slave` 跳过迁移；DB 租约系统任务由 master 排他 |
| `FRONTEND_BASE_URL` | — | 前端分离部署（主节点忽略） |
| `SYNC_FREQUENCY` | 60 | 数据库同步周期（秒） |

## ④ 安全（生产关键）
| `SESSION_SECRET` | — | 鉴权签名密钥；多节点必须一致；不可设 `random_string` |
| `CRYPTO_SECRET` | 跟随 SESSION_SECRET | **缓存键 HMAC 密钥**（非加密密钥）；共享 Redis 时多节点一致 |
| `SESSION_COOKIE_SECURE` | false | true 启用 Secure Cookie + 严格 Origin 校验 |
| `SESSION_COOKIE_TRUSTED_URL` | — | Secure=true 时必填，精确 HTTPS Origin（非 relay CORS 白名单） |
| `TRUSTED_PROXIES` | 回环+RFC1918 | 信任的代理 IP/CIDR；`none`=严格；留空带告警 |

## ⑤ 限流 / 会话
| `USER_SESSION_ACTIVE_LIMIT` | 50 | 单用户最大活跃会话 |
| `USER_SESSION_ISSUANCE_LIMIT` | 100 | 签发窗口内会话总数 |
| `USER_SESSION_ISSUANCE_WINDOW_SECONDS` | 86400 | 签发计数窗口 |
| `USER_SESSION_REVOKED_RETENTION_DAYS` | 7 | 撤销会话审计保留 |
| `USER_SESSION_HOURLY_ALERT_THRESHOLD` | 5000 | 全局每小时签发告警（只告警不拒绝） |

## ⑥ 转发超时与请求体限制
| `STREAMING_TIMEOUT` | 300 | 流式无响应超时（秒；⚠️ docker-compose 注释 120s 已过时） |
| `STREAM_SCANNER_MAX_BUFFER_MB` | 128 | 流式单行最大缓冲（4K 图片 base64 需调大） |
| `MAX_REQUEST_BODY_MB` | 128 | 请求体上限（解压后计，超限 413/400） |
| `RELAY_TIMEOUT` | 0 | 整体 HTTP 超时；**默认 0(不限制)=官方建议**（设正数有计费亏损风险） |
| `RELAY_IDLE_CONN_TIMEOUT` | Go 默认 | Relay HTTP 客户端空闲连接超时 |

## ⑦ 特性
| `FORCE_STREAM_OPTION` | true | 流式请求覆盖 `stream_options.include_usage=true`（有损；无损模式可关） |
| `BATCH_UPDATE_ENABLED` | — | 批量更新（性能） |
| `ERROR_LOG_ENABLED` | false | 错误日志 |
| `AZURE_DEFAULT_API_VERSION` | 2025-04-01-preview | Azure API 版本 |

## ⑧ 监控
| `PYROSCOPE_URL` / `PYROSCOPE_APP_NAME` 等 | — | Pyroscope 性能剖析 |
| `GOOGLE_ANALYTICS_ID` | — | GA 统计 |
| `UMAMI_WEBSITE_ID` / `UMAMI_SCRIPT_URL` | — | Umami 统计 |

> 数据库/Redis/会话相关详细语义见第 3 章；`FORCE_STREAM_OPTION`/`RELAY_TIMEOUT` 对无损与计费的影响见第 5、6 章。
