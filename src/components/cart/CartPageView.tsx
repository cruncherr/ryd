'use client'

import Link from 'next/link'

import { buttonClass } from '@/components/ui/Button'
import { cartSubtotal, useCart } from '@/lib/cart/store'
import { useCartSync } from '@/lib/hooks'

import { AnimatedPrice } from './CartDrawer'
import { CartLines } from './CartLines'

/** Pełna strona koszyka — to samo co w szufladzie, tylko z większym oddechem. */
export function CartPageView() {
  const lines = useCart((state) => state.lines)
  const hydrated = useCart((state) => state.hydrated)
  useCartSync(hydrated)

  const subtotal = cartSubtotal(lines)
  const hasUnavailable = lines.some((line) => line.unavailable)

  return (
    <div className="shell pt-8 pb-20 md:pt-12 md:pb-28">
      <h1 className="display-1 text-[clamp(2.75rem,1.6rem+4.2vw,5rem)]">Koszyk</h1>

      {!hydrated ? (
        <div aria-hidden="true" className="mt-12 h-40 rounded-[var(--radius-panel)] bg-stage/60" />
      ) : lines.length === 0 ? (
        <div className="mt-12 max-w-xl">
          <p className="lead">Koszyk jest pusty. Dodaj sofę, która wpadła Ci w oko — poczeka tu na Ciebie.</p>
          <Link className={buttonClass({ size: 'lg', className: 'mt-8' })} href="/sklep">
            Zobacz sofy
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-16 gap-y-10 lg:grid-cols-12 md:mt-14">
          <div className="lg:col-span-8">
            <CartLines className="border-t border-line" />
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-[var(--radius-panel)] bg-stage p-6 lg:sticky lg:top-28 md:p-8">
              <h2 className="display-4">Podsumowanie</h2>
              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <p className="text-ink-soft">Suma produktów</p>
                <AnimatedPrice className="text-xl font-medium" value={subtotal} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">Koszt dostawy wybierzesz w następnym kroku.</p>
              {hasUnavailable && (
                <p className="mt-4 text-sm text-danger" role="alert">
                  Usuń niedostępne produkty, aby przejść dalej.
                </p>
              )}
              <Link
                aria-disabled={hasUnavailable || undefined}
                className={buttonClass({ size: 'lg', className: 'mt-6 w-full' })}
                href="/zamowienie"
                onClick={(event) => {
                  if (hasUnavailable) event.preventDefault()
                }}
              >
                Przejdź do zamówienia
              </Link>
              <Link className="link-line mx-auto mt-4 block w-fit text-sm" href="/sklep">
                Kontynuuj zakupy
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
