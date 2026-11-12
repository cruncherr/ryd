import { defineConfig, devices } from '@playwright/test'

/**
 * Testy „klikające” po sklepie jak klient: zakup, formularz kontaktowy, strony informacyjne.
 * Uruchamiają się na działającym sklepie z danymi startowymi:
 *
 *   pnpm build && pnpm start        # w jednym oknie
 *   pnpm test:e2e                   # w drugim
 *
 * Adres sklepu można zmienić zmienną E2E_BASE_URL. Zamówienia z testów trafiają do panelu —
 * uruchamiaj je na sklepie w trybie przygotowania albo na kopii testowej, nigdy na „żywym”.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// Każde uruchomienie przedstawia się innym adresem, żeby ogranicznik zgłoszeń nie mylił testów z atakiem.
const runAddress = `198.51.100.${Math.floor(Math.random() * 250) + 1}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // Zamówienia dostają kolejne numery — testy idą po kolei, żeby wynik był powtarzalny.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'pl-PL',
    trace: 'off',
    extraHTTPHeaders: { 'x-forwarded-for': runAddress },
  },
  projects: [
    { name: 'komputer', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Telefon udajemy w tej samej przeglądarce (Chromium) — wystarcza do sprawdzenia układu i dotyku.
    { name: 'telefon', use: { ...devices['iPhone 14'], browserName: 'chromium' } },
  ],
})
