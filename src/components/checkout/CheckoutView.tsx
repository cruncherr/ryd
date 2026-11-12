'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode } from 'react'

import { AnimatedPrice } from '@/components/cart/CartDrawer'
import { Button, buttonClass } from '@/components/ui/Button'
import { Checkbox, FieldError, OptionCard, TextArea, TextField } from '@/components/ui/Field'
import { trackBeginCheckout } from '@/lib/analytics'
import { cartSubtotal, useCart, type CartLine } from '@/lib/cart/store'
import { orderTotal, shippingCostFor, type PaymentOption } from '@/lib/cart/totals'
import type { PaymentMethod } from '@/lib/constants'
import { useCartSync } from '@/lib/hooks'
import { formatPLN } from '@/lib/money'
import { placeOrder } from '@/lib/orders/actions'
import type { PlaceOrderResult } from '@/lib/orders/types'
import { shippingLabel } from '@/lib/orders/view'
import {
  CHECKOUT_FIELD_ORDER,
  formatPostalCodeInput,
  NOTE_MAX_LENGTH,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutField,
} from '@/lib/validation'

import { clearDraft, markOrderPlaced, readDraft, saveDraft, TEXT_FIELDS, type CheckoutDraft, type TextFieldName } from './draft'

export type CheckoutShippingMethod = {
  id: number
  name: string
  description: string | null
  deliveryTime: string | null
  price: number
  freeFrom: number | null
  allowCod: boolean
}

export type CheckoutConfig = {
  shippingMethods: CheckoutShippingMethod[]
  paymentOptions: PaymentOption[]
  priceNote: string | null
  /** Pełna nazwa sprzedawcy — do informacji o administratorze danych. */
  sellerName: string | null
  /** Sklep w trybie przygotowania: zamówienia są oznaczane jako testowe. */
  isTest: boolean
  links: { terms: string | null; privacy: string | null; returns: string | null; delivery: string | null }
  contact: { email: string | null; phone: string | null }
}

const CONNECTION_ERROR =
  'Nie udało się połączyć ze sklepem. Sprawdź połączenie z internetem i spróbuj ponownie — zamówienie nie zostało jeszcze złożone.'

/** Identyfikator jednej próby złożenia zamówienia; ponowione kliknięcie nie tworzy drugiego zamówienia. */
function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`
}

function readForm(form: HTMLFormElement) {
  const data = new FormData(form)
  const text = (name: string): string => {
    const value = data.get(name)
    return typeof value === 'string' ? value : ''
  }
  return {
    ...(Object.fromEntries(TEXT_FIELDS.map((name) => [name, text(name)])) as Record<TextFieldName, string>),
    shippingMethodId: text('shippingMethodId'),
    paymentMethod: text('paymentMethod'),
    wantsInvoice: data.get('wantsInvoice') === 'on',
    acceptTerms: data.get('acceptTerms') === 'on',
    honeypot: text('adres_www'),
  }
}

function focusFirstInvalid(form: HTMLFormElement, errors: CheckoutErrors): void {
  const first = CHECKOUT_FIELD_ORDER.find((name) => errors[name])
  if (!first) return
  const element = form.querySelector<HTMLElement>(`[name="${first}"]`)
  if (!element) return
  // Dla pól wyboru przewijamy do całej karty — sam znacznik jest niewidoczny.
  const target = element.closest('label') ?? element
  target.scrollIntoView({ block: 'center' })
  element.focus({ preventScroll: true })
}

function Section({ step, title, children, note }: { step: number; title: string; children: ReactNode; note?: string }) {
  return (
    <section aria-labelledby={`krok-${step}`}>
      <div className="flex items-baseline gap-4 border-b border-line pb-4">
        <span aria-hidden="true" className="tabular text-sm text-ink-faint">
          {String(step).padStart(2, '0')}
        </span>
        <h2 className="display-4" id={`krok-${step}`}>
          {title}
        </h2>
      </div>
      {note && <p className="mt-4 text-sm text-ink-soft">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function SummaryLines({ lines }: { lines: CartLine[] }) {
  return (
    <ul className="max-h-[22rem] overflow-y-auto overscroll-contain border-y border-line lg:max-h-[min(22rem,36vh)]">
      {lines.map((line) => (
        <li className="flex items-center gap-4 border-b border-line py-4 last:border-b-0" key={`${line.productId}:${line.variantId}`}>
          <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-stage">
            {line.imageUrl && <Image alt="" className="packshot" fill sizes="80px" src={line.imageUrl} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="leading-snug font-medium">{line.title}</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {[line.variantName, `${line.quantity} szt.`].filter(Boolean).join(' · ')}
            </p>
            {line.unavailable && <p className="mt-1 text-sm text-danger">Produkt niedostępny</p>}
          </div>
          <p className="tabular shrink-0 font-medium">{line.unavailable ? '—' : formatPLN(line.unitPrice * line.quantity)}</p>
        </li>
      ))}
    </ul>
  )
}

function CheckoutForm({ config, lines }: { config: CheckoutConfig; lines: CartLine[] }) {
  const router = useRouter()
  const saveTimer = useRef<number | null>(null)
  // Ten formularz powstaje dopiero w przeglądarce (po wczytaniu koszyka), więc może od razu sięgnąć do jej pamięci.
  const [draft] = useState<CheckoutDraft>(readDraft)
  const [requestId] = useState(newRequestId)
  const [isPending, startTransition] = useTransition()
  const [placed, setPlaced] = useState(false)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [shippingChoice, setShippingChoice] = useState<number | null>(draft.shippingMethodId ?? null)
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod | null>(draft.paymentMethod ?? null)
  const [wantsInvoice, setWantsInvoice] = useState(Boolean(draft.wantsInvoice))

  // Pomiar „rozpoczęto zamówienie" — raz, przy wejściu na formularz (koszyk z tej chwili).
  const linesAtStart = useRef(lines)
  useEffect(() => {
    trackBeginCheckout(
      linesAtStart.current
        .filter((line) => !line.unavailable)
        .map((line) => ({ id: line.productId, name: line.title, variant: line.variantName, price: line.unitPrice, quantity: line.quantity })),
    )
  }, [])

  const { shippingMethods, paymentOptions, links } = config
  const subtotal = cartSubtotal(lines)
  const hasUnavailable = lines.some((line) => line.unavailable)

  // Domyślnie zaznaczona jest najtańsza dostawa; klient może ją zmienić jednym kliknięciem.
  const cheapestShipping = shippingMethods.reduce<CheckoutShippingMethod | null>(
    (best, method) => (best === null || shippingCostFor(method, subtotal) < shippingCostFor(best, subtotal) ? method : best),
    null,
  )
  const shipping = shippingMethods.find((method) => method.id === shippingChoice) ?? cheapestShipping
  const availablePayments = paymentOptions.filter((option) => option.value !== 'cod' || Boolean(shipping?.allowCod))
  // Forma płatności z dopłatą nigdy nie jest zaznaczana z góry — taką klient musi wybrać sam.
  const payment =
    availablePayments.find((option) => option.value === paymentChoice) ?? availablePayments.find((option) => option.fee === 0) ?? null

  const shippingCost = shipping ? shippingCostFor(shipping, subtotal) : 0
  const paymentFee = payment?.fee ?? 0
  const total = orderTotal({ subtotal, shippingCost, paymentFee })
  const busy = isPending || placed

  const scheduleDraftSave = (form: HTMLFormElement) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      const values = readForm(form)
      const stored: CheckoutDraft = { wantsInvoice: values.wantsInvoice }
      for (const name of TEXT_FIELDS) stored[name] = values[name]
      const shippingId = Number(values.shippingMethodId)
      if (Number.isInteger(shippingId) && shippingId > 0) stored.shippingMethodId = shippingId
      const paymentValue = paymentOptions.find((option) => option.value === values.paymentMethod)?.value
      if (paymentValue) stored.paymentMethod = paymentValue
      saveDraft(stored)
    }, 250)
  }

  /** Sprawdza jedno pole i aktualizuje tylko jego komunikat. */
  const revalidateField = (form: HTMLFormElement, name: CheckoutField) => {
    const found = validateCheckout(readForm(form)).errors[name]
    setErrors((current) => {
      if (current[name] === found) return current
      const next = { ...current }
      if (found) next[name] = found
      else delete next[name]
      return next
    })
  }

  const handleChange = (event: ChangeEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    const target = event.target as unknown as HTMLInputElement
    if (target.name === 'postalCode') target.value = formatPostalCodeInput(target.value)

    // Komunikat znika, gdy tylko pole zostanie poprawione — bez czekania na ponowne wysłanie.
    const name = target.name as CheckoutField
    if (errors[name]) revalidateField(form, name)
    scheduleDraftSave(form)
  }

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    const target = event.target as unknown as HTMLInputElement
    if (!(TEXT_FIELDS as readonly string[]).includes(target.name)) return
    // Pustych pól nie wytykamy przy samym przejściu dalej — dopiero przy próbie złożenia zamówienia.
    if (target.value.trim() === '') return
    revalidateField(event.currentTarget, target.name as CheckoutField)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return

    const form = event.currentTarget
    const { honeypot, ...values } = readForm(form)
    const found = validateCheckout(values).errors
    setErrors(found)
    setFormError(null)

    if (Object.keys(found).length > 0) {
      focusFirstInvalid(form, found)
      return
    }
    if (hasUnavailable) {
      setFormError('W koszyku jest produkt, który nie jest już dostępny. Usuń go, aby złożyć zamówienie.')
      return
    }

    startTransition(async () => {
      let result: PlaceOrderResult
      try {
        result = await placeOrder({
          form: values,
          cart: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
          expectedTotal: total,
          requestId,
          website: honeypot,
        })
      } catch {
        setFormError(CONNECTION_ERROR)
        return
      }

      if (result.ok) {
        setPlaced(true)
        clearDraft()
        if (result.external) {
          // Wyjście na stronę operatora płatności — koszyk można opróżnić od razu.
          useCart.getState().clear()
          window.location.assign(result.redirectTo)
        } else {
          // Koszyk opróżni strona potwierdzenia; do tego czasu podsumowanie zostaje na ekranie.
          markOrderPlaced()
          router.replace(result.redirectTo)
        }
        return
      }

      setFormError(result.message)
      if (result.fieldErrors) {
        setErrors(result.fieldErrors)
        focusFirstInvalid(form, result.fieldErrors)
      }
      if (result.cart) useCart.getState().sync(result.cart)
      if (result.reason === 'cart-changed') router.refresh()
    })
  }

  if (shippingMethods.length === 0 || paymentOptions.length === 0) {
    return (
      <div className="mt-12 max-w-xl">
        <p className="lead">
          Składanie zamówień przez stronę jest chwilowo niedostępne. Napisz lub zadzwoń do nas — przyjmiemy zamówienie bezpośrednio.
        </p>
        <Link className={buttonClass({ size: 'lg', className: 'mt-8' })} href="/kontakt">
          Skontaktuj się z nami
        </Link>
      </div>
    )
  }

  const submitNote =
    payment?.value === 'online'
      ? 'Po kliknięciu przejdziesz na bezpieczną stronę płatności.'
      : payment?.value === 'transfer'
        ? 'Dane do przelewu zobaczysz na następnej stronie i w wiadomości e-mail.'
        : payment?.value === 'cod'
          ? 'Za zamówienie zapłacisz przy odbiorze.'
          : null

  return (
    <form
      aria-busy={busy || undefined}
      className="mt-10 grid gap-x-16 gap-y-12 md:mt-14 lg:grid-cols-12"
      noValidate
      onBlur={handleBlur}
      onChange={handleChange}
      onSubmit={handleSubmit}
    >
      <div className="min-w-0 space-y-14 lg:col-span-7">
        <Section step={1} title="Twoje dane">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="sm:col-span-2"
              defaultValue={draft.email}
              enterKeyHint="next"
              error={errors.email}
              hint="Wyślemy na niego potwierdzenie zamówienia."
              inputMode="email"
              label="E-mail"
              name="email"
              required
              spellCheck={false}
              type="email"
            />
            <TextField
              autoComplete="given-name"
              defaultValue={draft.firstName}
              enterKeyHint="next"
              error={errors.firstName}
              label="Imię"
              name="firstName"
              required
            />
            <TextField
              autoComplete="family-name"
              defaultValue={draft.lastName}
              enterKeyHint="next"
              error={errors.lastName}
              label="Nazwisko"
              name="lastName"
              required
            />
            <TextField
              autoComplete="tel"
              className="sm:col-span-2"
              defaultValue={draft.phone}
              enterKeyHint="next"
              error={errors.phone}
              hint="Przewoźnik zadzwoni, żeby umówić termin dostawy."
              inputMode="tel"
              label="Telefon"
              name="phone"
              required
              type="tel"
            />
          </div>
        </Section>

        <Section note="Dostarczamy na terenie Polski." step={2} title="Adres dostawy">
          <div className="grid gap-5 sm:grid-cols-6">
            <TextField
              autoComplete="address-line1"
              className="sm:col-span-6"
              defaultValue={draft.street}
              enterKeyHint="next"
              error={errors.street}
              label="Ulica, numer domu i mieszkania"
              name="street"
              required
            />
            <TextField
              autoComplete="postal-code"
              className="sm:col-span-2"
              defaultValue={draft.postalCode}
              enterKeyHint="next"
              error={errors.postalCode}
              inputMode="numeric"
              label="Kod pocztowy"
              maxLength={6}
              name="postalCode"
              placeholder="00-000"
              required
            />
            <TextField
              autoComplete="address-level2"
              className="sm:col-span-4"
              defaultValue={draft.city}
              enterKeyHint="next"
              error={errors.city}
              label="Miejscowość"
              name="city"
              required
            />
          </div>
        </Section>

        <Section step={3} title="Dostawa">
          <div aria-describedby={errors.shippingMethodId ? 'blad-dostawa' : undefined} aria-label="Sposób dostawy" className="grid gap-3" role="radiogroup">
            {shippingMethods.map((method) => {
              const cost = shippingCostFor(method, subtotal)
              return (
                <OptionCard
                  aside={cost > 0 ? formatPLN(cost) : 'bezpłatnie'}
                  checked={shipping?.id === method.id}
                  description={
                    <>
                      {method.description}
                      {method.description && method.deliveryTime ? <br /> : null}
                      {method.deliveryTime && <span className="text-ink">Czas dostawy: {method.deliveryTime}</span>}
                    </>
                  }
                  invalid={Boolean(errors.shippingMethodId)}
                  key={method.id}
                  name="shippingMethodId"
                  onChange={() => setShippingChoice(method.id)}
                  title={method.name}
                  value={String(method.id)}
                />
              )
            })}
          </div>
          <FieldError id="blad-dostawa" message={errors.shippingMethodId} />
        </Section>

        <Section step={4} title="Płatność">
          <div aria-describedby={errors.paymentMethod ? 'blad-platnosc' : undefined} aria-label="Sposób płatności" className="grid gap-3" role="radiogroup">
            {availablePayments.map((option) => (
              <OptionCard
                aside={option.fee > 0 ? `+ ${formatPLN(option.fee)}` : undefined}
                checked={payment?.value === option.value}
                description={option.description}
                invalid={Boolean(errors.paymentMethod)}
                key={option.value}
                name="paymentMethod"
                onChange={() => setPaymentChoice(option.value)}
                title={option.label}
                value={option.value}
              />
            ))}
          </div>
          <FieldError id="blad-platnosc" message={errors.paymentMethod} />
        </Section>

        <Section step={5} title="Faktura i uwagi">
          <Checkbox checked={wantsInvoice} name="wantsInvoice" onChange={(event) => setWantsInvoice(event.target.checked)}>
            Chcę otrzymać fakturę na firmę
          </Checkbox>

          <div className="reveal-rows" data-open={wantsInvoice ? '' : undefined}>
            <div>
              <div className="grid gap-5 pt-6 sm:grid-cols-6">
                <TextField
                  autoComplete="organization"
                  className="sm:col-span-4"
                  defaultValue={draft.companyName}
                  enterKeyHint="next"
                  error={errors.companyName}
                  label="Nazwa firmy"
                  name="companyName"
                  required={wantsInvoice}
                />
                <TextField
                  autoComplete="off"
                  className="sm:col-span-2"
                  defaultValue={draft.nip}
                  enterKeyHint="next"
                  error={errors.nip}
                  inputMode="numeric"
                  label="NIP"
                  maxLength={16}
                  name="nip"
                  required={wantsInvoice}
                />
                <TextField
                  autoComplete="off"
                  className="sm:col-span-6"
                  defaultValue={draft.invoiceAddress}
                  enterKeyHint="next"
                  error={errors.invoiceAddress}
                  hint="Wypełnij tylko wtedy, gdy jest inny niż adres dostawy."
                  label="Adres firmy"
                  name="invoiceAddress"
                  optional
                />
              </div>
            </div>
          </div>

          <TextArea
            className="mt-8"
            defaultValue={draft.note}
            error={errors.note}
            hint="Na przykład: piętro, winda, wąska klatka schodowa, dogodne godziny dostawy."
            label="Uwagi do zamówienia"
            maxLength={NOTE_MAX_LENGTH}
            name="note"
            optional
          />
        </Section>
      </div>

      <aside aria-label="Podsumowanie zamówienia" className="min-w-0 lg:col-span-5">
        <div className="rounded-[var(--radius-panel)] bg-stage p-5 sm:p-6 md:p-8 lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="display-4">Twoje zamówienie</h2>
            <Link className="link-line text-sm text-ink-soft" href="/koszyk">
              Edytuj koszyk
            </Link>
          </div>

          <div className="mt-5">
            <SummaryLines lines={lines} />
          </div>

          <dl className="mt-5 space-y-2 text-[0.9375rem]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">Produkty</dt>
              <dd className="tabular">{formatPLN(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-soft">{shippingLabel(shipping?.name)}</dt>
              <dd className="tabular shrink-0">{!shipping ? '—' : shippingCost > 0 ? formatPLN(shippingCost) : 'bezpłatnie'}</dd>
            </div>
            {paymentFee > 0 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Płatność przy odbiorze</dt>
                <dd className="tabular">{formatPLN(paymentFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
              <dt className="font-medium">Do zapłaty</dt>
              <dd>
                <AnimatedPrice className="font-display text-[1.75rem] leading-none" value={total} />
              </dd>
            </div>
          </dl>
          {config.priceNote && <p className="mt-1 text-right text-sm text-ink-soft">{config.priceNote}</p>}

          <div className="mt-7 border-t border-line pt-6">
            <Checkbox error={errors.acceptTerms} name="acceptTerms" required>
              Akceptuję{' '}
              {links.terms ? (
                <a className="underline underline-offset-4" href={links.terms} rel="noopener" target="_blank">
                  regulamin sklepu
                </a>
              ) : (
                'regulamin sklepu'
              )}
              .
            </Checkbox>
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
              {/* Nazwa firmy często kończy się kropką („sp. z o.o.") — nie stawiamy wtedy drugiej. */}
              Administratorem Twoich danych osobowych jest {(config.sellerName || 'sprzedawca').replace(/\.$/, '')}. Wykorzystamy je do
              realizacji zamówienia.
              {links.privacy && (
                <>
                  {' '}
                  Szczegóły znajdziesz w{' '}
                  <a className="underline underline-offset-4" href={links.privacy} rel="noopener" target="_blank">
                    polityce prywatności
                  </a>
                  .
                </>
              )}
            </p>
          </div>

          {/* Pole-pułapka na automaty; ludzie go nie widzą i nie da się do niego dojść klawiaturą. */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-[200vw] size-px overflow-hidden opacity-0">
            <label>
              Adres strony (zostaw puste)
              <input autoComplete="off" name="adres_www" tabIndex={-1} type="text" />
            </label>
          </div>

          {formError && (
            <p className="field-message mt-6 rounded-[var(--radius-field)] border border-danger/30 bg-danger/5 px-4 py-3 text-[0.9375rem] text-danger" role="alert">
              {formError}
            </p>
          )}

          {/* Napis na przycisku jest wymagany przepisami — na wąskich ekranach może się złamać, ale nie może zniknąć. */}
          <Button
            className="mt-6 h-auto min-h-14 w-full px-5 py-3 text-center leading-snug whitespace-normal"
            disabled={hasUnavailable}
            loading={busy}
            size="lg"
            type="submit"
          >
            Zamawiam z obowiązkiem zapłaty
          </Button>
          {submitNote && <p className="mt-3 text-center text-[0.8125rem] text-ink-soft">{submitNote}</p>}
          {config.isTest && (
            <p className="mt-3 text-center text-[0.8125rem] text-ink-soft">
              Sklep jest w trybie przygotowania — to zamówienie zostanie oznaczone jako testowe.
            </p>
          )}

          {(links.returns || links.delivery) && (
            <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-line pt-5 text-[0.8125rem] text-ink-soft">
              {links.delivery && (
                <a className="link-line" href={links.delivery} rel="noopener" target="_blank">
                  Dostawa i płatności
                </a>
              )}
              {links.returns && (
                <a className="link-line" href={links.returns} rel="noopener" target="_blank">
                  Zwroty i reklamacje
                </a>
              )}
            </p>
          )}
        </div>
      </aside>
    </form>
  )
}

/** Strona zamówienia: dane klienta, dostawa, płatność i podsumowanie z przyciskiem zamówienia. */
export function CheckoutView({ config }: { config: CheckoutConfig }) {
  const lines = useCart((state) => state.lines)
  const hydrated = useCart((state) => state.hydrated)
  useCartSync(hydrated)

  return (
    <div className="shell pt-8 pb-20 md:pt-12 md:pb-28">
      <h1 className="display-1 text-[clamp(2.75rem,1.6rem+4.2vw,5rem)]">Zamówienie</h1>

      {!hydrated ? (
        <div aria-hidden="true" className="mt-10 grid gap-x-16 gap-y-8 md:mt-14 lg:grid-cols-12">
          <div className="h-[32rem] rounded-[var(--radius-panel)] bg-stage/60 lg:col-span-7" />
          <div className="h-80 rounded-[var(--radius-panel)] bg-stage/60 lg:col-span-5" />
        </div>
      ) : lines.length === 0 ? (
        <div className="mt-12 max-w-xl">
          <p className="lead">Twój koszyk jest pusty. Wybierz sofę, a wrócimy tu, żeby dokończyć zamówienie.</p>
          <Link className={buttonClass({ size: 'lg', className: 'mt-8' })} href="/sklep">
            Zobacz sofy
          </Link>
        </div>
      ) : (
        <CheckoutForm config={config} lines={lines} />
      )}
    </div>
  )
}
