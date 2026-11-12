import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { breadcrumbJsonLd, organizationJsonLd, productJsonLd } from '@/lib/seo'
import type { Product, ShippingMethod } from '@/payload-types'

import { settings } from './fixtures'

const product = {
  id: 2,
  title: 'Sofa rozkładana Lund',
  slug: 'sofa-rozkladana-lund',
  shortDescription: 'Sofa z luźnymi poduchami.',
  price: 3990,
  salePrice: 3690,
  availability: 'made_to_order',
  category: { id: 1, title: 'Sofy', slug: 'sofy' },
  variants: [
    { id: 'v1', name: 'Granatowy', swatchColor: '#1f3a5f', sku: 'LUND-GR', available: true, images: [{ id: 10, url: '/api/media/file/lund-01.jpg' }] },
    { id: 'v2', name: 'Szary', swatchColor: '#888888', available: false, images: [] },
  ],
} as unknown as Product

const shipping = [{ id: 1, name: 'Kurier', price: 199, freeFrom: null }] as ShippingMethod[]

describe('opis produktu dla wyszukiwarek', () => {
  const previous = process.env.NEXT_PUBLIC_SERVER_URL
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://sklep.pl'
  })
  afterEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = previous
  })

  it('podaje cenę, którą klient faktycznie płaci, i pełne adresy', () => {
    const data = productJsonLd(product, settings, shipping) as Record<string, unknown>
    const offers = data.offers as Record<string, unknown>
    expect(data.name).toBe('Sofa rozkładana Lund')
    expect(data.image).toEqual(['https://sklep.pl/api/media/file/lund-01.jpg'])
    expect(data.sku).toBe('LUND-GR')
    expect(data.color).toBe('Granatowy')
    expect(offers.price).toBe('3690.00')
    expect(offers.priceCurrency).toBe('PLN')
    expect(offers.url).toBe('https://sklep.pl/produkt/sofa-rozkladana-lund')
    expect(offers.availability).toBe('https://schema.org/BackOrder')
    expect(offers.shippingDetails).toMatchObject({ shippingRate: { value: '199.00', currency: 'PLN' } })
  })

  it('pomija pola, których nie ma w bazie, zamiast je zgadywać', () => {
    const data = productJsonLd({ ...product, variants: [], shortDescription: null } as unknown as Product, settings, []) as Record<string, unknown>
    expect(data).not.toHaveProperty('image')
    expect(data).not.toHaveProperty('description')
    expect(data).not.toHaveProperty('sku')
    expect(data.offers).not.toHaveProperty('shippingDetails')
  })

  it('buduje okruszki i dane sprzedawcy', () => {
    expect(breadcrumbJsonLd([{ name: 'Sklep', path: '/sklep' }])).toMatchObject({
      itemListElement: [{ position: 1, name: 'Sklep', item: 'https://sklep.pl/sklep' }],
    })
    expect(organizationJsonLd(settings)).toMatchObject({
      name: 'RYD',
      legalName: 'RYD Meble sp. z o.o.',
      address: { addressLocality: 'Kalisz', addressCountry: 'PL' },
    })
  })
})
