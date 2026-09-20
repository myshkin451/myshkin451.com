# 首次云端部署验收

日期：2026-09-21（Asia/Shanghai）。此记录只说明实际完成的云端步骤；本机完整功能与恢复证据
见 [本地验收](LOCAL_ACCEPTANCE.md)，日常使用见 [运行说明](RUNBOOK.md)。

## 已上线

- 正式地址：[myshkin451.vercel.app](https://myshkin451.vercel.app)。
- Vercel Hobby 团队/项目：`myshkin451/myshkin451`；项目 ID `prj_6lKKAmTX9NFl2ZAou3aBnyea3sw5`。
- [PR #1](https://github.com/myshkin451/myshkin451.com/pull/1) 在 `ec002bb` 的 Stable checks 和
  Production platform 检查通过后合并；生产提交为 `a8e5a450a76cee7d840c5a248fd5864e33d51bd7`。
- 首次部署 `dpl_EtsRMcRCf74LNHHQDe4CG6VzoSRF` 于 `2026-09-20T18:53:19Z` 完成，状态 Ready。
  源码由 Vercel 从该仓库的 `main` 拉取，本机私密文件未上传。
- Root Directory 为 `site`，允许读取外层依赖和前端源码；Node 24.x、pnpm 10.33.2。
  构建机器为 Hobby basic，函数区域配置为 `sin1`；构建机器本身位于 `iad1`，二者含义不同。
- Git 自动部署只启用 `main`，项目 Preview 部署也已关闭。全部网站变量仅配到 Production，
  只有 Supabase 公开 URL/key、正式 origin、Corepack 开关与认证功能开关，无 service-role key。
- 本地主目录已快进到该合并提交，原有工作未覆盖。正式数据库没有导入本机样例、测试账号或媒体。

## 实际检查

- 从用户电脑请求首页、内容索引、文章、影像、项目、关于、留言、登录、注册、恢复、工作台、
  health、robots、sitemap，共 14 个地址返回 200；不存在的作品和媒体分别返回 404。
- `/health` 返回 `200 {"status":"ok"}` 且 `Cache-Control: no-store`，证明生产函数可查询数据库。
- 首页面向无登录会话返回实际 HTML 和正确 canonical；sitemap、robots 使用正式 origin。
- 内置浏览器实际打开首页，显示“暂无公开内容”，没有测试作品或本机设计预览控件。
  登录页完成身份检查后明确显示邮箱注册与找回暂未开放。
- 窄屏首页、内容索引、留言和工作台无横向溢出；请求 320 像素窗口时实际 CSS viewport 为
  291 像素，文档宽度同为 291。已查看首页截图，未捕获浏览器 warning/error，结束后恢复窗口尺寸。
- 云端 SQL 查询确认账号、公开内容和媒体对象均为 0，迁移版本为 `202609210001`。
  `public` 的 6 张业务表及 `private.message_events` 共 7 张表开启 RLS；`media` 桶保持私有。
- Supabase Auth 的 Site URL 为正式 origin；只允许精确 `/auth/callback` 与 `/recover` 回调，
  最低密码长度为 12，邮箱确认保持开启。配置 push 后再次 diff，已声明且受管理的配置差异为 0。
  未声明的远端配置没有被默认值覆盖。

## 尚未完成

- 自定义 SMTP 和真实确认信、恢复信送达。Brevo 手机验证码多次被拒，此路径已停止接续，
  未获得可用 SMTP 凭据；建议下一阶段评估自有域名加 Resend，尚未实施或验收替代服务。
- Supabase CLI 2.117.0 不管理 `auth.rate_limit.email_sent`；目标 30 封/小时仍需通过 Dashboard
  或 Management API 设置和读回。不能以本机 TOML 或其他配置 push 成功替代该项证据。
- 邮件注册功能开关仍为 false；尚无真实站主账号或 owner 授权。OAuth 也未启用。
- 真实账号的云端发布、独立访客权限、留言审核，以及有内容后的再次部署持久化验收。
- 日常备份的长期私密保存位置和托管环境恢复演练；本机恢复验收不代表云端恢复已验证。

本次没有购买域名、升级套餐、添加支付方式或创建付费资源。邮件未验证前，不把公开首页上线
称为完整平台交付。
