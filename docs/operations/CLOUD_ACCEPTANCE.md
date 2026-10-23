# 云端上线与验收

## 2026-10-23：正式域名与日常发布改进

- 本人完成域名付款；Vercel 团队 `myshkin451` 已确认注册，2027-10-23 到期，自动续费开启。
  注册人联系邮箱验证已完成。正式地址为 [myshkin451.com](https://myshkin451.com)，`www` 以
  308 跳转根域；两者均有自动续期证书，旧 Vercel 地址在迁移期保留。
- 提交 `63e0032c1c264c7c5cc6a1ba3b23623978668660` 已推送；
  [CI](https://github.com/myshkin451/myshkin451.com/actions/runs/39830368329) 与
  [Production platform](https://github.com/myshkin451/myshkin451.com/actions/runs/39830368469) 均成功。
  首次代码部署 `dpl_2Wv4eidwHhDbkMS9DtRtp7rHVPeL` Ready；随后应用正式 `SITE_URL` 的
  [生产部署](https://vercel.com/myshkin451/myshkin451/CvQrQSSJvXp1AkzaukcZArNQfNJn) Ready。
- 浏览器确认新版首页导航、登录返回位置及根域 canonical。HTTP 实测 `/health` 为
  `200 {"status":"ok"}`，sitemap 使用根域，`www` 的 `/notes` 跳转后保留路径与正确 canonical。
  新域 `/study` 在原生 Chrome 中显示学习室登录页；学习记录仍受独立账号保护。本轮没有
  修改学习项目、数据库结构、权限政策或导入测试内容。
- Supabase Auth Site URL 使用新域，迁移期保留新旧域各自的精确 `/auth/callback` 和
  `/recover`，没有通配符。邮箱确认开启、匿名登录关闭、最低密码长度 12 均已核查。
- Resend Free 已核实额度且付费超额发送关闭。`auth.myshkin451.com`（Tokyo）已验证，
  实际 DKIM/Forge CNAME/初始 DMARC 已在权威 DNS 读回，未配置邮件跟踪或接收 MX。

- 经本人明确批准，旧的未使用邮件凭据已撤销，只保留一枚同名、仅可通过认证子域发信的新凭据。
  Supabase custom SMTP 保存后刷新仍开启，受保护密码已存储；中文确认/恢复主题和正文已分别
  保存并预览。邮箱限流读回 30 封/小时，同一用户 60 秒间隔；没有推送整份本机配置。
- `NEXT_PUBLIC_EMAIL_AUTH_ENABLED=true` 仅配置于 Production；从源码 `99c1034` 重新部署的
  [邮件启用部署](https://vercel.com/myshkin451/myshkin451/J6DDeTLv1Dyimu2ow2uvkYPBraJq) Ready，
  已绑定正式域名。真实邀请邮件到本人 Gmail 收件箱并完成邮箱验证；网站恢复表单随后发出的
  中文信也到收件箱，链接建立 PKCE 会话，显示“设置新密码”。Gmail 显示认证子域签名及 TLS。
- 本人明确批准首个站主授权。`public.site_owners` 从 0 条变为 1 条本人已验证账号记录；
  刷新加载的真实 `/studio` 显示内容、随记、留言、设置和账号管理入口。首次授权使用受保护
  管理表操作，不能声称产生了应用权限变更 RPC 的审计事件。没有生产测试账号或假内容。

待完成：本人在已打开的安全页面设置网站密码，并验证密码登录及真实随记/文章/图片发布。
注册确认模板目前只有云端预览证据，不能用邀请或恢复邮件代替其实际送达验收；独立生产访客、
手机图片上传与无代理网络检查仍待进行。已验证的恢复会话与站主工作台访问不代表密码已保存。

## 2026-10-15 — learning page integration

Production `dpl_EEUmkuCgpwLM3GqiMMFfNERs3Scm` adds `/study`, a neutral navigation link,
and an independent study entry on the content-service error page. The existing Supabase project
was resumed; the home page and `/health` returned normally. No database migration, seed content,
paid upgrade or account change was performed.

The built route is static and does not fetch the content database. Live desktop and 390px Chrome
checks showed the embedded study login page; the 390px document had no horizontal overflow.
The learning service permits the precise personal-site origin, while the parent permits only that
study iframe. Targeted lint/format, site types/build and all 89 frontend tests passed. The owner
confirmed learning login; personal-site publishing/email acceptance remains a separate open item.


## 2026-09-27：已认可视觉与账号权限增量

- 正式地址仍为 [myshkin451.vercel.app](https://myshkin451.vercel.app)。本轮先将本地已认可
  `2a7e304`（包含 Cursor `e264d44`）推送 `main`，再发布账号管理增量 `766781a`。
- 视觉部署 `HZRFKNSWVjmwtrXcZczX8xPb9mP5` Ready；账号功能部署
  [`HbSMc5tpKHbeSD6NyGMiHW6H94UC`](https://vercel.com/myshkin451/myshkin451/HbSMc5tpKHbeSD6NyGMiHW6H94UC)
  Ready，正式别名指向 `myshkin451-bhm4ol06p-myshkin451.vercel.app`，Dashboard 源码显示
  `766781ab8c928578813d622dce732272dd1449b2`。
- 该提交的 [CI](https://github.com/myshkin451/myshkin451.com/actions/runs/36262811907) 与
  [Production platform](https://github.com/myshkin451/myshkin451.com/actions/runs/36262811811) 均成功。
- 已读回生产迁移 `202609210001`、`202609210002`、`202609270001`。只应用账号增量，
  没有初始化数据库、导入样例、建立测试账号或改变既有数据。
- 云端只读统计：Auth、站主、公开内容、草稿、留言、媒体均为 0。首位真实站主仍不存在。
- 从本机访问公开页、账号页、工作台账号路由、health、robots、sitemap，共 16 项 HTTP 200。
  首页实际 SSR 含 `modern-empty-home`、正确 canonical，无预览 dock；`/health` 返回 ok。
  浏览器确认新版空首页；390px 视口（内容宽 375px）无横向溢出。新版登录页明确提示
  “邮箱登录、注册与找回暂未开放”，生产浏览器未捕获 warning/error。
- Supabase Auth Site URL 实时读回为正式 origin，回跳仅两项精确 URL：`/auth/callback` 和
  `/recover`。自定义 SMTP 尚未配置；控制台明确要求先配置 SMTP 才能编辑邮件模板，发送
  邮件限额控件也不可编辑。没有把本机模板或 config push 当作云端邮件已生效的证据。

### 本机功能证据

89 项前端测试、76 项账号权限断言、186 项原 API 回归、12 项备份工具测试通过；lint、
根目录/site 类型检查、frontend/site 两套构建通过。新增权限断言覆盖匿名／访客越权、
自降权、并发交叉撤权、未验证／封禁身份、旧 JWT 访问草稿／媒体及权限审计。

独立 Chrome 站主与内置浏览器访客在本机真实 Supabase 验证：账号列表、自身保护、
限制写入成功提示、受限访客仍能登录但昵称写入被服务端拒绝、管理页拒绝访问；320px
站主账号管理页（内容宽 305px）无横向溢出，恢复写入确认与反馈成功。测试身份仅在本机，
不是云端真实账号验收。测试账号已精确清理，原有本机账号保留，测试页面和服务已关闭。
恢复工具的新增检查与 107 项合成恢复演练证据见 [本轮恢复记录](RELEASE_RESTORE_2026-09-27.md)。

本人明确授权后，实际生产归档已保存到本机私密长期目录，通过完整性校验：11 张表共
1 行默认设置，账号 0、媒体 0，生产没有写入。使用官方 CA 和完整 TLS 主机验证，凭据只在
进程内存中流转。该生产归档已恢复到全新的本机隔离目标，54 项恢复/重启检查通过，目标随后停止。
FileVault 已开启，目录 700、文件 600；每周日 21:00 的只读到期检查已安排。

### 仍未验收

用户再次将域名步骤留待下一步。生产邮箱开关继续关闭；外部确认／恢复邮件、本人安全
设置密码、显式首位站主授权、真实发布与留言、含真实内容的重新部署持久化均未完成。
有真实内容后的恢复与独立加密副本仍需后续验收。没有新外部存储、购买或付费升级。

回退可使用已认可视觉的 `2a7e304` 部署；账号迁移是向后兼容的新增表/RPC与权限收紧，
回退页面不删除数据库内容，也不反向回滚迁移。旧视觉 `9b916f8` 仅作更早历史参照。

---

## 2026-09-21：首次云端部署（历史）

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
