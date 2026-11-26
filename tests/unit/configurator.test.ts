import { describe, expect, it } from 'vitest'

import { parseCartInput } from '@/lib/cart/input'
import {
  configKey,
  configLine,
  configSummary,
  configuredPrice,
  fabricSurcharge,
  lowestConfiguredPrice,
  matchingVariantIndex,
  priceVaries,
  resolveConfig,
  toLineConfig,
  type ConfigOptions,
} from '@/lib/configurator'

const options: ConfigOptions = {
  sizes: [
    { id: 's2', label: '2-osobowa', priceDelta: -500, width: 176, depth: 96, height: 88, sleepWidth: 125, sleepLength: 195, bodyDepth: null, chaiseWidth: null },
    { id: 's3', label: '3-osobowa', priceDelta: 0, width: 214, depth: 96, height: 88, sleepWidth: 155, sleepLength: 195, bodyDepth: null, chaiseWidth: null },
    { id: 'sxl', label: '3-osobowa XL', priceDelta: 450, width: 236, depth: 96, height: 88, sleepWidth: 175, sleepLength: 195, bodyDepth: null, chaiseWidth: null },
  ],
  fabrics: [
    {
      id: 1,
      name: 'Welur hydrofobowy',
      type: 'velvet',
      typeLabel: 'Welur',
      surchargePercent: 0,
      description: null,
      features: [],
      composition: null,
      martindale: null,
      colors: [
        { id: 'granat', name: 'Granat', code: null, swatchColor: '#1A3F74', available: true, imageUrl: null },
        { id: 'roz', name: 'Pudrowy róż', code: '12', swatchColor: '#C8A19D', available: false, imageUrl: null },
      ],
    },
    {
      id: 2,
      name: 'Bouclé',
      type: 'boucle',
      typeLabel: 'Bouclé',
      surchargePercent: 12,
      description: null,
      features: [],
      composition: null,
      martindale: null,
      colors: [{ id: 'mleczny', name: 'Mleczny', code: null, swatchColor: '#EAE3D6', available: true, imageUrl: null }],
    },
  ],
  legs: [
    { id: 'czarne', name: 'Czarny metal', swatchColor: '#1E1E1E', priceDelta: 0 },
    { id: 'dab', name: 'Dąb naturalny', swatchColor: '#B88A58', priceDelta: 190 },
  ],
  sideChoice: true,
  defaultSide: 'right',
}

describe('konfigurator: wybór klienta', () => {
  it('uzupełnia brakujące pola wartościami domyślnymi', () => {
    const resolved = resolveConfig(options, {})
    expect(resolved?.size?.id).toBe('s3')
    expect(resolved?.fabric?.id).toBe(1)
    expect(resolved?.color?.id).toBe('granat')
    expect(resolved?.legs?.id).toBe('czarne')
    expect(resolved?.side).toBe('right')
  })

  it('odrzuca wybór czegoś, czego nie ma albo jest niedostępne', () => {
    expect(resolveConfig(options, { size: 'nie-ma' })).toBeNull()
    expect(resolveConfig(options, { fabric: 99 })).toBeNull()
    expect(resolveConfig(options, { fabric: 1, color: 'roz' })).toBeNull()
    expect(resolveConfig(options, { fabric: 1, color: 'mleczny' })).toBeNull()
    expect(resolveConfig(options, { legs: 'zlote' })).toBeNull()
  })

  it('ma stały zapis — ta sama konfiguracja to ta sama pozycja koszyka', () => {
    const a = toLineConfig(resolveConfig(options, { size: 'sxl', side: 'left' })!)
    const b = toLineConfig(resolveConfig(options, { side: 'left', size: 'sxl', fabric: 1, color: 'granat', legs: 'czarne' })!)
    expect(configKey(a)).toBe(configKey(b))
    expect(configKey(a)).not.toBe(configKey(toLineConfig(resolveConfig(options, {})!)))
  })
})

describe('konfigurator: cena', () => {
  it('dolicza wymiar, procent za tkaninę od ceny wymiaru i nóżki', () => {
    const base = 3690
    expect(configuredPrice(base, resolveConfig(options, {}))).toBe(3690)
    expect(configuredPrice(base, resolveConfig(options, { size: 's2' }))).toBe(3190)
    // 12% od (3690 + 450) = 496,80 → 497 zł; + 190 zł za nóżki
    expect(configuredPrice(base, resolveConfig(options, { size: 'sxl', fabric: 2, legs: 'dab' }))).toBe(3690 + 450 + 497 + 190)
  })

  it('zaokrągla dopłatę za tkaninę do pełnych złotych', () => {
    expect(fabricSurcharge(3333, 12)).toBe(400)
    expect(fabricSurcharge(3690, 0)).toBe(0)
  })

  it('podaje najniższą możliwą cenę do napisu „od”', () => {
    expect(lowestConfiguredPrice(3690, options)).toBe(3190)
    expect(priceVaries(options)).toBe(true)
    expect(priceVaries({ ...options, sizes: [options.sizes[1]!], fabrics: [options.fabrics[0]!], legs: [options.legs[0]!] })).toBe(false)
  })

  it('opisuje konfigurację słowami do koszyka i zamówienia', () => {
    const resolved = resolveConfig(options, { size: 'sxl', fabric: 2, legs: 'dab', side: 'left' })
    expect(configSummary(resolved)).toEqual([
      { label: 'Wymiar', value: '3-osobowa XL, 236 × 96 cm' },
      { label: 'Tkanina', value: 'Bouclé (bouclé)' },
      { label: 'Kolor', value: 'Mleczny' },
      { label: 'Nóżki', value: 'Dąb naturalny' },
      { label: 'Szezlong', value: 'po lewej stronie' },
    ])
    expect(configLine(resolved)).toBe('3-osobowa XL (236 × 96 cm) · Bouclé, Mleczny · nóżki: dąb naturalny · szezlong po lewej')
  })
})

describe('konfigurator: zdjęcia i koszyk', () => {
  it('znajduje zdjęcia w wybranym kolorze po tkaninie i nazwie koloru', () => {
    const variants = [
      { fabricLinkId: null, name: 'Granat' },
      { fabricLinkId: 1, name: ' granat ' },
    ]
    expect(matchingVariantIndex(variants, 1, 'Granat')).toBe(1)
    expect(matchingVariantIndex(variants, 2, 'Granat')).toBe(-1)
    expect(matchingVariantIndex(variants, null, 'Granat')).toBe(-1)
  })

  it('przyjmuje konfigurację w koszyku i rozróżnia pozycje z innym wyborem', () => {
    const lines = parseCartInput([
      { productId: 2, variantId: 'v', quantity: 1, config: { size: 's3', fabric: 1, color: 'granat' } },
      { productId: 2, variantId: 'v', quantity: 2, config: { size: 's3', fabric: 1, color: 'granat' } },
      { productId: 2, variantId: 'v', quantity: 1, config: { size: 'sxl', fabric: 1, color: 'granat' } },
    ])
    expect(lines).toHaveLength(2)
    expect(lines[0]?.quantity).toBe(3)
  })

  it('odrzuca konfigurację w złym formacie', () => {
    expect(parseCartInput([{ productId: 2, variantId: 'v', quantity: 1, config: { side: 'gora' } }])).toEqual([])
    expect(parseCartInput([{ productId: 2, variantId: 'v', quantity: 1, config: { fabric: 'welur' } }])).toEqual([])
  })
})
