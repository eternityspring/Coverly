# Coverly 自托管部署

## 当前发布

- 目标域名：https://coverly.79px.com
- 当前镜像：coverly:20260917-clarity（2026-09-17 发布并验收）
- HTTPS：1Panel 管理的 Let’s Encrypt 证书，HTTP 自动跳转 HTTPS；自动续期已启用。当前证书到期 2026-12-16。
- 管理页面：/admin
- 管理员：eternityspring@gmail.com，绑定现有已验证账号的固定用户 ID。
- 数据库：沿用现有 Neon PostgreSQL。此次发布没有表结构变更。
- 服务器应用目录：/opt/coverly
- 应用：Docker Compose，127.0.0.1:3009 → 容器 3000。
- OpenResty：通过 1Panel 安装，使用 host 网络，因此可代理服务器本机的 127.0.0.1:3009。

## 统计

Microsoft Clarity 项目 yjk948tl35，通过 Nuxt 全站 head 加载，仅生产构建启用。已验证正式 HTTPS 响应中仅有一份正确的安装代码。浏览器仍收到旧 Vercel 构建，未确认实际数据上报；公共 DNS A 记录已正确指向新服务器。

## 构建和启动

使用 Node 22.12+ 或兼容版本，先 npm ci，再 npm run build。Dockerfile 封装已经生成的 .output 目录；在 Linux amd64 服务器运行时，应确保构建产物的依赖不含其他平台的本机二进制。

生产环境文件 .env.production 由运维创建，权限设为 600，不提交 Git。配置 DATABASE_URL、BETTER_AUTH_SECRET、NUXT_PUBLIC_BETTER_AUTH_URL、TRUSTED_ORIGINS；启用 Google 登录时配置对应凭据。登录界面的运行时开关为 NUXT_PUBLIC_AUTH_ENABLED 和 NUXT_PUBLIC_GOOGLE_ENABLED。

管理员配置 ADMIN_EMAIL 和 ADMIN_USER_IDS（可用逗号分隔固定 ID）。授权同时检查固定 ID、邮箱和邮箱验证状态；自行注册指定邮箱不能取得管理员权限。服务端保护所有 /api/admin/* 接口。管理列表仅返回 ID、昵称、邮箱、验证状态、注册时间和角色。

生产环境关闭本机 Agent 导入接口和轮询。私有模板只在开发环境显示，生产模板从数据库加载。

在 /opt/coverly 执行 docker compose build 和 docker compose up -d。健康检查接口为 /api/health；容器限制为 1 GB 内存，日志自动轮转。

## 验证

运行 npm run test:admin。发布验收应另外检查未登录 401、普通用户 403、管理员读取成功，以及搜索、分页、导出和页面布局。

正式域名验收通过：匿名管理员接口 401、普通用户 403、指定管理员 200；搜索、分页、敏感字段限制、禁用生产 Agent 接口和容器健康检查通过。

## 数据和更新

浏览器设计存储在 localStorage；本地地址下的文档需要导出 JSON 后在正式域名导入。服务器更新不会自动把设计迁移到云端。

更新前保留上一个应用镜像及生产环境文件，记录发布内容。本次发布不会更新数据库迁移或重写现有模板。数据库全量备份到该服务器的操作未获自动审批，因此未执行；如需复制数据库备份，应先明确授权其目的地。
