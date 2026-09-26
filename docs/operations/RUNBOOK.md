# Myshkin 451 使用与维护

更新：2026-09-27。本指南对应 `site/` + Supabase；`frontend/` 的 IndexedDB 预览仍独立保留。
实际验收和上线状态以 [progress.md](../../progress.md) 为准，本文的操作步骤不代表云端已经完成。

当前正式地址：[myshkin451.vercel.app](https://myshkin451.vercel.app)。公开浏览已上线；
邮件和首次站主账号仍在接续，具体证据见 [云端验收](CLOUD_ACCEPTANCE.md)。
Brevo 手机验证反复失败，停止该流程。Myshkin 451 目前仍是工作名，域名暂缓；
Resend 接入准备、中文模板和待本人参与的环节见 [认证邮件接续](EMAIL_SETUP.md)。
目前仅完成本机邮件验证，正式 SMTP 尚未启用。新版视觉已上线；账号与权限操作见
[账号指南](ACCOUNT_GUIDE.md)。域名和真实收信仍由本人明确留待下一步。

## 日常使用

- **发布**：登录站主账号，打开工作台，新建文章、照片或项目。填写标题、正文/图片/项目链接、
  分类与显示选项，先保存草稿并预览，再发布。发布后复制作品链接；另一个浏览器无需登录即可阅读。
- **账号管理**：工作台 → 账号，查看邮箱验证、角色和写入状态；可授予/撤销其他已验证账号的站主权限，或限制/恢复访客的本站写入。确认提示会说明影响；不能在页面中撤销自己的权限。
- **随记**：工作台打开“随记”，直接写正文。停笔后自动存私有草稿，看到“草稿已保存”后
  可以刷新恢复。主动点击“发布”才会公开；“写新随记”保留原草稿并打开空编辑器。
- **修改**：在工作台打开已发布作品，保存只修改草稿，发布更新才会替换公开版本。
  撤下会移除公开作品，保留编辑内容；删除前先确认确实不再需要。站点无作品时可以正常使用。
- **照片**：使用编辑器上传文件；媒体存放在 Supabase 私有 `media` 桶，公开作品引用的图片允许读取，
  仅草稿引用的图片仅站主可读。不要在 Supabase 控制台手动改名或覆盖媒体对象。
- **留言**：访客用邮箱注册，完成验证后登录。可留言、回复，以及管理自己的留言。
  新留言与编辑后的留言需要审核；站主在工作台审核、隐藏或删除。访客身份不能进入站主管理权限。
- **找回账号**：在登录页发起密码恢复，使用邮件中的链接设置新密码。站主也走同一流程，
  恢复密码不改变站主身份。收不到邮件时先查看垃圾邮件、SMTP 配额和发送记录，勿关闭邮箱验证绕过问题。

首次站主授权由维护者完成：本人先注册并验证邮箱，维护者核对其 Auth 用户 UUID，再按
数据库运维步骤加入 `public.site_owners`。不能根据昵称、浏览器数据或自行提交的用户 metadata 授权。
日常发布和审核不需要改代码、SQL 或登录云控制台。

## 本人一次完成的账号步骤

以下服务均选择免费套餐，不添加收费组件。价格与限制按 2026-09-21 官方页面核查；
若注册页面要求支付、改套餐或购买资源，停在那一步重新确认，不默认购买。

| 服务 | 用途、计划和已知限制 | 本人要做的事 |
| --- | --- | --- |
| [Supabase](https://supabase.com/dashboard) | Free，$0/月；数据库 500 MB、文件 1 GB；没有可依赖的自动备份，低活动约一周可暂停。[官方价格](https://supabase.com/pricing) | 注册/登录、验证邮箱，创建 Free 项目；把数据库密码保存在密码管理器。区域在实际网络检查后确认。 |
| [Vercel](https://vercel.com/new) | Hobby，$0，适用于个人非商业站点；超额可能暂时停用相应功能。[官方限制](https://vercel.com/docs/plans/hobby) | 注册/登录，授权此 GitHub 仓库。使用默认 `*.vercel.app` 地址即可。 |
| [Resend](https://resend.com/) | 候选 Free，$0/月、3,000 封/月、100 封/日；需要验证自有发件域名。[官方价格](https://resend.com/pricing) | 名字与域名确定后注册并完成本人验证；未开户、未产生费用。技术设置见邮件接续。 |

Supabase/Vercel 的开户与首次部署已经完成，不重新建项目。表中这两项额度是 2026-09-21 的
核实记录，Resend 于 2026-09-27 复核。最终名字尚未决定，当前无需本人重复注册或购买。

密码、验证码、数据库连接串、SMTP 密钥和 service-role key 不发在聊天里。
本人在服务商登录界面和受保护的环境变量/密码管理器中填写；维护者接续配置与测试。
本机私密环境文件权限设为 `600`，保存在 Git 仓库外；不要把备份或密钥上传 GitHub。

## 部署接续（维护者）

1. 现有项目只应用未部署的增量迁移；仅首次新项目才从空库应用全部 `supabase/migrations/`。不要重置现有项目，也不要把本地测试库、旧 IndexedDB 或演示样例导入生产。
   SQL、函数权限、RLS 和私有媒体桶均由迁移建立。保留当前生产迁移版本和对应 Git 提交。
2. Vercel 导入本仓库，Root Directory 设为 `site`，允许构建读取根目录依赖和 `frontend/`。
   使用 [site/vercel.json](../../site/vercel.json) 的构建配置和 [环境模板](../../site/.env.example)。
   公开 URL/key 可以给浏览器；`SUPABASE_SERVICE_ROLE_KEY` 与数据库密码只能用于私密维护命令。
   禁止把 service-role key 放入任何 `NEXT_PUBLIC_*` 变量。预览部署不得复用生产写入权限作测试。
   当前 Git 自动部署只启用 `main`，其他分支不部署；生产变量仅配置到 Production。
   没有独立测试后端时不开放 Preview。此规则使用 Vercel 官方
   [分支匹配配置](https://vercel.com/docs/project-configuration/git-configuration)，
   后续添加独立预览后端后再调整。构建选择 Node.js 24.x，并配置
   `ENABLE_EXPERIMENTAL_COREPACK=1` 以使用根目录锁定的 pnpm 版本。
3. 用真实分配的 HTTPS 地址配置 `SITE_URL`，Supabase Auth 的 Site URL 与精确允许的回调/恢复地址。
   本地应用端口为 `127.0.0.1:4325`；旧的 `127.0.0.1:4323` 留作设计预览。
4. Supabase Auth 启用邮箱确认、最低密码长度 12、邮件间隔 60 秒、每小时邮件上限 30，保留其余速率限制并按
   [认证邮件接续](EMAIL_SETUP.md)配置 Resend SMTP、中文模板和已验证的发件域。此步骤待发件域就绪后执行，不要求先确定网站品牌。
   默认 Supabase 邮件仅适合团队地址测试，不能承担公开注册；参见 [Supabase SMTP 限制](https://supabase.com/docs/guides/auth/auth-smtp)。
   CLI 2.117.0 的 `config push` 明确不管理 `auth.rate_limit.email_sent`；该值必须通过
   Dashboard 或 Management API 配置并读回，不能仅凭本机 TOML 或 push 成功声称已设置。
5. 实测非项目团队邮箱注册、确认、登录、退出、恢复；检查发件人显示、回跳地址、实际收件和邮件配额。
   确认通过后才开放邮箱注册入口。不要把邮件测试收件箱或默认邮件服务的成功当成生产送达证明。
6. 授予本人站主身份，用匿名、两个独立访客和站主分别验证权限，再检查 `/health`、
   `/robots.txt`、`/sitemap.xml`、作品直链、桌面/手机布局、重启及重新部署后的内容与图片。
   生产保留真实空首页，不发布验收用假作品或测试账号。

出现服务异常时先查看 Vercel Deployment/Runtime Logs、Supabase 项目状态、Auth 日志和 SMTP 发送记录。
`/health` 返回 `200 {"status":"ok"}` 说明公开数据查询能执行；它不证明邮件、所有权限、图片或所有页面都正常。
免费项目被暂停时由本人从 Supabase Dashboard 恢复，检查网站和媒体再恢复正常使用。
不通过制造假流量规避平台暂停规则。

## 备份范围与保存方式

备份保存的是网站上以后不想丢失的东西：账号、作品、未公开草稿、留言、原始图片和站点设置。
例如误删文章或需要换服务器时，可以用它恢复到备份时的状态。网站源码另由 Git/GitHub 保存；
这份应用备份不包含整台电脑的文件。

[`backup.mjs`](../../scripts/production/backup.mjs) 导出本项目的邮箱密码账号、对应身份 UUID、站主授权、
个人昵称、账号写入限制及权限审计、公开内容、草稿、站点设置、留言及速率记录，并下载 `media` 桶所有原始文件。
每个文件与数据库导出都有 SHA-256，表有行数/内容摘要；备份期间检测到相关数据变化会失败，
不生成完成标记。目录权限为 `700`，文件为 `600`，输出目录必须位于 Git 仓库外。

账号密码以数据库中的哈希形式保留，不创建替代用户、不重编作者 UUID。备份仍含邮箱、密码哈希、
私密草稿和留言，必须存入加密磁盘/加密备份，并保留一个由本人控制的独立加密副本。
SHA-256 检查意外损坏，不验证来源；只恢复自己生成并保管的可信备份，SQL 文件不能接受陌生来源。
每次重要发布后备份，最迟每周一次；至少保留最近两份成功备份与一次实际恢复记录。
当前脚本按需在维护窗口运行，没有收费备份。不要在定时器中固定填入 `--quiesced` 冒充已停止写入。

9 月 27 日本人让维护者选择保存位置：本机 `~/Library/Application Support/Myshkin451/Backups`，
目录已创建并设为 700，FileVault 已实时确认开启。此路径在代码仓库和临时目录之外；
第二份独立加密副本尚未选定，不能把同一台 Mac 的另一目录称为独立副本。
本人已明确授权“仅用于这个项目的本机备份”。第一份生产归档
`2026-09-27-production` 于本地时间 9 月 27 日 02:44 生成并通过完整性检查：11 张表共
1 行默认设置，账号与媒体均为 0。该归档的实际隔离恢复及重启通过 54 项检查；另有含账号、内容
和媒体的合成演练 107 项检查，详见 [本轮恢复记录](RELEASE_RESTORE_2026-09-27.md)。
目录权限 700，归档文件权限 600；实际有内容后仍需再次备份并验证真实数据恢复。

当前 Codex 任务已安排每周日 21:00（Asia/Shanghai）检查备份是否超过七天、缺失或损坏。
正常时不通知，同一未解决状态没有变化时不重复通知。该检查只读，不访问生产密钥或自动导出；
到期后安排维护窗口执行备份。本机定期任务依赖 Mac 开机且 Codex 运行，不能视为服务器端自动备份；
参见 [Codex 定期任务说明](https://learn.chatgpt.com/docs/automations?surface=app)。

新增 `linked-backup.mjs` 可复用已有 CLI 授权获取本项目的短期数据库连接和 service_role，
只在本机进程内存与子进程环境传递，不输出密钥、不执行返回 shell、不写凭据文件。
它严格验证项目绑定，要求显式静默窗口，依赖已运行的 PostgreSQL 工具容器。远程连接始终使用
`verify-full`；当前项目的证书由 Supabase Database → Settings → SSL configuration 提供。
9 月 27 日控制台指向以下官方公开 CA（有效期至 2031-04-26）。工具容器重建后需重新放入证书，
不能依赖上次的容器临时文件；若服务商更换 CA，以当前控制台提供的证书为准：

```bash
curl --fail --show-error --location \
  https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt \
  --output /private/tmp/myshkin-prod-ca-2021.crt
openssl x509 -in /private/tmp/myshkin-prod-ca-2021.crt -noout -subject -issuer -dates
docker cp /private/tmp/myshkin-prod-ca-2021.crt \
  supabase_db_myshkin451-production:/tmp/myshkin-prod-ca-2021.crt
PGSSLROOTCERT=/tmp/myshkin-prod-ca-2021.crt \
node scripts/production/linked-backup.mjs \
  --project-ref ggvwabhlogzhmgdnqpkx \
  --out "$HOME/Library/Application Support/Myshkin451/Backups/NEW_TIMESTAMP" \
  --pg-container supabase_db_myshkin451-production --quiesced
```

CLI 短期连接以 `cli_login_postgres` 登录时，工具显式切换到其授权的 `postgres` 维护角色。
失败只报告固定阶段，不打印含凭据的原始 CLI 或数据库错误。证书信任或连接失败时修复对应条件，
不关闭 TLS 校验、不重置数据库密码。

每份清单记录 Git 提交/是否有未提交修改、Node/PostgreSQL 工具和服务端版本。恢复前会检查
目标媒体桶的私有状态、文件大小及 MIME 限制与备份一致，防止恢复时悄悄放宽上传约束。

这是**应用恢复包**，不是完整 Supabase 项目克隆：

- 包含 `auth.users`、`auth.identities`、六张 `public` 业务表及 `private.message_events`、`private.account_access`、`private.account_access_events` 的数据。
  数据库结构、函数、RLS 和媒体桶规则由相同版本的仓库迁移重建。
- 不恢复登录会话、refresh token、旧验证/重置链接；恢复后重新登录，未确认用户重新请求确认邮件。
  不复制 SMTP、项目 URL、签名密钥、数据库角色、服务商设置、其他桶、日志或外部服务凭据。
- 当前只支持邮箱密码。源库有短信、匿名、OAuth/SSO、MFA 等身份时脚本拒绝备份。
  启用新身份方式、修改数据模型或更换 Supabase/Auth 版本前，先扩展工具并完成新的恢复演练。
- 不直接恢复 Supabase 的 `storage.objects` 元数据，使用 Storage API 重新上传文件并验证原始字节。
  对象名保留，应用引用继续成立；供应商内部对象 ID、owner 元数据和创建时间不保证相同。

官方数据库备份也不包含 Storage 的实际文件。全项目迁移、额外 Auth 方式或不兼容版本应按
[Supabase 官方迁移说明](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
单独处理角色、schema、Auth/Storage 变更与文件，不能把本工具的受限恢复结果写成整个平台克隆。

## 执行备份（维护者）

环境要求：Node 22+，与数据库匹配的 PostgreSQL `pg_dump`/`psql`；本地可复用正在运行的
`supabase_db_myshkin451-production` 容器。私密环境文件包含以下变量名，实际值从已授权的控制台取得：

```dotenv
SUPABASE_URL=http://127.0.0.1:55421
SUPABASE_DB_URL=postgresql://USER:PASSWORD@127.0.0.1:55422/postgres
SUPABASE_SERVICE_ROLE_KEY=PRIVATE_SERVICE_KEY
PG_TOOL_CONTAINER=supabase_db_myshkin451-production
```

`PG_TOOL_CONTAINER` 仅指定 PostgreSQL 工具所在容器；本地地址会转为该容器内的 `127.0.0.1:5432`，
因此必须选中该项目的数据库容器。远程连接使用实际数据库地址，不改写；默认验证 TLS 证书，
需要时从 Supabase 控制台下载数据库 CA 并通过 `PGSSLROOTCERT` 指定，不使用 `sslmode=disable` 绕过验证。
在容器中执行远程备份时证书路径必须能被容器读取；可改用本机 PostgreSQL 工具，避免改变运行容器。
连接选择 Direct 或 Session pooler（通常端口 5432），不要用事务池模式执行备份恢复。

找一个没有发布、上传、注册、登录和留言操作的维护窗口；`--quiesced` 是对此的显式确认，
脚本不会替操作者停止服务或锁住所有请求。它还会前后检查数据摘要，变化时需重新生成一份备份。
恢复目标则必须一直保持隔离，不能接收访客请求。

```bash
node --env-file=/private/path/source.env scripts/production/backup.mjs \
  --out /private/path/backups/2026-09-21 --quiesced

node scripts/production/restore.mjs \
  --from /private/path/backups/2026-09-21 --verify-only
```

父目录须已存在，具体备份目录须为新目录。远程备份额外附加 `--remote https://PROJECT.supabase.co`，
必须与环境文件的 API 地址完全相同；命令行只出现非秘密的 URL。`--verify-only` 不连接服务、
不修改数据，仅验证本地文件和迁移版本，不能代替恢复演练。
目录缺少 `manifest.json` 或 `manifest.sha256` 表示未完成；保留用于排错，但不能拿它恢复。

## 恢复与实际演练（维护者）

1. 保留原项目、原备份和旧部署。创建隔离的本地 Supabase 目标或全新空项目，检出备份记录的
   迁移版本并应用迁移。目标 Auth、内容、留言、速率记录和媒体必须为空；唯一允许的业务行
   是迁移写入的默认站点设置，且该默认行必须存在。脚本会在事务内替换它。
   **不要清空生产库以绕过保护。**
2. 在独立私密环境文件中填写目标连接。仔细核对 API 与数据库属于同一目标，本地目标应使用
   不同端口、不同 project id 和不同 `PG_TOOL_CONTAINER`。备份中不保存连接密码。
3. 先 `--verify-only`，然后执行恢复；例中的目标端口需替换为实际新建的隔离目标：

   ```bash
   node --env-file=/private/path/restore-target.env scripts/production/restore.mjs \
     --from /private/path/backups/2026-09-21 \
     --confirm-target http://127.0.0.1:55521 --quiesced
   ```

   远程目标还需 `--remote https://NEW_PROJECT.supabase.co`，与 `--confirm-target` 同值。
   工具先验证全部文件与列结构、目标空状态和权限，再在默认设置行暂存随机标记，
   经服务角色 REST 读取核对，证明 API 和数据库属于同一目标。无论核对成功与否，均尝试仅在
   整行仍等于本次标记时恢复默认值；发现并发改动、无法核对或无法撤回即拒绝继续，不覆盖改动。
   撤回后重新检查空状态，才上传并逐个下载校验媒体；数据在关闭
   触发器的单个事务内恢复，避免自动生成 profile 与备份冲突，提交前逐表核对摘要。
4. 若失败，不切换流量。数据库事务失败会回滚，但 Storage 上传不在该事务内，隔离目标可能
   留下部分媒体；进程被强制终止或撤回失败时也可能留下绑定标记。目标全程保持隔离，
   由维护者检查后再决定重新建立目标，不手动清空业务数据绕过保护。脚本不会自动删除任何已有数据。
5. 使用备份前已有的站主和测试访客密码重新登录隔离站点，核对 UUID/站主身份、草稿隔离、
   已发布作品、回复与审核状态、原图内容；用另一个账号验证不能读取草稿或改他人留言。
   重启目标应用并再次读取内容和图片。记录备份时间、Git 提交、目标版本、行数/文件数、
   登录及权限结果；记录中不包含用户邮箱、密码哈希或连接串。
6. 只有全部通过后才重新配置目标的 SMTP、回调地址和生产部署连接，验证真实邮件及用户网络。
   原项目保留到新项目稳定；清理原项目属于单独的显式操作，不是此脚本的步骤。

一次恢复验证成功仅覆盖当次迁移、Supabase 版本与账号方式；云端数据库权限、网络和 SMTP 仍须
在实际服务商环境验证。免费环境的备份频率决定可接受的数据损失窗口，不具备时间点恢复承诺。

## 版本更新与回退

部署前先保留最近可恢复备份，运行当前仓库对应的检查和构建，再发布。Vercel 可重新部署先前
通过验收的提交，但它不会自动回退数据库；迁移应保持旧版本兼容，否则先在隔离目标演练。
无数据库变动的页面回退不会影响 Supabase 中的作品、账号或媒体。
任何数据模型或 Auth 变化都应同步审查备份表范围、迁移指纹和恢复测试。
