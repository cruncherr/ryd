import { asMedia } from '@/lib/catalog'
import type { Order, Setting } from '@/payload-types'

/**
 * Drobne funkcje opisujące zamówienie słowami — wspólne dla strony potwierdzenia i e-maili,
 * żeby klient wszędzie widział dokładnie te same dane.
 */

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Warsaw',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Warsaw',
})

export function formatOrderDate(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatOrderDateTime(value: string | Date): string {
  // „12 listopada 2026 08:55" → „12 listopada 2026, 08:55"
  return dateTimeFormatter.format(new Date(value)).replace(/,?\s+(\d{1,2}:\d{2})$/, ', $1')
}

/** „Dostawa: Kurier DPD"; nazwy zaczynającej się od słowa „Dostawa" nie poprzedzamy nim drugi raz. */
export function shippingLabel(methodName: string | null | undefined): string {
  const name = methodName?.trim()
  if (!name) return 'Dostawa'
  return /^dostawa/i.test(name) ? name : `Dostawa: ${name}`
}

export type TransferDetails = {
  recipient: string
  account: string
  bank: string
  title: string
  amount: number
}

/** Dane do przelewu albo null, gdy sprzedawca nie wpisał jeszcze numeru rachunku. */
export function transferDetails(order: Pick<Order, 'orderNumber' | 'total'>, settings: Setting): TransferDetails | null {
  const account = settings.payments?.bankAccount?.trim()
  if (!account) return null

  return {
    recipient: settings.company?.legalName?.trim() || settings.storeName || '',
    account,
    bank: settings.payments?.bankName?.trim() || '',
    title: `Zamówienie ${order.orderNumber}`,
    amount: order.total,
  }
}

export function customerFullName(order: Pick<Order, 'firstName' | 'lastName'>): string {
  return `${order.firstName} ${order.lastName}`.trim()
}

/** Adres dostawy w dwóch wierszach: ulica, a pod nią kod i miejscowość. */
export function addressLines(order: Pick<Order, 'shippingAddress'>): string[] {
  const { street, postalCode, city } = order.shippingAddress
  return [street, `${postalCode} ${city}`.trim()].filter(Boolean)
}

/** Dane do faktury w kolejnych wierszach albo pusta lista, gdy klient o nią nie prosił. */
export function invoiceLines(order: Pick<Order, 'invoice' | 'shippingAddress'>): string[] {
  const invoice = order.invoice
  if (!invoice?.wanted) return []
  const address = invoice.address?.trim() || addressLines(order).join(', ')
  return [invoice.companyName ?? '', invoice.nip ? `NIP ${invoice.nip}` : '', address].filter(Boolean)
}

/** Adres miniatury zdjęcia pozycji zamówienia (albo null, gdy zdjęcie usunięto). */
export function orderItemImage(item: Order['items'][number]): string | null {
  const media = asMedia(item.image)
  return media?.sizes?.thumbnail?.url ?? media?.url ?? null
}

export function orderItemCount(order: Pick<Order, 'items'>): number {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

/** Czy klient może (jeszcze) zapłacić za zamówienie online. */
export function canPayOnline(order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'status'>): boolean {
  return (
    order.paymentMethod === 'online' &&
    order.status !== 'cancelled' &&
    (order.paymentStatus === 'pending' || order.paymentStatus === 'failed')
  )
}

/** Dane sprzedawcy w jednym wierszu — do stopek e-maili. */
export function sellerLine(settings: Setting): string {
  const company = settings.company
  const address = [company?.street, [company?.postalCode, company?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [company?.legalName, address, company?.nip ? `NIP ${company.nip}` : ''].filter(Boolean).join(' · ')
}
