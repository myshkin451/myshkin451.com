# 共享前端与本机预览

`frontend/src/` 提供首页、内容浏览、编辑工作台和访客页面。现在有两个独立运行入口，不能把
其中一个的保存结果当成另一个的数据。架构见[决策 0013](../docs/decisions/0013-production-supabase-and-next.md)，
上线与外部服务验收状态以 [progress.md](../progress.md) 为准。

| 入口 | 保存与身份 | 用途 |
| --- | --- | --- |
| `frontend/`，Vite，`http://127.0.0.1:4323/` | IndexedDB、本机昵称，无真实密码或邮件 | 独立试用、设计预览；保留原有本机内容 |
| [`site/`](../site/app/client.tsx)，Next.js，默认本地端口 `4325` | Supabase PostgreSQL、Auth、私有 Storage，服务端权限隔离 | 真实发布与互动实现；云端账号、部署与邮件送达需另行验收 |

本机内容、排版样例和测试身份不会自动导入真实服务。根目录的旧 Next/Payload 应用及
`docs/design/studies/` 历史样稿继续保留，均不是新的生产入口。

## 本机预览

在仓库根目录运行：

```bash
pnpm install --frozen-lockfile
pnpm frontend:dev
```

打开 `http://127.0.0.1:4323/`。`localhost`、`127.0.0.1` 和不同端口有各自的 IndexedDB，
清除浏览器数据会删除该来源的本机内容。此模式不提供共享发布、账号恢复或服务端权限。
右下角“本机预览”可以打开明确标注的排版样例和工作台；首次打开默认隐藏样例。
既有显示偏好及用户创建的内容保留，不生成虚构访客对话。

```bash
pnpm frontend:test
pnpm frontend:build
pnpm frontend:preview
```

`frontend/dist/` 是可用静态 HTTP 服务打开的本机预览产物，不能单独部署它并声称完成真实平台。

### 当前完整平台评审

第四轮现代视觉已经接入共享应用。用户于 9 月 27 日确认当前版本可以作为上线基线，不要求
刻意建立独特的个人辨识度；下一阶段是部署及真实账号验收，见[决策 0015](../docs/decisions/0015-modern-public-direction.md)。

运行 `pnpm frontend:dev --port 4333` 后打开
[完整平台预览](http://127.0.0.1:4333/index.html?preview=sample)。这个显式参数仅在本机应用中
启用样例，并保存该来源的显示偏好；也可以通过“本机预览”关闭样例，保留自己的内容。
工作台与公开页使用同一 IndexedDB 内容，能够沿既有草稿、预览和发布流程检验新版。
`site/` 已复用更新后的公共组件，生产不会读取这个样例开关或自动创建演示内容。

[独立研究入口](http://127.0.0.1:4333/study.html)继续保留作探索参照；
`study.html?content=empty` 可看其独立空态。这个入口不挂载平台适配器，不读写 IndexedDB，
不连接 Supabase；留言和管理链接进入完整应用。Vite 构建仍生成两个 HTML 入口。
设计理由、验证与范围见[研究 04](../docs/design/studies/restart-04/README.md)。本轮没有部署新版。

## 真实服务模式

`site/` 从服务端读取已发布内容，复用本目录页面。它采用正常路径、服务端 HTML、元信息、
站点地图与 `/media/…` 入口；客户端通过 `PlatformProvider` 的 `remote` 配置调用 Supabase。
只有公开项目地址和 publishable/anon key 进入网页，service-role key 不属于网站运行配置。

本地开发需要已运行且应用迁移的 Supabase，及安全配置的 [site/.env.example](../site/.env.example)
所列变量。设置好后，从仓库根目录运行：

```bash
pnpm site:dev
pnpm site:typecheck
pnpm site:build
pnpm site:start
```

开发与生产启动共用默认端口 `127.0.0.1:4325`，不要同时启动，也不要占用供设计评审的 `4323`。
部署、邮箱回调、站主授权及备份步骤见[使用与维护](../docs/operations/RUNBOOK.md)。
邮箱入口默认关闭，须在自定义 SMTP、注册确认和恢复的真实送达验收后启用。

已实现的真实服务能力：

- 站主登录后编辑文章、组图和链接项目，保存草稿、预览、发布、更新、撤下及修改网站设置。
  草稿与公开副本分别保存，修改草稿不会更改公开作品。空数据库仍有完整首页。
- 图片支持 PNG/JPG/WebP/AVIF，单张最多 10 MiB，每篇最多 20 张；支持排序、说明和替代文字。
  保存时上传到私有 Storage 的新 UUID 对象，不能覆盖旧图。数据库只保存稳定 `/media/<UUID>.ext`
  路径；草稿临时签名仅用于站主预览，不写回内容。
- 访客邮箱注册、验证、密码登录、退出、找回和修改密码；个人昵称由真实资料预填，开始编辑后
  不被后台刷新覆盖。GitHub 登录保留可选接口，默认关闭。
- 访客留言、回复、修改和删除自己的留言。新留言及修改进入待审核，账号页可管理自己的
  待审核或隐藏记录；站主审核和隐藏，站主回复直接公开。实际授权、回复目标及限流在数据库执行。
- 身份通过 Auth `getUser` 校验，站主管理由角色表判定；注册 metadata 不授予权限。
  匿名和普通访客不请求草稿。临时网络错误保留已验证身份和正在编辑的内容；确认会话失效、
  退出或权限撤销后清除相应私有状态。每次写入仍须通过服务端权限检查。
- 内容、草稿、留言按稳定顺序分页读取；正常路径导航后仍能返回原列表的筛选和选中位置。
  恢复地址仅允许本站内容列表，服务端初始链接为安全默认值。

具体字段、RPC、权限和媒体契约见 [API 协议](../docs/operations/API_CONTRACT.md)。
实现完成和本地测试通过不代表云端已经部署，亦不证明正式邮箱能收到邮件。

## 页面与编辑边界

首页根据已发布内容、精选状态与站点设置选择主要作品、文章、影像和近期随记，支持空站、
单件作品、只有随记及混合内容。真实内容优先于可选本机样例，不依赖样例 ID 才能显示。
全站搜索支持文字与类型筛选、键盘选择和 Cmd/Ctrl + K；内容页保留话题筛选、图文／目录视图，
切换类别时保留搜索与视图。文章增加阅读进度、活动章节、字号和链接复制；组图与附图使用
支持键盘、Escape 关闭和焦点恢复的图片查看器。账号、随记和工作台使用同一现代视觉基础。

现有色彩工具保留配色、方向、CSS 复制和 SVG 导出。新增本机“图像取景”样例支持比例、拖动、
方向键、位置／放大、原图对照、复位、选择本机 JPG/PNG/WebP 和 PNG 导出；选图最大 20 MB，
导出最长边 4096 px。图片仅在本机页面处理，不上传、不改变原图、不自动创建作品。
工具只随本机样例出现；正式首页不自动添加这个项目。
文章支持段落、`##` 标题、简单列表、引用和代码块；配图在正文后展示，第一张同时作封面。
随记支持自动私有草稿，文章等其他编辑器仍需主动保存。当前没有富文本编辑器、通用页面搭建器、专题编排或手动排序首页。新的交互作品仍由
代码实现；发布现成文章、照片和链接项目不需要改代码。未保存编辑有页面内离开确认及浏览器关闭提示。

## 文件边界

- [`src/App.tsx`](src/App.tsx)：页面装配、现代导航、公开内容搜索、站主工作台入口及本机预览工具。
- [`src/navigation.tsx`](src/navigation.tsx)：Vite hash 路由与生产正常路径的统一接口。
- [`src/platform.tsx`](src/platform.tsx)：选择本机或真实服务适配器，导出 `usePlatform`。
- [`src/remote-platform.tsx`](src/remote-platform.tsx)：Auth、RLS 数据读取、RPC 写入和媒体上传。
- [`src/model.ts`](src/model.ts)、[`src/storage.ts`](src/storage.ts)：本机数据规则和 IndexedDB 事务。
- [`src/types.ts`](src/types.ts)：共享内容、图片、留言及适配器类型。
- [`src/pages/Studio.tsx`](src/pages/Studio.tsx)：编辑发布、网站设置和留言审核。
- [`src/pages/Community.tsx`](src/pages/Community.tsx)：账号、恢复和通用讨论组件。
- [`src/pages/Public.tsx`](src/pages/Public.tsx)、[`src/pages/Home.tsx`](src/pages/Home.tsx)：公共浏览和首页。
- [`src/modern/HomePresentation.tsx`](src/modern/HomePresentation.tsx)：共享的数据驱动首页。
- [`src/modern/ReadingTools.tsx`](src/modern/ReadingTools.tsx)：阅读进度、章节、字号与链接控件。
- [`src/modern-shell.css`](src/modern-shell.css)、[`src/modern-public.css`](src/modern-public.css)：共享现代呈现层。
- [`src/study/PhotoSequence.tsx`](src/study/PhotoSequence.tsx)、[`src/study/CropPlayground.tsx`](src/study/CropPlayground.tsx)：共享图片查看器与本机取景工具；`Study.tsx` 仍为独立研究入口。
- [`src/Confirm.tsx`](src/Confirm.tsx)：页面内确认框。

## 验证

当前现代视觉整合：83 项前端单元与组件测试、lint、根目录／site TypeScript 检查、Vite 与
Next 网站构建通过。新增回归覆盖无样例的 UUID 内容、空站、无封面长标题、只有随记、正常
生产路径、无浏览器全局对象的 SSR、私有内容排除及切换类型保留筛选。

Chromium 检查 12 条路由 × 320/390/780/1440 像素宽度，共 48 个组合，未发现横向溢出或新
运行时错误；另对真实新建／编辑文章页面检查相同四种宽度。搜索与手机菜单、图库键盘和焦点、
阅读控件、本机选图、正确裁切的 PNG 下载，以及独立 `localhost:4333` 中的草稿／发布／刷新／
私有修订隔离均已通过浏览器检查，唯一测试条目已通过 UI 删除。细节见[研究 04](../docs/design/studies/restart-04/README.md)。
真实触屏设备、Safari、辅助技术和本轮云端真实站主发布未验收；源码与构建通过不代表上线。

既有适配器测试使用受控服务替身，覆盖匿名／伪造角色不读草稿、失败不冒充空站、稳定媒体引用、
退出清理、断网与撤权、分页等边界；不能替代真实 API 验收。此前本机草稿／发布／撤下、
Auth/Mailpit 和备份恢复证据分别由[状态板](../progress.md)与[API 验证记录](../docs/operations/API_CONTRACT.md#本地权限验证)
维护，不能据此宣称云端邮箱或首位真实站主已经完成验收。

## 随记

`/#/notes` 提供正文时间线、月份/主题/搜索筛选、展开与独立链接；`/#/studio/notes`
提供无标题编辑、自动存草稿、发布修改与撤下。正式网站对应 `/notes` 和 `/studio/notes`，
沿用同一 Supabase 管理者权限与草稿隔离。四条排版随记仅在本机手动开启样例后出现。
使用和当前验证边界见 [随记验收](../docs/operations/NOTES_ACCEPTANCE.md)。
