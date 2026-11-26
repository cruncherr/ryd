import { expect, test } from '@playwright/test'

import { collectPageErrors, fillCheckout, testCustomer } from './helpers'

test.describe('konfigurator', () => {
  test('klient wybiera wymiar, tkaninę i stronę — cena i zamówienie się zgadzają', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page)
    await page.goto('/produkt/naroznik-rozkladany-oslo')

    // Cena za wybraną konfigurację (atrybut przy kwocie, która płynnie się przewija).
    const priceText = () => page.locator('[data-price]').first().getAttribute('data-price')
    const base = Number((await priceText()) ?? 0)
    expect(base).toBeGreaterThan(0)

    // Większy wymiar — droższy; każda karta wymiaru pokazuje swoją cenę.
    await page.locator('label.choice', { hasText: 'Narożnik 300' }).click()
    await expect.poll(async () => Number((await priceText()) ?? 0)).toBeGreaterThan(base)
    const withSize = Number((await priceText()) ?? 0)

    // Tkanina z dopłatą procentową podnosi cenę jeszcze bardziej.
    await page.locator('label.choice', { hasText: 'Bouclé' }).click()
    await expect.poll(async () => Number((await priceText()) ?? 0)).toBeGreaterThan(withSize)
    await page.locator('label.choice', { hasText: 'Po lewej' }).click()
    const finalPrice = Number((await priceText()) ?? 0)

    await page.getByRole('button', { name: 'Dodaj do koszyka' }).first().click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toContainText('Narożnik 300')
    await expect(drawer).toContainText('Bouclé')
    await expect(drawer).toContainText('szezlong po lewej')

    // Serwer liczy kwotę sam — zamówienie przechodzi tylko wtedy, gdy zgadza się z tym, co widział klient.
    await drawer.getByRole('link', { name: 'Przejdź do zamówienia' }).click()
    await page.waitForURL('**/zamowienie')
    await fillCheckout(page, testCustomer(`konfigurator-${testInfo.project.name}`))
    await page.getByRole('radio', { name: /Przelew tradycyjny/ }).check({ force: true })
    await page.getByRole('checkbox', { name: /Akceptuję/ }).check({ force: true })
    await page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' }).click()
    await page.waitForURL('**/zamowienie/potwierdzenie/**')

    const summary = page.getByRole('complementary', { name: 'Podsumowanie zamówienia' })
    await expect(summary).toContainText('Narożnik 300')
    await expect(summary).toContainText('Bouclé')
    await expect(summary).toContainText(new Intl.NumberFormat('pl-PL', { useGrouping: 'always' } as Intl.NumberFormatOptions).format(finalPrice).replace(/\s/g, ' '))
    expect(errors).toEqual([])
  })

  test('próbnik: klient zamawia bezpłatne próbki', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/tkaniny')
    const firstColor = page.locator('label', { hasText: 'Zamów próbkę' }).first()
    await firstColor.click()
    await page.locator('label', { hasText: 'Zamów próbkę' }).nth(5).click()
    await expect(page.getByText('2 z')).toBeVisible()

    await page.getByLabel('Imię i nazwisko').fill('Anna Testowa')
    await page.getByLabel('E-mail', { exact: true }).fill(`probki-${Date.now()}@example.com`)
    await page.getByLabel('Ulica i numer').fill('Prosta 1')
    await page.getByLabel('Kod pocztowy').fill('00950')
    await page.getByLabel('Miejscowość').fill('Warszawa')
    await page.getByRole('button', { name: /Zamów próbki \(2\)/ }).click()
    await expect(page.getByRole('heading', { name: 'Próbki są w drodze do realizacji' })).toBeVisible()
    expect(errors).toEqual([])
  })
})
