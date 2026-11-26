'use client'

import { Check, X } from 'lucide-react'
import { useState, useTransition, type FormEvent } from 'react'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import type { FabricOption } from '@/lib/configurator'
import { cn } from '@/lib/cn'
import { orderSamples, type SamplesResult } from '@/lib/samples/actions'
import { noOrphans } from '@/lib/typography'
import { formatPostalCodeInput, SAMPLES_FIELD_ORDER, validateSamples, type SamplesErrors } from '@/lib/validation'

type Props = {
  fabrics: FabricOption[]
  /** Próbka zaznaczona od razu — gdy klient przyszedł z konfiguratora („fabricId-colorId”). */
  preselected: string | null
  samplesEnabled: boolean
  max: number
  note: string | null
  sellerName: string | null
  privacyUrl: string | null
}

type SamplePick = { fabric: number; color: string }

const keyOf = (pick: SamplePick) => `${pick.fabric}-${pick.color}`
const thousands = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

function parsePreselected(value: string | null, fabrics: FabricOption[]): SamplePick[] {
  if (!value) return []
  const match = /^(\d+)-([A-Za-z0-9_-]{1,64})$/.exec(value)
  if (!match) return []
  const fabric = fabrics.find((item) => item.id === Number(match[1]))
  const color = fabric?.colors.find((item) => item.id === match[2] && item.available)
  return fabric && color ? [{ fabric: fabric.id, color: color.id }] : []
}

/**
 * Próbnik: wszystkie tkaniny i kolory, a przy nich zaznaczanie bezpłatnych próbek.
 * Wybrane próbki zbierają się w pasku na dole ekranu; formularz z adresem jest na końcu strony.
 */
export function SamplePicker({ fabrics, preselected, samplesEnabled, max, note, sellerName, privacyUrl }: Props) {
  const [picks, setPicks] = useState<SamplePick[]>(() => parsePreselected(preselected, fabrics))
  const [errors, setErrors] = useState<SamplesErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = new Set(picks.map(keyOf))
  const full = picks.length >= max

  const toggle = (pick: SamplePick) => {
    setFormError(null)
    setPicks((current) =>
      current.some((item) => keyOf(item) === keyOf(pick))
        ? current.filter((item) => keyOf(item) !== keyOf(pick))
        : current.length >= max
          ? current
          : [...current, pick],
    )
  }

  const describe = (pick: SamplePick) => {
    const fabric = fabrics.find((item) => item.id === pick.fabric)
    const color = fabric?.colors.find((item) => item.id === pick.color)
    return fabric && color ? { fabric, color } : null
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => {
      const value = data.get(name)
      return typeof value === 'string' ? value : ''
    }
    const values = Object.fromEntries(SAMPLES_FIELD_ORDER.map((name) => [name, text(name)]))
    const found = validateSamples(values).errors
    setErrors(found)
    setFormError(null)
    if (picks.length === 0) {
      setFormError('Zaznacz co najmniej jedną próbkę — kliknij kolor w próbniku powyżej.')
      return
    }
    const first = SAMPLES_FIELD_ORDER.find((name) => found[name])
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    startTransition(async () => {
      let result: SamplesResult
      try {
        result = await orderSamples({ form: values, samples: picks, website: text('adres_www') })
      } catch {
        setFormError('Nie udało się połączyć ze sklepem. Sprawdź połączenie z internetem i spróbuj ponownie.')
        return
      }
      if (result.ok) {
        setSentTo(String(values.email ?? '').trim())
        return
      }
      setFormError(result.message)
      if (result.fieldErrors) setErrors(result.fieldErrors)
    })
  }

  return (
    <>
      <div className="mt-12 grid gap-0 md:mt-16">
        {fabrics.map((fabric) => (
          <section className="grid gap-8 border-t border-line py-10 md:py-14 lg:grid-cols-12 lg:gap-12" id={`tkanina-${fabric.id}`} key={fabric.id}>
            <div className="lg:col-span-4">
              <p className="eyebrow">{fabric.typeLabel}</p>
              <h2 className="display-3 mt-2">{fabric.name}</h2>
              <p className="tabular mt-2 text-sm font-medium">
                {fabric.surchargePercent > 0 ? `Dopłata ${fabric.surchargePercent}% do ceny mebla` : 'W cenie mebla'}
              </p>
              {fabric.description && <p className="mt-4 max-w-[44ch] text-[0.9375rem] text-ink-soft">{noOrphans(fabric.description)}</p>}
              {fabric.features.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {fabric.features.map((feature) => (
                    <li className="rounded-full bg-stage px-2.5 py-1 text-xs font-medium text-ink-soft" key={feature.value}>
                      {feature.label}
                    </li>
                  ))}
                </ul>
              )}
              {(fabric.composition || fabric.martindale) && (
                <dl className="mt-5 grid gap-1.5 text-sm">
                  {fabric.composition && (
                    <div className="flex gap-2">
                      <dt className="text-ink-soft">Skład:</dt>
                      <dd>{fabric.composition}</dd>
                    </div>
                  )}
                  {fabric.martindale && (
                    <div className="flex gap-2">
                      <dt className="text-ink-soft">Ścieranie:</dt>
                      <dd className="tabular">{thousands(fabric.martindale)} cykli Martindale</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:col-span-8 lg:grid-cols-5">
              {fabric.colors.map((color) => {
                const pick = { fabric: fabric.id, color: color.id }
                const isSelected = selected.has(keyOf(pick))
                const disabled = !color.available || (!isSelected && full) || !samplesEnabled
                const swatch = (
                  <>
                    <span className="relative block">
                      <FabricSwatch
                        className={cn(
                          'aspect-square rounded-xl transition-[box-shadow] duration-150 ease-out',
                          isSelected && 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1),0_0_0_3px_var(--color-paper),0_0_0_5px_var(--color-brand)]',
                        )}
                        color={color.swatchColor}
                        imageUrl={color.imageUrl}
                        type={fabric.type}
                      />
                      {samplesEnabled && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-2 right-2 grid size-6 place-items-center rounded-full transition-[opacity,transform] duration-150 ease-out',
                            isSelected ? 'scale-100 bg-brand text-paper opacity-100' : 'scale-90 bg-paper/90 text-ink opacity-0 group-hover:opacity-100',
                          )}
                        >
                          {isSelected ? <Check size={14} strokeWidth={2.5} /> : <span className="text-base leading-none">+</span>}
                        </span>
                      )}
                    </span>
                    <span className="mt-2.5 block text-sm leading-snug font-medium">{color.name}</span>
                    {color.code && <span className="block text-xs text-ink-soft">nr {color.code}</span>}
                    {!color.available && <span className="block text-xs text-ink-soft">chwilowo niedostępny</span>}
                  </>
                )
                return (
                  <li key={color.id}>
                    {samplesEnabled ? (
                      <label className={cn('group block cursor-pointer text-left active:scale-[0.97] transition-transform duration-150 ease-out', disabled && 'cursor-not-allowed opacity-50')}>
                        <input checked={isSelected} className="sr-only" disabled={disabled} onChange={() => toggle(pick)} type="checkbox" />
                        <span className="sr-only">Zamów próbkę: </span>
                        {swatch}
                      </label>
                    ) : (
                      <div>{swatch}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {samplesEnabled && (
        <section className="scroll-mt-24 border-t border-line pt-12 md:pt-16" id="zamow-probki">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="display-2">Zamów próbki</h2>
              <p className="lead mt-4 max-w-[40ch]">
                {noOrphans(`Zaznacz do ${max} kolorów. ${note ?? 'Próbki wysyłamy bezpłatnie.'}`)}
              </p>
              <ul className="mt-8 grid gap-2" aria-live="polite">
                {picks.length === 0 && <li className="text-[0.9375rem] text-ink-soft">Nie zaznaczono jeszcze żadnej próbki.</li>}
                {picks.map((pick) => {
                  const info = describe(pick)
                  if (!info) return null
                  return (
                    <li className="flex items-center gap-3 rounded-xl bg-surface py-2 pr-2 pl-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]" key={keyOf(pick)}>
                      <FabricSwatch className="size-9 shrink-0 rounded-lg" color={info.color.swatchColor} imageUrl={info.color.imageUrl} type={info.fabric.type} />
                      <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug">
                        <span className="block font-medium">{info.color.name}</span>
                        <span className="block text-sm text-ink-soft">{info.fabric.name}</span>
                      </span>
                      <button aria-label={`Usuń próbkę ${info.color.name}`} className="icon-btn size-9" onClick={() => toggle(pick)} type="button">
                        <X aria-hidden="true" size={16} strokeWidth={1.75} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="lg:col-span-7">
              {sentTo !== null ? (
                <div className="animate-[label-swap_280ms_var(--ease-out)_both] rounded-[var(--radius-panel)] bg-stage p-8 md:p-10" role="status">
                  <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-brand text-paper">
                    <Check size={20} strokeWidth={2.25} />
                  </span>
                  <h3 className="display-3 mt-6">Próbki są w drodze do realizacji</h3>
                  <p className="mt-3 max-w-md text-ink-soft">
                    Potwierdzenie wysyłki prześlemy na adres <strong className="font-medium text-ink">{sentTo}</strong>.
                  </p>
                  <Button
                    className="mt-7"
                    onClick={() => {
                      setSentTo(null)
                      setPicks([])
                    }}
                    variant="secondary"
                  >
                    Zamów inne próbki
                  </Button>
                </div>
              ) : (
                <form aria-busy={isPending || undefined} className="relative grid gap-5" noValidate onSubmit={handleSubmit}>
                  <TextField autoComplete="name" error={errors.name} label="Imię i nazwisko" name="name" required />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      error={errors.email}
                      inputMode="email"
                      label="E-mail"
                      name="email"
                      required
                      spellCheck={false}
                      type="email"
                    />
                    <TextField autoComplete="tel" error={errors.phone} inputMode="tel" label="Telefon" name="phone" optional type="tel" />
                  </div>
                  <TextField autoComplete="street-address" error={errors.street} label="Ulica i numer" name="street" required />
                  <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                    <TextField
                      autoComplete="postal-code"
                      error={errors.postalCode}
                      inputMode="numeric"
                      label="Kod pocztowy"
                      maxLength={6}
                      name="postalCode"
                      onChange={(event) => {
                        event.currentTarget.value = formatPostalCodeInput(event.currentTarget.value)
                      }}
                      placeholder="00-000"
                      required
                    />
                    <TextField autoComplete="address-level2" error={errors.city} label="Miejscowość" name="city" required />
                  </div>

                  <div aria-hidden="true" className="pointer-events-none absolute -left-[200vw] size-px overflow-hidden opacity-0">
                    <label>
                      Adres strony (zostaw puste)
                      <input autoComplete="off" name="adres_www" tabIndex={-1} type="text" />
                    </label>
                  </div>

                  {formError && (
                    <p className="field-message rounded-[var(--radius-field)] border border-danger/30 bg-danger/5 px-4 py-3 text-[0.9375rem] text-danger" role="alert">
                      {formError}
                    </p>
                  )}

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Button className="shrink-0" loading={isPending} size="lg" type="submit" variant="brand">
                      {picks.length > 0 ? `Zamów próbki (${picks.length})` : 'Zamów próbki'}
                    </Button>
                    <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
                      Administratorem danych jest {(sellerName || 'sprzedawca').replace(/\.$/, '')}. Wykorzystamy je wyłącznie do wysłania próbek.
                      {privacyUrl && (
                        <>
                          {' '}
                          <a className="underline underline-offset-4" href={privacyUrl}>
                            Polityka prywatności
                          </a>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pasek z liczbą wybranych próbek — widoczny, dopóki klient przegląda kolory. */}
      {samplesEnabled && sentTo === null && (
        <div
          aria-hidden={picks.length === 0}
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out)]',
            picks.length > 0 ? 'translate-y-0' : 'translate-y-full',
          )}
          inert={picks.length === 0}
        >
          <div className="shell flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="flex -space-x-2">
                {picks.slice(0, 6).map((pick) => {
                  const info = describe(pick)
                  return info ? (
                    <FabricSwatch className="size-8 rounded-full ring-2 ring-paper" color={info.color.swatchColor} imageUrl={info.color.imageUrl} key={keyOf(pick)} type={info.fabric.type} />
                  ) : null
                })}
              </span>
              <p className="tabular truncate text-sm">
                <span className="font-medium">
                  {picks.length} z {max}
                </span>{' '}
                <span className="text-ink-soft">próbek</span>
              </p>
            </div>
            <a className="btn h-11 shrink-0 bg-brand px-5 text-[0.9375rem] text-paper" href="#zamow-probki">
              Przejdź do zamówienia
            </a>
          </div>
        </div>
      )}
    </>
  )
}
