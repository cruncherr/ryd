'use client'

import { Check, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/Field'
import { getInquiryProductTitle, sendContactMessage, type ContactResult } from '@/lib/contact/actions'
import { CONTACT_FIELD_ORDER, MESSAGE_MAX_LENGTH, validateContact, type ContactErrors, type ContactField } from '@/lib/validation'

type Props = {
  /** Pełna nazwa sprzedawcy — do informacji o administratorze danych. */
  sellerName: string | null
  privacyUrl: string | null
}

const FIELDS = ['name', 'email', 'phone', 'message'] as const

function readForm(form: HTMLFormElement) {
  const data = new FormData(form)
  const text = (name: string): string => {
    const value = data.get(name)
    return typeof value === 'string' ? value : ''
  }
  return {
    values: Object.fromEntries(FIELDS.map((name) => [name, text(name)])) as Record<ContactField, string>,
    honeypot: text('adres_www'),
  }
}

export function ContactForm({ sellerName, privacyUrl }: Props) {
  const productSlug = useSearchParams().get('produkt')
  const [product, setProduct] = useState<{ slug: string; title: string } | null>(null)
  const [dismissedProduct, setDismissedProduct] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ContactErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  // Klient przyszedł z karty produktu — dopisujemy do wiadomości, o który mebel pyta.
  useEffect(() => {
    if (!productSlug) return
    let cancelled = false
    getInquiryProductTitle(productSlug)
      .then((title) => {
        if (!cancelled && title) setProduct({ slug: productSlug, title })
      })
      .catch(() => {
        // Bez nazwy produktu formularz działa tak samo — to tylko udogodnienie.
      })
    return () => {
      cancelled = true
    }
  }, [productSlug])

  const inquiry = product && !dismissedProduct && product.slug === productSlug ? product : null

  const revalidateField = (form: HTMLFormElement, name: ContactField) => {
    const found = validateContact(readForm(form).values).errors[name]
    setErrors((current) => {
      if (current[name] === found) return current
      const next = { ...current }
      if (found) next[name] = found
      else delete next[name]
      return next
    })
  }

  const handleChange = (event: ChangeEvent<HTMLFormElement>) => {
    const name = (event.target as unknown as HTMLInputElement).name as ContactField
    if (errors[name]) revalidateField(event.currentTarget, name)
  }

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    const target = event.target as unknown as HTMLInputElement
    if (!(FIELDS as readonly string[]).includes(target.name) || target.value.trim() === '') return
    revalidateField(event.currentTarget, target.name as ContactField)
  }

  const focusFirstInvalid = (form: HTMLFormElement, found: ContactErrors) => {
    const first = CONTACT_FIELD_ORDER.find((name) => found[name])
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isPending) return

    const form = event.currentTarget
    const { values, honeypot } = readForm(form)
    const found = validateContact(values).errors
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(form, found)
      return
    }

    startTransition(async () => {
      let result: ContactResult
      try {
        result = await sendContactMessage({
          form: values,
          website: honeypot,
          source: inquiry ? `Pytanie o produkt: ${inquiry.title}` : 'Formularz kontaktowy',
        })
      } catch {
        setFormError('Nie udało się połączyć ze sklepem. Sprawdź połączenie z internetem i spróbuj ponownie.')
        return
      }

      if (result.ok) {
        setSentTo(values.email.trim())
        return
      }
      setFormError(result.message)
      if (result.fieldErrors) {
        setErrors(result.fieldErrors)
        focusFirstInvalid(form, result.fieldErrors)
      }
    })
  }

  if (sentTo !== null) {
    return (
      <div className="animate-[label-swap_280ms_var(--ease-out)_both] rounded-[var(--radius-panel)] bg-stage p-8 md:p-10" role="status">
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-ink text-paper">
          <Check size={20} strokeWidth={2.25} />
        </span>
        <h2 className="display-3 mt-6">Dziękujemy za wiadomość</h2>
        <p className="mt-3 max-w-md text-ink-soft">
          Odpowiemy na adres <strong className="font-medium text-ink">{sentTo}</strong> najszybciej, jak to możliwe.
        </p>
        <Button className="mt-7" onClick={() => setSentTo(null)} variant="secondary">
          Napisz kolejną wiadomość
        </Button>
      </div>
    )
  }

  return (
    <form aria-busy={isPending || undefined} className="grid gap-5" noValidate onBlur={handleBlur} onChange={handleChange} onSubmit={handleSubmit}>
      {inquiry && (
        <p className="flex items-center justify-between gap-3 rounded-[var(--radius-field)] bg-stage py-2 pr-2 pl-4 text-[0.9375rem]">
          <span>
            <span className="text-ink-soft">Pytanie o: </span>
            <span className="font-medium">{inquiry.title}</span>
          </span>
          <button aria-label="Usuń informację o produkcie" className="icon-btn size-9" onClick={() => setDismissedProduct(true)} type="button">
            <X aria-hidden="true" size={16} strokeWidth={1.75} />
          </button>
        </p>
      )}

      <TextField autoComplete="name" enterKeyHint="next" error={errors.name} label="Imię i nazwisko" name="name" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          enterKeyHint="next"
          error={errors.email}
          inputMode="email"
          label="E-mail"
          name="email"
          required
          spellCheck={false}
          type="email"
        />
        <TextField autoComplete="tel" enterKeyHint="next" error={errors.phone} inputMode="tel" label="Telefon" name="phone" optional type="tel" />
      </div>
      <TextArea
        error={errors.message}
        label="Wiadomość"
        maxLength={MESSAGE_MAX_LENGTH}
        name="message"
        placeholder={inquiry ? 'Np. pytanie o wymiary, tkaninę albo termin realizacji' : undefined}
        required
        rows={6}
      />

      {/* Pole-pułapka na automaty; ludzie go nie widzą i nie da się do niego dojść klawiaturą. */}
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
        <Button className="shrink-0" loading={isPending} size="lg" type="submit">
          Wyślij wiadomość
        </Button>
        <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
          Administratorem danych jest {(sellerName || 'sprzedawca').replace(/\.$/, '')}. Wykorzystamy je wyłącznie do odpowiedzi na Twoją wiadomość.
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
  )
}
