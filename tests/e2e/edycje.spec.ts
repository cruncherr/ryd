import { expect, test } from '@playwright/test'

import { collectPageErrors, fillCheckout, testCustomer } from './helpers'

test.describe('edycje numerowane', () => {
  test('klient wybiera numer egzemplarza; gdy ktoś zamówi go pierwszy, drugi klient dostaje prośbę o inny', async ({ browser }, testInfo) => {
    const first = await (await browser.newContext()).newPage()
    const second = await (await browser.newContext()).newPage()
    const errors = [...collectPageErrors(first), ...collectPageErrors(second)]

    await first.goto('/produkt/sofa-rozkladana-bergen')
    await expect(first.getByText('Edycja Nº 01 · Nakład 50 egz.')).toBeVisible()

    // Najwyższy wolny numer — testy mogą się powtarzać, a numery z poprzednich zamówień są zajęte.
    const free = first.locator('input[name="numer-egzemplarza"]:not([disabled])')
    await expect(free.first()).toBeAttached()
    const chosen = Number(await free.last().getAttribute('value'))
    const label = String(chosen).padStart(2, '0')
    const pick = async (page: typeof first) => {
      await page.locator('label', { has: page.locator(`input[name="numer-egzemplarza"][value="${chosen}"]`) }).click()
      await page.getByRole('button', { name: `Zarezerwuj egzemplarz Nº ${label}` }).click()
      await page.waitForURL('**/zamowienie')
      await expect(page.getByText(`Egzemplarz Nº ${label} / 50`).first()).toBeVisible()
    }

    // Obaj klienci wybierają ten sam numer i przechodzą do zamówienia.
    await pick(first)
    await second.bringToFront()
    await second.goto('/produkt/sofa-rozkladana-bergen')
    await pick(second)

    // Drugi zamawia pierwszy — numer trafia do rejestru na jego nazwisko.
    const customer = testCustomer(`numer-${testInfo.project.name}`)
    await fillCheckout(second, customer)
    await second.getByRole('radio', { name: /Przelew tradycyjny/ }).check({ force: true })
    await second.getByRole('checkbox', { name: /Akceptuję/ }).check({ force: true })
    await second.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' }).click()
    await second.waitForURL('**/zamowienie/potwierdzenie/**')
    await expect(second.getByRole('heading', { level: 1, name: 'Twój egzemplarz czeka w rejestrze' })).toBeVisible()
    await expect(second.getByText(`Egzemplarz Nº ${label} / 50`).first()).toBeVisible()
    await expect(second.getByText(`${customer.firstName} ${customer.lastName}`).first()).toBeVisible()

    // Pierwszy klient próbuje dokończyć zamówienie — serwer nie sprzeda drugi raz tego samego numeru.
    // Karta pierwszego klienta czekała w tle — przywracamy ją na wierzch, zanim zaczniemy pisać.
    await first.bringToFront()
    await fillCheckout(first, testCustomer(`numer2-${testInfo.project.name}`))
    await first.getByRole('radio', { name: /Przelew tradycyjny/ }).check({ force: true })
    await expect(async () => {
      await first.getByRole('checkbox', { name: /Akceptuję/ }).check({ force: true })
    }).toPass({ timeout: 10_000 })
    await first.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' }).click()
    await expect(first.getByText(`Egzemplarz Nº ${label} / 50 ma już właściciela`, { exact: false }).first()).toBeVisible()
    expect(first.url()).toMatch(/\/zamowienie$/)

    // Na stronie modelu ten numer jest już zajęty.
    await first.goto('/produkt/sofa-rozkladana-bergen')
    await expect(first.locator(`input[name="numer-egzemplarza"][value="${chosen}"]`)).toBeDisabled()
    expect(errors).toEqual([])
    await first.context().close()
    await second.context().close()
  })

  test('przedsprzedaż na zaproszenie: bez kodu nie ma rezerwacji, z kodem jest', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/produkt/sofa-rozkladana-visby')
    await expect(page.getByText('Przedsprzedaż na zaproszenie').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Zarezerwuj egzemplarz/ })).toHaveCount(0)

    await page.getByPlaceholder('Kod zaproszenia').fill('ZLY-KOD')
    await page.getByRole('button', { name: 'Otwórz zaproszenie' }).click()
    await expect(page.getByText('Ten kod nie pasuje do zaproszenia', { exact: false })).toBeVisible()

    await page.getByPlaceholder('Kod zaproszenia').fill('visby-prive')
    await page.getByRole('button', { name: 'Otwórz zaproszenie' }).click()
    await expect(page.getByRole('button', { name: /^Zarezerwuj egzemplarz/ }).first()).toBeVisible()

    // Kod zostaje zapamiętany w tej karcie przeglądarki.
    await page.reload()
    await expect(page.getByRole('button', { name: /^Zarezerwuj egzemplarz/ }).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('prośba o zaproszenie i zapis na listę prywatną', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const errors = collectPageErrors(page)

    await page.goto('/produkt/sofa-rozkladana-visby')
    await page.getByRole('button', { name: 'Nie masz zaproszenia? Poproś o nie' }).click()
    const form = page.locator('form', { has: page.getByRole('button', { name: 'Poproś o zaproszenie' }) })
    await form.getByRole('button', { name: 'Poproś o zaproszenie' }).click()
    await expect(form.getByText('Podaj imię i nazwisko', { exact: false })).toBeVisible()
    await form.getByLabel('Imię i nazwisko').fill('Anna Testowa')
    await form.getByLabel('E-mail').fill(`zaproszenie-${Date.now()}@example.com`)
    await form.getByRole('button', { name: 'Poproś o zaproszenie' }).click()
    await expect(page.getByText('Atelier odezwie się do Ciebie', { exact: false })).toBeVisible()

    await page.goto('/#lista-prywatna')
    const list = page.locator('#lista-prywatna')
    await list.getByLabel('Imię i nazwisko').fill('Jan Testowy')
    await list.getByLabel('E-mail').fill(`lista-${Date.now()}@example.com`)
    await list.getByRole('button', { name: 'Dołącz do listy prywatnej' }).click()
    await expect(list.getByText('Jesteś na liście prywatnej', { exact: false })).toBeVisible()

    expect(errors).toEqual([])
    await context.close()
  })
})
