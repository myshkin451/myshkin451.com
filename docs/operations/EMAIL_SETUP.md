# 认证邮件接续

更新：2026-09-27。Myshkin 451 仍是工作名；本人再次确认没有可管理的 DNS/域名，域名步骤继续暂缓。
本文件是可执行的准备记录，不代表 Resend 已注册、SMTP 已启用或真实邮件已送达。

## 当前云端边界

9 月 27 日重新登录现有 Supabase 项目核查：Custom SMTP 尚未配置，认证邮件页明确显示
“Set up custom SMTP to edit templates”，默认发送服务只使用默认模板；发送邮件限额控件禁用。Site URL 与两项精确回跳
`/auth/callback`、`/recover` 已读回确认。因此本仓库中文模板
不能通过代码部署自动生效，也不以临时绕过该限制完成验收。生产仍没有网站账号。

当日复核 Resend 官方价格：Free 为 $0/月、3,000 封/月、100 封/日；必须验证本人控制的
发件域。未注册或购买，不开启付费 overage。服务选择仍待发件域步骤，不是已激活方案。

## 已准备

- [确认邮箱模板](../../supabase/templates/confirmation.html)，主题「确认你的邮箱」。
- [恢复密码模板](../../supabase/templates/recovery.html)，主题「设置新密码」。
- [本机配置](../../supabase/config.toml) 已绑定两份模板。它们使用 Supabase 原生
  `{{ .ConfirmationURL }}` 和 `{{ .SiteURL }}`，不写死域名或尚未确定的品牌。
- 2026-09-22 用隔离本机 Auth + Mailpit 实测：两封中文信到达本机捕获器、模板变量完成
  替换、确认链接完成邮箱验证、恢复链接回到 `/recover`、新密码可登录，21 项断言通过。
  320px 浏览器检查两份实际渲染模板，长链接可换行，无横向溢出。合成账号随后清理。
  本机证据不覆盖 Gmail、QQ、Outlook 等实际客户端渲染、垃圾箱判断或外部送达率。

## 发件域就绪后执行

网站继续使用 Vercel 地址。发件域可独立于网站品牌选择，现阶段不要求本人先定最终名字；
用户于 9 月 27 日明确将域名步骤留到下一步。购买、服务商注册和本人验证由本人完成，
技术配置、排错和接续验收由维护者执行。
不因本文准备记录自动购买、建立新的公开身份或重复 Brevo 手机验证码流程。

| 项目 | 准备采用的设置 | 启用条件 |
| --- | --- | --- |
| 网站地址 | 继续使用当前 Vercel 地址；正式域名按本人最终选择绑定 | 注册商 DNS、Vercel 域名归属及 HTTPS 验证通过 |
| 发件服务 | Resend Free，$0/月、3,000 封/月、100 封/日 | 本人注册；实际额度与要求以开户时页面为准 |
| 发件域名 | 独立子域，例如 `auth.example.com` | 根据 Resend 当场生成的 DNS 记录验证 DKIM/SPF；不能使用此占位域名 |
| 发件人 | 最终站名 + `noreply@auth.example.com` | 与已验证的发件域匹配，不冒用公共邮箱地址 |
| SMTP | `smtp.resend.com`，端口 `465`，用户名 `resend` | API key 只写入 Supabase 受保护的 SMTP 配置 |
| 邮件内容 | 本仓库的确认/恢复模板与中文主题 | 单独更新 Hosted Auth 对应模板并读回核对 |
| 跟踪 | 认证邮件关闭点击及打开跟踪 | 避免一次性验证链接被改写，减少不必要追踪 |

1. DNS 值从实际 Vercel 项目和 Resend 控制台取得，不照抄其他域名的记录。核对现有记录后
   添加需要的记录；不覆盖已有收信 MX，不在同一域名建立多个 SPF 记录。DMARC 按最终
   发件域配置并验证对齐；报告地址只能使用本人实际控制的邮箱。
2. HTTPS 成功后更新网站 `SITE_URL`、Auth Site URL 与精确允许的 `/auth/callback`、
   `/recover` 地址。先保留仍在使用的有效回跳地址，验证后再缩小范围。
3. 配置 SMTP、中文模板和 Auth 邮件限流，保留邮箱确认。使用 Dashboard 或明确字段的
   Management API 更新并读回；**不把整个本机 `config.toml` 推到云端**，避免覆盖正式 URL。
   本机模板提交与 Vercel 部署都不会自动更新 Hosted Auth 邮件。
4. 在本人邮箱实测确认信和恢复信，核对发件人、实际到达、垃圾箱、链接目的地与新密码登录。
   收信和密码输入由本人完成。通过后开放生产注册/恢复入口，授予已验证本人 UUID 站主权限，
   继续真实随记/文章/图片的发布、修改、撤下和重新部署持久化验收。
5. 在真实内容产生前确认长期加密备份保存位置。服务商日志和本机临时目录不是长期备份。

## 官方依据

2026-09-22 核实：[Resend 免费额度](https://resend.com/pricing)、
[Supabase SMTP 接入](https://resend.com/docs/send-with-supabase-smtp)、
[发件子域与验证](https://resend.com/docs/dashboard/domains/introduction)、
[Supabase 邮件模板与链接跟踪注意事项](https://supabase.com/docs/guides/auth/auth-email-templates)、
[本机模板配置](https://supabase.com/docs/guides/local-development/customizing-email-templates)。
