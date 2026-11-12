import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/constants'

/**
 * Wpisane dane zamówienia są na bieżąco zapamiętywane w karcie przeglądarki. Klient może
 * wrócić do koszyka albo odświeżyć stronę i nie musi wpisywać wszystkiego od nowa.
 * Zapis znika po zamknięciu karty i po złożeniu zamówienia; zgody nigdy nie są zapamiętywane.
 */

export const TEXT_FIELDS = [
  'email',
  'phone',
  'firstName',
  'lastName',
  'street',
  'postalCode',
  'city',
  'companyName',
  'nip',
  'invoiceAddress',
  'note',
] as const

export type TextFieldName = (typeof TEXT_FIELDS)[number]

export type CheckoutDraft = Partial<Record<TextFieldName, string>> & {
  shippingMethodId?: number
  paymentMethod?: PaymentMethod
  wantsInvoice?: boolean
}

const DRAFT_KEY = 'ryd-zamowienie'
const PLACED_KEY = 'ryd-zamowiono'

export function readDraft(): CheckoutDraft {
  try {
    const stored = window.sessionStorage.getItem(DRAFT_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : null
    if (typeof parsed !== 'object' || parsed === null) return {}
    const source = parsed as Record<string, unknown>

    const draft: CheckoutDraft = {}
    for (const name of TEXT_FIELDS) {
      const value = source[name]
      if (typeof value === 'string') draft[name] = value.slice(0, 1200)
    }
    if (typeof source.shippingMethodId === 'number') draft.shippingMethodId = source.shippingMethodId
    const payment = PAYMENT_METHODS.find((method) => method.value === source.paymentMethod)
    if (payment) draft.paymentMethod = payment.value
    if (source.wantsInvoice === true) draft.wantsInvoice = true
    return draft
  } catch {
    return {}
  }
}

export function saveDraft(draft: CheckoutDraft): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Tryb prywatny albo pełna pamięć — formularz działa dalej, tylko bez zapamiętywania.
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // jw.
  }
}

/** Znacznik „właśnie złożono zamówienie” — strona potwierdzenia opróżnia po nim koszyk. */
export function markOrderPlaced(): void {
  try {
    window.sessionStorage.setItem(PLACED_KEY, '1')
  } catch {
    // jw.
  }
}

export function consumeOrderPlaced(): boolean {
  try {
    const placed = window.sessionStorage.getItem(PLACED_KEY) === '1'
    if (placed) window.sessionStorage.removeItem(PLACED_KEY)
    return placed
  } catch {
    return false
  }
}
