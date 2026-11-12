import { getPayloadClient } from '@/lib/payload'
import { getStripe, markPaymentFailed, settleOrderFromSession } from '@/lib/payments/stripe'

/**
 * Adres, na który Stripe zgłasza wynik płatności (tzw. webhook):
 *   https://adres-sklepu/platnosc/stripe/webhook
 * Każde zgłoszenie jest podpisane — bez poprawnego podpisu (klucz STRIPE_WEBHOOK_SECRET)
 * sklep je odrzuca, więc nikt z zewnątrz nie oznaczy zamówienia jako opłaconego.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret || !process.env.STRIPE_SECRET_KEY) return new Response('Płatności online nie są skonfigurowane', { status: 503 })
  if (!signature) return new Response('Brak podpisu', { status: 400 })

  const stripe = getStripe()
  const body = await request.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret)
  } catch {
    return new Response('Nieprawidłowy podpis', { status: 400 })
  }

  const payload = await getPayloadClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await settleOrderFromSession(payload, event.data.object)
        break
      case 'checkout.session.async_payment_failed':
        await markPaymentFailed(payload, event.data.object)
        break
      default:
        break
    }
  } catch (error) {
    payload.logger.error({ err: error }, `Błąd obsługi zgłoszenia Stripe ${event.id} (${event.type})`)
    // Odpowiedź 500 sprawia, że Stripe ponowi zgłoszenie później.
    return new Response('Błąd serwera', { status: 500 })
  }

  return Response.json({ received: true })
}
