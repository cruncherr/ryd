'use client'

import { Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Price } from '@/components/ui/Price'
import { buttonClass } from '@/components/ui/Button'
import { trackAddToCart, trackViewItem } from '@/lib/analytics'
import { useCart } from '@/lib/cart/store'
import type { PriceView } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { CART_LIMITS } from '@/lib/constants'
import { formatPLN } from '@/lib/money'
import { noOrphans } from '@/lib/typography'

import { Gallery, type GalleryImage } from './Gallery'

export type HeroVariant = {
  id: string
  name: string
  fabric: string | null
  swatchColor: string
  available: boolean
  images: GalleryImage[]
  thumbUrl: string | null
}

export type ProductHeroData = {
  id: number
  slug: string
  title: string
  shortDescription: string | null
  price: PriceView
  priceNote: string | null
  availability: 'in_stock' | 'made_to_order' | 'unavailable'
  availabilityLabel: string
  leadTime: string | null
  variants: HeroVariant[]
}

type Props = {
  product: ProductHeroData
  breadcrumbs: ReactNode
  /** Informacje o dostawie, zwrocie i płatności — przygotowane na serwerze. */
  info: ReactNode
}

/**
 * Górna część strony produktu: galeria i panel zakupu.
 * Wybrany kolor steruje jednocześnie galerią i tym, co trafia do koszyka.
 */
export function ProductHero({ product, breadcrumbs, info }: Props) {
  const firstAvailable = product.variants.find((variant) => variant.available) ?? product.variants[0]
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [ctaVisible, setCtaVisible] = useState(true)
  const cta = useRef<HTMLDivElement>(null)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const add = useCart((state) => state.add)
  const openCart = useCart((state) => state.open)

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable
  const purchasable = product.availability !== 'unavailable' && Boolean(variant?.available)

  // Na telefonie, gdy główny przycisk zniknie z ekranu, pokazujemy pasek zakupu na dole.
  useEffect(() => {
    const element = cta.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry) setCtaVisible(entry.isIntersecting)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current)
  }, [])

  // Pomiar „obejrzano produkt" — raz na wejście na stronę i tylko za zgodą klienta.
  useEffect(() => {
    trackViewItem({ id: product.id, name: product.title, price: product.price.current, quantity: 1 })
  }, [product.id, product.title, product.price.current])

  const addToCart = () => {
    if (!variant || !purchasable) return
    add(
      {
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        variantName: variant.name,
        slug: product.slug,
        unitPrice: product.price.current,
        imageUrl: variant.thumbUrl,
      },
      quantity,
    )
    trackAddToCart({ id: product.id, name: product.title, variant: variant.name, price: product.price.current, quantity })
    setJustAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setJustAdded(false), 2200)
    openCart()
  }

  const dot =
    product.availability === 'in_stock'
      ? 'bg-success'
      : product.availability === 'made_to_order'
        ? 'bg-[#b98a2b]'
        : 'bg-ink-faint'

  return (
    <>
      <div className="shell grid gap-x-12 gap-y-8 pt-3 lg:grid-cols-12 lg:pt-4">
        <div className="lg:col-span-7">
          <Gallery images={variant?.images ?? []} title={product.title} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            {breadcrumbs}
            <h1 className="display-2 mt-4 text-[clamp(2rem,1.5rem+2vw,3.125rem)]">{noOrphans(product.title)}</h1>
            {product.shortDescription && (
              <p className="mt-4 max-w-[46ch] text-[1.0625rem] text-ink-soft">{noOrphans(product.shortDescription)}</p>
            )}

            <Price className="mt-7" mode="full" note={product.priceNote} price={product.price} />

            {product.variants.length > 0 && variant && (
              <fieldset className="mt-8">
                <legend className="text-sm text-ink-soft">
                  Kolor: <span className="font-medium text-ink">{variant.name}</span>
                  {variant.fabric ? ` · ${variant.fabric}` : ''}
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {product.variants.map((item) => (
                    <label
                      className={cn('relative cursor-pointer', !item.available && 'cursor-not-allowed opacity-45')}
                      key={item.id}
                      title={item.available ? item.name : `${item.name} — niedostępny`}
                    >
                      <input
                        checked={item.id === variant.id}
                        className="peer sr-only"
                        disabled={!item.available}
                        name="kolor"
                        onChange={() => setVariantId(item.id)}
                        type="radio"
                        value={item.id}
                      />
                      <span
                        aria-hidden="true"
                        className="pressable block size-10 rounded-full ring-1 ring-black/10 ring-offset-[3px] ring-offset-paper transition-[transform,box-shadow] duration-150 ease-out peer-checked:ring-[1.5px] peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[6px] peer-focus-visible:outline-ink"
                        style={{ backgroundColor: item.swatchColor }}
                      />
                      <span className="sr-only">
                        {item.name}
                        {item.available ? '' : ' (niedostępny)'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
              <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', dot)} />
              <span className="font-medium whitespace-nowrap">{product.availabilityLabel}</span>
              {product.leadTime && product.availability !== 'unavailable' && (
                <span className="text-ink-soft max-sm:basis-full max-sm:pl-[1.125rem]">{product.leadTime}</span>
              )}
            </p>

            <div className="mt-5 flex gap-3" ref={cta}>
              {purchasable ? (
                <>
                  <div className="flex h-14 shrink-0 items-center rounded-full border border-line-strong">
                    <button
                      aria-label="Zmniejsz ilość"
                      className="icon-btn disabled:opacity-35"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      type="button"
                    >
                      <Minus aria-hidden="true" size={16} strokeWidth={1.75} />
                    </button>
                    <span aria-live="polite" className="tabular w-6 text-center font-medium">
                      <span className="sr-only">Ilość: </span>
                      {quantity}
                    </span>
                    <button
                      aria-label="Zwiększ ilość"
                      className="icon-btn disabled:opacity-35"
                      disabled={quantity >= CART_LIMITS.maxQuantityPerLine}
                      onClick={() => setQuantity((value) => Math.min(CART_LIMITS.maxQuantityPerLine, value + 1))}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                  <button className={buttonClass({ size: 'lg', className: 'flex-1 px-5' })} onClick={addToCart} type="button">
                    {/* Zmiana napisu potwierdza dodanie; lekkie rozmycie łączy oba stany w jedno przejście. */}
                    <span
                      className="inline-flex animate-[label-swap_260ms_var(--ease-out)_both] items-center gap-2"
                      key={justAdded ? 'added' : 'idle'}
                    >
                      {justAdded ? (
                        <>
                          <Check aria-hidden="true" size={18} strokeWidth={2} />
                          Dodano do koszyka
                        </>
                      ) : (
                        'Dodaj do koszyka'
                      )}
                    </span>
                  </button>
                </>
              ) : (
                <div className="grid w-full gap-3">
                  <button className={buttonClass({ size: 'lg', className: 'w-full' })} disabled type="button">
                    Chwilowo niedostępny
                  </button>
                  <Link className={buttonClass({ size: 'lg', variant: 'secondary', className: 'w-full' })} href="/kontakt">
                    Zapytaj o dostępność
                  </Link>
                </div>
              )}
            </div>

            {info}
          </div>
        </div>
      </div>

      {purchasable && (
        <div
          aria-hidden={ctaVisible}
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden',
            ctaVisible ? 'translate-y-full' : 'translate-y-0',
          )}
          inert={ctaVisible}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.title}</p>
              <p className="tabular text-sm text-ink-soft">{formatPLN(product.price.current)}</p>
            </div>
            <button className={buttonClass({ size: 'md', className: 'shrink-0' })} onClick={addToCart} type="button">
              Do koszyka
            </button>
          </div>
        </div>
      )}
    </>
  )
}
