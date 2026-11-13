'use client'

import { Drawer } from '@base-ui/react/drawer'
import NumberFlow from '@number-flow/react'
import { X } from 'lucide-react'
import Link from 'next/link'

import { buttonClass } from '@/components/ui/Button'
import { cartCount, cartSubtotal, useCart } from '@/lib/cart/store'
import { cn } from '@/lib/cn'
import { useCartSync, useMediaQuery } from '@/lib/hooks'
import { plural } from '@/lib/typography'

import { CartLines } from './CartLines'

/** Kwota, której cyfry płynnie się przewijają przy zmianie ilości. */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const hasGrosze = Math.round(value * 100) % 100 !== 0
  return (
    <NumberFlow
      className={cn('tabular', className)}
      format={{
        style: 'currency',
        currency: 'PLN',
        useGrouping: 'always',
        minimumFractionDigits: hasGrosze ? 2 : 0,
        maximumFractionDigits: hasGrosze ? 2 : 0,
      }}
      locales="pl-PL"
      value={value}
    />
  )
}

/**
 * Koszyk w szufladzie: z prawej strony na komputerze, od dołu na telefonie
 * (zamykany także przeciągnięciem). Otwiera się po dodaniu produktu.
 */
export function CartDrawer() {
  const isOpen = useCart((state) => state.isOpen)
  const setOpen = useCart((state) => state.setOpen)
  const lines = useCart((state) => state.lines)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useCartSync(isOpen)

  const count = cartCount(lines)
  const subtotal = cartSubtotal(lines)
  const hasUnavailable = lines.some((line) => line.unavailable)
  const close = () => setOpen(false)

  return (
    <Drawer.Root onOpenChange={setOpen} open={isOpen} swipeDirection={isDesktop ? 'right' : 'down'}>
      <Drawer.Portal>
        <Drawer.Backdrop className="drawer-backdrop" />
        <Drawer.Viewport className={cn('drawer-viewport', isDesktop ? 'items-stretch justify-end' : 'items-end justify-center')}>
          <Drawer.Popup className={cn(isDesktop ? 'drawer-side' : 'drawer-sheet flex max-h-[calc(92dvh+3rem)] flex-col')}>
            {!isDesktop && <div aria-hidden="true" className="drawer-handle shrink-0" />}

            <div className="flex shrink-0 items-center justify-between px-6 pt-4 pb-3 md:pt-6">
              <Drawer.Title className="display-4">
                Koszyk
                {count > 0 && (
                  <span className="tabular ml-2 font-sans text-sm font-normal text-ink-soft">
                    {count} {plural(count, 'produkt', 'produkty', 'produktów')}
                  </span>
                )}
              </Drawer.Title>
              <Drawer.Close aria-label="Zamknij koszyk" className="icon-btn -mr-2">
                <X aria-hidden="true" size={22} strokeWidth={1.5} />
              </Drawer.Close>
            </div>

            {lines.length === 0 ? (
              <Drawer.Content className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <p className="display-3">Koszyk jest pusty</p>
                <p className="mt-3 max-w-[30ch] text-ink-soft">Dodaj mebel, który wpadł Ci w oko — poczeka tu na Ciebie.</p>
                <Link className={buttonClass({ className: 'mt-8' })} href="/sklep" onClick={close}>
                  Zobacz meble
                </Link>
              </Drawer.Content>
            ) : (
              <>
                <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
                  <CartLines className="border-t border-line" onNavigate={close} />
                </Drawer.Content>

                <div className="shrink-0 border-t border-line px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-baseline justify-between">
                    <p className="text-ink-soft">Suma produktów</p>
                    <AnimatedPrice className="text-xl font-medium" value={subtotal} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">Koszt dostawy wybierzesz w następnym kroku.</p>
                  {hasUnavailable && (
                    <p className="mt-3 text-sm text-danger" role="alert">
                      Usuń niedostępne produkty, aby przejść dalej.
                    </p>
                  )}
                  <Link
                    aria-disabled={hasUnavailable || undefined}
                    className={buttonClass({ size: 'lg', className: 'mt-5 w-full' })}
                    href="/zamowienie"
                    onClick={(event) => {
                      if (hasUnavailable) event.preventDefault()
                      else close()
                    }}
                  >
                    Przejdź do zamówienia
                  </Link>
                  <Link className="link-line mx-auto mt-4 block w-fit text-sm" href="/koszyk" onClick={close}>
                    Zobacz cały koszyk
                  </Link>
                </div>
              </>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
