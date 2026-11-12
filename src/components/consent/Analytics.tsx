'use client'

import { useEffect } from 'react'

import { flushPendingEvents } from '@/lib/analytics'
import { useConsent } from '@/lib/consent'

/**
 * Uruchamia narzędzia pomiarowe — dopiero po zgodzie klienta i tylko te, na które się zgodził.
 * Gdy klient wycofa zgodę, narzędzie przestaje wysyłać dane, a jego pliki cookie są usuwane.
 */

type Props = {
  /** Identyfikator Google Analytics 4 (G-XXXXXXXXXX) albo null. */
  ga4Id: string | null
  /** Identyfikator piksela Meta (same cyfry) albo null. */
  metaPixelId: string | null
}

function injectScript(id: string, src: string): void {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function deleteCookies(prefix: string): void {
  const names = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim() ?? '')
    .filter((name) => name.startsWith(prefix))
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

function startGoogleAnalytics(id: string): void {
  const flags = window as unknown as Record<string, unknown>
  flags[`ga-disable-${id}`] = false

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }

  const dataLayer = (window.dataLayer = window.dataLayer ?? [])
  // Biblioteka Google oczekuje w kolejce dokładnie obiektu `arguments`, nie zwykłej tablicy.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  // Zgoda dotyczy statystyki; funkcje reklamowe Google pozostają wyłączone.
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('config', id)
  injectScript('ryd-ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`)
}

function stopGoogleAnalytics(id: string): void {
  if (typeof window.gtag !== 'function') return
  const flags = window as unknown as Record<string, unknown>
  flags[`ga-disable-${id}`] = true
  window.gtag('consent', 'update', { analytics_storage: 'denied' })
  deleteCookies('_ga')
}

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: unknown
  loaded: boolean
  version: string
}

function startMetaPixel(id: string): void {
  if (typeof window.fbq === 'function') {
    window.fbq('consent', 'grant')
    return
  }

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as PixelFunction
  fbq.queue = []
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  window.fbq = fbq
  ;(window as unknown as Record<string, unknown>)._fbq = fbq

  fbq('consent', 'grant')
  fbq('init', id)
  fbq('track', 'PageView')
  injectScript('ryd-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js')
}

function stopMetaPixel(): void {
  if (typeof window.fbq !== 'function') return
  window.fbq('consent', 'revoke')
  deleteCookies('_fb')
}

export function Analytics({ ga4Id, metaPixelId }: Props) {
  const consent = useConsent()
  const analyticsAllowed = consent?.analytics === true
  const marketingAllowed = consent?.marketing === true

  useEffect(() => {
    if (!ga4Id) return
    if (analyticsAllowed) {
      startGoogleAnalytics(ga4Id)
      flushPendingEvents()
    } else {
      stopGoogleAnalytics(ga4Id)
    }
  }, [ga4Id, analyticsAllowed])

  useEffect(() => {
    if (!metaPixelId) return
    if (marketingAllowed) {
      startMetaPixel(metaPixelId)
      flushPendingEvents()
    } else {
      stopMetaPixel()
    }
  }, [metaPixelId, marketingAllowed])

  return null
}
