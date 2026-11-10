/**
 * Słowniki używane jednocześnie w panelu administracyjnym, w sklepie i w e-mailach.
 * Jedno źródło prawdy dla nazw statusów widocznych po polsku.
 */

export const AVAILABILITY = [
  { value: 'in_stock', label: 'Dostępny od ręki' },
  { value: 'made_to_order', label: 'Na zamówienie' },
  { value: 'unavailable', label: 'Chwilowo niedostępny' },
] as const

export type Availability = (typeof AVAILABILITY)[number]['value']

export const ORDER_STATUSES = [
  { value: 'new', label: 'Nowe' },
  { value: 'confirmed', label: 'Potwierdzone' },
  { value: 'in_production', label: 'W realizacji' },
  { value: 'shipped', label: 'Wysłane' },
  { value: 'completed', label: 'Zrealizowane' },
  { value: 'cancelled', label: 'Anulowane' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Oczekuje na płatność' },
  { value: 'paid', label: 'Opłacone' },
  { value: 'on_delivery', label: 'Płatność przy odbiorze' },
  { value: 'failed', label: 'Płatność nieudana' },
  { value: 'refunded', label: 'Zwrócone' },
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]['value']

export const PAYMENT_METHODS = [
  { value: 'online', label: 'Płatność online (BLIK, szybki przelew, karta)' },
  { value: 'transfer', label: 'Przelew tradycyjny' },
  { value: 'cod', label: 'Płatność przy odbiorze' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export function labelOf<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | null | undefined,
): string {
  return options.find((option) => option.value === value)?.label ?? ''
}

/** Adresy stron prawnych, do których odwołuje się formularz zamówienia i stopka. */
export const LEGAL_SLUGS = {
  terms: 'regulamin',
  privacy: 'polityka-prywatnosci',
  returns: 'zwroty-i-reklamacje',
  delivery: 'dostawa-i-platnosci',
} as const

/** Ograniczenia koszyka chroniące przed pomyłkami i nadużyciami. */
export const CART_LIMITS = {
  maxQuantityPerLine: 10,
  maxLines: 20,
} as const
