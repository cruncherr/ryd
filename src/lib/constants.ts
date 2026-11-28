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

/** Rodzaje tkanin w próbniku — od nich zależy też faktura próbki rysowanej w sklepie. */
export const FABRIC_TYPES = [
  { value: 'velvet', label: 'Welur' },
  { value: 'boucle', label: 'Bouclé' },
  { value: 'chenille', label: 'Szenil' },
  { value: 'corduroy', label: 'Sztruks' },
  { value: 'weave', label: 'Plecionka' },
  { value: 'leather', label: 'Skóra ekologiczna' },
] as const

export type FabricType = (typeof FABRIC_TYPES)[number]['value']

/** Właściwości tkaniny pokazywane klientowi jako krótkie etykiety. */
export const FABRIC_FEATURES = [
  { value: 'easy_clean', label: 'Łatwe czyszczenie wodą' },
  { value: 'water_repellent', label: 'Odporna na płyny' },
  { value: 'pet_friendly', label: 'Odporna na pazurki' },
  { value: 'durable', label: 'Bardzo odporna na ścieranie' },
  { value: 'soft', label: 'Wyjątkowo miękka' },
  { value: 'fire_retardant', label: 'Trudnozapalna' },
  { value: 'oeko_tex', label: 'Certyfikat OEKO-TEX' },
  { value: 'recycled', label: 'Z recyklingu' },
] as const

export type FabricFeature = (typeof FABRIC_FEATURES)[number]['value']

/** Strona szezlonga lub narożnika — tak, jak widzi ją osoba stojąca przed meblem. */
export const SIDES = [
  { value: 'left', label: 'Lewa' },
  { value: 'right', label: 'Prawa' },
] as const

export type Side = (typeof SIDES)[number]['value']

/**
 * Stan sprzedaży edycji. Wyczerpanie nakładu nie jest osobnym stanem — sklep wylicza je sam
 * z rejestru egzemplarzy, więc nie da się sprzedać więcej sztuk, niż wynosi nakład.
 */
export const EDITION_STATUSES = [
  { value: 'open', label: 'Sprzedaż otwarta' },
  { value: 'invite', label: 'Przedsprzedaż na zaproszenie' },
  { value: 'announced', label: 'Zapowiedź — tylko lista oczekujących' },
] as const

export type EditionStatus = (typeof EDITION_STATUSES)[number]['value']

/** Największy nakład, jaki da się ustawić — wybór numeru w sklepie musi mieścić się na ekranie. */
export const MAX_EDITION_SIZE = 300
