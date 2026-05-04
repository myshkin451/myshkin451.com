import { test, expect, type Locator } from '@playwright/test'
import {
  cleanupPlatformLoopFixture,
  createPlatformLoopFixture,
} from '../helpers/platformLoopFixture'

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

    await expect(heading).toContainText('Writing, projects, knowledge, and experiments')
  })

  test('renders published article and project records with cover media', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: loopFixture.articleTitle })).toBeVisible()
    await expect(page.getByRole('link', { name: loopFixture.projectTitle })).toBeVisible()

    const homepageImages = page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`)
    await expect(homepageImages).toHaveCount(2)
    await expectImagesLoaded(homepageImages)

    await page.goto('/articles')
    await expect(page.getByRole('link', { name: loopFixture.articleTitle })).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto(`/articles/${loopFixture.articleSlug}`)
    await expect(page.getByRole('heading', { name: loopFixture.articleTitle })).toBeVisible()
    await expect(
      page.getByText('Browser fixture article for the first platform loop.'),
    ).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto('/projects')
    await expect(page.getByRole('link', { name: loopFixture.projectTitle })).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))

    await page.goto(`/projects/${loopFixture.projectSlug}`)
    await expect(page.getByRole('heading', { name: loopFixture.projectTitle })).toBeVisible()
    await expect(
      page.getByText('Browser fixture project for the first platform loop.'),
    ).toBeVisible()
    await expectImagesLoaded(page.locator(`.cover-image img[alt="${loopFixture.coverAlt}"]`))
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
