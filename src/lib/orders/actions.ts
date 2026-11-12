'use server'

import { randomBytes } from 'crypto'

import { runAfterResponse } from '@/lib/afterResponse'
import { orderTotal, parseCartInput, paymentOptions, priceCart, shippingCostFor, toCartLines } from '@/lib/cart/pricing'
import { sendOrderPlacedEmails } from '@/lib/email/send'
import { isOnlinePaymentConfigured } from '@/lib/launch'
import { toGrosze } from '@/lib/money'
import { createPaymentSession } from '@/lib/payments/stripe'
import { getPayloadClient } from '@/lib/payload'
import { getSettings, getShippingMethods } from '@/lib/queries'
import { clientFingerprint, rateLimit } from '@/lib/rateLimit'
import { getSiteUrl } from '@/lib/site'
import { validateCheckout } from '@/lib/validation'

import { findOrderByToken } from './find'
import { formatOrderNumber, nextOrderSequence } from './number'
import type { PlaceOrderResult, StartPaymentResult } from './types'
import { canPayOnline } from './view'

const GENERIC_ERROR =
  'Coś poszło nie tak po naszej stronie i zamówienie nie zostało złożone. Spróbuj ponownie za chwilę, a jeśli problem się powtórzy — napisz lub zadzwoń do nas.'

const TEN_MINUTES = 10 * 60_000
const ONE_HOUR = 60 * 60_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const confirmationPath = (token: string): string => `/zamowienie/potwierdzenie/${token}`

/**
 * Przyjmuje zamówienie. Przeglądarka przysyła tylko dane klienta oraz identyfikatory i ilości
 * produktów — wszystkie kwoty serwer liczy sam, z aktualnych cen w bazie. Jeśli wynik różni się
 * od sumy, którą klient widział na ekranie, zamówienie nie powstaje i klient dostaje do
 * potwierdzenia nowe podsumowanie.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const payload = await getPayloadClient()

  try {
    const body = isRecord(input) ? input : {}

    // Pole-pułapka: człowiek go nie widzi, automat wypełnia.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return { ok: false, message: GENERIC_ERROR }
    }

    const { values, errors } = validateCheckout(body.form)
    if (Object.keys(errors).length > 0 || values.shippingMethodId === null || values.paymentMethod === null) {
      return { ok: false, message: 'Sprawdź zaznaczone pola i spróbuj ponownie.', fieldErrors: errors }
    }

    const cartInput = parseCartInput(body.cart)
    if (cartInput.length === 0) {
      return { ok: false, reason: 'empty-cart', cart: [], message: 'Twój koszyk jest pusty — dodaj produkt, aby złożyć zamówienie.' }
    }

    // Ponowione zgłoszenie tej samej próby (np. po zerwanym połączeniu) prowadzi do już zapisanego zamówienia.
    const requestId = typeof body.requestId === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(body.requestId) ? body.requestId : null
    if (requestId) {
      const existing = await payload.find({
        collection: 'orders',
        depth: 0,
        limit: 1,
        pagination: false,
        where: { requestId: { equals: requestId } },
      })
      const previous = existing.docs[0]
      if (previous?.accessToken) return { ok: true, redirectTo: confirmationPath(previous.accessToken), external: false }
    }

    const [priced, settings, shippingMethods] = await Promise.all([priceCart(cartInput), getSettings(), getShippingMethods()])
    const freshCart = toCartLines(priced)

    if (priced.hasUnavailable) {
      return {
        ok: false,
        reason: 'cart-changed',
        cart: freshCart,
        message: 'Część produktów z koszyka nie jest już dostępna. Usuń je z koszyka, aby złożyć zamówienie.',
      }
    }
    if (priced.lines.length === 0 || priced.subtotal <= 0) {
      return { ok: false, reason: 'empty-cart', cart: freshCart, message: 'Twój koszyk jest pusty — dodaj produkt, aby złożyć zamówienie.' }
    }

    const shippingMethod = shippingMethods.find((method) => method.id === values.shippingMethodId)
    if (!shippingMethod) {
      return {
        ok: false,
        reason: 'cart-changed',
        message: 'Wybrany sposób dostawy nie jest już dostępny. Wybierz inny.',
        fieldErrors: { shippingMethodId: 'Ten sposób dostawy nie jest już dostępny. Wybierz inny.' },
      }
    }

    const payment = paymentOptions(settings, isOnlinePaymentConfigured())
      .filter((option) => option.value !== 'cod' || Boolean(shippingMethod.allowCod))
      .find((option) => option.value === values.paymentMethod)
    if (!payment) {
      return {
        ok: false,
        reason: 'cart-changed',
        message: 'Wybrana forma płatności nie jest dostępna dla tej dostawy. Wybierz inną.',
        fieldErrors: { paymentMethod: 'Ta forma płatności nie jest dostępna dla wybranej dostawy. Wybierz inną.' },
      }
    }

    const shippingCost = shippingCostFor(shippingMethod, priced.subtotal)
    const paymentFee = payment.fee
    const total = orderTotal({ subtotal: priced.subtotal, shippingCost, paymentFee })

    // Klient zobowiązuje się do zapłaty konkretnej kwoty — musi to być ta sama, którą widział.
    const expectedTotal = Number(body.expectedTotal)
    if (!Number.isFinite(expectedTotal) || toGrosze(expectedTotal) !== toGrosze(total)) {
      return {
        ok: false,
        reason: 'cart-changed',
        cart: freshCart,
        message:
          'Ceny lub koszt dostawy zmieniły się od chwili otwarcia strony. Sprawdź nowe podsumowanie i potwierdź zamówienie jeszcze raz.',
      }
    }

    // Ograniczenia chroniące przed automatami: sklep nie może służyć do zasypywania kogoś e-mailami.
    const fingerprint = await clientFingerprint()
    if (!rateLimit(`order:${fingerprint}`, 5, TEN_MINUTES)) {
      return { ok: false, message: 'Zbyt wiele zamówień w krótkim czasie. Odczekaj kilka minut i spróbuj ponownie albo skontaktuj się z nami.' }
    }
    const recentForEmail = await payload.count({
      collection: 'orders',
      where: {
        and: [{ email: { equals: values.email } }, { createdAt: { greater_than: new Date(Date.now() - ONE_HOUR).toISOString() } }],
      },
    })
    if (recentForEmail.totalDocs >= 5) {
      return {
        ok: false,
        message: 'Na ten adres e-mail złożono w ostatniej godzinie kilka zamówień. Sprawdź skrzynkę — potwierdzenia powinny już tam być — albo skontaktuj się z nami.',
      }
    }

    const sequence = await nextOrderSequence(payload)
    const accessToken = randomBytes(24).toString('base64url')

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: formatOrderNumber(settings.orders?.prefix, sequence),
        status: 'new',
        paymentStatus: payment.value === 'cod' ? 'on_delivery' : 'pending',
        items: priced.lines.map((line) => ({
          title: line.title,
          variantName: line.variantName,
          sku: line.sku,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          product: line.productId,
          image: line.imageId,
        })),
        subtotal: priced.subtotal,
        shippingCost,
        paymentFee,
        total,
        paymentMethod: payment.value,
        shippingMethodName: shippingMethod.name,
        shippingMethod: shippingMethod.id,
        customerNote: values.note || null,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        shippingAddress: { street: values.street, postalCode: values.postalCode, city: values.city },
        invoice: {
          wanted: values.wantsInvoice,
          companyName: values.wantsInvoice ? values.companyName : null,
          nip: values.wantsInvoice ? values.nip : null,
          address: values.wantsInvoice && values.invoiceAddress ? values.invoiceAddress : null,
        },
        isTest: settings.storeStatus !== 'live',
        termsAcceptedAt: new Date().toISOString(),
        accessToken,
        requestId,
      },
    })

    runAfterResponse(payload, () => sendOrderPlacedEmails(payload, order.id))

    if (payment.value === 'online') {
      try {
        const session = await createPaymentSession(order, getSiteUrl())
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: { stripeSessionId: session.id },
          context: { skipNotify: true },
        })
        return { ok: true, redirectTo: session.url, external: true }
      } catch (error) {
        // Zamówienie jest zapisane; klient zapłaci ze strony zamówienia, gdy operator znów odpowie.
        payload.logger.error({ err: error }, `Nie udało się rozpocząć płatności online za zamówienie ${order.orderNumber}`)
        return { ok: true, redirectTo: `${confirmationPath(accessToken)}?platnosc=blad`, external: false }
      }
    }

    return { ok: true, redirectTo: confirmationPath(accessToken), external: false }
  } catch (error) {
    payload.logger.error({ err: error }, 'Błąd podczas składania zamówienia')
    return { ok: false, message: GENERIC_ERROR }
  }
}

/** Rozpoczyna (albo ponawia) płatność online za już złożone zamówienie — przycisk „Zapłać online". */
export async function startOnlinePayment(token: unknown): Promise<StartPaymentResult> {
  const unavailable: StartPaymentResult = {
    ok: false,
    message: 'Płatność online jest chwilowo niedostępna. Spróbuj ponownie za kilka minut albo skontaktuj się z nami.',
  }
  if (!isOnlinePaymentConfigured()) return unavailable

  const payload = await getPayloadClient()
  try {
    const fingerprint = await clientFingerprint()
    if (!rateLimit(`pay:${fingerprint}`, 10, TEN_MINUTES)) {
      return { ok: false, message: 'Zbyt wiele prób. Odczekaj kilka minut i spróbuj ponownie.' }
    }

    const order = await findOrderByToken(payload, token, 0)
    if (!order) return { ok: false, message: 'Nie znaleźliśmy tego zamówienia.' }
    if (!canPayOnline(order)) return { ok: false, message: 'To zamówienie nie wymaga już płatności online.' }

    const session = await createPaymentSession(order, getSiteUrl())
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { stripeSessionId: session.id },
      context: { skipNotify: true },
    })
    return { ok: true, url: session.url }
  } catch (error) {
    payload.logger.error({ err: error }, 'Nie udało się rozpocząć płatności online')
    return unavailable
  }
}
