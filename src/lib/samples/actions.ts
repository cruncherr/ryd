'use server'

import { runAfterResponse } from '@/lib/afterResponse'
import { fabricOption } from '@/lib/configurator'
import { sendContactNotification } from '@/lib/email/send'
import { getPayloadClient } from '@/lib/payload'
import { clientFingerprint, rateLimit } from '@/lib/rateLimit'
import { formatPhone, validateSamples, type SamplesErrors } from '@/lib/validation'

export type SamplesResult = { ok: true } | { ok: false; message: string; fieldErrors?: SamplesErrors }

const GENERIC_ERROR = 'Nie udało się przyjąć zamówienia próbek. Spróbuj ponownie za chwilę albo zadzwoń do nas.'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Bezpłatne próbki tkanin: zamówienie zapisuje się w panelu (Sprzedaż → Wiadomości, rodzaj „Próbki tkanin”),
 * a sprzedawca dostaje e-mail z listą kolorów i adresem do wysyłki.
 */
export async function orderSamples(input: unknown): Promise<SamplesResult> {
  const payload = await getPayloadClient()

  try {
    const body = isRecord(input) ? input : {}
    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true }

    const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: false })
    if (settings.samples?.enabled === false) {
      return { ok: false, message: 'Zamawianie próbek jest chwilowo wyłączone. Napisz do nas — chętnie pomożemy w wyborze.' }
    }
    const max = Math.max(1, Math.min(20, settings.samples?.max ?? 6))

    const { values, errors } = validateSamples(body.form)
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: 'Sprawdź zaznaczone pola i spróbuj ponownie.', fieldErrors: errors }
    }

    // Próbki przysłane z przeglądarki porównujemy z próbnikiem — zapisujemy wyłącznie istniejące, dostępne kolory.
    const requested = Array.isArray(body.samples) ? body.samples.slice(0, 40) : []
    const wanted = new Set(
      requested.flatMap((item) =>
        isRecord(item) && typeof item.fabric === 'number' && typeof item.color === 'string' && item.color.length <= 64
          ? [`${item.fabric}:${item.color}`]
          : [],
      ),
    )
    const fabrics = await payload.find({
      collection: 'fabrics',
      depth: 0,
      limit: 100,
      pagination: false,
      overrideAccess: false,
      where: { active: { equals: true } },
    })
    const chosen = fabrics.docs
      .map(fabricOption)
      .flatMap((fabric) =>
        fabric.colors
          .filter((color) => color.available && wanted.has(`${fabric.id}:${color.id}`))
          .map((color) => `${fabric.name} — ${[color.name, color.code].filter(Boolean).join(' ')}`),
      )

    if (chosen.length === 0) return { ok: false, message: 'Zaznacz co najmniej jedną próbkę.' }
    if (chosen.length > max) return { ok: false, message: `Możesz zamówić najwyżej ${max} próbek naraz.` }

    const fingerprint = await clientFingerprint()
    if (!rateLimit(`samples:${fingerprint}`, 3, 30 * 60_000)) {
      return { ok: false, message: 'Zamówiono już kilka zestawów próbek w krótkim czasie. Odczekaj chwilę albo zadzwoń do nas.' }
    }

    const address = [values.name, values.street, `${values.postalCode} ${values.city}`].join('\n')
    const samples = chosen.map((line) => `• ${line}`).join('\n')

    const message = await payload.create({
      collection: 'messages',
      data: {
        kind: 'samples',
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        samples,
        address,
        message: `Proszę o bezpłatne próbki tkanin (${chosen.length}):\n${samples}\n\nAdres do wysyłki:\n${address}${
          values.phone ? `\nTelefon: ${formatPhone(values.phone)}` : ''
        }`,
        source: 'Próbnik tkanin',
      },
    })

    runAfterResponse(payload, async () => {
      await sendContactNotification(payload, message)
    })

    return { ok: true }
  } catch (error) {
    payload.logger.error({ err: error }, 'Błąd zamówienia próbek tkanin')
    return { ok: false, message: GENERIC_ERROR }
  }
}
