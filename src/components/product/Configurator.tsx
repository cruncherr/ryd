'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import {
  configuredPrice,
  fabricSurcharge,
  sizeText,
  type ConfigOptions,
  type LineConfig,
  type ResolvedConfig,
} from '@/lib/configurator'
import { cn } from '@/lib/cn'
import type { Side } from '@/lib/constants'
import { formatPLN } from '@/lib/money'

import { DimensionDrawing } from './DimensionDrawing'

type Props = {
  options: ConfigOptions
  resolved: ResolvedConfig
  /** Cena, którą płaci klient za wersję podstawową (promocyjna, jeśli trwa promocja). */
  basePrice: number
  onChange: (patch: Partial<LineConfig>) => void
  samplesEnabled: boolean
}

const cmText = (value: number) => String(value).replace('.', ',')

function Step({ number, title, value, children }: { number: number; title: string; value?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      {/* Legenda pływa, żeby zajęła całą szerokość — inaczej przeglądarki ignorują układ flex. */}
      <legend className="float-left mb-4 flex w-full items-baseline justify-between gap-4">
        <span className="shrink-0 text-[0.9375rem] font-medium">
          <span className="tabular mr-2 text-sm text-ink-faint">{String(number).padStart(2, '0')}</span>
          {title}
        </span>
        {value && <span className="min-w-0 truncate text-right text-sm text-ink-soft">{value}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

const signed = (amount: number) => (amount === 0 ? 'w cenie' : `${amount > 0 ? '+' : '−'}${formatPLN(Math.abs(amount))}`)

function SideIcon({ side }: { side: Side }) {
  return (
    <svg aria-hidden="true" className={cn('h-7 w-11 text-ink', side === 'left' && '-scale-x-100')} fill="none" viewBox="0 0 44 28">
      <path d="M2 3h40v22h-11V13H2z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M2 7.5h40" stroke="currentColor" strokeOpacity=".4" />
    </svg>
  )
}

/**
 * Wybór wymiaru, tkaniny, koloru, nóżek i strony szezlonga. Każda opcja pokazuje, ile kosztuje,
 * zanim klient ją kliknie — bez zgadywania i bez niespodzianek w koszyku.
 */
export function Configurator({ options, resolved, basePrice, onChange, samplesEnabled }: Props) {
  let step = 0
  const priceWith = (patch: Partial<ResolvedConfig>) => configuredPrice(basePrice, { ...resolved, ...patch })
  const forSize = basePrice + (resolved.size?.priceDelta ?? 0)

  const largest = {
    width: Math.max(...options.sizes.map((size) => size.width), 1),
    depth: Math.max(...options.sizes.map((size) => size.depth), 1),
  }
  const corner = options.sideChoice || options.sizes.some((size) => size.bodyDepth || size.chaiseWidth)

  return (
    <div className="mt-8 grid gap-6">
      {options.sizes.length > 0 && resolved.size && (
        <Step number={++step} title="Wymiar" value={sizeText(resolved.size)}>
          <div
            className={cn(
              'grid gap-2',
              options.sizes.length === 3 ? 'grid-cols-3' : options.sizes.length % 2 === 0 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3',
            )}
          >
            {options.sizes.map((size) => {
              const price = priceWith({ size })
              return (
                <label className="choice px-3 py-3 sm:px-3.5" key={size.id}>
                  <input
                    checked={size.id === resolved.size?.id}
                    className="sr-only"
                    name="wymiar"
                    onChange={() => onChange({ size: size.id })}
                    type="radio"
                    value={size.id}
                  />
                  <span className="block text-[0.9375rem] leading-snug font-medium">{size.label}</span>
                  <span className="tabular mt-0.5 block text-[0.8125rem] text-ink-soft">{sizeText(size)}</span>
                  <span className="tabular mt-2 block text-sm font-medium">{formatPLN(price)}</span>
                </label>
              )
            })}
          </div>

          {options.sizes.length > 0 && (
            <div className="mt-4 rounded-xl bg-stage/60 px-3 pt-2 pb-3">
              <DimensionDrawing corner={corner} largest={largest} side={resolved.side} size={resolved.size} />
              <dl className="tabular mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.8125rem] text-ink-soft">
                {resolved.size.height && (
                  <div className="flex gap-1.5">
                    <dt>Wysokość</dt>
                    <dd className="font-medium text-ink">{cmText(resolved.size.height)} cm</dd>
                  </div>
                )}
                {resolved.size.sleepWidth && resolved.size.sleepLength && (
                  <div className="flex gap-1.5">
                    <dt>Spanie</dt>
                    <dd className="font-medium text-ink">
                      {cmText(resolved.size.sleepWidth)} × {cmText(resolved.size.sleepLength)} cm
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </Step>
      )}

      {options.fabrics.length > 0 && resolved.fabric && resolved.color && (
        <Step
          number={++step}
          title="Tkanina i kolor"
          value={
            <>
              {resolved.fabric.name} <span className="text-ink">{resolved.color.name}</span>
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            {options.fabrics.map((fabric) => {
              const surcharge = fabricSurcharge(forSize, fabric.surchargePercent)
              return (
                <label className="choice flex h-11 items-center gap-2 rounded-full px-4" key={fabric.id}>
                  <input
                    checked={fabric.id === resolved.fabric?.id}
                    className="sr-only"
                    name="tkanina"
                    onChange={() => {
                      const color = fabric.colors.find((item) => item.available)
                      onChange({ fabric: fabric.id, color: color?.id })
                    }}
                    type="radio"
                    value={fabric.id}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">{fabric.name}</span>
                  <span className="tabular text-[0.8125rem] whitespace-nowrap text-ink-soft">
                    {fabric.typeLabel.toLowerCase()} · {signed(surcharge)}
                  </span>
                </label>
              )
            })}
          </div>

          {(resolved.fabric.description || resolved.fabric.features.length > 0) && (
            <div className="mt-4">
              {resolved.fabric.description && <p className="max-w-[52ch] text-sm text-ink-soft">{resolved.fabric.description}</p>}
              {(resolved.fabric.supplier || resolved.fabric.weight || resolved.fabric.composition) && (
                <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                  {[resolved.fabric.supplier && `Tkanina ${resolved.fabric.supplier}`, resolved.fabric.composition, resolved.fabric.weight]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {resolved.fabric.features.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {resolved.fabric.features.map((feature) => (
                    <li className="rounded-full bg-stage px-2.5 py-1 text-xs font-medium text-ink-soft" key={feature.value}>
                      {feature.label}
                    </li>
                  ))}
                  {resolved.fabric.martindale && (
                    <li className="tabular rounded-full bg-stage px-2.5 py-1 text-xs font-medium text-ink-soft">
                      {new Intl.NumberFormat('pl-PL', { useGrouping: 'always' } as Intl.NumberFormatOptions).format(resolved.fabric.martindale)} cykli
                      Martindale
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-x-3.5 gap-y-3.5" role="presentation">
            {resolved.fabric.colors.map((color) => (
              <label
                className="swatch-choice"
                key={color.id}
                title={`${resolved.fabric!.name} ${color.name}${color.available ? '' : ' — niedostępny'}`}
              >
                <input
                  checked={color.id === resolved.color?.id}
                  className="peer sr-only"
                  disabled={!color.available}
                  name="kolor"
                  onChange={() => onChange({ color: color.id })}
                  type="radio"
                  value={color.id}
                />
                <FabricSwatch className="size-11" color={color.swatchColor} imageUrl={color.imageUrl} type={resolved.fabric!.type} />
                <span className="sr-only">
                  {resolved.fabric!.name} {color.name}
                  {color.available ? '' : ' (niedostępny)'}
                </span>
              </label>
            ))}
          </div>

          {samplesEnabled && (
            <Link
              className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium"
              href={`/tkaniny?probka=${resolved.fabric.id}-${resolved.color.id}`}
            >
              <span className="link-line">Zamów bezpłatną próbkę tego koloru</span>
              <ArrowRight aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" size={15} />
            </Link>
          )}
        </Step>
      )}

      {options.legs.length > 1 && resolved.legs && (
        <Step number={++step} title="Nóżki" value={resolved.legs.name}>
          <div className="flex flex-wrap gap-2">
            {options.legs.map((legs) => (
              <label className="choice flex h-11 items-center gap-2.5 rounded-full pr-4 pl-2.5" key={legs.id}>
                <input
                  checked={legs.id === resolved.legs?.id}
                  className="sr-only"
                  name="nozki"
                  onChange={() => onChange({ legs: legs.id })}
                  type="radio"
                  value={legs.id}
                />
                <span
                  aria-hidden="true"
                  className="size-6 rounded-full ring-1 ring-black/10"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.45), transparent 48%), ${legs.swatchColor}`,
                  }}
                />
                <span className="text-sm font-medium whitespace-nowrap">{legs.name}</span>
                <span className="tabular text-[0.8125rem] whitespace-nowrap text-ink-soft">{signed(legs.priceDelta)}</span>
              </label>
            ))}
          </div>
        </Step>
      )}

      {options.sideChoice && resolved.side && (
        <Step number={++step} title="Strona szezlonga" value={resolved.side === 'left' ? 'Po lewej' : 'Po prawej'}>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right'] as const).map((side) => (
              <label className="choice flex items-center gap-3 px-3.5 py-3" key={side}>
                <input
                  checked={resolved.side === side}
                  className="sr-only"
                  name="strona"
                  onChange={() => onChange({ side })}
                  type="radio"
                  value={side}
                />
                <SideIcon side={side} />
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] leading-snug font-medium">{side === 'left' ? 'Po lewej' : 'Po prawej'}</span>
                  <span className="block text-[0.8125rem] text-ink-soft">
                    {side === options.defaultSide ? 'jak na zdjęciach' : 'odbicie lustrzane'}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2.5 text-[0.8125rem] text-ink-soft">Stronę określamy, stojąc przodem do mebla.</p>
        </Step>
      )}
    </div>
  )
}
