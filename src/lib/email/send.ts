import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'

import { LEGAL_SLUGS } from '@/lib/constants'
import { isEmailConfigured } from '@/lib/launch'
import { formatOrderDate } from '@/lib/orders/view'
import { richTextToPlainText } from '@/lib/richtext/plaintext'
import { getSiteUrl } from '@/lib/site'
import type { Message, Order, Setting } from '@/payload-types'

import {
  contactMessageEmail,
  orderConfirmationEmail,
  ownerNotificationEmail,
  paymentReceivedEmail,
  shippedEmail,
  type EmailContent,
  type EmailContext,
} from './templates'

/**
 * Wysyłka wiadomości sklepu. Każda funkcja sama pobiera aktualne dane zamówienia,
 * wysyła wiadomość i zapisuje przy zamówieniu, czy się udało. Błąd poczty nigdy
 * nie przerywa składania zamówienia ani zapisu w panelu — trafia do dziennika serwera.
 */

export type EmailOutcome = 'sent' | 'skipped' | 'failed'

type Attachment = { filename: string; content: string; contentType: string }

type Envelope = EmailContent & {
  to: string
  replyTo?: string
  attachments?: Attachment[]
  /** Krótka nazwa do podglądu i dziennika, np. „potwierdzenie-RYD-1001". */
  label: string
}

/**
 * Pomoc przy pracy nad sklepem: gdy ustawiona jest zmienna EMAIL_PREVIEW_DIR,
 * każda wiadomość zapisuje się dodatkowo jako plik HTML w tym katalogu.
 */
async function savePreview(envelope: Envelope): Promise<void> {
  const directory = process.env.EMAIL_PREVIEW_DIR
  if (!directory) return
  try {
    await mkdir(directory, { recursive: true })
    const name = `${Date.now()}-${envelope.label.replace(/[^a-zA-Z0-9-]+/g, '-')}`
    await writeFile(path.join(directory, `${name}.html`), envelope.html, 'utf8')
    await writeFile(
      path.join(directory, `${name}.txt`),
      `Do: ${envelope.to}\nTemat: ${envelope.subject}\nZałączniki: ${(envelope.attachments ?? []).map((item) => item.filename).join(', ') || 'brak'}\n\n${envelope.text}`,
      'utf8',
    )
    for (const attachment of envelope.attachments ?? []) {
      await writeFile(path.join(directory, `${name}-${attachment.filename}`), attachment.content, 'utf8')
    }
  } catch {
    // Podgląd jest tylko udogodnieniem — jego brak niczego nie blokuje.
  }
}

async function deliver(payload: Payload, settings: Setting, envelope: Envelope): Promise<EmailOutcome> {
  await savePreview(envelope)

  if (!isEmailConfigured()) {
    payload.logger.warn(
      `E-mail NIE został wysłany (brak konfiguracji poczty SMTP). Do: ${envelope.to} · Temat: ${envelope.subject}`,
    )
    return 'skipped'
  }

  try {
    await payload.sendEmail({
      from: { name: settings.storeName?.trim() || process.env.SMTP_FROM_NAME || 'RYD', address: process.env.SMTP_FROM || '' },
      to: envelope.to,
      replyTo: envelope.replyTo || undefined,
      subject: envelope.subject,
      html: envelope.html,
      text: envelope.text,
      attachments: envelope.attachments,
    })
    return 'sent'
  } catch (error) {
    payload.logger.error({ err: error }, `Nie udało się wysłać e-maila „${envelope.subject}" do ${envelope.to}`)
    return 'failed'
  }
}

async function loadContext(payload: Payload): Promise<EmailContext> {
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  return { settings, siteUrl: getSiteUrl() }
}

async function loadOrder(payload: Payload, orderId: number): Promise<Order | null> {
  try {
    return await payload.findByID({ collection: 'orders', id: orderId, depth: 1 })
  } catch {
    return null
  }
}

type EmailLog = Record<string, { status: EmailOutcome; at: string }>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function emailLogOf(order: Pick<Order, 'emailsSent'>): EmailLog {
  return isRecord(order.emailsSent) ? (order.emailsSent as EmailLog) : {}
}

export function wasEmailSent(order: Pick<Order, 'emailsSent'>, key: string): boolean {
  return emailLogOf(order)[key]?.status === 'sent'
}

/** Zapisuje przy zamówieniu wynik wysyłki (widoczny w panelu jako historia wiadomości). */
async function recordOutcomes(payload: Payload, orderId: number, outcomes: Record<string, EmailOutcome>): Promise<void> {
  try {
    const current = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    const at = new Date().toISOString()
    const log: EmailLog = { ...emailLogOf(current) }
    for (const [key, status] of Object.entries(outcomes)) log[key] = { status, at }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { emailsSent: log },
      depth: 0,
      // Sam zapis historii nie może wywołać kolejnych powiadomień.
      context: { skipNotify: true },
    })
  } catch (error) {
    payload.logger.error({ err: error }, `Nie udało się zapisać historii e-maili zamówienia ${orderId}`)
  }
}

/* ---------- Załączniki prawne ---------- */

const BOM = '﻿'

/**
 * Regulamin oraz zasady zwrotów w brzmieniu z dnia zamówienia, dołączane do potwierdzenia
 * jako pliki tekstowe — klient ma je u siebie na stałe, niezależnie od późniejszych zmian na stronie.
 */
async function legalAttachments(
  payload: Payload,
  context: EmailContext,
): Promise<Array<Attachment & { title: string; slug: string }>> {
  const slugs: string[] = [LEGAL_SLUGS.terms, LEGAL_SLUGS.returns]
  try {
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: slugs.length,
      pagination: false,
      overrideAccess: false,
      where: { and: [{ slug: { in: slugs } }, { _status: { equals: 'published' } }] },
    })

    return slugs.flatMap((slug) => {
      const page = result.docs.find((doc) => doc.slug === slug)
      if (!page?.content) return []
      const body = richTextToPlainText(page.content, { siteUrl: context.siteUrl })
      if (!body) return []

      const header = `${page.title.toUpperCase()}\n${context.settings.storeName ?? ''} · ${context.siteUrl}/${slug}\nTreść obowiązująca w dniu ${formatOrderDate(new Date())}`
      return [
        {
          title: page.title,
          slug,
          filename: `${slug}.txt`,
          content: `${BOM}${header}\n\n${page.lead ? `${page.lead}\n\n` : ''}${body}\n`,
          contentType: 'text/plain; charset=utf-8',
        },
      ]
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Nie udało się przygotować załączników z regulaminem')
    return []
  }
}

/* ---------- Zamówienie złożone ---------- */

/** Potwierdzenie dla klienta i powiadomienie dla sprzedawcy — zaraz po złożeniu zamówienia. */
export async function sendOrderPlacedEmails(payload: Payload, orderId: number): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order) return
  const context = await loadContext(payload)
  const { settings } = context
  const outcomes: Record<string, EmailOutcome> = {}

  if (!wasEmailSent(order, 'confirmation')) {
    const attachments = await legalAttachments(payload, context)
    const content = orderConfirmationEmail(order, context, attachments)
    outcomes.confirmation = await deliver(payload, settings, {
      ...content,
      to: order.email,
      replyTo: settings.contact?.email || undefined,
      attachments: attachments.map(({ filename, content: body, contentType }) => ({ filename, content: body, contentType })),
      label: `potwierdzenie-${order.orderNumber}`,
    })
  }

  const ownerAddress = settings.orders?.notificationEmail || settings.contact?.email
  if (!ownerAddress) {
    payload.logger.warn(
      `Brak adresu do powiadomień o zamówieniach (Ustawienia → Zamówienia i płatności). Zamówienie ${order.orderNumber} nie zostało zgłoszone e-mailem.`,
    )
  } else if (!wasEmailSent(order, 'owner')) {
    outcomes.owner = await deliver(payload, settings, {
      ...ownerNotificationEmail(order, context),
      to: ownerAddress,
      replyTo: order.email,
      label: `nowe-zamowienie-${order.orderNumber}`,
    })
  }

  if (Object.keys(outcomes).length > 0) await recordOutcomes(payload, order.id, outcomes)
}

/* ---------- Płatność zaksięgowana ---------- */

export async function sendPaymentReceivedEmail(payload: Payload, orderId: number): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order || wasEmailSent(order, 'paid')) return
  const context = await loadContext(payload)

  const outcome = await deliver(payload, context.settings, {
    ...paymentReceivedEmail(order, context),
    to: order.email,
    replyTo: context.settings.contact?.email || undefined,
    label: `platnosc-${order.orderNumber}`,
  })
  await recordOutcomes(payload, order.id, { paid: outcome })
}

/* ---------- Zamówienie wysłane ---------- */

export async function sendShippedEmail(payload: Payload, orderId: number): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order || wasEmailSent(order, 'shipped')) return
  const context = await loadContext(payload)

  const outcome = await deliver(payload, context.settings, {
    ...shippedEmail(order, context),
    to: order.email,
    replyTo: context.settings.contact?.email || undefined,
    label: `wysylka-${order.orderNumber}`,
  })
  await recordOutcomes(payload, order.id, { shipped: outcome })
}

/* ---------- Formularz kontaktowy ---------- */

export async function sendContactNotification(
  payload: Payload,
  message: Pick<Message, 'id' | 'name' | 'email' | 'phone' | 'message' | 'source'>,
): Promise<EmailOutcome> {
  const context = await loadContext(payload)
  const { settings } = context
  const to = settings.contact?.email || settings.orders?.notificationEmail
  if (!to) {
    payload.logger.warn('Brak adresu kontaktowego sklepu — wiadomość z formularza jest dostępna tylko w panelu.')
    return 'skipped'
  }

  return deliver(payload, settings, {
    ...contactMessageEmail(message, context),
    to,
    replyTo: message.email,
    label: `kontakt-${message.id}`,
  })
}
