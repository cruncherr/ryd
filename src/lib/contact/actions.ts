'use server'

import { runAfterResponse } from '@/lib/afterResponse'
import { sendContactNotification } from '@/lib/email/send'
import { getPayloadClient } from '@/lib/payload'
import { clientFingerprint, rateLimit } from '@/lib/rateLimit'
import { validateContact, type ContactErrors } from '@/lib/validation'

export type ContactResult = { ok: true } | { ok: false; message: string; fieldErrors?: ContactErrors }

const GENERIC_ERROR = 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę albo zadzwoń do nas.'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Formularz kontaktowy: wiadomość zapisuje się w panelu (Sprzedaż → Wiadomości),
 * a sprzedawca dostaje powiadomienie e-mailem, na które może od razu odpowiedzieć klientowi.
 */
export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const payload = await getPayloadClient()

  try {
    const body = isRecord(input) ? input : {}

    // Pole-pułapka: człowiek go nie widzi, automat wypełnia. Udajemy sukces, żeby nie zachęcać do kolejnych prób.
    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true }

    const { values, errors } = validateContact(body.form)
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: 'Sprawdź zaznaczone pola i spróbuj ponownie.', fieldErrors: errors }
    }

    const fingerprint = await clientFingerprint()
    if (!rateLimit(`contact:${fingerprint}`, 4, 10 * 60_000)) {
      return { ok: false, message: 'Wysłano już kilka wiadomości w krótkim czasie. Odczekaj kilka minut albo zadzwoń do nas.' }
    }

    const source = typeof body.source === 'string' ? body.source.replace(/\s+/g, ' ').trim().slice(0, 160) : ''

    const message = await payload.create({
      collection: 'messages',
      data: {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        message: values.message,
        source: source || 'Formularz kontaktowy',
      },
    })

    runAfterResponse(payload, async () => {
      await sendContactNotification(payload, message)
    })

    return { ok: true }
  } catch (error) {
    payload.logger.error({ err: error }, 'Błąd formularza kontaktowego')
    return { ok: false, message: GENERIC_ERROR }
  }
}

/** Nazwa produktu, o który pyta klient (gdy wszedł na stronę kontaktu z karty produktu). */
export async function getInquiryProductTitle(slug: unknown): Promise<string | null> {
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(slug)) return null
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    select: { title: true },
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0]?.title ?? null
}
