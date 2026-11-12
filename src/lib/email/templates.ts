import { labelOf, LEGAL_SLUGS, PAYMENT_METHODS } from '@/lib/constants'
import { formatPLN } from '@/lib/money'
import {
  addressLines,
  customerFullName,
  formatOrderDateTime,
  invoiceLines,
  orderItemImage,
  sellerLine,
  transferDetails,
} from '@/lib/orders/view'
import { formatPhone } from '@/lib/validation'
import type { Message, Order, Setting } from '@/payload-types'

import {
  button,
  divider,
  escapeHtml,
  escapeMultiline,
  heading,
  itemsTable,
  keyValues,
  link,
  panel,
  paragraph,
  renderLayout,
  subheading,
  totalsTable,
  type EmailItem,
} from './layout'

/**
 * Treść wiadomości wysyłanych przez sklep. Każda funkcja przyjmuje gotowe dane
 * i zwraca temat oraz dwie wersje treści: ozdobną (HTML) i zwykły tekst.
 */

export type EmailContent = {
  subject: string
  html: string
  text: string
}

export type EmailContext = {
  settings: Setting
  /** Publiczny adres sklepu, bez ukośnika na końcu. */
  siteUrl: string
}

const storeNameOf = (settings: Setting): string => settings.storeName?.trim() || 'RYD'

const absolute = (siteUrl: string, path: string | null): string | null => {
  if (!path) return null
  return /^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function orderPageUrl(order: Pick<Order, 'accessToken'>, siteUrl: string): string {
  return `${siteUrl}/zamowienie/potwierdzenie/${order.accessToken ?? ''}`
}

function emailItems(order: Order, siteUrl: string): EmailItem[] {
  return order.items.map((item) => ({
    title: item.title,
    details: [item.variantName, `${item.quantity} × ${formatPLN(item.unitPrice)}`].filter(Boolean).join(' · '),
    amount: formatPLN(item.lineTotal),
    imageUrl: absolute(siteUrl, orderItemImage(item)),
  }))
}

function totalsRows(order: Order): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Produkty', formatPLN(order.subtotal)],
    [`Dostawa: ${order.shippingMethodName}`, order.shippingCost > 0 ? formatPLN(order.shippingCost) : 'bezpłatnie'],
  ]
  if (order.paymentFee && order.paymentFee > 0) rows.push(['Płatność przy odbiorze', formatPLN(order.paymentFee)])
  return rows
}

function itemsText(order: Order): string {
  return order.items
    .map((item) => {
      const name = [item.title, item.variantName].filter(Boolean).join(', ')
      return `- ${name} — ${item.quantity} × ${formatPLN(item.unitPrice)} = ${formatPLN(item.lineTotal)}`
    })
    .join('\n')
}

function totalsText(order: Order): string {
  return [...totalsRows(order).map(([label, amount]) => `${label}: ${amount}`), `Razem do zapłaty: ${formatPLN(order.total)}`].join('\n')
}

function customerFooter({ settings, siteUrl }: EmailContext): string[] {
  const contact = [settings.contact?.email, formatPhone(settings.contact?.phone)].filter(Boolean).join(' · ')
  return [
    sellerLine(settings),
    contact,
    `Otrzymujesz tę wiadomość, ponieważ w sklepie ${storeNameOf(settings)} (${siteUrl.replace(/^https?:\/\//, '')}) złożono zamówienie z użyciem tego adresu e-mail.`,
  ]
}

const testNoticeHtml = panel(
  '<strong>To jest zamówienie testowe.</strong> Sklep działa w trybie przygotowania — zamówienie nie zostanie zrealizowane.',
  { tone: 'notice' },
)

const testNoticeText = 'UWAGA: to jest zamówienie testowe. Sklep działa w trybie przygotowania — zamówienie nie zostanie zrealizowane.\n\n'

/* ---------- Potwierdzenie zamówienia dla klienta ---------- */

function paymentBlock(order: Order, context: EmailContext): { html: string; text: string } {
  const { settings, siteUrl } = context
  const total = formatPLN(order.total)

  if (order.paymentMethod === 'transfer') {
    const details = transferDetails(order, settings)
    if (!details) {
      const line = 'Dane do przelewu prześlemy w osobnej wiadomości.'
      return { html: subheading('Płatność przelewem') + paragraph(escapeHtml(line)), text: `PŁATNOŚĆ PRZELEWEM\n${line}` }
    }
    const rows: Array<[string, string]> = [
      ['Odbiorca', escapeHtml(details.recipient)],
      ['Numer rachunku', escapeHtml(details.account)],
      ['Bank', escapeHtml(details.bank)],
      ['Tytuł przelewu', escapeHtml(details.title)],
      ['Kwota', escapeHtml(total)],
    ]
    const note = 'Realizację zamówienia rozpoczniemy po zaksięgowaniu wpłaty.'
    return {
      html: subheading('Dane do przelewu') + panel(keyValues(rows)) + paragraph(escapeHtml(note), { soft: true }),
      text: [
        'DANE DO PRZELEWU',
        `Odbiorca: ${details.recipient}`,
        `Numer rachunku: ${details.account}`,
        details.bank ? `Bank: ${details.bank}` : '',
        `Tytuł przelewu: ${details.title}`,
        `Kwota: ${total}`,
        note,
      ]
        .filter(Boolean)
        .join('\n'),
    }
  }

  if (order.paymentMethod === 'cod') {
    const line = `Za zamówienie zapłacisz przy odbiorze — przygotuj ${total}.`
    return { html: subheading('Płatność przy odbiorze') + paragraph(escapeHtml(line)), text: `PŁATNOŚĆ PRZY ODBIORZE\n${line}` }
  }

  if (order.paymentStatus === 'paid') {
    const line = `Płatność online w kwocie ${total} została zaksięgowana. Dziękujemy!`
    return { html: subheading('Płatność online') + paragraph(escapeHtml(line)), text: `PŁATNOŚĆ ONLINE\n${line}` }
  }

  const url = orderPageUrl(order, siteUrl)
  const line = `Czekamy na potwierdzenie płatności online w kwocie ${total}. Jeśli płatność nie została dokończona, możesz ją wykonać w dowolnej chwili na stronie zamówienia.`
  return {
    html: subheading('Płatność online') + paragraph(escapeHtml(line)) + button('Zapłać online', url),
    text: `PŁATNOŚĆ ONLINE\n${line}\n${url}`,
  }
}

export type LegalAttachment = { title: string; slug: string }

export function orderConfirmationEmail(order: Order, context: EmailContext, attachments: LegalAttachment[] = []): EmailContent {
  const { settings, siteUrl } = context
  const storeName = storeNameOf(settings)
  const subject = `${order.isTest ? '[TEST] ' : ''}Potwierdzenie zamówienia ${order.orderNumber} — ${storeName}`
  const url = orderPageUrl(order, siteUrl)
  const payment = paymentBlock(order, context)
  const invoice = invoiceLines(order)
  const phone = formatPhone(order.phone)

  const intro = `Przyjęliśmy Twoje zamówienie nr ${order.orderNumber} z dnia ${formatOrderDateTime(order.createdAt)}. Poniżej znajdziesz jego podsumowanie — zachowaj tę wiadomość.`
  const contactLine = [settings.contact?.email, formatPhone(settings.contact?.phone)].filter(Boolean).join(' lub ')
  const help = contactLine
    ? `Masz pytania? Odpowiedz na tę wiadomość albo skontaktuj się z nami: ${contactLine}.`
    : 'Masz pytania? Odpowiedz na tę wiadomość.'

  const legalLinks: Array<[string, string]> = [
    ['Regulamin sklepu', `${siteUrl}/${LEGAL_SLUGS.terms}`],
    ['Zwroty i reklamacje', `${siteUrl}/${LEGAL_SLUGS.returns}`],
  ]
  const attachmentNote =
    attachments.length > 0
      ? `W załączniku znajdziesz: ${attachments.map((item) => item.title).join(', ')} — w brzmieniu z dnia zamówienia.`
      : ''

  const content = [
    order.isTest ? testNoticeHtml : '',
    heading(`Dziękujemy za zamówienie, ${order.firstName}!`),
    paragraph(escapeHtml(intro)),
    payment.html,
    subheading('Zamówione produkty'),
    itemsTable(emailItems(order, siteUrl)),
    totalsTable(totalsRows(order), ['Razem do zapłaty', formatPLN(order.total)]),
    settings.priceNote ? paragraph(escapeHtml(settings.priceNote), { soft: true }) : '',
    subheading('Dostawa'),
    paragraph(
      [
        `<strong>${escapeHtml(customerFullName(order))}</strong>`,
        ...addressLines(order).map((line) => escapeHtml(line)),
        phone ? `tel. ${escapeHtml(phone)}` : '',
      ]
        .filter(Boolean)
        .join('<br>'),
    ),
    paragraph(escapeHtml(order.shippingMethodName), { soft: true }),
    invoice.length > 0 ? subheading('Dane do faktury') + paragraph(invoice.map((line) => escapeHtml(line)).join('<br>')) : '',
    order.customerNote ? subheading('Twoje uwagi') + paragraph(escapeMultiline(order.customerNote)) : '',
    button('Zobacz zamówienie', url),
    divider(),
    paragraph(escapeHtml(help), { soft: true }),
    paragraph(
      `${legalLinks.map(([label, href]) => link(label, href)).join(' · ')}${attachmentNote ? `<br>${escapeHtml(attachmentNote)}` : ''}`,
      { soft: true },
    ),
  ].join('\n')

  const text = [
    order.isTest ? testNoticeText.trim() : '',
    `Dziękujemy za zamówienie, ${order.firstName}!`,
    intro,
    payment.text,
    `ZAMÓWIONE PRODUKTY\n${itemsText(order)}`,
    totalsText(order),
    settings.priceNote ?? '',
    ['DOSTAWA', customerFullName(order), ...addressLines(order), phone ? `tel. ${phone}` : '', order.shippingMethodName].filter(Boolean).join('\n'),
    invoice.length > 0 ? `DANE DO FAKTURY\n${invoice.join('\n')}` : '',
    order.customerNote ? `TWOJE UWAGI\n${order.customerNote}` : '',
    `Zobacz zamówienie: ${url}`,
    help,
    legalLinks.map(([label, href]) => `${label}: ${href}`).join('\n'),
    attachmentNote,
    customerFooter(context).filter(Boolean).join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    subject,
    html: renderLayout({
      subject,
      preheader: `Zamówienie ${order.orderNumber} · ${formatPLN(order.total)} · ${labelOf(PAYMENT_METHODS, order.paymentMethod)}`,
      storeName,
      siteUrl,
      content,
      footerLines: customerFooter(context),
    }),
    text,
  }
}

/* ---------- Powiadomienie dla sprzedawcy ---------- */

export function ownerNotificationEmail(order: Order, context: EmailContext): EmailContent {
  const { settings, siteUrl } = context
  const storeName = storeNameOf(settings)
  const subject = `${order.isTest ? '[TEST] ' : ''}Nowe zamówienie ${order.orderNumber} — ${formatPLN(order.total)}`
  const adminUrl = `${siteUrl}/admin/collections/orders/${order.id}`
  const invoice = invoiceLines(order)
  const phone = formatPhone(order.phone)
  const paymentLabel = labelOf(PAYMENT_METHODS, order.paymentMethod)

  const customerRows: Array<[string, string]> = [
    ['Klient', escapeHtml(customerFullName(order))],
    ['E-mail', link(order.email, `mailto:${order.email}`)],
    ['Telefon', phone ? link(phone, `tel:${order.phone}`) : ''],
    ['Adres dostawy', addressLines(order).map((line) => escapeHtml(line)).join('<br>')],
    ['Dostawa', escapeHtml(order.shippingMethodName)],
    ['Płatność', escapeHtml(paymentLabel)],
    ['Faktura', invoice.map((line) => escapeHtml(line)).join('<br>')],
  ]

  const content = [
    order.isTest ? testNoticeHtml : '',
    heading(`Nowe zamówienie ${order.orderNumber}`),
    paragraph(escapeHtml(`Złożone ${formatOrderDateTime(order.createdAt)}. Wartość: ${formatPLN(order.total)}.`)),
    button('Otwórz zamówienie w panelu', adminUrl),
    subheading('Klient'),
    keyValues(customerRows),
    order.customerNote ? subheading('Uwagi klienta') + panel(escapeMultiline(order.customerNote)) : '',
    subheading('Produkty'),
    itemsTable(emailItems(order, siteUrl)),
    totalsTable(totalsRows(order), ['Razem', formatPLN(order.total)]),
  ].join('\n')

  const text = [
    order.isTest ? testNoticeText.trim() : '',
    `Nowe zamówienie ${order.orderNumber}`,
    `Złożone ${formatOrderDateTime(order.createdAt)}. Wartość: ${formatPLN(order.total)}.`,
    `Panel: ${adminUrl}`,
    [
      'KLIENT',
      customerFullName(order),
      order.email,
      phone,
      ...addressLines(order),
      `Dostawa: ${order.shippingMethodName}`,
      `Płatność: ${paymentLabel}`,
      invoice.length > 0 ? `Faktura: ${invoice.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    order.customerNote ? `UWAGI KLIENTA\n${order.customerNote}` : '',
    `PRODUKTY\n${itemsText(order)}`,
    totalsText(order),
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    subject,
    html: renderLayout({
      subject,
      preheader: `${customerFullName(order)} · ${order.shippingAddress.city} · ${paymentLabel}`,
      storeName,
      siteUrl,
      content,
      footerLines: [`Powiadomienie ze sklepu ${storeName}. Odpowiedź na tę wiadomość trafi bezpośrednio do klienta.`],
    }),
    text,
  }
}

/* ---------- Płatność zaksięgowana ---------- */

export function paymentReceivedEmail(order: Order, context: EmailContext): EmailContent {
  const { settings, siteUrl } = context
  const storeName = storeNameOf(settings)
  const subject = `${order.isTest ? '[TEST] ' : ''}Płatność za zamówienie ${order.orderNumber} zaksięgowana`
  const url = orderPageUrl(order, siteUrl)
  const intro = `Otrzymaliśmy płatność w kwocie ${formatPLN(order.total)} za zamówienie nr ${order.orderNumber}. Dziękujemy — przystępujemy do realizacji.`
  const next = 'Gdy zamówienie będzie gotowe do wysyłki, damy Ci znać osobną wiadomością.'

  const content = [
    order.isTest ? testNoticeHtml : '',
    heading(`Płatność zaksięgowana, ${order.firstName}`),
    paragraph(escapeHtml(intro)),
    paragraph(escapeHtml(next), { soft: true }),
    button('Zobacz zamówienie', url),
  ].join('\n')

  return {
    subject,
    html: renderLayout({
      subject,
      preheader: `Zamówienie ${order.orderNumber} · ${formatPLN(order.total)}`,
      storeName,
      siteUrl,
      content,
      footerLines: customerFooter(context),
    }),
    text: [
      order.isTest ? testNoticeText.trim() : '',
      `Płatność zaksięgowana, ${order.firstName}`,
      intro,
      next,
      `Zobacz zamówienie: ${url}`,
      customerFooter(context).filter(Boolean).join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

/* ---------- Zamówienie wysłane ---------- */

/** Dopuszczamy wyłącznie zwykłe adresy stron — nic innego nie trafi do odnośnika w e-mailu. */
export function safeTrackingUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function shippedEmail(order: Order, context: EmailContext): EmailContent {
  const { settings, siteUrl } = context
  const storeName = storeNameOf(settings)
  const subject = `${order.isTest ? '[TEST] ' : ''}Zamówienie ${order.orderNumber} jest w drodze`
  const url = orderPageUrl(order, siteUrl)
  const trackingUrl = safeTrackingUrl(order.trackingUrl)
  const trackingNumber = order.trackingNumber?.trim() || ''
  const phone = formatPhone(order.phone)

  const intro = `Twoje zamówienie nr ${order.orderNumber} zostało przekazane do dostawy (${order.shippingMethodName}).`
  const callNote = phone
    ? `Przewoźnik skontaktuje się z Tobą pod numerem ${phone}, aby umówić termin dostawy.`
    : 'Przewoźnik skontaktuje się z Tobą, aby umówić termin dostawy.'
  const checkNote =
    'Przy odbiorze sprawdź, proszę, stan opakowania i mebla w obecności dostawcy. Gdyby coś było nie tak — spisz protokół i daj nam znać, zajmiemy się resztą.'

  const content = [
    order.isTest ? testNoticeHtml : '',
    heading(`${order.firstName}, Twoje zamówienie jest w drodze`),
    paragraph(escapeHtml(intro)),
    trackingNumber ? panel(keyValues([['Numer przesyłki', escapeHtml(trackingNumber)]])) : '',
    trackingUrl ? button('Śledź przesyłkę', trackingUrl) : '',
    paragraph(escapeHtml(callNote)),
    subheading('Adres dostawy'),
    paragraph([`<strong>${escapeHtml(customerFullName(order))}</strong>`, ...addressLines(order).map((line) => escapeHtml(line))].join('<br>')),
    divider(),
    paragraph(escapeHtml(checkNote), { soft: true }),
    paragraph(link('Zobacz zamówienie', url), { soft: true }),
  ].join('\n')

  return {
    subject,
    html: renderLayout({
      subject,
      preheader: trackingNumber ? `Numer przesyłki: ${trackingNumber}` : order.shippingMethodName,
      storeName,
      siteUrl,
      content,
      footerLines: customerFooter(context),
    }),
    text: [
      order.isTest ? testNoticeText.trim() : '',
      `${order.firstName}, Twoje zamówienie jest w drodze`,
      intro,
      trackingNumber ? `Numer przesyłki: ${trackingNumber}` : '',
      trackingUrl ? `Śledzenie przesyłki: ${trackingUrl}` : '',
      callNote,
      ['ADRES DOSTAWY', customerFullName(order), ...addressLines(order)].join('\n'),
      checkNote,
      `Zobacz zamówienie: ${url}`,
      customerFooter(context).filter(Boolean).join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n'),
  }
}

/* ---------- Wiadomość z formularza kontaktowego (dla sprzedawcy) ---------- */

export function contactMessageEmail(
  message: Pick<Message, 'name' | 'email' | 'phone' | 'message' | 'source'> & { id?: number },
  context: EmailContext,
): EmailContent {
  const { settings, siteUrl } = context
  const storeName = storeNameOf(settings)
  const subject = `Wiadomość ze sklepu od: ${message.name}`
  const phone = formatPhone(message.phone)
  const adminUrl = message.id ? `${siteUrl}/admin/collections/messages/${message.id}` : `${siteUrl}/admin/collections/messages`

  const content = [
    heading('Nowa wiadomość ze sklepu'),
    keyValues([
      ['Od', escapeHtml(message.name)],
      ['E-mail', link(message.email, `mailto:${message.email}`)],
      ['Telefon', phone ? link(phone, `tel:${message.phone}`) : ''],
      ['Dotyczy', escapeHtml(message.source ?? '')],
    ]),
    subheading('Treść'),
    panel(escapeMultiline(message.message)),
    button('Otwórz w panelu', adminUrl),
  ].join('\n')

  return {
    subject,
    html: renderLayout({
      subject,
      preheader: message.message.slice(0, 120),
      storeName,
      siteUrl,
      content,
      footerLines: [`Wiadomość z formularza kontaktowego sklepu ${storeName}. Odpowiedź trafi bezpośrednio do nadawcy.`],
    }),
    text: [
      'Nowa wiadomość ze sklepu',
      [`Od: ${message.name}`, `E-mail: ${message.email}`, phone ? `Telefon: ${phone}` : '', message.source ? `Dotyczy: ${message.source}` : '']
        .filter(Boolean)
        .join('\n'),
      message.message,
      `Panel: ${adminUrl}`,
    ].join('\n\n'),
  }
}
