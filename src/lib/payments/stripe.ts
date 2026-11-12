import type { Payload } from 'payload'
import Stripe from 'stripe'

import { toGrosze } from '@/lib/money'
import { shippingLabel } from '@/lib/orders/view'
import type { Order } from '@/payload-types'

/**
 * Płatności online przez Stripe (BLIK, Przelewy24, karty — według ustawień konta Stripe).
 * Klient płaci na stronie operatora, sklep nigdy nie widzi danych karty.
 * Całość jest uśpiona, dopóki w ustawieniach hostingu nie pojawią się klucze STRIPE_*.
 */

let client: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Brak klucza STRIPE_SECRET_KEY')
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 })
  return client
}

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

type LineItem = {
  quantity: number
  price_data: { currency: 'pln'; unit_amount: number; product_data: { name: string } }
}

/** Pozycje widoczne na stronie płatności. Ich suma zawsze równa się kwocie zamówienia. */
export function paymentLineItems(
  order: Pick<Order, 'items' | 'shippingCost' | 'shippingMethodName' | 'paymentFee' | 'total' | 'orderNumber'>,
): LineItem[] {
  const line = (name: string, amount: number, quantity = 1): LineItem => ({
    quantity,
    price_data: { currency: 'pln', unit_amount: toGrosze(amount), product_data: { name: truncate(name, 120) } },
  })

  const items = order.items.map((item) => line([item.title, item.variantName].filter(Boolean).join(' — '), item.unitPrice, item.quantity))
  if (order.shippingCost > 0) items.push(line(shippingLabel(order.shippingMethodName), order.shippingCost))
  if (order.paymentFee && order.paymentFee > 0) items.push(line('Opłata za sposób płatności', order.paymentFee))

  const itemized = items.reduce((total, item) => total + item.price_data.unit_amount * item.quantity, 0)
  // Zabezpieczenie: gdyby rozbicie na pozycje różniło się od sumy zamówienia, pobieramy jedną kwotę łączną.
  if (itemized !== toGrosze(order.total)) return [line(`Zamówienie ${order.orderNumber}`, order.total)]
  return items
}

export async function createPaymentSession(order: Order, siteUrl: string): Promise<{ id: string; url: string }> {
  if (!order.accessToken) throw new Error(`Zamówienie ${order.orderNumber} nie ma klucza dostępu`)
  const returnUrl = `${siteUrl}/zamowienie/potwierdzenie/${order.accessToken}`
  const metadata = { orderId: String(order.id), orderNumber: order.orderNumber }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'pl',
    customer_email: order.email,
    client_reference_id: String(order.id),
    line_items: paymentLineItems(order),
    metadata,
    payment_intent_data: { description: `Zamówienie ${order.orderNumber}`, metadata },
    success_url: `${returnUrl}?platnosc=ok`,
    cancel_url: `${returnUrl}?platnosc=anulowana`,
  })

  if (!session.url) throw new Error('Operator płatności nie zwrócił adresu strony płatności')
  return { id: session.id, url: session.url }
}

export type SettleResult = 'paid' | 'pending' | 'ignored'

function orderIdOf(session: Stripe.Checkout.Session): number | null {
  const candidate = Number(session.metadata?.orderId ?? session.client_reference_id)
  return Number.isInteger(candidate) && candidate > 0 ? candidate : null
}

/**
 * Oznacza zamówienie jako opłacone na podstawie sesji płatności potwierdzonej przez Stripe.
 * Zanim to zrobi, porównuje kwotę i walutę z zamówieniem. Wielokrotne wywołanie jest bezpieczne.
 */
export async function settleOrderFromSession(payload: Payload, session: Stripe.Checkout.Session): Promise<SettleResult> {
  const orderId = orderIdOf(session)
  if (orderId === null) return 'ignored'

  let order: Order
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
  } catch {
    payload.logger.error(`Płatność ${session.id} wskazuje na nieistniejące zamówienie ${orderId}`)
    return 'ignored'
  }

  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return 'pending'
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return 'paid'

  const amountMatches = session.amount_total === toGrosze(order.total) && session.currency?.toLowerCase() === 'pln'
  if (!amountMatches) {
    const note = `Uwaga: płatność ${session.id} opiewa na ${(session.amount_total ?? 0) / 100} ${session.currency?.toUpperCase() ?? ''}, a zamówienie na ${order.total} PLN. Sprawdź w panelu Stripe.`
    payload.logger.error(note)
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { internalNote: [order.internalNote, note].filter(Boolean).join('\n') },
      context: { skipNotify: true },
    })
    return 'ignored'
  }

  const cancelledNote =
    order.status === 'cancelled'
      ? `Uwaga: wpłynęła płatność online (${session.id}) za zamówienie, które jest anulowane — zwróć środki w panelu Stripe albo wznów zamówienie.`
      : null

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentStatus: 'paid',
      stripeSessionId: session.id,
      ...(cancelledNote ? { internalNote: [order.internalNote, cancelledNote].filter(Boolean).join('\n') } : {}),
    },
  })
  return 'paid'
}

/** Nieudana płatność odroczona (np. odrzucony przelew) — zamówienie czeka na ponowną próbę. */
export async function markPaymentFailed(payload: Payload, session: Stripe.Checkout.Session): Promise<void> {
  const orderId = orderIdOf(session)
  if (orderId === null) return
  try {
    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    if (order.paymentStatus !== 'pending') return
    await payload.update({ collection: 'orders', id: order.id, data: { paymentStatus: 'failed' } })
  } catch (error) {
    payload.logger.error({ err: error }, `Nie udało się oznaczyć nieudanej płatności ${session.id}`)
  }
}

/**
 * Sprawdza u operatora stan ostatniej płatności zamówienia. Używane po powrocie klienta
 * ze strony płatności — dzięki temu status „Opłacone” pojawia się od razu,
 * nawet zanim dotrze powiadomienie od Stripe.
 */
export async function refreshPaymentStatus(payload: Payload, order: Order): Promise<SettleResult> {
  if (!order.stripeSessionId) return 'pending'
  try {
    const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId)
    return await settleOrderFromSession(payload, session)
  } catch (error) {
    payload.logger.error({ err: error }, `Nie udało się sprawdzić płatności zamówienia ${order.orderNumber}`)
    return 'pending'
  }
}
