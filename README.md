# 浩航科技山东校园代理 H5

面向山东高校的校园代理招募网站。公开页面、报名表、管理员后台、内容管理和匿名统计均在同一个 Cloudflare Pages 项目中运行。

## 当前架构

- React + TypeScript + Vite：网站前端
- Cloudflare Pages：静态页面与自动部署
- Pages Functions：同域 `/api` 接口
- D1：报名名单、网站内容和统计数据
- R2：后台上传的微信二维码与图片

旧版 `cloudfunctions/haohang-api` 仅保留作迁移参考，线上不再使用 CloudBase，也不需要配置 `VITE_CLOUDBASE_ENV_ID`。

## 本地预览

```powershell
npm install
npm run dev
```

直接执行 `npm run dev` 时使用浏览器本地演示数据，演示后台地址为 `/admin/login`，默认密码是 `demo1234`。本地演示数据不会进入线上 D1。

完整检查：

```powershell
npm test
npm run build
npm run check:functions
```

## 一、创建 D1 数据库

1. 打开 Cloudflare 控制台，进入“存储和数据库”中的 D1。
2. 创建数据库，名称建议填写 `haohang-campus`。
3. 打开该数据库的“控制台”，完整粘贴并执行 `migrations/0001_initial.sql`。
4. 执行成功后应看到 5 张表：`site_content`、`applications`、`analytics_events`、`submission_rate_limits`、`sequence_counters`。

## 二、创建 R2 存储桶

1. 进入 Cloudflare R2，创建存储桶，名称建议填写 `haohang-assets`。
2. 不需要开启公共访问。网站通过 `/api/assets/...` 读取图片。

如果暂时不需要从后台更换二维码，可以稍后配置 R2；报名和名单仍可使用，但后台上传图片会提示“图片存储尚未配置”。

## 三、绑定 Pages 项目

进入 Cloudflare Pages 项目 `Money-watergold` 的“设置 > 绑定”，添加：

| 类型 | 变量名称 | 选择的资源 |
| --- | --- | --- |
| D1 数据库 | `DB` | `haohang-campus` |
| R2 存储桶 | `ASSETS_BUCKET` | `haohang-assets` |

变量名称必须完全一致，包括大写。

## 四、生成并配置密钥

先生成管理员密码摘要，密码至少 10 位：

```powershell
npm run admin:hash -- "这里换成你的后台密码"
```

终端输出的整行值用于 `ADMIN_PASSWORD_HASH`。再生成另外三个随机密钥：

```powershell
npm run cloudflare:secrets
```

在 Pages 项目的“设置 > 变量和机密”中新增以下机密，生产环境和预览环境可分别配置：

| 机密名称 | 值 |
| --- | --- |
| `ADMIN_PASSWORD_HASH` | 密码摘要脚本输出的整行 |
| `ADMIN_SESSION_SECRET` | 随机密钥脚本输出的对应值 |
| `DATA_ENCRYPTION_KEY` | 随机密钥脚本输出的对应值 |
| `DATA_HASH_SECRET` | 随机密钥脚本输出的对应值 |
| `WECOM_WEBHOOK_URL` | 可选，企业微信群机器人 Webhook |

不要把真实密码、摘要、密钥或 Webhook 写进 `.env.example`、README 或提交到 GitHub。`DATA_ENCRYPTION_KEY` 和 `DATA_HASH_SECRET` 一旦投入使用不要随意更换，否则旧报名中的联系方式将无法解密或无法正确识别重复报名。

## 五、Cloudflare Pages 构建设置

- 框架预设：`React (Vite)` 或 `Vite`
- 构建命令：`npm run build`
- 构建输出目录：`dist`
- 根目录：留空（仓库根目录就是项目目录）
- Node.js：建议 20 或更高版本

前端无需设置 `VITE_API_BASE_URL`，生产构建会自动使用同域 `/api`。完成 D1/R2 绑定和机密配置后，在“部署”中重新部署最新提交。

## 六、上线验收

1. 打开 `https://你的域名/apply` 提交一份测试报名。
2. 打开 `https://你的域名/admin/login`，使用生成摘要时输入的原始密码登录。
3. 在报名名单确认记录可见，并修改为“已通过”，检查是否生成 `HH-SD-000001` 格式编号。
4. 在内容管理上传两张微信二维码并保存，再检查首页和报名成功页。
5. 导出一次 Excel，确认微信号、手机号、来源和状态完整。

分享链接可以附加来源，例如 `?source=朋友圈`、`?source=微信群`，后台会按来源统计。

正式收集报名信息前，请完成一次手机微信内置浏览器的真实报名与后台查看闭环。
