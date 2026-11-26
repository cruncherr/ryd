import { FABRIC_FEATURES, FABRIC_TYPES, labelOf, type FabricFeature, type FabricType, type Side } from '@/lib/constants'
import { fromGrosze, toGrosze } from '@/lib/money'
import type { Fabric, Media, Product } from '@/payload-types'

/**
 * Konfigurator mebla: wymiar, tkanina z kolorem, nóżki i strona szezlonga.
 * Te same funkcje liczą cenę w przeglądarce (na żywo, przy każdym kliknięciu) i na serwerze
 * (ostatecznie, przy zamówieniu) — dzięki temu klient zawsze widzi kwotę, którą zapłaci.
 */

/** Wybór klienta. Brak pola = wartość domyślna (np. wymiar z dopłatą 0). */
export type LineConfig = {
  size?: string
  fabric?: number
  color?: string
  legs?: string
  side?: Side
}

export type SizeOption = {
  id: string
  label: string
  priceDelta: number
  width: number
  depth: number
  height: number | null
  sleepWidth: number | null
  sleepLength: number | null
  bodyDepth: number | null
  chaiseWidth: number | null
}

export type FabricColorOption = {
  id: string
  name: string
  code: string | null
  swatchColor: string
  available: boolean
  imageUrl: string | null
}

export type FabricOption = {
  id: number
  name: string
  type: FabricType
  typeLabel: string
  surchargePercent: number
  description: string | null
  features: Array<{ value: FabricFeature; label: string }>
  composition: string | null
  martindale: number | null
  colors: FabricColorOption[]
}

export type LegOption = {
  id: string
  name: string
  swatchColor: string
  priceDelta: number
}

export type ConfigOptions = {
  sizes: SizeOption[]
  fabrics: FabricOption[]
  legs: LegOption[]
  sideChoice: boolean
  defaultSide: Side
}

const asNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null)

const mediaUrl = (value: number | Media | null | undefined): string | null =>
  value && typeof value === 'object' ? (value.sizes?.thumbnail?.url ?? value.url ?? null) : null

export function fabricOption(fabric: Fabric): FabricOption {
  return {
    id: fabric.id,
    name: fabric.name,
    type: fabric.type,
    typeLabel: labelOf(FABRIC_TYPES, fabric.type),
    surchargePercent: Math.max(0, Math.min(100, fabric.surchargePercent ?? 0)),
    description: fabric.description?.trim() || null,
    features: (fabric.features ?? []).map((value) => ({ value, label: labelOf(FABRIC_FEATURES, value) })),
    composition: fabric.composition?.trim() || null,
    martindale: asNumber(fabric.martindale),
    colors: (fabric.colors ?? []).map((color, index) => ({
      id: color.id ?? String(index),
      name: color.name,
      code: color.code?.trim() || null,
      swatchColor: color.swatchColor,
      available: color.available !== false,
      imageUrl: mediaUrl(color.image),
    })),
  }
}

/** Opcje konfiguratora zapisane w produkcie (zakładka „Konfiguracja” w panelu). */
export function configOptions(product: Product): ConfigOptions {
  const fabrics = (product.fabrics ?? [])
    .filter((fabric): fabric is Fabric => typeof fabric === 'object' && fabric !== null && fabric.active !== false)
    .map(fabricOption)
    .filter((fabric) => fabric.colors.some((color) => color.available))

  return {
    sizes: (product.sizes ?? []).flatMap((size, index) => {
      const width = asNumber(size.width)
      const depth = asNumber(size.depth)
      if (!size.label || !width || !depth) return []
      return [
        {
          id: size.id ?? String(index),
          label: size.label,
          priceDelta: typeof size.priceDelta === 'number' ? size.priceDelta : 0,
          width,
          depth,
          height: asNumber(size.height),
          sleepWidth: asNumber(size.sleepWidth),
          sleepLength: asNumber(size.sleepLength),
          bodyDepth: asNumber(size.bodyDepth),
          chaiseWidth: asNumber(size.chaiseWidth),
        },
      ]
    }),
    fabrics,
    legs: (product.legs ?? []).map((leg, index) => ({
      id: leg.id ?? String(index),
      name: leg.name,
      swatchColor: leg.swatchColor,
      priceDelta: typeof leg.priceDelta === 'number' ? leg.priceDelta : 0,
    })),
    sideChoice: Boolean(product.sideChoice),
    defaultSide: product.defaultSide === 'left' ? 'left' : 'right',
  }
}

export function hasConfigurator(options: ConfigOptions): boolean {
  return options.sizes.length > 1 || options.fabrics.length > 0 || options.legs.length > 1 || options.sideChoice
}

export type ResolvedConfig = {
  size: SizeOption | null
  fabric: FabricOption | null
  color: FabricColorOption | null
  legs: LegOption | null
  side: Side | null
}

const defaultSize = (sizes: SizeOption[]): SizeOption | null => sizes.find((size) => size.priceDelta === 0) ?? sizes[0] ?? null

const firstAvailableColor = (fabric: FabricOption): FabricColorOption | null =>
  fabric.colors.find((color) => color.available) ?? null

/**
 * Zamienia wybór klienta na konkretne opcje. Brakujące pola dostają wartości domyślne,
 * a wskazanie czegoś, czego już nie ma (np. wycofanego koloru), daje `null` — taka pozycja
 * nie może trafić do zamówienia, bo klient zamawiałby coś innego, niż wybrał.
 */
export function resolveConfig(options: ConfigOptions, config: LineConfig | undefined): ResolvedConfig | null {
  const chosen = config ?? {}

  let size: SizeOption | null = null
  if (options.sizes.length > 0) {
    size = chosen.size ? (options.sizes.find((item) => item.id === chosen.size) ?? null) : defaultSize(options.sizes)
    if (!size) return null
  }

  let fabric: FabricOption | null = null
  let color: FabricColorOption | null = null
  if (options.fabrics.length > 0) {
    fabric = chosen.fabric !== undefined ? (options.fabrics.find((item) => item.id === chosen.fabric) ?? null) : (options.fabrics[0] ?? null)
    if (!fabric) return null
    color = chosen.color ? (fabric.colors.find((item) => item.id === chosen.color) ?? null) : firstAvailableColor(fabric)
    if (!color || !color.available) return null
  }

  let legs: LegOption | null = null
  if (options.legs.length > 0) {
    legs = chosen.legs ? (options.legs.find((item) => item.id === chosen.legs) ?? null) : (options.legs[0] ?? null)
    if (!legs) return null
  }

  let side: Side | null = null
  if (options.sideChoice) {
    side = chosen.side === 'left' || chosen.side === 'right' ? chosen.side : options.defaultSide
  }

  return { size, fabric, color, legs, side }
}

/** Wybór zapisany w koszyku — zawsze kompletny, żeby ta sama konfiguracja miała ten sam zapis. */
export function toLineConfig(resolved: ResolvedConfig): LineConfig {
  const config: LineConfig = {}
  if (resolved.size) config.size = resolved.size.id
  if (resolved.fabric) config.fabric = resolved.fabric.id
  if (resolved.color) config.color = resolved.color.id
  if (resolved.legs) config.legs = resolved.legs.id
  if (resolved.side) config.side = resolved.side
  return config
}

/** Krótki, stały zapis konfiguracji — rozróżnia pozycje koszyka z tym samym produktem. */
export function configKey(config: LineConfig | undefined): string {
  if (!config) return ''
  return [
    config.size ? `s=${config.size}` : '',
    config.fabric !== undefined ? `f=${config.fabric}` : '',
    config.color ? `c=${config.color}` : '',
    config.legs ? `l=${config.legs}` : '',
    config.side ? `d=${config.side}` : '',
  ]
    .filter(Boolean)
    .join('|')
}

export function lineKey(productId: number, variantId: string, config: LineConfig | undefined): string {
  return `${productId}:${variantId}:${configKey(config)}`
}

/** Dopłata za tkaninę w złotych — procent od ceny mebla w wybranym wymiarze, zaokrąglony do pełnych złotych. */
export function fabricSurcharge(priceForSize: number, surchargePercent: number): number {
  if (surchargePercent <= 0) return 0
  return Math.round((priceForSize * surchargePercent) / 100)
}

/**
 * Cena mebla w danej konfiguracji: cena podstawowa (regularna albo promocyjna) + dopłata za wymiar,
 * + procent za tkaninę liczony od ceny wymiaru, + dopłata za nóżki.
 */
export function configuredPrice(base: number, resolved: ResolvedConfig | null): number {
  if (!resolved) return base
  const forSize = fromGrosze(toGrosze(base) + toGrosze(resolved.size?.priceDelta ?? 0))
  const surcharge = fabricSurcharge(forSize, resolved.fabric?.surchargePercent ?? 0)
  return fromGrosze(toGrosze(forSize) + toGrosze(surcharge) + toGrosze(resolved.legs?.priceDelta ?? 0))
}

/** Najniższa możliwa cena modelu — do napisu „od … zł” na liście produktów. */
export function lowestConfiguredPrice(base: number, options: ConfigOptions): number {
  const minSizeDelta = options.sizes.length > 0 ? Math.min(...options.sizes.map((size) => size.priceDelta)) : 0
  const minPercent = options.fabrics.length > 0 ? Math.min(...options.fabrics.map((fabric) => fabric.surchargePercent)) : 0
  const minLegs = options.legs.length > 0 ? Math.min(...options.legs.map((leg) => leg.priceDelta)) : 0
  const forSize = fromGrosze(toGrosze(base) + toGrosze(minSizeDelta))
  return fromGrosze(toGrosze(forSize) + toGrosze(fabricSurcharge(forSize, minPercent)) + toGrosze(minLegs))
}

/** Czy cena modelu zależy od wyboru klienta (wtedy na liście pokazujemy „od … zł”). */
export function priceVaries(options: ConfigOptions): boolean {
  return (
    new Set(options.sizes.map((size) => size.priceDelta)).size > 1 ||
    new Set(options.fabrics.map((fabric) => fabric.surchargePercent)).size > 1 ||
    new Set(options.legs.map((leg) => leg.priceDelta)).size > 1
  )
}

const cmText = (value: number) => String(value).replace('.', ',')

export function sizeText(size: Pick<SizeOption, 'width' | 'depth'>): string {
  return `${cmText(size.width)} × ${cmText(size.depth)} cm`
}

export const sideText = (side: Side): string => (side === 'left' ? 'po lewej stronie' : 'po prawej stronie')

/** Opis konfiguracji do koszyka, zamówienia, e-maili i panelu. */
export function configSummary(resolved: ResolvedConfig | null): Array<{ label: string; value: string }> {
  if (!resolved) return []
  const rows: Array<{ label: string; value: string }> = []
  if (resolved.size) rows.push({ label: 'Wymiar', value: `${resolved.size.label}, ${sizeText(resolved.size)}` })
  if (resolved.fabric) rows.push({ label: 'Tkanina', value: `${resolved.fabric.name} (${resolved.fabric.typeLabel.toLowerCase()})` })
  if (resolved.color) rows.push({ label: 'Kolor', value: [resolved.color.name, resolved.color.code].filter(Boolean).join(' ') })
  if (resolved.legs) rows.push({ label: 'Nóżki', value: resolved.legs.name })
  if (resolved.side) rows.push({ label: 'Szezlong', value: sideText(resolved.side) })
  return rows
}

/** Jedna linijka pod nazwą produktu w koszyku: „3-osobowa · Welur hydrofobowy, Grafit · nóżki: Czarny metal”. */
export function configLine(resolved: ResolvedConfig | null): string {
  if (!resolved) return ''
  return [
    resolved.size ? `${resolved.size.label} (${sizeText(resolved.size)})` : '',
    resolved.fabric && resolved.color ? `${resolved.fabric.name}, ${[resolved.color.name, resolved.color.code].filter(Boolean).join(' ')}` : '',
    resolved.legs ? `nóżki: ${resolved.legs.name.toLowerCase()}` : '',
    resolved.side ? `szezlong ${sideText(resolved.side).replace(' stronie', '')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

const normalize = (value: string) => value.trim().toLocaleLowerCase('pl')

/**
 * Zdjęcia mebla w wybranym kolorze: wariant z zakładki „Zdjęcia i kolory”, który wskazuje tę tkaninę
 * i ma tę samą nazwę koloru. Gdy takich zdjęć nie ma, sklep pokazuje zdjęcia domyślne z dopiskiem.
 */
export function matchingVariantIndex(
  variants: Array<{ fabricLinkId: number | null; name: string }>,
  fabricId: number | null | undefined,
  colorName: string | null | undefined,
): number {
  if (fabricId === null || fabricId === undefined || !colorName) return -1
  return variants.findIndex((variant) => variant.fabricLinkId === fabricId && normalize(variant.name) === normalize(colorName))
}
