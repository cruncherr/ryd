import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Błędy JavaScript na stronie — test kończy się niepowodzeniem, jeśli jakiś się pojawi. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/** Otwiera pierwszy produkt z listy sklepu i zwraca jego nazwę. */
export async function openFirstProduct(page: Page): Promise<string> {
  await page.goto('/sklep')
  const firstProduct = page.locator('a[href^="/produkt/"]').first()
  await expect(firstProduct).toBeVisible()
  await firstProduct.click()
  await page.waitForURL('**/produkt/**')
  const title = (await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s+/g, ' ').trim()
  expect(title.length).toBeGreaterThan(2)
  return title
}

export async function addToCart(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).first().click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: /Koszyk/ })).toBeVisible()
}

export type Customer = {
  email: string
  firstName: string
  lastName: string
  phone: string
  street: string
  postalCode: string
  city: string
}

export function testCustomer(label: string): Customer {
  return {
    email: `test-${label}-${Date.now()}@example.com`,
    firstName: 'Anna',
    lastName: 'Testowa',
    phone: '600 100 200',
    street: 'ul. Długa 12/4',
    postalCode: '00950',
    city: 'Warszawa',
  }
}

export async function fillCheckout(page: Page, customer: Customer): Promise<void> {
  await page.getByLabel('E-mail', { exact: true }).fill(customer.email)
  await page.getByLabel('Imię', { exact: true }).fill(customer.firstName)
  await page.getByLabel('Nazwisko', { exact: true }).fill(customer.lastName)
  await page.getByLabel('Telefon', { exact: true }).fill(customer.phone)
  await page.getByLabel('Ulica, numer domu i mieszkania').fill(customer.street)
  await page.getByLabel('Kod pocztowy').pressSequentially(customer.postalCode)
  await page.getByLabel('Miejscowość').fill(customer.city)
}

/**
 * Automatyczna kontrola dostępności bieżącej strony (reguły WCAG 2.1 A i AA): kontrast,
 * etykiety pól, nazwy przycisków, poprawność atrybutów ARIA.
 */
export async function expectAccessible(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
  }))
  expect(summary, `Problemy z dostępnością na stronie: ${label}`).toEqual([])
}
