# 0013: 托管内容、身份和正式网站

Status: Accepted implementation direction; cloud activation and external delivery not yet verified

Date: 2026-09-21

## 依据

本次委托授权实现、技术选择和部署，零预算，不要求保留旧 Payload。前端已有集中数据接口和
可用的中文编辑器；旧 Payload 公开内容模型不包含组图/访客隔离，且需额外托管常驻应用、
数据库、对象存储和邮件。选择保留页面、替换持久层，减少自行维护认证服务的负担。

## 决定

- `site/` 使用Next.js 16.3.5 + React（部署前升级，覆盖 2026 年 8 月官方安全修复），通过服务端读取已发布内容提供真实路径、HTML、
  元信息、站点地图和媒体入口。共享 `frontend/src/` 页面；旧 Vite 本机预览继续独立保留。
- Supabase 托管 PostgreSQL、Auth 和私有 Storage；公开键受数据库 RLS 与 RPC 权限限制。
  网站运行不持有 service-role 密钥。旧 Next/Payload 应用保留为历史实现，生产不部署其 API。
- 管理者由受控数据库角色表显式授予；注册、资料字段和客户端都不能授予自己管理权限。
  内容分别保存草稿与公开副本。私有媒体仅管理者或公开内容的确切引用可以读取。
- 访客使用验证邮箱和密码注册/登录；注册确认、找回密码由 Supabase Auth 完成。正式邮件使用
  Brevo 免费档与验证发件人；未经真实送达验证不得启用生产邮箱入口。GitHub OAuth 仅可选。
- 留言默认待审核，修改后重新审核；本人管理、回复目标校验、限流均在数据库执行。邮件不公开。
- Vercel Hobby 托管 `site/`，使用默认域名；无付费功能、无新域名购买、无测试内容上线。
- 备份含数据库身份/业务数据和完整媒体字节；恢复范围、拒绝条件和演练证据由运行说明记录。

## 费用和约束（2026-09-21 官方资料）

[Supabase Free](https://supabase.com/pricing)：$0/月，500 MB 数据库、1 GB 图片存储，
每周闲置暂停，不含自动备份；这是免费启动的可用性限制，不能宣称持续在线保证。
[Vercel Hobby](https://vercel.com/docs/plans/hobby)：$0，限个人非商业用途，额度耗尽可能停服。
[Brevo Free](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)：$0，300 封/日；
新账号的事务邮件开通、发件人验证与实际送达仍须验收。无自有域名时可能
[改写免费邮箱发件地址](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders)，
由接收人实际看到的邮件验证体验。SMTP2GO 仅在已有合规工作/域名邮箱时作为备选，不能称为人人可无域名注册。
[Supabase 默认 SMTP](https://supabase.com/docs/guides/auth/auth-smtp) 不能支持公众注册。

## 验证与边界

官方 [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、
[Storage 权限](https://supabase.com/docs/guides/storage/security/access-control)、
[本机 CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) 支持此组合。
本次以真实本机 Supabase 服务、公开/访客/管理 API、两浏览器会话和备份恢复证明实现。
云账号、发送方验证、实际网络与免费档部署尚须单独验收，不能以本地通过替代。
本机 IndexedDB 不自动迁移；测试数据只存在独立本机数据库。

公开链接为 `/entry/<稳定 UUID>`，改标题不改链接。发布后的图片签名缓存最多 60 秒；撤下后
拒绝新签名，但已有下载/签名在有效期内无法召回。正文只渲染受控纯文本格式，不接受任意 HTML。

## 未选路径

复用 Payload 需改造访客、组图、存储与托管，当前收益低于复用界面。自行维护密码认证/邮件
与免费服务器增加安全和运维负担。Cloudflare R2 需要付款方式，与当前零付费启动不合适。
未来收费业务或存储/流量变化时重新评估套餐；本决定不授权收费升级。
