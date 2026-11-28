'use client'

import { Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'

import { InviteGate } from '@/components/edition/InviteGate'
import { NumberPicker } from '@/components/edition/NumberPicker'
import { WaitlistForm } from '@/components/edition/WaitlistForm'
import { AnimatedPrice } from '@/components/ui/AnimatedPrice'
import { Price } from '@/components/ui/Price'
import { buttonClass } from '@/components/ui/Button'
import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { trackAddToCart, trackViewItem } from '@/lib/analytics'
import { useCart } from '@/lib/cart/store'
import type { PriceView } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import {
  configLine,
  configuredPrice,
  matchingVariantIndex,
  resolveConfig,
  toLineConfig,
  type ConfigOptions,
  type LineConfig,
} from '@/lib/configurator'
import { CART_LIMITS, type EditionStatus } from '@/lib/constants'
import { editionLineText, editionTitle, padNumber } from '@/lib/editions'
import { discountPercent, formatPLN } from '@/lib/money'
import { noOrphans } from '@/lib/typography'

import { Configurator, Step } from './Configurator'
import { Gallery, type GalleryImage } from './Gallery'

export type HeroVariant = {
  id: string
  name: string
  fabric: string | null
  /** Tkanina z próbnika, której kolor pokazują te zdjęcia. */
  fabricLinkId: number | null
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
  /** Opcje konfiguratora (wymiar, tkaniny, nóżki, strona). */
  options: ConfigOptions
  configurable: boolean
  samplesEnabled: boolean
  /** Edycja numerowana — `null`, gdy model nie jest limitowany. */
  edition: HeroEdition | null
}

export type HeroEdition = {
  size: number
  code: string | null
  status: EditionStatus
  numberChoice: boolean
  releaseDate: string | null
  taken: number[]
  allocated: number
  remaining: number
  soldOut: boolean
}

const releaseFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' })
const inviteKey = (productId: number) => `veluro-zaproszenie-${productId}`

function readInvite(productId: number): string | null {
  try {
    return sessionStorage.getItem(inviteKey(productId))
  } catch {
    return null
  }
}

const noSubscription = () => () => {}

type Props = {
  product: ProductHeroData
  breadcrumbs: ReactNode
  /** Informacje o dostawie, zwrocie i płatności — przygotowane na serwerze. */
  info: ReactNode
}

/** Pierwszy wybór: kolor ze zdjęć (jeśli wskazuje tkaninę z próbnika), wymiar z dopłatą 0, pierwsze nóżki. */
function initialConfig(product: ProductHeroData, photoVariant: HeroVariant | undefined): LineConfig {
  const { options } = product
  const config: LineConfig = {}
  const fabric = options.fabrics.find((item) => item.id === photoVariant?.fabricLinkId)
  const color = fabric?.colors.find((item) => item.available && item.name.trim().toLowerCase() === photoVariant?.name.trim().toLowerCase())
  if (fabric && color) {
    config.fabric = fabric.id
    config.color = color.id
  }
  return config
}

/**
 * Górna część strony produktu: galeria i panel zakupu z konfiguratorem.
 * Wybór klienta steruje jednocześnie ceną, zdjęciami i tym, co trafia do koszyka.
 */
export function ProductHero({ product, breadcrumbs, info }: Props) {
  const firstAvailable = product.variants.find((variant) => variant.available) ?? product.variants[0]
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? '')
  const [config, setConfig] = useState<LineConfig>(() => initialConfig(product, firstAvailable))
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [ctaVisible, setCtaVisible] = useState(true)
  const cta = useRef<HTMLDivElement>(null)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [number, setNumber] = useState<number | undefined>(undefined)
  const [enteredInvite, setEnteredInvite] = useState<string | undefined>(undefined)
  const router = useRouter()

  const add = useCart((state) => state.add)
  const openCart = useCart((state) => state.open)
  const { edition } = product

  // Kod zaproszenia wpisany wcześniej w tej karcie przeglądarki — nie trzeba go podawać drugi raz.
  const storedInvite = useSyncExternalStore(
    noSubscription,
    () => (edition?.status === 'invite' ? readInvite(product.id) : null),
    () => null,
  )
  const invite = enteredInvite ?? storedInvite ?? undefined

  const unlockInvite = (code: string) => {
    setEnteredInvite(code)
    try {
      sessionStorage.setItem(inviteKey(product.id), code)
    } catch {
      // Pamięć przeglądarki bywa wyłączona (tryb prywatny) — kod zostaje tylko do odświeżenia strony.
    }
  }

  // Czy edycja pozwala teraz zarezerwować egzemplarz (zapowiedź i wyczerpany nakład — nie).
  const editionGate: 'open' | 'invite' | 'announced' | 'sold-out' = !edition
    ? 'open'
    : edition.soldOut
      ? 'sold-out'
      : edition.status === 'announced'
        ? 'announced'
        : edition.status === 'invite' && !invite
          ? 'invite'
          : 'open'

  const { options, configurable } = product
  const usesFabrics = options.fabrics.length > 0
  const resolved = useMemo(() => resolveConfig(options, config) ?? resolveConfig(options, {}), [options, config])

  // Zdjęcia: przy tkaninach z próbnika — wariant w wybranym kolorze, jeśli sprzedawca go sfotografował.
  const matchedIndex = usesFabrics
    ? matchingVariantIndex(product.variants, resolved?.fabric?.id, resolved?.color?.name)
    : product.variants.findIndex((item) => item.id === variantId)
  const photoVariant = (matchedIndex >= 0 ? product.variants[matchedIndex] : undefined) ?? firstAvailable
  const showsOtherColor = usesFabrics && matchedIndex < 0

  const inStock =
    product.availability !== 'unavailable' && Boolean(photoVariant) && (usesFabrics ? Boolean(resolved?.color?.available) : Boolean(photoVariant?.available))
  const purchasable = inStock && editionGate === 'open'

  const price: PriceView = {
    current: configuredPrice(product.price.current, resolved),
    regular: product.price.regular !== null ? configuredPrice(product.price.regular, resolved) : null,
    lowest30: product.price.lowest30 !== null ? configuredPrice(product.price.lowest30, resolved) : null,
  }

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

  // Pomiar „obejrzano produkt” — raz na wejście na stronę i tylko za zgodą klienta.
  const { id: productId, title: productTitle } = product
  const basePrice = product.price.current
  useEffect(() => {
    trackViewItem({ id: productId, name: productTitle, price: basePrice, quantity: 1 })
  }, [productId, productTitle, basePrice])

  const lineConfig = (): LineConfig | undefined => {
    const config: LineConfig = configurable && resolved ? toLineConfig(resolved) : {}
    if (edition && number !== undefined) config.number = number
    if (edition?.status === 'invite' && invite) config.invite = invite
    return Object.keys(config).length > 0 ? config : undefined
  }

  /** Edycja numerowana: jeden egzemplarz na kliknięcie i od razu do zamówienia — bez koszyka po drodze. */
  const reserve = () => {
    if (!photoVariant || !purchasable || !edition) return
    const variantName = configLine(resolved) || photoVariant.name
    add({
      productId: product.id,
      variantId: photoVariant.id,
      config: lineConfig(),
      title: product.title,
      variantName,
      edition: editionLineText(edition.size, number),
      slug: product.slug,
      unitPrice: price.current,
      imageUrl: photoVariant.thumbUrl,
    })
    trackAddToCart({ id: product.id, name: product.title, variant: variantName, price: price.current, quantity: 1 })
    router.push('/zamowienie')
  }

  const addToCart = () => {
    if (edition) return reserve()
    if (!photoVariant || !purchasable) return
    const variantName = configLine(resolved) || photoVariant.name
    add(
      {
        productId: product.id,
        variantId: photoVariant.id,
        config: lineConfig(),
        title: product.title,
        variantName,
        slug: product.slug,
        unitPrice: price.current,
        imageUrl: photoVariant.thumbUrl,
      },
      quantity,
    )
    trackAddToCart({ id: product.id, name: product.title, variant: variantName, price: price.current, quantity })
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

  const onSale = price.regular !== null

  const numberStep = (step: number | null) =>
    edition && (
      <Step number={step} title="Numer egzemplarza">
        <NumberPicker onChange={setNumber} size={edition.size} taken={edition.taken} value={number} />
      </Step>
    )

  const gatePanel = () => {
    if (!edition) return null
    if (editionGate === 'invite') return <InviteGate onUnlock={unlockInvite} productId={product.id} />
    const soldOut = editionGate === 'sold-out'
    return (
      <div className="rounded-[var(--radius-panel)] border border-line-strong p-6 md:p-7">
        <p className="eyebrow text-brass">{soldOut ? 'Nakład wyczerpany' : 'Zapowiedź'}</p>
        <p className="display-4 mt-3">
          {soldOut
            ? `Wszystkie ${edition.size} egzemplarzy mają już właścicieli.`
            : edition.releaseDate
              ? `Premiera ${releaseFormat.format(new Date(edition.releaseDate))}.`
              : 'Premiera wkrótce.'}
        </p>
        <p className="mt-2 max-w-[46ch] text-ink-soft">
          {noOrphans(
            soldOut
              ? 'Ten model nie wróci w tej edycji. Zostaw nam swoje dane — o kolejnej dowiesz się przed innymi.'
              : 'Osoby z listy oczekujących dostaną zaproszenie do przedsprzedaży, zanim model trafi do sklepu.',
          )}
        </p>
        <WaitlistForm
          className="mt-6"
          productId={product.id}
          submitLabel={soldOut ? 'Powiadom mnie o kolejnej edycji' : 'Zapisz mnie na listę'}
        />
      </div>
    )
  }

  return (
    <>
      <div className="shell grid gap-x-12 gap-y-8 pt-3 lg:grid-cols-12 lg:pt-4">
        <div className={cn('min-w-0 lg:col-span-7', configurable && 'lg:sticky lg:top-24 lg:self-start')}>
          {/* Zmiana koloru to inny zestaw zdjęć — galeria zaczyna wtedy od nowa, od pierwszego zdjęcia. */}
          <Gallery images={photoVariant?.images ?? []} key={photoVariant?.id ?? 'brak'} title={product.title} />
          {usesFabrics && resolved?.fabric && resolved.color && photoVariant && (
            <p className="mt-3 flex items-center gap-3 text-sm text-ink-soft">
              <FabricSwatch
                className="size-6 shrink-0 rounded-full"
                color={resolved.color.swatchColor}
                imageUrl={resolved.color.imageUrl}
                type={resolved.fabric.type}
              />
              <span>
                {showsOtherColor
                  ? noOrphans(`Na zdjęciach inny kolor tkaniny. Wybrany: ${resolved.fabric.name} ${resolved.color.name} — `)
                  : noOrphans('Kolor na zdjęciach jest zbliżony do wybranego. Dokładny odcień — ')}
                {product.samplesEnabled ? (
                  <Link className="link-line text-ink" href={`/tkaniny?probka=${resolved.fabric.id}-${resolved.color.id}`}>
                    {showsOtherColor ? 'zobacz go na próbce' : 'na bezpłatnej próbce'}
                  </Link>
                ) : showsOtherColor ? (
                  'odcień zobaczysz na próbce'
                ) : (
                  'na próbce'
                )}
                .
              </span>
            </p>
          )}
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className={cn(!configurable && 'lg:sticky lg:top-24')}>
            {breadcrumbs}
            {edition && (
              <p className="eyebrow mt-5 text-brass">
                {editionTitle(edition)} · Nakład {edition.size} egz.
              </p>
            )}
            {/* Bardzo długa nazwa dostaje mniejszy stopień pisma, żeby nie zajęła całego ekranu. */}
            <h1
              className={cn(
                edition ? 'display-2 mt-2.5' : 'display-2 mt-4',
                product.title.length > 56 ? 'text-[clamp(1.625rem,1.3rem+1.3vw,2.375rem)]' : 'text-[clamp(2rem,1.5rem+2vw,3.125rem)]',
              )}
            >
              {noOrphans(product.title)}
            </h1>
            {product.shortDescription && (
              <p className="mt-4 max-w-[46ch] text-[1.0625rem] text-ink-soft">{noOrphans(product.shortDescription)}</p>
            )}

            {configurable ? (
              <div className="tabular mt-7" data-price={price.current}>
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={cn('text-[1.75rem] leading-none font-medium tracking-tight', onSale && 'text-accent')}>
                    {onSale && <span className="sr-only">Cena promocyjna: </span>}
                    <AnimatedPrice value={price.current} />
                  </span>
                  {onSale && (
                    <>
                      <s className="text-lg text-ink-faint">
                        <span className="sr-only">Cena regularna: </span>
                        {formatPLN(price.regular ?? 0)}
                      </s>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
                        −{discountPercent(price.regular ?? 0, price.current)}%
                      </span>
                    </>
                  )}
                </p>
                {onSale && price.lowest30 !== null && (
                  <p className="mt-2 text-sm text-ink-soft">Najniższa cena z 30 dni przed obniżką: {formatPLN(price.lowest30)}</p>
                )}
                <p className="mt-1.5 text-sm text-ink-soft">
                  {[product.priceNote, 'cena za wybraną konfigurację'].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : (
              <Price className="mt-7" mode="full" note={product.priceNote} price={price} />
            )}

            {configurable && resolved ? (
              <Configurator
                basePrice={product.price.current}
                onChange={(patch) => setConfig((current) => ({ ...(resolved ? toLineConfig(resolved) : current), ...patch }))}
                options={options}
                resolved={resolved}
                samplesEnabled={product.samplesEnabled}
                extraStep={edition && edition.numberChoice && editionGate !== 'sold-out' && editionGate !== 'announced' ? (step) => numberStep(step) : undefined}
              />
            ) : (
              product.variants.length > 0 &&
              photoVariant && (
                <fieldset className="mt-8">
                  <legend className="text-sm text-ink-soft">
                    Kolor: <span className="font-medium text-ink">{photoVariant.name}</span>
                    {photoVariant.fabric ? ` · ${photoVariant.fabric}` : ''}
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {product.variants.map((item) => (
                      <label
                        className={cn('relative cursor-pointer', !item.available && 'cursor-not-allowed opacity-45')}
                        key={item.id}
                        title={item.available ? item.name : `${item.name} — niedostępny`}
                      >
                        <input
                          checked={item.id === photoVariant.id}
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
              )
            )}

            {!configurable && edition && edition.numberChoice && editionGate !== 'sold-out' && editionGate !== 'announced' && (
              <div className="mt-8">{numberStep(null)}</div>
            )}

            <p className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm', configurable || edition ? 'mt-8 border-t border-line pt-5' : 'mt-7')}>
              <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', dot)} />
              <span className="font-medium whitespace-nowrap">{product.availabilityLabel}</span>
              {product.leadTime && product.availability !== 'unavailable' && (
                <span className="text-ink-soft max-sm:basis-full max-sm:pl-[1.125rem]">{product.leadTime}</span>
              )}
            </p>

            {/* Na najwęższych telefonach przycisk przechodzi pod wybór ilości, zamiast wystawać poza ekran. */}
            <div className="mt-5 flex flex-wrap gap-3" ref={cta}>
              {edition && inStock && editionGate !== 'open' ? (
                <div className="w-full">{gatePanel()}</div>
              ) : edition && purchasable ? (
                <div className="grid w-full gap-3">
                  <button className={buttonClass({ size: 'lg', variant: 'brand', className: 'w-full' })} onClick={reserve} type="button">
                    <span className="inline-flex animate-[label-swap_260ms_var(--ease-out)_both] items-center gap-2" key={number ?? 'auto'}>
                      {number !== undefined ? `Zarezerwuj egzemplarz Nº ${padNumber(number, edition.size)}` : 'Zarezerwuj egzemplarz'}
                    </span>
                  </button>
                  <p className="text-center text-[0.8125rem] text-ink-soft">
                    {noOrphans('Po rezerwacji atelier skontaktuje się z Tobą osobiście, by potwierdzić wykonanie.')}
                  </p>
                </div>
              ) : purchasable ? (
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
                  <button className={buttonClass({ size: 'lg', className: 'flex-1 basis-44 px-5' })} onClick={addToCart} type="button">
                    {/* Zmiana napisu potwierdza dodanie; lekkie rozmycie łączy oba stany w jedno przejście. */}
                    <span
                      className="inline-flex animate-[label-swap_260ms_var(--ease-out)_both] items-center gap-2"
                      key={justAdded ? 'added' : 'idle'}
                    >
                      {justAdded ? (
                        <>
                          <Check aria-hidden="true" size={18} strokeWidth={2} />
                          Dodano
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
              <p className="tabular truncate text-sm text-ink-soft">
                {formatPLN(price.current)}
                {edition && number !== undefined ? ` · Nº ${padNumber(number, edition.size)}` : configurable && resolved?.size ? ` · ${resolved.size.label}` : ''}
              </p>
            </div>
            <button className={buttonClass({ size: 'md', variant: edition ? 'brand' : 'primary', className: 'shrink-0' })} onClick={addToCart} type="button">
              {edition ? 'Zarezerwuj' : 'Do koszyka'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
