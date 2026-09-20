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
右下角“本机预览”可以打开六项排版样例和工作台；首次打开默认隐藏样例。
既有显示偏好及用户创建的内容保留，不生成虚构访客对话。

```bash
pnpm frontend:test
pnpm frontend:build
pnpm frontend:preview
```

`frontend/dist/` 是可用静态 HTTP 服务打开的本机预览产物，不能单独部署它并声称完成真实平台。

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

首页提供文章、影像和项目入口，最多展示三项精选或最近内容。内容页支持搜索、形式/主题筛选、
图文/目录切换、阅读字号、组图与大图查看。现有色彩工具支持配色、方向、CSS 复制和 SVG 导出。

文章支持段落、`##` 标题、简单列表、引用和代码块；配图在正文后展示，第一张同时作封面。
当前没有富文本编辑器、自动保存、通用页面搭建器、专题编排或手动排序首页。新的交互作品仍由
代码实现；发布现成文章、照片和链接项目不需要改代码。未保存编辑有页面内离开确认及浏览器关闭提示。

## 文件边界

- [`src/App.tsx`](src/App.tsx)：页面装配、公开导航、站主工作台入口及独立预览工具。
- [`src/navigation.tsx`](src/navigation.tsx)：Vite hash 路由与生产正常路径的统一接口。
- [`src/platform.tsx`](src/platform.tsx)：选择本机或真实服务适配器，导出 `usePlatform`。
- [`src/remote-platform.tsx`](src/remote-platform.tsx)：Auth、RLS 数据读取、RPC 写入和媒体上传。
- [`src/model.ts`](src/model.ts)、[`src/storage.ts`](src/storage.ts)：本机数据规则和 IndexedDB 事务。
- [`src/types.ts`](src/types.ts)：共享内容、图片、留言及适配器类型。
- [`src/pages/Studio.tsx`](src/pages/Studio.tsx)：编辑发布、网站设置和留言审核。
- [`src/pages/Community.tsx`](src/pages/Community.tsx)：账号、恢复和通用讨论组件。
- [`src/pages/Public.tsx`](src/pages/Public.tsx)、[`src/pages/Home.tsx`](src/pages/Home.tsx)：公共浏览和首页。
- [`src/Confirm.tsx`](src/Confirm.tsx)：页面内确认框。

## 验证

2026-09-21：前端单元与组件测试共 51 项：原有 19 项数据/持久化和 8 项离开保护，新增
12 项真实适配器回归、10 项返回列表回归、2 项账号昵称回归。
远端适配器测试使用受控服务替身，覆盖匿名/伪造角色不读草稿、失败不冒充空站、媒体稳定引用、
退出清理、恢复事件、断网不卸载编辑器、撤销权限与超过 1,000 条记录；它们不能替代真实 API 验收。
类型检查与本次修改文件的 ESLint 已通过。真实 API、浏览器、构建、备份恢复及部署的最终汇总由
[当前状态板](../progress.md) 和 [API 验证记录](../docs/operations/API_CONTRACT.md#本地权限验证)维护。

此前本机预览已完成 320/390 像素和桌面布局、图集、草稿与公开副本隔离、编辑确认等浏览器检查。
这些是 IndexedDB 模式的历史证据，不能替代真实服务模式验收。SVG 下载已验证生成和触发，
历史内置浏览器未能观察文件落盘；减少动态效果样式存在，未做操作系统级偏好切换验收。

## 随记

`/#/notes` 提供正文时间线、月份/主题/搜索筛选、展开与独立链接；`/#/studio/notes`
提供无标题编辑、存草稿、发布修改与撤下。正式网站对应 `/notes` 和 `/studio/notes`，
沿用同一 Supabase 管理者权限与草稿隔离。四条排版随记仅在本机手动开启样例后出现。
使用和当前验证边界见 [随记验收](../docs/operations/NOTES_ACCEPTANCE.md)。
