# Frontend implementation contract

This is an isolated React frontend preview using the repo's installed Vite/React tools. No backend
authentication or shared publication is claimed. Do not edit legacy src/ application files.

`src/types.ts` owns data types. `src/platform.tsx` will export `PlatformProvider` and `usePlatform(): Platform`.
`entries` is the merged current entries including sample records when mode=sample; `drafts` are separate
working copies. Published pages must filter entry.status===published. Saving an edit to drafts must not
change the published entry; publish commits a draft and removes its working copy. The store persists
in IndexedDB, resolves operations after durable writes, reports quota/unavailable errors without
discarding previous state. Mode=empty hides samples but retains locally created entries.

Routes use hash links: #/, #/archive, #/writing, #/photos, #/projects, #/entry/:id, #/topics/:topic,
#/play/color, #/about, #/guestbook, #/login, #/register, #/recover, #/account,
#/studio, #/studio/new?kind=writing|photo|project, #/studio/edit/:id,
#/studio/settings, #/studio/comments. `navigation.ts` exports useRoute and go.

Shared CSS from root: --paper:#fafaf8, --ink:#202320, --muted:#747971, --line:#dedfd8,
--accent:#3e5749, --serif:ui-serif,'Songti SC',serif. System sans for body. Common classes:
button (dark primary), button.secondary, button.quiet, button.danger, field, field-label,
muted, eyebrow, page-heading, page-lead, empty-state, form-error, form-notice, sr-only.
Inputs, textarea, select are globally styled. Icons may be simple inline SVG strokes.
Public layout uses 1200px max width. Root renders SiteHeader/footer and main; pages own inner content.
On /studio* root renders only the studio page (the studio owns its minimal header/nav).

Studio exports `StudioPage({path, params}:{path:string;params:URLSearchParams})` from pages/Studio.tsx.
Community exports `CommunityPage({path,params})` and `Discussion({targetId})` from pages/Community.tsx.
Own CSS files imported by page. Community main comment target is 'guestbook'; entry target is entry.id.
Use no real auth secrets: explicit demo identity, no real password collection or email delivery claim.
No seed fake visitor conversations. Preview note belongs to a small explanatory area, not every control.
No external network calls, dependencies, commits, or edits to files outside assigned ownership.
