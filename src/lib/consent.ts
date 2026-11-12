'use client'

import { useSyncExternalStore } from 'react'

/**
 * Zgody klienta na narzędzia analityczne i marketingowe. Decyzja jest zapisana wyłącznie
 * w przeglądarce klienta; dopóki jej nie podejmie, żadne z tych narzędzi nie jest uruchamiane.
 */

export type Consent = {
  /** Statystyka odwiedzin (Google Analytics). */
  analytics: boolean
  /** Pomiar reklam (Meta Pixel). */
  marketing: boolean
  /** Kiedy klient podjął decyzję. */
  decidedAt: string
}

const STORAGE_KEY = 'ryd-zgody'
const CHANGE_EVENT = 'ryd:consent-changed'
export const OPEN_EVENT = 'ryd:open-consent'

// Jedna, niezmienna wartość „brak decyzji” — React wymaga, żeby odczyt stanu nie tworzył nowych obiektów.
let cache: { raw: string | null; value: Consent | null } = { raw: null, value: null }

function read(): Consent | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === cache.raw) return cache.value

  let value: Consent | null = null
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      const source = parsed as Record<string, unknown>
      if (typeof source.decidedAt === 'string') {
        value = { analytics: source.analytics === true, marketing: source.marketing === true, decidedAt: source.decidedAt }
      }
    }
  } catch {
    value = null
  }
  cache = { raw, value }
  return value
}

export function saveConsent(choice: Pick<Consent, 'analytics' | 'marketing'>): void {
  const value: Consent = { ...choice, decidedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Tryb prywatny: decyzja obowiązuje do zamknięcia karty.
    cache = { raw: JSON.stringify(value), value }
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Aktualna decyzja klienta: `undefined` — jeszcze nie wiadomo (strona się wczytuje),
 * `null` — klient nie podjął decyzji, obiekt — podjął.
 */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore<Consent | null | undefined>(subscribe, read, () => undefined)
}

export function currentConsent(): Consent | null {
  return typeof window === 'undefined' ? null : read()
}
