# 浩航科技山东校园代理 H5

面向山东高校的代理招募网站，包含公开 H5、报名表、单管理员后台、内容管理、匿名统计和 CloudBase 云函数。

## 本地运行

```powershell
npm install
npm run assets
npm run dev
```

未设置 `VITE_CLOUDBASE_ENV_ID` 时自动使用浏览器本地存储。演示后台地址为 `/admin/login`，默认本地密码为 `demo1234`，可通过 `VITE_DEMO_ADMIN_PASSWORD` 修改。该演示密码不会在配置 CloudBase 后生效。

浏览器本地存储仅在 Vite 开发模式启用。Vercel、Cloudflare Pages 等线上构建如果未设置 `VITE_CLOUDBASE_ENV_ID`，报名和后台会明确显示未连接云端，不会产生误导性的本地报名。

## CloudBase 部署

1. 创建 CloudBase 环境，开通静态托管、云函数、云数据库和云存储。
2. 安装 CloudBase CLI 并登录腾讯云账号。
3. 根据 `.env.example` 配置前端环境变量和云函数环境变量。
4. 在 CloudBase 身份认证中启用匿名登录，并把正式网站域名加入 Web 安全域名。
5. 在云数据库中将集合权限设为仅云函数可读写。
6. 执行 `npm run build`，部署 `cloudfunctions/haohang-api`，再将 `dist` 部署至静态托管。
7. 把 CloudBase 默认访问地址作为第一阶段分享链接。

## Cloudflare Pages

- 构建命令：`npm run build`
- 输出目录：`dist`
- 必填环境变量：`VITE_CLOUDBASE_ENV_ID`
- 云函数名：`VITE_CLOUDBASE_FUNCTION_NAME=haohang-api`
- 单页路由：`public/_redirects` 会随构建自动发布

修改前端环境变量后必须重新部署，Vite 会在构建时写入这些配置。

正式对外发布前，请在后台上传真实企业微信二维码并完成一次微信内置浏览器报名闭环测试。
