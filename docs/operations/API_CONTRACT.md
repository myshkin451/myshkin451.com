# 发布与互动 API

实现：`supabase/migrations/202609210001_platform.sql`。前端通过 Supabase Auth、PostgREST
和 Storage API 访问本协议。公开浏览使用匿名 publishable/anon key；浏览器不得持有 service
role key。此文记录代码和本地验证，不代表已有线上服务。

## 数据与读取权限

所有业务表启用 RLS。浏览器角色只有 SELECT 权限，任何 INSERT、UPDATE、DELETE 均须调用
下列 RPC；即使站主也不能绕过 RPC 直接写表。`service_role` 只用于受保护的后台运维、首次
授予站主身份和本地测试，不属于网站登录角色。

| 表 | 数据 | 匿名 | 访客 | 站主 |
| --- | --- | --- | --- | --- |
| `published_entries` | `id: uuid, data: Entry` | 全部已发布内容 | 同匿名 | 同匿名 |
| `entry_drafts` | `id: uuid, data: Entry` | 无权限 | 无可见行 | 全部草稿 |
| `site_settings` | `id: true, data: Settings` | 单行设置 | 同匿名 | 同匿名 |
| `profiles` | `id: auth.users.id, nickname` | 无权限 | 仅自己 | 仅自己 |
| `site_owners` | `user_id: auth.users.id` | 无权限 | 仅自己的角色行；普通访客无记录 | 自己的角色行 |
| `messages` | 留言及审核状态，见下文 | 公开讨论中的 approved 留言 | 另可见自己所有状态的留言 | 全部留言 |

`Entry` 字段与 `frontend/src/types.ts` 一致。公开版本和草稿是两个独立物理副本；保存新草稿
不改变已发布版本。草稿和公开版本可同时存在。首次发布和后续更新均删除对应草稿；撤下时
优先保留已编辑的草稿。服务端生成创建/更新时间，保留首次发布时间；不信任客户端时间戳。
`sample` 强制为 false，`artwork` 只保留 `color` 或 `site`，未知 JSON 字段会丢弃。

设置初始值是 `{"name":"Myshkin 451","intro":"","about":"","homeView":"grid"}`。
不创建作品、假评论或生产测试身份。

`messages` 字段为 `id, target_id, author_id, author_name, body, created_at, parent_id, status`。
`status` 仅允许 `pending / approved / hidden`。目标为 `guestbook` 或已发布、`discussion=true`
的内容 UUID；关闭讨论、撤下或删除内容后，该目标的留言不再公开。作者仍可查看、删除自己的
留言。公开 API 不返回邮箱或其他 Auth 私有字段；留言中的 UUID 用于本人操作判定。

昵称来自服务端 profiles，创建留言时保存显示名快照。注册触发器只接受 metadata 中的
`nickname`：折叠空白/控制字符、截取最多 24 字符，缺失或空白回退为“访客”。任何 role、owner
等 metadata 均不能赋予权限。后续 `save_profile` 可保存 1–30 字符昵称；已有留言署名不随之修改。

## 写入 RPC

参数名称是 PostgREST 协议的一部分。失败通过标准 Supabase `{data, error}` 返回；权限不足
使用 SQLSTATE `42501`，输入无效使用 `22023`，留言限流使用 `P0001`。界面应展示中文错误，
不得在失败时先更新本地状态而制造成功假象。

| RPC | 调用者 | 返回值 / 行为 |
| --- | --- | --- |
| `save_entry(entry: jsonb, publish: boolean = false)` | 站主 | 清理后的 `Entry` JSON；保存草稿或替换公开版本 |
| `unpublish_entry(entry_id: uuid)` | 站主 | void；公开版本转入草稿，保留既有草稿修改 |
| `delete_entry(entry_id: uuid)` | 站主 | void；删除公开和草稿副本；留言保留为作者/站主可管理的非公开记录 |
| `save_settings(settings: jsonb)` | 站主 | 清理后的 `Settings` JSON |
| `save_profile(nickname: text)` | 已验证邮箱的用户 | `{id, nickname}`；只修改当前用户 |
| `add_message(target_id: text, body: text, parent_id: uuid = null)` | 已验证邮箱的用户 | 新留言完整行；访客 pending，站主 approved |
| `edit_message(message_id: uuid, body: text)` | 已验证邮箱的原作者 | 更新后的完整行；访客修改重新进入 pending |
| `delete_message(message_id: uuid)` | 已验证邮箱的原作者或站主 | void；无回复时删除，有回复时替换为匿名删除标记 |
| `moderate_message(message_id: uuid, status: text)` | 站主 | void；调整审核状态 |

所有权限函数固定空 `search_path` 并使用完整 schema 名。站主身份实时查询 `site_owners`；
留言权限实时检查 `auth.users.email_confirmed_at`，即使客户端仍持旧 JWT 也不能跳过验证。
`private` schema 不对 PostgREST 暴露；辅助函数没有可利用的公开写入口。

回复必须指向同一目标、尚未删除且已审核的留言。不能回复其他页面的留言或尚未审核的内容。
删除有回复的留言将 `author_id` 置 null，`author_name` 设为“已删除”，`body` 设为“留言已删除”，
保留 id、parent_id 和审核状态，避免破坏回复关系。站主可以删除、审核别人的留言，但不能
以对方身份编辑正文。

访客创建和编辑合计最多 5 次/滚动分钟、30 次/滚动 24 小时。`private.message_events`
记录已成功操作，按用户的事务级 advisory lock 串行检查；并发请求不能越过限额。失败操作
随事务回滚；过期事件在该用户下次操作时清除。站主回复不受此限额。删除不受限流，方便
撤回内容。此限制不是按 IP 的注册防滥用方案；Auth 自身的速率限制及生产邮件配置仍须维护。

## 内容与图片验证

标题最多 150 字符，摘要 1000，正文 200,000，项目地址 2048，主题最多 20 个且每个 40 字符。
主题去空、去重。设置的站名为 1–60 字符，简介最多 1000，关于最多 50,000。
留言为去首尾空格后的 1–1000 字符。发布文章需要正文，发布影像需要照片，发布项目需要介绍
或地址；草稿允许不完整正文，但所有已填写的字段和媒体引用仍须有效。

每篇最多 20 张照片，照片 id 不得重复，alt 最多 200 字符，caption 最多 1000，credit 最多 200。
`cover` 与 `photos[].src` 只存以下稳定标识：

```text
/media/<lowercase-uuid>.png
/media/<lowercase-uuid>.jpg
/media/<lowercase-uuid>.webp
/media/<lowercase-uuid>.avif
```

保存草稿、发布、更新时都验证对应对象已存在于 Storage `media` 桶。不能存 data URL、
外部 URL、任意路径或签名 URL。前端解析出的下载/签名 URL 仅用于呈现，不可写回 Entry。
项目地址仅支持 http、https 和本站路径（兼容旧 `#/` 路由），不支持 javascript 等协议。

`media` 是私有桶，单对象最多 10 MiB，仅允许 PNG/JPEG/WebP/AVIF MIME。只有站主可按规范
创建新对象。浏览器不能覆盖、更新或删除已有对象；更换图片需上传新 UUID。这样修改草稿
不会改变旧公开内容的图片，也不会破坏已有备份引用。孤立对象需要在保留期后由运维确认
引用和备份情况，再使用受保护的管理权限清理，不自动删除。

Storage SELECT 只允许站主，或被 `published_entries.data.cover / photos[].src` 精确引用的
对象。草稿引用不参与公开权限判断。撤下后新的受 RLS 检查的读取会失败；已经下载、缓存或
获得尚未过期签名 URL 的内容不能保证立即撤回。私有草稿预览使用短时签名链接，不持久保存。

## 本地权限验证

测试只接受 loopback `SUPABASE_URL`，会创建专用随机测试账号、内容和图片，并清理本次生成
的 ID；不会重置数据库或改动其他已有记录。`SUPABASE_TEST_DB_CONTAINER` 指向本地 Supabase
数据库容器，用于模拟邮箱验证撤销和已发生的 24 小时限流记录。不得改成线上运行。

在环境安全注入本地配置后运行：

```bash
node scripts/production/api-test.mjs
```

所需环境变量：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、
`SUPABASE_TEST_DB_CONTAINER`。不要在聊天、提交或日志中输出实际 key。

2026-09-21：本地 Supabase 真实 Auth/PostgREST/Storage API 完成 155 项断言，覆盖匿名、站主、
两个普通访客、邮箱未验证身份，以及独立限流身份。已验证草稿/图片隔离、公开更新、撤下、
直接 DML 拒绝、角色及作者伪造拒绝、个人资料隔离、回复目标、审核、删除标记、撤下后本人删除、
并发分钟限流和滚动日限流。测试用户、内容和图片已清理，网站设置还原。此脚本通过管理员
创建本地测试身份，不替代浏览器里的真实注册、收信、恢复和独立会话验收。

实现参考：[Supabase 数据库函数](https://supabase.com/docs/guides/database/functions)、
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、
[Storage 访问控制](https://supabase.com/docs/guides/storage/security/access-control)。

## 随记（2026-09-21）

增量迁移 `202609210002_notes.sql` 增加 `kind: note`，继续使用 `save_entry` 和已有发布表。
随记允许空标题，发布要求正文非空，草稿与公开正文都限制 5,000 个 Unicode 码点。
现有文章、影像、项目校验不变；管理者校验先于内容处理，匿名与访客没有写权限。
修改与再次发布保留 `publishedAt`，撤下仍保留私有草稿。备份无需增加新表。
