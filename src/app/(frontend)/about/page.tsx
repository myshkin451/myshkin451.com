import Link from 'next/link'

import { SiteFooter } from '../_components/SiteFooter'
import { SiteHeader } from '../_components/SiteHeader'
import { SurfaceIndex } from '../_components/SurfaceIndex'
import { createPageMetadata, siteConfig } from '@/lib/siteMetadata'

export const metadata = createPageMetadata({
  pathname: '/about',
  description: '关于 Myshkin 451：一个中文优先的个人数字平台，连接写作、项目、知识路径和实验。',
  title: '关于',
})

const operatingNotes = [
  '公共表达要能被认真阅读，也要能被未来的自己重新检查。',
  '项目记录优先展示证据、边界和复盘，不只展示漂亮截图。',
  '知识路径先保持克制，等真实内容足够时再做复杂结构。',
]

export default function AboutPage() {
  return (
    <div className="site-shell theme-light site-shell--about">
      <SiteHeader />

      <main className="site-main about-main">
        <section className="about-hero" aria-labelledby="about-title">
          <p className="eyebrow">关于 / About</p>
          <h1 id="about-title">一个把学习、建造和写作留在公开处的个人平台。</h1>
          <p>
            {
              'Myshkin 451 是长期个人工作的入口：中文写作、公开项目、研究路径和小型实验会在这里逐步连接起来。它希望既能被路过的人快速理解，也能让认真阅读的人看见更深的脉络。'
            }
          </p>
        </section>

        <section className="about-layout" aria-label="平台说明">
          <article className="about-statement">
            <p className="eyebrow">Current Focus</p>
            <h2>当前重点是把第一个公共循环做得可靠、清楚、可继续。</h2>
            <p>
              {
                '这个阶段不会急着做论坛、复杂权限或完整知识图谱。更重要的是让一篇文章、一个项目、一张媒体图和一个公开路径从 CMS 到前台都成立，并让访问者知道这里以后会长成什么。'
              }
            </p>
          </article>

          <aside className="about-facts" aria-label="工作兴趣">
            <dl>
              <div>
                <dt>语言</dt>
                <dd>中文优先，保留英文 URL 与未来翻译空间</dd>
              </div>
              <div>
                <dt>兴趣</dt>
                <dd>哲学、软件系统、AI 工具、长期知识整理</dd>
              </div>
              <div>
                <dt>方式</dt>
                <dd>把可发布内容和可验证工程放在同一条工作线上</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="surface-index surface-index--compact" aria-label="平台表面">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Selected Surfaces</p>
              <h2>公开入口先清楚，复杂系统慢慢长。</h2>
            </div>
            <p>写作和项目先开放；知识路径与实验室先作为诚实的预留面出现。</p>
          </div>
          <SurfaceIndex compact />
        </section>

        <section className="operating-notes" aria-labelledby="operating-notes-title">
          <p className="eyebrow">Operating Notes</p>
          <h2 id="operating-notes-title">这个站点会怎样生长</h2>
          <ol>
            {operatingNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ol>
        </section>

        <section className="contact-panel" aria-label="外部链接">
          <div>
            <p className="eyebrow">Links</p>
            <h2>源代码和后台入口保持可见，但不会压过公共阅读体验。</h2>
          </div>
          <div className="actions actions--compact">
            <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
              GitHub Source
            </a>
            <Link href="/admin">Payload Admin</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
