import { paymentOptions } from '@/lib/cart/pricing'
import { isOnlinePaymentConfigured } from '@/lib/launch'
import type { Setting, ShippingMethod } from '@/payload-types'

const SHORT_LABELS = {
  online: 'BLIK, szybki przelew, karta',
  transfer: 'przelew tradycyjny',
  cod: 'płatność przy odbiorze',
} as const

/**
 * Krótkie nazwy form płatności, które klient faktycznie zobaczy w zamówieniu — do stopki
 * i strony produktu. Płatność online pojawia się tu dopiero po podłączeniu operatora.
 */
export function paymentSummary(settings: Setting, shippingMethods?: Array<Pick<ShippingMethod, 'allowCod'>>): string[] {
  // Płatność przy odbiorze ma sens tylko wtedy, gdy pozwala na nią choć jeden sposób dostawy.
  const codPossible = shippingMethods ? shippingMethods.some((method) => Boolean(method.allowCod)) : true
  return paymentOptions(settings, isOnlinePaymentConfigured())
    .filter((option) => option.value !== 'cod' || codPossible)
    .map((option) => SHORT_LABELS[option.value])
}
