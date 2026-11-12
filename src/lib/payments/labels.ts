import { paymentOptions } from '@/lib/cart/pricing'
import { isOnlinePaymentConfigured } from '@/lib/launch'
import type { Setting } from '@/payload-types'

const SHORT_LABELS = {
  online: 'BLIK, szybki przelew, karta',
  transfer: 'przelew tradycyjny',
  cod: 'płatność przy odbiorze',
} as const

/**
 * Krótkie nazwy form płatności, które klient faktycznie zobaczy w zamówieniu — do stopki
 * i strony produktu. Płatność online pojawia się tu dopiero po podłączeniu operatora.
 */
export function paymentSummary(settings: Setting): string[] {
  return paymentOptions(settings, isOnlinePaymentConfigured()).map((option) => SHORT_LABELS[option.value])
}
