'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { lineKey, type LineConfig } from '@/lib/configurator'
import { CART_LIMITS } from '@/lib/constants'

/**
 * Koszyk żyje w przeglądarce klienta (pamięć lokalna) — bez kont i bez ciasteczek.
 * Zapisane ceny i nazwy służą tylko do natychmiastowego wyświetlenia; serwer zawsze
 * przelicza koszyk na nowo z bazy, zanim przyjmie zamówienie.
 */
export type CartLine = {
  /** Produkt + zdjęcia + konfiguracja — dwie różne konfiguracje tego samego mebla to dwie pozycje. */
  key: string
  productId: number
  /** Identyfikator koloru (wiersza wariantu) produktu. */
  variantId: string
  /** Wybór z konfiguratora: wymiar, tkanina, kolor, nóżki, strona. */
  config?: LineConfig
  quantity: number
  title: string
  variantName: string
  slug: string
  unitPrice: number
  imageUrl: string | null
  /** Numer egzemplarza z edycji numerowanej, np. „Nº 07 / 50”, albo informacja o przydziale numeru. */
  edition?: string
  /** Ustawiane po sprawdzeniu na serwerze: produkt wycofany lub kolor niedostępny. */
  unavailable?: boolean
}

type CartState = {
  lines: CartLine[]
  isOpen: boolean
  /** Czy koszyk został już wczytany z pamięci przeglądarki. */
  hydrated: boolean
  add: (line: Omit<CartLine, 'quantity' | 'key'>, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  /** Podmienia dane pozycji na aktualne z serwera (ceny, nazwy, dostępność). */
  sync: (lines: CartLine[]) => void
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}


/** Wybrany numer egzemplarza to jedna konkretna sztuka — taka pozycja ma zawsze ilość 1. */
const clampQuantity = (quantity: number, config?: LineConfig) =>
  Math.max(1, Math.min(config?.number ? 1 : CART_LIMITS.maxQuantityPerLine, Math.round(quantity)))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hydrated: false,
      add: (line, quantity = 1) =>
        set((state) => {
          const key = lineKey(line.productId, line.variantId, line.config)
          const existing = state.lines.find((item) => item.key === key)
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.key === key ? { ...item, ...line, key, quantity: clampQuantity(item.quantity + quantity, line.config) } : item,
              ),
            }
          }
          if (state.lines.length >= CART_LIMITS.maxLines) return state
          return { lines: [...state.lines, { ...line, key, quantity: clampQuantity(quantity, line.config) }] }
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) => (item.key === key ? { ...item, quantity: clampQuantity(quantity, item.config) } : item)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((item) => item.key !== key) })),
      clear: () => set({ lines: [] }),
      sync: (lines) => set({ lines }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'ryd-koszyk',
      version: 2,
      partialize: (state) => ({ lines: state.lines }),
      // Koszyk zapisany przed pojawieniem się konfiguratora: każda pozycja dostaje swój klucz.
      migrate: (persisted) => {
        const lines = (persisted as { lines?: Array<Omit<CartLine, 'key'> & { key?: string }> } | null)?.lines ?? []
        return {
          lines: lines.map((line) => ({ ...line, key: line.key ?? lineKey(line.productId, line.variantId, line.config) })),
        }
      },
      // Wczytujemy ręcznie po stronie przeglądarki, żeby serwer i klient zaczynały od tego samego (pustego) stanu.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCart.setState({ hydrated: true })
      },
    },
  ),
)

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0)
}

export function cartSubtotal(lines: CartLine[]): number {
  const grosze = lines
    .filter((line) => !line.unavailable)
    .reduce((total, line) => total + Math.round(line.unitPrice * 100) * line.quantity, 0)
  return grosze / 100
}
