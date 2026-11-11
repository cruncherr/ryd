'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { refreshCart } from '@/lib/cart/actions'
import { useCart } from '@/lib/cart/store'

/** Czy zapytanie o media (np. szerokość ekranu) jest spełnione. Na serwerze zawsze `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * Uzgadnia koszyk z serwerem (aktualne ceny i dostępność), gdy `active` zmienia się na true.
 * Zmiany ilości nie wymagają ponownego pytania serwera — ceny jednostkowe się nie zmieniają.
 */
export function useCartSync(active: boolean): void {
  const hydrated = useCart((state) => state.hydrated)
  const running = useRef(false)

  useEffect(() => {
    if (!active || !hydrated || running.current) return
    const { lines, sync } = useCart.getState()
    if (lines.length === 0) return

    running.current = true
    const sent = lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }))

    refreshCart(sent)
      .then((fresh) => {
        // Jeśli klient zdążył coś zmienić w koszyku, zachowujemy jego ilości i usunięcia.
        const current = useCart.getState().lines
        const merged = current.flatMap((line) => {
          const match = fresh.find((item) => item.productId === line.productId && item.variantId === line.variantId)
          return match ? [{ ...match, quantity: line.quantity }] : [line]
        })
        sync(merged)
      })
      .catch(() => {
        // Brak sieci: zostawiamy koszyk bez zmian; serwer i tak przeliczy go przy zamówieniu.
      })
      .finally(() => {
        running.current = false
      })
  }, [active, hydrated])
}
