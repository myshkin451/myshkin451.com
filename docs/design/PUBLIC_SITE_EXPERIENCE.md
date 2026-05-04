# Public Site Experience Design

This document defines the target public-site experience for Myshkin 451. It guides future frontend
implementation after Phase 1, but it does not add new CMS models or require every future module to
exist immediately.

## Design Thesis

Myshkin 451 should feel like a Chinese-first technical atlas and public workshop.

The site is a personal digital platform entrance, not a pure blog, resume, portfolio, knowledge base,
or lab. It should make writing, projects, knowledge paths, and experiments feel like parts of one
working system.

The public experience should be:

- Chinese-first in UI copy and navigation.
- Technically literate without looking like a generic AI startup page.
- More expressive than a conservative blog template.
- Structured enough to grow into knowledge paths, labs, search, translation, and future interaction.
- Calm enough that long-form Chinese reading remains comfortable.

## Reference Lessons

Reference sites are inputs, not templates.

- Linear: borrow the precision, dark interface atmosphere, product-system pacing, and use of UI
  fragments as visual evidence. Do not borrow the full SaaS marketing posture.
- Stripe Press: borrow the editorial confidence, artifact-like content presentation, and sense that
  technical culture can be literary.
- Maggie Appleton: borrow the multi-surface personal knowledge structure and the feeling of a site
  that can contain essays, notes, patterns, gardens, and references.
- Andy Matuschak Notes: borrow the honesty of working notes and durable idea surfaces. Do not borrow
  the intentionally sparse navigation wholesale; Myshkin 451 needs clearer public entry points.
- Rauno Freiberg, Paco Coursey, nan.fyi, and similar design-engineer sites: borrow restraint,
  interaction craft, motion-as-feedback, and page-specific details that feel made by hand.

Avoid common personal-site defaults: purple-blue gradients, generic glass cards, fake terminal
screens, emoji-heavy dashboards, stock startup hero patterns, and template portfolio grids.

## Language And Internationalization

Default public UI language is Simplified Chinese.

Implementation should still leave room for English UI and translated content:

- Keep public URLs in stable English paths such as `/articles`, `/projects`, `/about`, and future
  `/labs`.
- Use Chinese labels in navigation and page chrome, with short English secondary labels only when
  they add texture, such as `写作 / Writing`.
- Avoid scattering UI strings across components once the redesign grows; introduce a small UI copy
  dictionary before real i18n work.
- Do not implement full locale routing, automatic translation, or bilingual CMS fields until there
  is real publishing pressure.
- Design page layouts so a future language toggle can fit in the header without changing the whole
  navigation system.

## Theme Strategy

Do not make the entire site dark-only.

Use a dark-forward dual-theme system:

- Dark mode is the signature environment for the homepage, projects, labs, and system-navigation
  surfaces. It provides the modern technical atmosphere.
- Light mode remains first-class for long-form reading, archives, and accessibility. Chinese essays
  should never be trapped in low-contrast dark pages.
- The first implementation should use CSS variables for both modes, even if the manual toggle ships
  later.
- When a toggle ships, support `system`, `dark`, and `light`, and persist the visitor preference.

The dark palette should be near-black graphite, not pure black. Accent colors should avoid AI-template
purple-blue. Prefer combinations such as vermilion, warm amber, oxidized green, cyan used sparingly,
and paper-white text.

The light palette should feel like technical paper, not beige lifestyle stationery: warm off-white,
ink, graphite lines, restrained accent marks, and enough contrast for long Chinese reading.

## Visual System

### Layout

- Use a strong editorial grid with visible structure: rails, indexes, section numbers, metadata rows,
  and precise alignments.
- Prefer full-width bands, split grids, timelines, ledgers, and panels over floating marketing cards.
- Keep repeated content items dense but breathable: date, status, summary, tags, and action links
  should scan quickly.
- First viewport should show `Myshkin 451`, a Chinese positioning line, current platform surfaces,
  and a hint of live content below.

### Typography

- Chinese body text is the priority. Use a system Chinese font stack first, then later consider a
  deliberate display/body pair if font loading is acceptable.
- Headlines can be bolder and more architectural than the current conservative type scale.
- English can appear as small metadata, labels, or secondary texture, not as the primary voice.
- Long-form pages should keep readable line length, generous paragraph rhythm, and clear heading
  hierarchy.

### Interaction

- Use motion sparingly but confidently: surface transitions, hover reveals, active rail states,
  route transitions, reading progress, and command-palette style search.
- Avoid ambient animation that never communicates state.
- Labs can be more experimental, but every experiment should still have a route back to the platform.

### Signature Details

Future implementation can use these recurring motifs:

- `Surface Index`: a persistent four-surface map for writing, projects, knowledge paths, and labs.
- `Status Line`: small rows showing published count, current focus, build/version, or module state.
- `Dossier Panels`: project and article entries styled like public case files.
- `Reading Rail`: article detail side rail with metadata, progress, related entries, and language
  affordances.
- `Command Entry`: future search/quick-jump interaction, visually hinted before it is functional.
- `Reserved Surface`: visible placeholders for knowledge paths and labs that feel intentional rather
  than empty.

## Page Designs

### Home

Purpose: establish identity and route visitors into the platform.

Structure:

1. Header with `Myshkin 451`, Chinese nav labels, theme/language affordance placeholders, and GitHub
   or admin links kept secondary.
2. Hero as a platform console, not a marketing hero: large Chinese headline, one-sentence platform
   thesis, current status line, and primary actions to writing and projects.
3. Four-surface map:
   - `写作 / Writing`: essays, notes, long-form arguments.
   - `项目 / Projects`: artifacts, demos, systems, retrospectives.
   - `知识路径 / Knowledge Paths`: curated routes through study and research, reserved at first.
   - `实验室 / Labs`: tools, AI demos, and experiments, reserved at first.
4. Latest writing and latest project as asymmetric feature panels.
5. About/profile preview that explains who runs the platform and why it exists.
6. Footer with source, RSS or feed placeholder, language posture, and public repository link.

Tone: modern, dark-forward, precise, slightly ambitious.

### Writing Index

Purpose: make Chinese long-form content easy to browse and trust.

Structure:

1. Page header with `写作`, short description, article count, and future RSS/search affordance.
2. Featured or latest article row.
3. Archive ledger grouped by year or topic once enough content exists.
4. Each article row includes title, excerpt, published date, reading status, and tags when tags exist.

Tone: readable, editorial, calm. Less dramatic than the homepage.

### Article Detail

Purpose: prioritize reading while keeping platform context visible.

Structure:

1. Title, excerpt, publication date, and cover image if available.
2. Optional reading rail on desktop: metadata, progress, related writing, project links, translation
   affordance placeholder.
3. Main content uses a comfortable Chinese reading measure.
4. End section links back to writing, related projects, and the platform map.

Tone: light-mode friendly, long-session comfortable, not visually noisy.

### Project Index

Purpose: present work as artifacts and systems, not a generic portfolio wall.

Structure:

1. Page header with `项目`, platform context, and project count.
2. Featured project dossier if available.
3. Project grid or ledger with status, stack/tools, summary, links, and cover media.
4. Archived/older projects can become a compact list instead of large cards.

Tone: more technical and interface-like than writing, with stronger dark-mode support.

### Project Detail

Purpose: show what was built, why it matters, and what can be inspected.

Structure:

1. Project hero with status, role, timeframe, stack, links, and cover media.
2. Case-file sections: problem, context, approach, artifacts, result, lessons.
3. Screenshots or media should be inspectable and not decorative.
4. Link related articles, labs, or future knowledge paths.

Tone: evidence-first, precise, and polished.

### About

Purpose: connect the public identity to the person behind the platform.

Structure:

1. Chinese-first personal statement.
2. Current focus and working interests.
3. Selected surfaces: writing, projects, knowledge paths, labs.
4. Timeline or operating notes if useful.
5. Contact or GitHub links kept simple.

Tone: personal but not influencer-like; thoughtful, direct, and technically curious.

### Knowledge Paths

Purpose: future curated routes through study, research, and notes.

Initial design:

- It may appear as a reserved surface on the homepage before a route exists.
- When implemented, start with curated path pages, not a full graph database.
- Use maps, reading sequences, and concept clusters only when real content supports them.

Tone: dense but humane.

### Labs

Purpose: bounded experiments, tools, AI demos, and playful technical surfaces.

Initial design:

- It may appear as a reserved surface on the homepage before a route exists.
- When implemented, each lab should have a clear title, status, interaction area, and explanation.
- Labs can be visually bolder than the core site, but should inherit header, theme, and navigation
  primitives.

Tone: more experimental, but not disconnected.

## Implementation Sequence

1. Establish theme tokens for dark and light modes.
2. Convert current public UI labels and homepage copy to Chinese-first.
3. Redesign the homepage around the platform console and four-surface map.
4. Add `/about` as the first new public surface.
5. Upgrade writing index/detail and project index/detail using the same tokens.
6. Add theme toggle and UI copy dictionary before adding a broad set of new pages.
7. Revisit i18n and content translation only after Chinese-first publishing has real content.

## Acceptance Criteria

Future frontend work against this design should prove:

- The homepage does not look like a generic SaaS, AI, portfolio, or blog template.
- Chinese UI copy is primary and polished.
- Dark and light tokens exist, even if the first shipped toggle is simple.
- Writing remains comfortable in light mode and acceptable in dark mode.
- Reserved knowledge and lab areas feel intentional, not broken.
- Mobile layouts keep the platform map, navigation, and long Chinese text readable.
- Browser or screenshot verification covers desktop and mobile for major public UI changes.
