# 认证邮件接续

更新：2026-10-23。正式域名、Resend SMTP、云端中文模板和生产邮箱入口已启用。
真实邀请与恢复邮件已到本人 Gmail 收件箱，恢复链接已打开设置新密码页；本人站主授权及工作台
访问已验证。密码保存、密码登录和真实发布仍待本人完成。整体顺序见
[日常使用审查与上线步骤](DAILY_USE_LAUNCH.md)。

## 10 月 23 日接续

- Resend Free 已核实为 3,000 封/月、100 封/日，未启用付费超额发送或其他附加服务。
- 发件域 `auth.myshkin451.com`（Tokyo）已验证，未配置邮件跟踪或接收服务。Vercel 的权威 DNS
  已读回 DKIM TXT、`rsend.auth` / `send.auth` 两条当场生成的 Forge CNAME，及初始 `p=none`
  的 `_dmarc.auth`。不要用旧的 SES MX/SPF 示例覆盖这些记录。
- Supabase Site URL 已切为主域；新旧域各自的精确确认回跳与恢复地址共四项，均已保存。
- 经本人批准，旧的未使用凭据已撤销；现仅保留一枚 `myshkin451-supabase-auth`，权限为
  Sending access，限 `auth.myshkin451.com`。Supabase SMTP 保存成功并刷新确认开启、密码已存储。
  一次性密钥窗口随后关闭，剪贴板清空；凭据未写入项目文件或截图。
- 中文确认/恢复主题和正文已分别保存到 Hosted Auth，预览显示正确。限流读回为每小时 30 封、
  同一用户间隔 60 秒。控制台促销横幅曾遮挡保存按钮；关闭横幅后保存成功，不需反复重建凭据。
- 真实本人账号经邀请邮件完成邮箱验证；生产邮箱开关已启用并部署。网站实际发出的中文恢复信
  到达 Gmail 收件箱，签名域显示 `auth.myshkin451.com`，TLS 传输，链接建立 PKCE 会话并打开
  设置密码页。站主授权后工作台可进入；这不代替本人设置密码和密码登录验证。
- 注册确认模板目前只有云端预览证据，尚无真实外部注册确认信的送达证据；不要把邀请信或
  本机邮件测试写成生产注册闭环已通过。未创建生产测试账号或发布测试内容。
- 接续不再需要重新征求本次配置相关邮箱读取或原控制台登录的授权。凭据不能写入本文件。

## 9 月 27 日历史边界

9 月 27 日重新登录现有 Supabase 项目核查：Custom SMTP 尚未配置，认证邮件页明确显示
“Set up custom SMTP to edit templates”，默认发送服务只使用默认模板；发送邮件限额控件禁用。Site URL 与两项精确回跳
`/auth/callback`、`/recover` 已读回确认。因此本仓库中文模板
不能通过代码部署自动生效，也不以临时绕过该限制完成验收。生产仍没有网站账号。

当日复核 Resend 官方价格：Free 为 $0/月、3,000 封/月、100 封/日；必须验证本人控制的
发件域。未注册或购买，不开启付费 overage。服务选择仍待发件域步骤，不是已激活方案。

## 模板与验证证据

- [确认邮箱模板](../../supabase/templates/confirmation.html)，主题「确认你的邮箱」。
- [恢复密码模板](../../supabase/templates/recovery.html)，主题「设置新密码」。
- [本机配置](../../supabase/config.toml) 已绑定两份模板。它们使用 Supabase 原生
  `{{ .ConfirmationURL }}` 和 `{{ .SiteURL }}`，不写死域名或尚未确定的品牌。
- 2026-09-22 用隔离本机 Auth + Mailpit 实测：两封中文信到达本机捕获器、模板变量完成
  替换、确认链接完成邮箱验证、恢复链接回到 `/recover`、新密码可登录，21 项断言通过。
  320px 浏览器检查两份实际渲染模板，长链接可换行，无横向溢出。合成账号随后清理。
  本机证据不覆盖 Gmail、QQ、Outlook 等实际客户端渲染、垃圾箱判断或外部送达率。
- 2026-10-23 两份模板已单独保存到云端；中文恢复信的实际 Gmail 送达与链接回跳已验证。
  注册确认信、其他邮箱客户端和整体送达率不因这一例恢复信而视为通过。

## 当前配置与后续维护

网站已能通过 `https://myshkin451.com` 访问，旧 Vercel 地址在迁移期间保留；认证发件域使用独立子域。
购买、服务商注册和本人验证由本人完成，
技术配置、排错和接续验收由维护者执行。
不因本文准备记录自动购买、建立新的公开身份或重复 Brevo 手机验证码流程。

| 项目 | 当前设置 | 维护边界 |
| --- | --- | --- |
| 网站地址 | `https://myshkin451.com`，迁移期保留旧 Vercel 地址 | 新旧域均使用精确认证回跳，避免通配符 |
| 发件服务 | Resend Free，$0/月、3,000 封/月、100 封/日 | 未启用付费超额发送，额度以控制台为准 |
| 发件域名 | `auth.myshkin451.com` | 以实际生成并验证的 DKIM/Forge DNS 记录为准 |
| 发件人 | `Myshkin 451 <noreply@auth.myshkin451.com>` | 与已验证的发件域匹配 |
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
4. 本人账号已受邀并验证，无需再次注册。当前先由本人在 `/recover` 输入、确认并保存新密码，
   再验证密码登录。设置相关邮件可按既有授权由维护者核对；密码始终由本人输入并提交。
   已确认的首次站主授权无需重复，继续真实随记/文章/图片的发布、修改、撤下和持久化验收。
5. 注册确认信与独立访客流程另行验证，不用虚构生产账号代替真实使用；沿用现有长期加密
   备份位置，并在产生真实数据后更新归档。服务商日志和本机临时目录不是长期备份。

## 官方依据

2026-09-22 核实：[Resend 免费额度](https://resend.com/pricing)、
[Supabase SMTP 接入](https://resend.com/docs/send-with-supabase-smtp)、
[发件子域与验证](https://resend.com/docs/dashboard/domains/introduction)、
[Supabase 邮件模板与链接跟踪注意事项](https://supabase.com/docs/guides/auth/auth-email-templates)、
[本机模板配置](https://supabase.com/docs/guides/local-development/customizing-email-templates)。
