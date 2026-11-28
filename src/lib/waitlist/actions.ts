'use server'

import { runAfterResponse } from '@/lib/afterResponse'
import { inviteCodes } from '@/lib/editionData'
import { editionInfo, inviteMatches } from '@/lib/editions'
import { sendContactNotification } from '@/lib/email/send'
import { getPayloadClient } from '@/lib/payload'
import { clientFingerprint, rateLimit } from '@/lib/rateLimit'
import { validateWaitlist, type WaitlistErrors } from '@/lib/validation'

export type WaitlistResult = { ok: true } | { ok: false; message: string; fieldErrors?: WaitlistErrors }

const GENERIC_ERROR = 'Nie udało się zapisać Twojego zgłoszenia. Spróbuj ponownie za chwilę albo napisz do nas.'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Opublikowany model, którego dotyczy zapis (tylko tytuł i stan edycji — bez danych z panelu). */
async function findProduct(productId: unknown) {
  if (typeof productId !== 'number' || !Number.isInteger(productId) || productId <= 0) return null
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    select: { title: true, slug: true, edition: true },
    where: { and: [{ id: { equals: productId } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0] ?? null
}

/**
 * Zapis na listę oczekujących: do konkretnego modelu (zapowiedź, przedsprzedaż, wyczerpany nakład)
 * albo na listę prywatną — zaproszenia do wszystkich kolejnych edycji. Zgłoszenie trafia do
 * „Wiadomości” w panelu, a sklep dostaje powiadomienie e-mailem.
 */
export async function joinWaitlist(input: unknown): Promise<WaitlistResult> {
  const payload = await getPayloadClient()
  try {
    const body = isRecord(input) ? input : {}
    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true }

    const { values, errors } = validateWaitlist(body.form)
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: 'Sprawdź zaznaczone pola i spróbuj ponownie.', fieldErrors: errors }
    }

    const fingerprint = await clientFingerprint()
    if (!rateLimit(`waitlist:${fingerprint}`, 4, 30 * 60_000)) {
      return { ok: false, message: 'Wysłano już kilka zgłoszeń w krótkim czasie. Odczekaj chwilę albo napisz do nas.' }
    }

    const product = body.productId === undefined || body.productId === null ? null : await findProduct(body.productId)
    if (body.productId !== undefined && body.productId !== null && !product) {
      return { ok: false, message: 'Ten model nie jest już dostępny w sklepie.' }
    }

    // Ten sam adres zapisany już na tę samą listę — nie dublujemy wpisu, ale potwierdzamy zapis.
    const existing = await payload.count({
      collection: 'messages',
      where: {
        and: [
          { kind: { equals: 'waitlist' } },
          { email: { equals: values.email } },
          product ? { product: { equals: product.id } } : { product: { exists: false } },
        ],
      },
    })
    if (existing.totalDocs > 0) return { ok: true }

    const info = product ? editionInfo(product.edition) : null
    const reason = !product
      ? 'Lista prywatna — zaproszenia do kolejnych edycji.'
      : info?.status === 'announced'
        ? `Zapowiedź „${product.title}” — prośba o zaproszenie przed premierą.`
        : info?.status === 'invite'
          ? `Przedsprzedaż „${product.title}” — prośba o kod zaproszenia.`
          : `„${product.title}” — prośba o informację o kolejnej edycji.`

    const message = await payload.create({
      collection: 'messages',
      data: {
        kind: 'waitlist',
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        product: product?.id ?? null,
        message: reason,
        source: product ? `Strona modelu: ${product.title}` : 'Lista prywatna',
      },
    })

    runAfterResponse(payload, async () => {
      await sendContactNotification(payload, message)
    })
    return { ok: true }
  } catch (error) {
    payload.logger.error({ err: error }, 'Błąd zapisu na listę oczekujących')
    return { ok: false, message: GENERIC_ERROR }
  }
}

export type InviteResult = { ok: true } | { ok: false; message: string }

/** Sprawdza kod zaproszenia do przedsprzedaży. Ostatecznie kod weryfikuje i tak serwer przy zamówieniu. */
export async function checkInvite(productId: unknown, code: unknown): Promise<InviteResult> {
  const fingerprint = await clientFingerprint()
  if (!rateLimit(`invite:${fingerprint}`, 8, 15 * 60_000)) {
    return { ok: false, message: 'Zbyt wiele prób. Odczekaj kilka minut i spróbuj ponownie.' }
  }
  if (typeof code !== 'string' || code.trim().length < 4 || code.length > 32) {
    return { ok: false, message: 'Wpisz kod z zaproszenia.' }
  }
  const product = await findProduct(productId)
  if (!product || editionInfo(product.edition).status !== 'invite') {
    return { ok: false, message: 'Ten model nie wymaga już zaproszenia — odśwież stronę.' }
  }
  const codes = await inviteCodes([product.id])
  return inviteMatches(codes.get(product.id), code)
    ? { ok: true }
    : { ok: false, message: 'Ten kod nie pasuje do zaproszenia. Sprawdź pisownię albo poproś atelier o nowy.' }
}
