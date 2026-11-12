'use client'

import { currentConsent } from '@/lib/consent'

/**
 * Zdarzenia sklepu dla narzędzi pomiarowych (Google Analytics 4, Meta Pixel).
 * Każde zdarzenie trafia tylko do tych narzędzi, na które klient się zgodził i które
 * zostały już uruchomione — bez zgody funkcje po prostu nic nie robią.
 */

type Gtag = (...args: unknown[]) => void
type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
    fbq?: Fbq
  }
}

export type AnalyticsItem = {
  id: string | number
  name: string
  variant?: string | null
  price: number
  quantity: number
}

const toGaItems = (items: AnalyticsItem[]) =>
  items.map((item) => ({
    item_id: String(item.id),
    item_name: item.name,
    item_variant: item.variant || undefined,
    price: item.price,
    quantity: item.quantity,
  }))

const valueOf = (items: AnalyticsItem[]): number => Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100) / 100

type Pending = { tool: 'ga' | 'pixel'; name: string; params: Record<string, unknown> }

// Zdarzenia zgłoszone, zanim narzędzie zdążyło się uruchomić (np. „obejrzano produkt” tuż po wczytaniu strony).
const pending: Pending[] = []
const MAX_PENDING = 20

function gtagEvent(name: string, params: Record<string, unknown>): void {
  if (!currentConsent()?.analytics) return
  if (typeof window.gtag === 'function') window.gtag('event', name, params)
  else if (pending.length < MAX_PENDING) pending.push({ tool: 'ga', name, params })
}

function pixelEvent(name: string, params: Record<string, unknown>): void {
  if (!currentConsent()?.marketing) return
  if (typeof window.fbq === 'function') window.fbq('track', name, params)
  else if (pending.length < MAX_PENDING) pending.push({ tool: 'pixel', name, params })
}

/** Wysyła zdarzenia, które czekały na uruchomienie narzędzia. Wywoływane zaraz po jego starcie. */
export function flushPendingEvents(): void {
  const consent = currentConsent()
  for (const event of pending.splice(0)) {
    if (event.tool === 'ga' && consent?.analytics && typeof window.gtag === 'function') window.gtag('event', event.name, event.params)
    if (event.tool === 'pixel' && consent?.marketing && typeof window.fbq === 'function') window.fbq('track', event.name, event.params)
  }
}

export function trackViewItem(item: AnalyticsItem): void {
  gtagEvent('view_item', { currency: 'PLN', value: item.price, items: toGaItems([item]) })
  pixelEvent('ViewContent', { content_ids: [String(item.id)], content_name: item.name, content_type: 'product', value: item.price, currency: 'PLN' })
}

export function trackAddToCart(item: AnalyticsItem): void {
  const value = valueOf([item])
  gtagEvent('add_to_cart', { currency: 'PLN', value, items: toGaItems([item]) })
  pixelEvent('AddToCart', { content_ids: [String(item.id)], content_name: item.name, content_type: 'product', value, currency: 'PLN' })
}

export function trackBeginCheckout(items: AnalyticsItem[]): void {
  const value = valueOf(items)
  gtagEvent('begin_checkout', { currency: 'PLN', value, items: toGaItems(items) })
  pixelEvent('InitiateCheckout', {
    content_ids: items.map((item) => String(item.id)),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    value,
    currency: 'PLN',
  })
}

export function trackPurchase(order: { number: string; total: number; shipping: number; items: AnalyticsItem[] }): void {
  gtagEvent('purchase', {
    transaction_id: order.number,
    currency: 'PLN',
    value: order.total,
    shipping: order.shipping,
    items: toGaItems(order.items),
  })
  pixelEvent('Purchase', {
    content_ids: order.items.map((item) => String(item.id)),
    content_type: 'product',
    num_items: order.items.reduce((total, item) => total + item.quantity, 0),
    value: order.total,
    currency: 'PLN',
  })
}
