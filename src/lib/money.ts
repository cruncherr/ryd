/**
 * Ceny w bazie są zapisane w złotych (np. 3990 albo 3990.5). Wszystkie obliczenia
 * robimy na groszach (liczby całkowite), żeby uniknąć błędów zaokrągleń.
 */

export function toGrosze(zloty: number): number {
  return Math.round(zloty * 100)
}

export function fromGrosze(grosze: number): number {
  return Math.round(grosze) / 100
}

/** Suma pozycji: cena jednostkowa × ilość, liczona na groszach. */
export function lineTotal(unitPrice: number, quantity: number): number {
  return fromGrosze(toGrosze(unitPrice) * quantity)
}

export function sum(values: number[]): number {
  return fromGrosze(values.reduce((acc, value) => acc + toGrosze(value), 0))
}

const NBSP = '\u00a0'

/**
 * „3 990 zł" dla pełnych złotych, „3 990,50 zł" gdy są grosze.
 * Formatowanie jest napisane ręcznie (bez Intl), żeby serwer i każda przeglądarka
 * dawały identyczny tekst — inaczej React zgłaszałby różnice przy hydracji.
 */
export function formatPLN(zloty: number): string {
  const grosze = toGrosze(zloty)
  const sign = grosze < 0 ? '−' : ''
  const absolute = Math.abs(grosze)
  const whole = Math.floor(absolute / 100)
  const rest = absolute % 100
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  const decimals = rest === 0 ? '' : `,${String(rest).padStart(2, '0')}`
  return `${sign}${grouped}${decimals}${NBSP}zł`
}

/** Cena, którą klient faktycznie płaci: promocyjna, jeśli jest ustawiona i niższa. */
export function effectivePrice(product: { price: number; salePrice?: number | null }): number {
  const { price, salePrice } = product
  if (typeof salePrice === 'number' && salePrice > 0 && salePrice < price) return salePrice
  return price
}

export function isOnSale(product: { price: number; salePrice?: number | null }): boolean {
  return effectivePrice(product) < product.price
}

/** Procent obniżki zaokrąglony do pełnych procentów (np. 15 dla −15%). */
export function discountPercent(regular: number, sale: number): number {
  if (regular <= 0 || sale >= regular) return 0
  return Math.round(((regular - sale) / regular) * 100)
}

/** Walidacja pól cenowych w panelu: liczba nieujemna, najwyżej dwa miejsca po przecinku. */
export function isValidAmount(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6
}
