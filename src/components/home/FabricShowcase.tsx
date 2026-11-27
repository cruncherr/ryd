'use client'

import { useState } from 'react'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { ButtonLink } from '@/components/ui/Button'
import { Emphasis } from '@/components/ui/Emphasis'
import type { FabricOption } from '@/lib/configurator'
import { cn } from '@/lib/cn'
import { noOrphans } from '@/lib/typography'
import type { Homepage } from '@/payload-types'

type Props = {
  content: Homepage['fabrics']
  fabrics: FabricOption[]
  samplesEnabled: boolean
}

const thousands = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/**
 * Próbnik na stronie głównej: duża próbka wybranego koloru i pełna paleta obok.
 * Zmiana koloru to tylko płynne przejście barwy — bez przesuwania układu.
 */
export function FabricShowcase({ content, fabrics, samplesEnabled }: Props) {
  const [fabricId, setFabricId] = useState(fabrics[0]?.id ?? 0)
  const fabric = fabrics.find((item) => item.id === fabricId) ?? fabrics[0]
  const [colorId, setColorId] = useState(fabric?.colors.find((color) => color.available)?.id ?? '')
  if (!content?.title || !fabric) return null
  const color = fabric.colors.find((item) => item.id === colorId) ?? fabric.colors.find((item) => item.available) ?? fabric.colors[0]
  if (!color) return null

  return (
    <section className="shell section-y">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] md:aspect-[5/4]">
            <FabricSwatch
              className="absolute inset-0 bg-cover bg-center transition-[background-color] duration-300 ease-out"
              color={color.swatchColor}
              imageUrl={color.photoUrl ?? color.imageUrl}
              type={fabric.type}
            />
            {/* Miękkie załamanie światła — próbka wygląda jak kawałek materiału, a nie płaski kolor. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,transparent_38%,rgb(255_255_255/0.14)_50%,transparent_62%),radial-gradient(130%_90%_at_50%_120%,rgb(0_0_0/0.28),transparent_60%)]"
            />
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3 md:inset-x-6 md:bottom-6">
              <div className="rounded-2xl bg-paper/92 px-4 py-3 shadow-[0_10px_30px_-12px_rgb(28_26_24/0.35)] backdrop-blur-md">
                <p className="text-xs text-ink-soft">{[fabric.supplier, fabric.typeLabel.toLowerCase()].filter(Boolean).join(' · ')}</p>
                <p className="text-[1.0625rem] font-medium">
                  {fabric.name} {color.name}
                  {color.code ? <span className="text-ink-soft"> · {color.code}</span> : null}
                </p>
              </div>
              {fabric.martindale && (
                <p className="tabular rounded-full bg-paper/92 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                  {thousands(fabric.martindale)} cykli Martindale
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          {content.eyebrow && <p className="eyebrow mb-4">{content.eyebrow}</p>}
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
          {content.text && <p className="lead mt-5 max-w-[46ch]">{noOrphans(content.text)}</p>}

          <div aria-label="Tkanina" className="mt-8 flex flex-wrap gap-2" role="radiogroup">
            {fabrics.map((item) => (
              <label className="choice flex h-10 items-center rounded-full px-4" key={item.id}>
                <input
                  checked={item.id === fabric.id}
                  className="sr-only"
                  name="probnik-tkanina"
                  onChange={() => {
                    setFabricId(item.id)
                    setColorId(item.colors.find((option) => option.available)?.id ?? '')
                  }}
                  type="radio"
                />
                <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
              </label>
            ))}
          </div>

          {fabric.description && <p className="mt-5 max-w-[50ch] text-[0.9375rem] text-ink-soft">{noOrphans(fabric.description)}</p>}
          {fabric.features.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {fabric.features.map((feature) => (
                <li className="rounded-full bg-stage px-2.5 py-1 text-xs font-medium text-ink-soft" key={feature.value}>
                  {feature.label}
                </li>
              ))}
            </ul>
          )}

          <div aria-label="Kolor" className="mt-6 flex flex-wrap gap-3.5" role="radiogroup">
            {fabric.colors.map((option) => (
              <label className={cn('swatch-choice')} key={option.id} title={`${fabric.name} ${option.name}`}>
                <input
                  checked={option.id === color.id}
                  className="sr-only"
                  disabled={!option.available}
                  name="probnik-kolor"
                  onChange={() => setColorId(option.id)}
                  type="radio"
                />
                <FabricSwatch className="size-11" color={option.swatchColor} imageUrl={option.imageUrl} type={fabric.type} />
                <span className="sr-only">
                  {fabric.name} {option.name}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {samplesEnabled && (
              <ButtonLink href={`/tkaniny?probka=${fabric.id}-${color.id}`} size="lg" variant="brand">
                Zamów bezpłatne próbki
              </ButtonLink>
            )}
            <ButtonLink href="/tkaniny" size="lg" variant="secondary">
              Wszystkie tkaniny
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
