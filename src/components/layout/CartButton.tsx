'use client'

import { ShoppingBag } from 'lucide-react'
import { useEffect } from 'react'

import { cartCount, useCart } from '@/lib/cart/store'
import { plural } from '@/lib/typography'

/** Przycisk koszyka w nagłówku z licznikiem sztuk. Otwiera szufladę koszyka. */
export function CartButton() {
  const lines = useCart((state) => state.lines)
  const hydrated = useCart((state) => state.hydrated)
  const open = useCart((state) => state.open)
  const count = hydrated ? cartCount(lines) : 0

  // Koszyk wczytujemy z pamięci przeglądarki dopiero po stronie klienta.
  useEffect(() => {
    void useCart.persist.rehydrate()
  }, [])

  const label =
    count === 0 ? 'Koszyk jest pusty' : `Koszyk: ${count} ${plural(count, 'produkt', 'produkty', 'produktów')}`

  return (
    <button aria-haspopup="dialog" aria-label={label} className="icon-btn relative" onClick={open} type="button">
      <ShoppingBag aria-hidden="true" size={21} strokeWidth={1.5} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="tabular absolute top-1 right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-ink px-1 text-[0.6875rem] leading-none font-semibold text-paper [animation:badge-pop_260ms_var(--ease-out)]"
          key={count}
        >
          {count}
        </span>
      )}
    </button>
  )
}
