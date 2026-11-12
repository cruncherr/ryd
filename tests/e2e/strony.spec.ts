import { expect, test } from '@playwright/test'

import { collectPageErrors } from './helpers'

test.describe('witryna', () => {
  test('strona główna pokazuje ofertę i prowadzi do sklepu', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('a[href^="/produkt/"]').first()).toBeVisible()
    // Strona nie przewija się w poziomie.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })

  test('strony informacyjne są dostępne', async ({ page }) => {
    for (const [path, heading] of [
      ['/regulamin', 'Regulamin sklepu'],
      ['/polityka-prywatnosci', 'Polityka prywatności'],
      ['/zwroty-i-reklamacje', 'Zwroty i reklamacje'],
      ['/dostawa-i-platnosci', 'Dostawa i płatności'],
    ] as const) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    }
  })

  test('nieistniejący adres daje czytelną stronę „nie znaleziono”', async ({ page }) => {
    const response = await page.goto('/tej-strony-nie-ma')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Tej strony już tu nie ma' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zobacz sofy' })).toBeVisible()
    expect((await page.goto('/a/b/c'))?.status()).toBe(404)
  })

  test('formularz kontaktowy sprawdza dane i przyjmuje wiadomość', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page)
    await page.goto('/kontakt')
    const send = page.getByRole('button', { name: 'Wyślij wiadomość' })
    await send.click()
    await expect(page.getByText('Podaj adres e-mail — na niego odpowiemy.')).toBeVisible()

    await page.getByLabel('Imię i nazwisko').fill('Jan Testowy')
    await page.getByLabel('E-mail', { exact: true }).fill(`kontakt-${testInfo.project.name}-${Date.now()}@example.com`)
    await page.getByLabel('Wiadomość').fill('Wiadomość z testu automatycznego — proszę zignorować.')
    await send.click()
    await expect(page.getByRole('heading', { name: 'Dziękujemy za wiadomość' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('wyszukiwarki dostają spójne wskazówki', async ({ page, request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)

    await page.goto('/')
    const preparing = (await page.getByText('Sklep w przygotowaniu', { exact: false }).count()) > 0
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content')
    if (preparing) {
      // Tryb przygotowania: sklep prosi wyszukiwarki, żeby go jeszcze nie pokazywały.
      expect(robotsMeta).toContain('noindex')
      expect(await robots.text()).toContain('Disallow: /')
      expect(await sitemap.text()).not.toContain('<loc>')
    } else {
      expect(robotsMeta ?? '').not.toContain('noindex')
      expect(await robots.text()).toContain('Sitemap:')
      expect(await sitemap.text()).toContain('/produkt/')
    }
  })

  test('strona produktu ma dane dla wyszukiwarek', async ({ page }) => {
    await page.goto('/sklep')
    await page.locator('a[href^="/produkt/"]').first().click()
    await page.waitForURL('**/produkt/**')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const data = blocks.flatMap((block) => JSON.parse(block) as Array<Record<string, unknown>>)
    const product = data.find((entry) => entry['@type'] === 'Product') as { name: string; offers: { price: string; priceCurrency: string } } | undefined
    expect(product?.name).toBeTruthy()
    expect(product?.offers.priceCurrency).toBe('PLN')
    expect(Number(product?.offers.price)).toBeGreaterThan(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/produkt\//)
  })
})

test.describe('panel administracyjny', () => {
  test('strona logowania jest po polsku i nie wpuszcza bez hasła', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL('**/admin/login**')
    await expect(page.locator('#field-email')).toBeVisible()
    await expect(page.locator('#field-password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible()
  })

  test('dane zamówień nie są dostępne bez zalogowania', async ({ request }) => {
    for (const path of ['/api/orders', '/api/messages', '/api/users', '/api/counters']) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(403)
    }
  })
})
