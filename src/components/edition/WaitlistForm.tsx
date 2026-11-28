'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useId, useState, type FormEvent } from 'react'

import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { LEGAL_SLUGS } from '@/lib/constants'
import { WAITLIST_FIELD_ORDER, type WaitlistErrors } from '@/lib/validation'
import { joinWaitlist } from '@/lib/waitlist/actions'

type Props = {
  /** Model, którego dotyczy zapis; bez niego — lista prywatna (wszystkie kolejne edycje). */
  productId?: number
  submitLabel?: string
  successText?: string
  /** `dark`: na pasie w kolorze marki. */
  tone?: 'light' | 'dark'
  className?: string
}

type Values = { name: string; email: string; phone: string }

/** Zapis na listę oczekujących — imię, e-mail i (dobrowolnie) telefon do atelier. */
export function WaitlistForm({
  productId,
  submitLabel = 'Zapisz mnie na listę',
  successText = 'Dziękujemy. Jesteś na liście — napiszemy do Ciebie, zanim sprzedaż się rozpocznie.',
  tone = 'light',
  className,
}: Props) {
  const uid = useId()
  const [values, setValues] = useState<Values>({ name: '', email: '', phone: '' })
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<WaitlistErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const dark = tone === 'dark'

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setMessage(null)
    const result = await joinWaitlist({ form: values, website, productId }).catch(() => null)
    if (result?.ok) {
      setStatus('done')
      return
    }
    setStatus('idle')
    setErrors(result && !result.ok ? (result.fieldErrors ?? {}) : {})
    setMessage(result && !result.ok ? result.message : 'Nie udało się wysłać zgłoszenia. Sprawdź połączenie i spróbuj ponownie.')
    const first = WAITLIST_FIELD_ORDER.find((field) => result && !result.ok && result.fieldErrors?.[field])
    if (first) document.getElementById(`${uid}-${first}`)?.focus()
  }

  if (status === 'done') {
    return (
      <p
        className={cn('flex animate-[fade-up_320ms_var(--ease-out)_both] items-start gap-3', dark ? 'text-paper' : 'text-ink', className)}
        role="status"
      >
        <span className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', dark ? 'bg-paper text-brand' : 'bg-brand text-paper')}>
          <Check aria-hidden="true" size={14} strokeWidth={2.25} />
        </span>
        {successText}
      </p>
    )
  }

  const field = (name: keyof Values, label: string, props: { type?: string; autoComplete?: string; inputMode?: 'tel' | 'email' } = {}) => {
    const id = `${uid}-${name}`
    const error = errors[name]
    return (
      <div>
        <label className={cn('field-label', dark && 'text-paper/80')} htmlFor={id}>
          {label}
          {name === 'phone' && <span className={cn('font-normal', dark ? 'text-paper/50' : 'text-ink-faint')}> (opcjonalnie)</span>}
        </label>
        <input
          aria-describedby={error ? `${id}-blad` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={props.autoComplete}
          className={cn('field-input', dark && 'field-input-dark')}
          id={id}
          inputMode={props.inputMode}
          name={name}
          onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
          type={props.type ?? 'text'}
          value={values[name]}
        />
        {error && (
          <p className={cn('field-message', dark ? 'text-[#f3b9a9]' : 'text-danger')} id={`${id}-blad`}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form className={cn('grid gap-4', className)} noValidate onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Imię i nazwisko', { autoComplete: 'name' })}
        {field('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
      </div>
      {field('phone', 'Telefon', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
      {/* Pole-pułapka na automaty — niewidoczne dla ludzi i czytników ekranu. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-www`}>Strona internetowa</label>
        <input autoComplete="off" id={`${uid}-www`} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
      </div>
      {message && (
        <p className={cn('text-sm', dark ? 'text-[#f3b9a9]' : 'text-danger')} role="alert">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          className={buttonClass({ size: 'lg', variant: dark ? 'light' : 'brand', className: 'px-7' })}
          disabled={status === 'sending'}
          type="submit"
        >
          {status === 'sending' ? 'Zapisuję…' : submitLabel}
        </button>
        <p className={cn('max-w-[40ch] text-[0.8125rem]', dark ? 'text-paper/55' : 'text-ink-faint')}>
          Dane posłużą wyłącznie do wysłania zaproszenia.{' '}
          <Link className="underline underline-offset-2" href={`/${LEGAL_SLUGS.privacy}`}>
            Polityka prywatności
          </Link>
        </p>
      </div>
    </form>
  )
}
