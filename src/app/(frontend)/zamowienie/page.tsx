import type { Metadata } from 'next'

import { CheckoutView, type CheckoutConfig } from '@/components/checkout/CheckoutView'
import { paymentOptions } from '@/lib/cart/pricing'
import { LEGAL_SLUGS } from '@/lib/constants'
import { isOnlinePaymentConfigured } from '@/lib/launch'
import { getPublishedPageSlugs, getSettings, getShippingMethods } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Zamówienie',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const [settings, shippingMethods, pages] = await Promise.all([getSettings(), getShippingMethods(), getPublishedPageSlugs()])

  const published = new Set(pages.map((page) => page.slug))
  const linkTo = (slug: string): string | null => (published.has(slug) ? `/${slug}` : null)

  const config: CheckoutConfig = {
    shippingMethods: shippingMethods.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description ?? null,
      deliveryTime: method.deliveryTime ?? null,
      price: method.price,
      freeFrom: method.freeFrom ?? null,
      allowCod: Boolean(method.allowCod),
    })),
    paymentOptions: paymentOptions(settings, isOnlinePaymentConfigured()),
    priceNote: settings.priceNote ?? null,
    sellerName: settings.company?.legalName?.trim() || null,
    isTest: settings.storeStatus !== 'live',
    links: {
      terms: linkTo(LEGAL_SLUGS.terms),
      privacy: linkTo(LEGAL_SLUGS.privacy),
      returns: linkTo(LEGAL_SLUGS.returns),
      delivery: linkTo(LEGAL_SLUGS.delivery),
    },
    contact: {
      email: settings.contact?.email ?? null,
      phone: settings.contact?.phone ?? null,
    },
  }

  return <CheckoutView config={config} />
}
