# haohang-api

CloudBase 单入口云函数。部署前设置以下环境变量：

- `ADMIN_PASSWORD_HASH`：运行 `node scripts/hash-admin-password.mjs <密码>` 生成。
- `ADMIN_SESSION_SECRET`：至少 32 字节随机字符串。
- `DATA_ENCRYPTION_KEY`：32 字节随机值的 Base64 编码。
- `DATA_HASH_SECRET`：至少 32 字节随机字符串。
- `WECOM_WEBHOOK_URL`：可选，企业微信群机器人 Webhook。

数据库集合会在首次写入时自动创建。生产环境需把集合权限设置为仅云函数可读写。
