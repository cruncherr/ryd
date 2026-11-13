import { expect, test } from '@playwright/test'

import { addToCart, expectAccessible, openFirstProduct } from './helpers'

/**
 * Automatyczna kontrola dostępności (reguły WCAG 2.1 A i AA) najważniejszych stron sklepu:
 * kontrast, etykiety pól, nazwy przycisków, kolejność nagłówków, poprawność atrybutów ARIA.
 * Automat wychwytuje tylko część problemów — nie zastępuje sprawdzenia klawiaturą i czytnikiem ekranu.
 */

test.describe('dostępność', () => {
  for (const [path, label] of [
    ['/', 'strona główna'],
    ['/sklep', 'sklep'],
    ['/kontakt', 'kontakt'],
    ['/regulamin', 'regulamin'],
    ['/koszyk', 'pusty koszyk'],
    ['/tej-strony-nie-ma', 'strona 404'],
  ] as const) {
    test(label, async ({ page }) => {
      await page.goto(path)
      // Sekcje strony głównej pojawiają się przy przewijaniu — odsłaniamy je, żeby sprawdzić ich ostateczny wygląd.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y)
          await new Promise((resolve) => setTimeout(resolve, 80))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(900)
      await expectAccessible(page, label)
    })
  }

  test('strona produktu i koszyk w szufladzie', async ({ page }) => {
    await openFirstProduct(page)
    await page.waitForTimeout(600)
    await expectAccessible(page, 'produkt')
    await addToCart(page)
    await page.waitForTimeout(600)
    await expectAccessible(page, 'produkt z otwartym koszykiem')
  })

  test('formularz zamówienia — pusty i z komunikatami błędów', async ({ page }) => {
    await openFirstProduct(page)
    await addToCart(page)
    await page.getByRole('dialog').getByRole('link', { name: 'Przejdź do zamówienia' }).click()
    await page.waitForURL('**/zamowienie')
    await expect(page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' })).toBeVisible()
    await page.waitForTimeout(500)
    await expectAccessible(page, 'zamówienie')

    await page.getByRole('button', { name: 'Zamawiam z obowiązkiem zapłaty' }).click()
    await expect(page.getByText('Zaakceptuj regulamin, aby złożyć zamówienie.')).toBeVisible()
    await page.waitForTimeout(400)
    await expectAccessible(page, 'zamówienie z błędami')
  })
})
