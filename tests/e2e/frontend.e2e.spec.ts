import { test, expect, type Locator } from '@playwright/test'
import {
  cleanupPlatformLoopFixture,
  createPlatformLoopFixture,
} from '../helpers/platformLoopFixture'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.myshkin451.com').replace(
  /\/+$/,
  '',
)

test.describe('Frontend', () => {
  let loopFixture: Awaited<ReturnType<typeof createPlatformLoopFixture>>

  test.beforeAll(async () => {
    loopFixture = await createPlatformLoopFixture()
  })

  test.afterAll(async () => {
    await cleanupPlatformLoopFixture(loopFixture)
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Myshkin 451/)

    const heading = page.locator('h1').first()

    await expect(heading).toContainText('把写作、项目和知识路径放回同一个工作台')
    await expect(page.getByRole('heading', { name: '四个入口，不是四个孤岛。' })).toBeVisible()
    await expect(page.getByText('知识路径').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /关于 About/ }).first()).toBeVisible()
    await expect(page.getByRole('group', { name: '主题切换' })).toBeVisible()
  })

  test('persists the public theme preference', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: '使用亮色主题' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.getByRole('button', { name: '使用暗色主题' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByRole('button', { name: '跟随系统主题' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system')
    expect(await page.evaluate(() => window.localStorage.getItem('myshkin451.theme'))).toBe(
      'system',
    )
  })

  test('renders published article and project records with cover media', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: loopFixture.articleTitle })).toBeVisible()
    await expect(page.getByRole('link', { name: loopFixture.projectTitle })).toBeVisible()

    const homepageImages = page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`)
    await expect(homepageImages).toHaveCount(2)
    await expectImagesLoaded(homepageImages)

    await page.goto('/articles')
    await expect(
      page.getByRole('heading', { name: '把长文整理成可追踪的阅读账本。' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: '按年份排布的公共写作。' })).toBeVisible()
    await expect(
      page.getByLabel('文章档案').getByRole('link', { name: loopFixture.articleTitle }),
    ).toBeVisible()
    await expect(page.getByText('分钟阅读').first()).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto(`/articles/${loopFixture.articleSlug}`)
    await expect(page.getByRole('heading', { name: loopFixture.articleTitle })).toBeVisible()
    await expect(page.getByLabel('阅读轨道')).toContainText('阅读预期')
    await expect(
      page.getByText('Browser fixture article for the first platform loop.'),
    ).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto('/projects')
    await expect(
      page.getByRole('heading', { name: '把作品放成可以检查的案例档案。' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '每个项目都应该留下可检查的上下文。' }),
    ).toBeVisible()
    await expect(
      page.getByLabel('项目档案').getByRole('link', { name: loopFixture.projectTitle }),
    ).toBeVisible()
    await expect(page.getByText('进行中').first()).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto(`/projects/${loopFixture.projectSlug}`)
    await expect(page.getByRole('heading', { name: loopFixture.projectTitle })).toBeVisible()
    await expect(page.getByText(`项目卷宗 / Project Dossier`)).toBeVisible()
    await expect(page.getByText(`/projects/${loopFixture.projectSlug}`)).toBeVisible()
    await expect(
      page.getByText('Browser fixture project for the first platform loop.'),
    ).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))
  })

  test('exposes canonical metadata and crawl entry points', async ({ page, request }) => {
    await page.goto('/')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', siteUrl)
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Myshkin 451',
    )

    await page.goto('/articles')
    await expect(page).toHaveTitle('写作 | Myshkin 451')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${siteUrl}/articles`,
    )

    await page.goto(`/articles/${loopFixture.articleSlug}`)
    await expect(page).toHaveTitle(`${loopFixture.articleTitle} | Myshkin 451`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${siteUrl}/articles/${loopFixture.articleSlug}`,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)

    await page.goto('/about')
    await expect(page).toHaveTitle('关于 | Myshkin 451')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${siteUrl}/about`)
    await expect(
      page.getByRole('heading', { name: '一个把学习、建造和写作留在公开处的个人平台。' }),
    ).toBeVisible()

    const robots = await request.get('/robots.txt')
    await expect(robots).toBeOK()
    await expect(await robots.text()).toContain(`Sitemap: ${siteUrl}/sitemap.xml`)

    const sitemap = await request.get('/sitemap.xml')
    await expect(sitemap).toBeOK()
    const sitemapXml = await sitemap.text()

    expect(sitemapXml).toContain(`<loc>${siteUrl}/</loc>`)
    expect(sitemapXml).toContain(`<loc>${siteUrl}/articles</loc>`)
    expect(sitemapXml).toContain(`<loc>${siteUrl}/projects</loc>`)
    expect(sitemapXml).toContain(`<loc>${siteUrl}/about</loc>`)
    expect(sitemapXml).toContain(`<loc>${siteUrl}/articles/${loopFixture.articleSlug}</loc>`)
    expect(sitemapXml).toContain(`<loc>${siteUrl}/projects/${loopFixture.projectSlug}</loc>`)
  })
})

async function expectImagesLoaded(locator: Locator) {
  const imageCount = await locator.count()

  expect(imageCount).toBeGreaterThan(0)

  for (let index = 0; index < imageCount; index += 1) {
    const image = locator.nth(index)
    await expect(image).toBeVisible()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true)
  }
}
