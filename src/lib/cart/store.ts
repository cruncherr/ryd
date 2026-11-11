'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { CART_LIMITS } from '@/lib/constants'

/**
 * Koszyk żyje w przeglądarce klienta (pamięć lokalna) — bez kont i bez ciasteczek.
 * Zapisane ceny i nazwy służą tylko do natychmiastowego wyświetlenia; serwer zawsze
 * przelicza koszyk na nowo z bazy, zanim przyjmie zamówienie.
 */
export type CartLine = {
  productId: number
  /** Identyfikator koloru (wiersza wariantu) produktu. */
  variantId: string
  quantity: number
  title: string
  variantName: string
  slug: string
  unitPrice: number
  imageUrl: string | null
  /** Ustawiane po sprawdzeniu na serwerze: produkt wycofany lub kolor niedostępny. */
  unavailable?: boolean
}

type CartState = {
  lines: CartLine[]
  isOpen: boolean
  /** Czy koszyk został już wczytany z pamięci przeglądarki. */
  hydrated: boolean
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: number, variantId: string, quantity: number) => void
  remove: (productId: number, variantId: string) => void
  clear: () => void
  /** Podmienia dane pozycji na aktualne z serwera (ceny, nazwy, dostępność). */
  sync: (lines: CartLine[]) => void
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

const sameLine = (line: CartLine, productId: number, variantId: string) =>
  line.productId === productId && line.variantId === variantId

const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(CART_LIMITS.maxQuantityPerLine, Math.round(quantity)))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hydrated: false,
      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((item) => sameLine(item, line.productId, line.variantId))
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                sameLine(item, line.productId, line.variantId)
                  ? { ...item, ...line, quantity: clampQuantity(item.quantity + quantity) }
                  : item,
              ),
            }
          }
          if (state.lines.length >= CART_LIMITS.maxLines) return state
          return { lines: [...state.lines, { ...line, quantity: clampQuantity(quantity) }] }
        }),
      setQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            sameLine(item, productId, variantId) ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),
      remove: (productId, variantId) =>
        set((state) => ({ lines: state.lines.filter((item) => !sameLine(item, productId, variantId)) })),
      clear: () => set({ lines: [] }),
      sync: (lines) => set({ lines }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'ryd-koszyk',
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
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
