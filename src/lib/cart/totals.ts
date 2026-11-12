import type { PaymentMethod } from '@/lib/constants'
import { sum } from '@/lib/money'
import type { Setting } from '@/payload-types'

/**
 * Rachunki wspólne dla przeglądarki i serwera: koszt dostawy i suma zamówienia.
 * Przeglądarka liczy nimi podsumowanie na żywo, serwer — ostateczną kwotę przy zapisie.
 */

/** Koszt dostawy z uwzględnieniem progu darmowej dostawy. */
export function shippingCostFor(method: { price: number; freeFrom?: number | null }, subtotal: number): number {
  if (typeof method.freeFrom === 'number' && method.freeFrom > 0 && subtotal >= method.freeFrom) return 0
  return method.price
}

export type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  fee: number
}

export function orderTotal(parts: { subtotal: number; shippingCost: number; paymentFee: number }): number {
  return sum([parts.subtotal, parts.shippingCost, parts.paymentFee])
}

/**
 * Formy płatności dostępne w zamówieniu — według ustawień sklepu.
 * Płatność online pojawia się tylko wtedy, gdy podłączono operatora płatności.
 */
export function paymentOptions(settings: Setting, onlineConfigured: boolean): PaymentOption[] {
  const payments = settings.payments
  const options: PaymentOption[] = []

  if (payments?.onlineEnabled && onlineConfigured) {
    options.push({
      value: 'online',
      label: 'Płatność online',
      description: 'BLIK, szybki przelew lub karta. Po złożeniu zamówienia przejdziesz na bezpieczną stronę płatności.',
      fee: 0,
    })
  }
  if (payments?.transferEnabled) {
    options.push({
      value: 'transfer',
      label: 'Przelew tradycyjny',
      description: 'Dane do przelewu otrzymasz na stronie potwierdzenia i w wiadomości e-mail.',
      fee: 0,
    })
  }
  if (payments?.codEnabled) {
    options.push({
      value: 'cod',
      label: 'Płatność przy odbiorze',
      description: 'Płacisz kurierowi przy dostawie.',
      fee: payments.codFee ?? 0,
    })
  }
  return options
}
