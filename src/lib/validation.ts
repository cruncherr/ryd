import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/constants'

/**
 * Sprawdzanie danych z formularzy. Te same reguły działają w przeglądarce (podpowiedź od razu
 * przy polu) i na serwerze (ostateczna kontrola przed zapisaniem zamówienia).
 * Bez zewnętrznych bibliotek, żeby nie obciążać strony zamówienia.
 */

const collapse = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : ''

const multiline = (value: unknown, maxLength: number): string =>
  typeof value === 'string'
    ? value
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength)
    : ''

/* ---------- E-mail ---------- */

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().slice(0, 254) : ''
}

export function isValidEmail(value: string): boolean {
  if (value.length < 6 || value.length > 254) return false
  if (!/^[^\s@<>()[\],;:"\\]+@[^\s@<>()[\],;:"\\]+\.[a-z0-9-]{2,}$/i.test(value)) return false
  const [local = '', domain = ''] = value.split('@')
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false
  return !domain.startsWith('.') && !domain.startsWith('-') && !domain.includes('..')
}

/* ---------- Telefon ---------- */

/** „600 100 200", „+48 600-100-200", „0048600100200" → „+48600100200". Zwraca '' dla błędnego numeru. */
export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  const compact = value.replace(/[\s().-]/g, '')
  if (compact === '') return ''

  const polish = /^(?:\+48|0048|48)?(\d{9})$/.exec(compact)
  if (polish?.[1] && /^[1-9]/.test(polish[1])) return `+48${polish[1]}`

  const international = compact.startsWith('00') ? `+${compact.slice(2)}` : compact
  if (/^\+[1-9]\d{7,14}$/.test(international) && !international.startsWith('+48')) return international

  return ''
}

/** „+48600100200" → „+48 600 100 200" (do wyświetlania w e-mailach i na stronie potwierdzenia). */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return ''
  const polish = /^\+48(\d{3})(\d{3})(\d{3})$/.exec(value)
  return polish ? `+48 ${polish[1]} ${polish[2]} ${polish[3]}` : value
}

/* ---------- Kod pocztowy ---------- */

/** „00950" i „00 950" → „00-950". Zwraca '' dla błędnego kodu. */
export function normalizePostalCode(value: unknown): string {
  if (typeof value !== 'string') return ''
  const digits = value.replace(/[\s-]/g, '')
  return /^\d{5}$/.test(digits) ? `${digits.slice(0, 2)}-${digits.slice(2)}` : ''
}

/** Formatowanie w trakcie pisania: po dwóch cyfrach sam pojawia się myślnik. */
export function formatPostalCodeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 5)
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits
}

/* ---------- NIP ---------- */

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const

/** „PL 521-301-28-41" → „5213012841". Zwraca '' dla numeru z błędną sumą kontrolną. */
export function normalizeNip(value: unknown): string {
  if (typeof value !== 'string') return ''
  const digits = value.replace(/^\s*PL/i, '').replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(digits)) return ''

  const numbers = [...digits].map(Number)
  const checksum = NIP_WEIGHTS.reduce((total, weight, index) => total + weight * (numbers[index] ?? 0), 0) % 11
  if (checksum === 10 || checksum !== numbers[9]) return ''
  if (/^(\d)\1{9}$/.test(digits)) return ''
  return digits
}

/* ---------- Formularz zamówienia ---------- */

export type CheckoutValues = {
  email: string
  phone: string
  firstName: string
  lastName: string
  street: string
  postalCode: string
  city: string
  shippingMethodId: number | null
  paymentMethod: PaymentMethod | null
  wantsInvoice: boolean
  companyName: string
  nip: string
  invoiceAddress: string
  note: string
  acceptTerms: boolean
}

export type CheckoutField = keyof CheckoutValues
export type CheckoutErrors = Partial<Record<CheckoutField, string>>

/** Kolejność pól na stronie — według niej ustawiamy kursor w pierwszym błędnym polu. */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  'email',
  'phone',
  'firstName',
  'lastName',
  'street',
  'postalCode',
  'city',
  'shippingMethodId',
  'paymentMethod',
  'companyName',
  'nip',
  'invoiceAddress',
  'note',
  'acceptTerms',
]

export const NOTE_MAX_LENGTH = 1000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asBoolean = (value: unknown): boolean => value === true || value === 'true' || value === 'on'

/**
 * Sprawdza formularz zamówienia. Zwraca uporządkowane wartości (np. telefon w jednym formacie)
 * oraz komunikaty błędów przypisane do pól. Pusta lista błędów = dane są poprawne.
 */
export function validateCheckout(raw: unknown): { values: CheckoutValues; errors: CheckoutErrors } {
  const input = isRecord(raw) ? raw : {}
  const errors: CheckoutErrors = {}

  const email = normalizeEmail(input.email)
  if (email === '') errors.email = 'Podaj adres e-mail — wyślemy na niego potwierdzenie zamówienia.'
  else if (!isValidEmail(email)) errors.email = 'Sprawdź adres e-mail — wygląda na niepełny.'

  const rawPhone = collapse(input.phone, 30)
  const phone = normalizePhone(rawPhone)
  if (rawPhone === '') errors.phone = 'Podaj numer telefonu — przewoźnik zadzwoni przed dostawą.'
  else if (phone === '') errors.phone = 'Sprawdź numer telefonu — polski numer ma 9 cyfr.'

  const firstName = collapse(input.firstName, 60)
  if (firstName.length < 2) errors.firstName = 'Podaj imię.'

  const lastName = collapse(input.lastName, 80)
  if (lastName.length < 2) errors.lastName = 'Podaj nazwisko.'

  const street = collapse(input.street, 120)
  if (street.length < 3) errors.street = 'Podaj ulicę i numer domu.'
  else if (!/\d/.test(street)) errors.street = 'Dodaj numer domu (i mieszkania, jeśli jest).'

  const rawPostalCode = collapse(input.postalCode, 12)
  const postalCode = normalizePostalCode(rawPostalCode)
  if (rawPostalCode === '') errors.postalCode = 'Podaj kod pocztowy.'
  else if (postalCode === '') errors.postalCode = 'Kod pocztowy ma format 00-000.'

  const city = collapse(input.city, 80)
  if (city.length < 2) errors.city = 'Podaj miejscowość.'

  const shippingCandidate = Number(input.shippingMethodId)
  const shippingMethodId =
    input.shippingMethodId !== null && input.shippingMethodId !== '' && Number.isInteger(shippingCandidate) && shippingCandidate > 0
      ? shippingCandidate
      : null
  if (shippingMethodId === null) errors.shippingMethodId = 'Wybierz sposób dostawy.'

  const paymentMethod = PAYMENT_METHODS.find((method) => method.value === input.paymentMethod)?.value ?? null
  if (paymentMethod === null) errors.paymentMethod = 'Wybierz sposób płatności.'

  const wantsInvoice = asBoolean(input.wantsInvoice)
  let companyName = ''
  let nip = ''
  let invoiceAddress = ''
  if (wantsInvoice) {
    companyName = collapse(input.companyName, 160)
    if (companyName.length < 2) errors.companyName = 'Podaj nazwę firmy.'

    const rawNip = collapse(input.nip, 20)
    nip = normalizeNip(rawNip)
    if (rawNip === '') errors.nip = 'Podaj NIP.'
    else if (nip === '') errors.nip = 'Sprawdź NIP — ten numer jest nieprawidłowy.'

    invoiceAddress = collapse(input.invoiceAddress, 200)
  }

  const rawNote = typeof input.note === 'string' ? input.note : ''
  const note = multiline(rawNote, NOTE_MAX_LENGTH)
  if (rawNote.trim().length > NOTE_MAX_LENGTH) errors.note = `Uwagi mogą mieć najwyżej ${NOTE_MAX_LENGTH} znaków.`

  const acceptTerms = asBoolean(input.acceptTerms)
  if (!acceptTerms) errors.acceptTerms = 'Zaakceptuj regulamin, aby złożyć zamówienie.'

  return {
    values: {
      email,
      // Przy błędzie zostawiamy to, co wpisał klient — poprawi w polu, zamiast wpisywać od nowa.
      phone: phone || rawPhone,
      firstName,
      lastName,
      street,
      postalCode: postalCode || rawPostalCode,
      city,
      shippingMethodId,
      paymentMethod,
      wantsInvoice,
      companyName,
      nip: nip || collapse(input.nip, 20),
      invoiceAddress,
      note,
      acceptTerms,
    },
    errors,
  }
}

/* ---------- Formularz kontaktowy ---------- */

export type ContactValues = {
  name: string
  email: string
  phone: string
  message: string
}

export type ContactField = keyof ContactValues
export type ContactErrors = Partial<Record<ContactField, string>>

export const CONTACT_FIELD_ORDER: ContactField[] = ['name', 'email', 'phone', 'message']

export const MESSAGE_MAX_LENGTH = 3000

export function validateContact(raw: unknown): { values: ContactValues; errors: ContactErrors } {
  const input = isRecord(raw) ? raw : {}
  const errors: ContactErrors = {}

  const name = collapse(input.name, 120)
  if (name.length < 2) errors.name = 'Podaj imię, żebyśmy wiedzieli, jak się do Ciebie zwracać.'

  const email = normalizeEmail(input.email)
  if (email === '') errors.email = 'Podaj adres e-mail — na niego odpowiemy.'
  else if (!isValidEmail(email)) errors.email = 'Sprawdź adres e-mail — wygląda na niepełny.'

  // Telefon jest dobrowolny, ale jeśli został podany, musi być poprawny.
  const rawPhone = collapse(input.phone, 30)
  const phone = normalizePhone(rawPhone)
  if (rawPhone !== '' && phone === '') errors.phone = 'Sprawdź numer telefonu — polski numer ma 9 cyfr.'

  const rawMessage = typeof input.message === 'string' ? input.message : ''
  const message = multiline(rawMessage, MESSAGE_MAX_LENGTH)
  if (message.length < 10) errors.message = 'Napisz, w czym możemy pomóc (co najmniej kilka słów).'
  else if (rawMessage.trim().length > MESSAGE_MAX_LENGTH) {
    errors.message = `Wiadomość może mieć najwyżej ${MESSAGE_MAX_LENGTH} znaków.`
  }

  return {
    values: { name, email, phone: phone || rawPhone, message },
    errors,
  }
}
