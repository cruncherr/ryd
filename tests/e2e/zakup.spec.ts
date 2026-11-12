import { expect, test } from '@playwright/test'

import { addToCart, collectPageErrors, fillCheckout, openFirstProduct, testCustomer } from './helpers'

test.describe('zakup', () => {
  test('klient kupuje produkt z płatnością przelewem', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page)
    const productTitle = await openFirstProduct(page)
    await addToCart(page)

    // Koszyk w szufladzie pokazuje dodany produkt i prowadzi do zamówienia.
    const drawer = page.getByRole('dialog')
    await expect(drawer).toContainText(productTitle)
    await drawer.getByRole('link', { name: 'Przejdź do zamówienia' }).click()
    await page.waitForURL('**/zamowienie')
    await expect(page.getByRole('heading', { level: 1, name: 'Zamówienie' })).toBeVisible()
    const submit = page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' })
    await expect(submit).toBeVisible()

    // Pusty formularz: komunikaty przy polach, kursor w pierwszym błędnym polu, zamówienie nie powstaje.
    await submit.click()
    await expect(page.getByText('Podaj adres e-mail — wyślemy na niego potwierdzenie zamówienia.')).toBeVisible()
    await expect(page.getByText('Zaakceptuj regulamin, aby złożyć zamówienie.')).toBeVisible()
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused()
    expect(page.url()).toMatch(/\/zamowienie$/)

    // Błędny telefon jest wychwytywany od razu po wyjściu z pola.
    await page.getByLabel('Telefon', { exact: true }).fill('123')
    await page.getByLabel('Imię', { exact: true }).focus()
    await expect(page.getByText('Sprawdź numer telefonu — polski numer ma 9 cyfr.')).toBeVisible()

    const customer = testCustomer(testInfo.project.name)
    await fillCheckout(page, customer)
    // Kod pocztowy sam dostaje myślnik.
    await expect(page.getByLabel('Kod pocztowy')).toHaveValue('00-950')

    await page.getByRole('radio', { name: /Przelew tradycyjny/ }).check({ force: true })
    await page.getByLabel('Uwagi do zamówienia').fill('Zamówienie z testu automatycznego.')
    await page.getByRole('checkbox', { name: /Akceptuję/ }).check({ force: true })
    await expect(page.locator('.field-message.text-danger')).toHaveCount(0)

    // Wpisane dane przetrwają odświeżenie strony (poza zgodą, którą trzeba zaznaczyć ponownie).
    await page.reload()
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(customer.email)
    await expect(page.getByLabel('Miejscowość')).toHaveValue(customer.city)
    await page.getByRole('checkbox', { name: /Akceptuję/ }).check({ force: true })

    await page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' }).click()
    await page.waitForURL('**/zamowienie/potwierdzenie/**')

    // Strona potwierdzenia: numer zamówienia, adres e-mail klienta, kupiony produkt i sposób płatności.
    await expect(page.getByRole('heading', { level: 1, name: 'Dziękujemy za zamówienie' })).toBeVisible()
    await expect(page.getByText(/Zamówienie [A-Z0-9]*-?\d{4,}/).first()).toBeVisible()
    await expect(page.getByText(customer.email).first()).toBeVisible()
    const summary = page.getByRole('complementary', { name: 'Podsumowanie zamówienia' })
    await expect(summary).toContainText(productTitle)
    await expect(summary).toContainText('Przelew tradycyjny')
    await expect(summary).toContainText('Zamówienie z testu automatycznego.')
    await expect(page.getByRole('heading', { name: 'Dane do przelewu' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Co dalej' })).toBeVisible()

    // Po zakupie koszyk jest pusty, a formularz nie pamięta już danych.
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('ryd-koszyk') ?? '{}')?.state?.lines?.length ?? 0)).toBe(0)
    expect(await page.evaluate(() => sessionStorage.getItem('ryd-zamowienie'))).toBeNull()

    // Odnośnik do zamówienia działa także po ponownym wejściu (np. z e-maila).
    const orderUrl = page.url()
    await page.goto('/')
    await page.goto(orderUrl)
    await expect(summary).toContainText(productTitle)

    expect(errors).toEqual([])
  })

  test('koszyk: zmiana ilości i usunięcie produktu', async ({ page }) => {
    const errors = collectPageErrors(page)
    const productTitle = await openFirstProduct(page)
    await addToCart(page)
    await page.getByRole('dialog').getByRole('link', { name: 'Zobacz cały koszyk' }).click()
    await page.waitForURL('**/koszyk')

    // Szuflada z koszykiem zamyka się po przejściu na stronę koszyka.
    await expect(page.getByRole('dialog')).toBeHidden()
    const line = page.getByRole('main').getByRole('listitem').filter({ hasText: productTitle })
    await expect(line).toBeVisible()
    await line.getByRole('button', { name: /Zwiększ ilość/ }).click()
    await expect(line.getByText('Ilość: 2', { exact: false })).toBeAttached()
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('ryd-koszyk') ?? '{}')?.state?.lines?.[0]?.quantity)).toBe(2)

    await line.getByRole('button', { name: 'Usuń' }).click()
    await expect(page.getByText('Koszyk jest pusty', { exact: false }).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('zamówienie bez produktów nie jest możliwe', async ({ page }) => {
    await page.goto('/zamowienie')
    await expect(page.getByText('Twój koszyk jest pusty', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' })).toHaveCount(0)
  })

  test('cudzego zamówienia nie da się podejrzeć zgadywaniem adresu', async ({ page }) => {
    const response = await page.goto('/zamowienie/potwierdzenie/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Tej strony już tu nie ma' })).toBeVisible()
  })
})
