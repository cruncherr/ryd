'use client'

import { Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { useCart, type CartLine } from '@/lib/cart/store'
import { cn } from '@/lib/cn'
import { CART_LIMITS } from '@/lib/constants'
import { formatPLN } from '@/lib/money'

type Props = {
  /** Zamknięcie szuflady po kliknięciu w produkt. */
  onNavigate?: () => void
  className?: string
}

function Line({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)
  const [removing, setRemoving] = useState(false)

  const handleRemove = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      remove(line.productId, line.variantId)
      return
    }
    // Pozycja najpierw się zwija, dopiero potem znika — lista nie „przeskakuje”.
    setRemoving(true)
    window.setTimeout(() => remove(line.productId, line.variantId), 220)
  }

  return (
    <li
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
        removing ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
      )}
    >
      <div className="overflow-hidden">
        <div className="flex gap-4 border-b border-line py-5">
          <Link
            aria-hidden="true"
            className="relative block aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-lg bg-stage sm:w-28"
            href={`/produkt/${line.slug}`}
            onClick={onNavigate}
            tabIndex={-1}
          >
            {line.imageUrl && <Image alt="" className="packshot" fill sizes="112px" src={line.imageUrl} />}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Bardzo długa nazwa zajmuje najwyżej trzy wiersze — pełna jest na stronie produktu. */}
                <Link className="line-clamp-3 font-medium" href={`/produkt/${line.slug}`} onClick={onNavigate} title={line.title}>
                  {line.title}
                </Link>
                {line.variantName && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{line.variantName}</p>}
              </div>
              <p className="tabular shrink-0 font-medium">
                {line.unavailable ? '—' : formatPLN(line.unitPrice * line.quantity)}
              </p>
            </div>

            {line.unavailable ? (
              <p className="mt-2 text-sm text-danger">Ten produkt nie jest już dostępny. Usuń go, aby złożyć zamówienie.</p>
            ) : null}

            <div className="mt-auto flex items-center justify-between pt-3">
              {line.unavailable ? (
                <span />
              ) : (
                <div className="flex h-10 items-center rounded-full border border-line-strong">
                  <button
                    aria-label={`Zmniejsz ilość: ${line.title}`}
                    className="grid size-10 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-90 disabled:opacity-35"
                    disabled={line.quantity <= 1}
                    onClick={() => setQuantity(line.productId, line.variantId, line.quantity - 1)}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={14} strokeWidth={1.75} />
                  </button>
                  <span className="tabular w-5 text-center text-sm font-medium">
                    <span className="sr-only">Ilość: </span>
                    {line.quantity}
                  </span>
                  <button
                    aria-label={`Zwiększ ilość: ${line.title}`}
                    className="grid size-10 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-90 disabled:opacity-35"
                    disabled={line.quantity >= CART_LIMITS.maxQuantityPerLine}
                    onClick={() => setQuantity(line.productId, line.variantId, line.quantity + 1)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={14} strokeWidth={1.75} />
                  </button>
                </div>
              )}
              <button className="link-line text-sm text-ink-soft" onClick={handleRemove} type="button">
                Usuń
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export function CartLines({ onNavigate, className }: Props) {
  const lines = useCart((state) => state.lines)

  return (
    <ul className={className}>
      {lines.map((line) => (
        <Line key={`${line.productId}:${line.variantId}`} line={line} onNavigate={onNavigate} />
      ))}
    </ul>
  )
}
