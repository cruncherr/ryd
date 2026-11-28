import { MAX_EDITION_SIZE, type EditionStatus } from '@/lib/constants'

/**
 * Edycje numerowane: każdy model powstaje w ograniczonym nakładzie, a każdy sprzedany egzemplarz
 * dostaje własny numer (np. 07/50) zapisany w rejestrze. Funkcje w tym pliku nie dotykają bazy —
 * tych samych używa strona produktu (na żywo) i serwer przy przyjmowaniu zamówienia (ostatecznie).
 */

export type EditionInfo = {
  /** Nakład — liczba egzemplarzy. `null`: model nie jest limitowany. */
  size: number | null
  /** Oznaczenie edycji, np. „01” → „Edycja Nº 01”. */
  code: string | null
  status: EditionStatus
  /** Czy klient może sam wybrać numer swojego egzemplarza. */
  numberChoice: boolean
  /** Data premiery (ISO) — pokazywana przy zapowiedzi. */
  releaseDate: string | null
}

/** Stan edycji w danej chwili: ile egzemplarzy ma już właścicieli i które numery są zajęte. */
export type EditionState = EditionInfo & {
  taken: number[]
  allocated: number
  remaining: number
  soldOut: boolean
  /** Czy da się teraz zarezerwować egzemplarz (z kodem zaproszenia, jeśli edycja go wymaga). */
  purchasable: boolean
}

type EditionFields = {
  size?: number | null
  code?: string | null
  status?: string | null
  numberChoice?: boolean | null
  releaseDate?: string | null
}

const STATUSES: EditionStatus[] = ['open', 'invite', 'announced']

/** Odczytuje dane edycji zapisane przy produkcie, odrzucając wartości spoza dozwolonego zakresu. */
export function editionInfo(edition: EditionFields | null | undefined): EditionInfo {
  const size = edition?.size
  const validSize = typeof size === 'number' && Number.isInteger(size) && size >= 1 && size <= MAX_EDITION_SIZE ? size : null
  const status = STATUSES.find((value) => value === edition?.status) ?? 'open'
  return {
    size: validSize,
    code: edition?.code?.trim() || null,
    status,
    numberChoice: validSize !== null && edition?.numberChoice !== false,
    releaseDate: edition?.releaseDate || null,
  }
}

export function editionState(info: EditionInfo, takenNumbers: Iterable<number>): EditionState {
  const taken = info.size === null ? [] : [...new Set(takenNumbers)].filter((n) => n >= 1 && n <= (info.size ?? 0)).sort((a, b) => a - b)
  const allocated = taken.length
  const remaining = info.size === null ? Number.POSITIVE_INFINITY : Math.max(0, info.size - allocated)
  const soldOut = info.size !== null && remaining === 0
  return {
    ...info,
    taken,
    allocated,
    remaining,
    soldOut,
    purchasable: !soldOut && info.status !== 'announced',
  }
}

/** Numer z zerem na początku, dopasowany do długości nakładu: 7 z 50 → „07”, 7 z 120 → „007”. */
export function padNumber(number: number, size: number | null): string {
  const width = String(size ?? number).length
  return String(number).padStart(Math.max(2, width), '0')
}

/** „Nº 07 / 50” — zapis numeru egzemplarza w sklepie, e-mailach i na certyfikacie. */
export function pieceLabel(number: number, size: number | null): string {
  // Twarda spacja po „Nº” — numer nigdy nie zostaje sam w następnym wierszu.
  return size ? `Nº\u00a0${padNumber(number, size)} / ${size}` : `Nº\u00a0${padNumber(number, null)}`
}

/** „Edycja Nº 01” albo samo „Edycja limitowana”, gdy edycja nie ma oznaczenia. */
export function editionTitle(info: Pick<EditionInfo, 'code'>): string {
  return info.code ? `Edycja Nº\u00a0${info.code}` : 'Edycja limitowana'
}

/** Wolne numery od najniższego. */
export function freeNumbers(size: number, taken: Iterable<number>): number[] {
  const used = new Set(taken)
  const free: number[] = []
  for (let n = 1; n <= size; n += 1) if (!used.has(n)) free.push(n)
  return free
}

export type PieceRequest = { quantity: number; number?: number }

/**
 * Przydziela numery dla zamówienia: najpierw numery wybrane przez klientów, potem kolejne wolne
 * od najniższego. Zwraca `null`, jeśli wybrany numer jest zajęty albo egzemplarzy jest za mało.
 */
export function assignNumbers(size: number, taken: Iterable<number>, requests: PieceRequest[]): number[][] | null {
  const used = new Set(taken)
  const result: number[][] = requests.map(() => [])

  for (const [index, request] of requests.entries()) {
    if (request.number === undefined) continue
    if (request.quantity !== 1 || request.number < 1 || request.number > size || used.has(request.number)) return null
    used.add(request.number)
    result[index] = [request.number]
  }

  const free = freeNumbers(size, used)
  for (const [index, request] of requests.entries()) {
    if (request.number !== undefined) continue
    if (free.length < request.quantity) return null
    result[index] = free.splice(0, request.quantity)
  }
  return result
}

/** Porównanie kodów zaproszenia: bez znaczenia są wielkość liter i spacje na brzegach. */
export function inviteMatches(expected: string | null | undefined, given: string | null | undefined): boolean {
  const normalize = (value: string) => value.trim().toUpperCase().replace(/\s+/g, '')
  if (!expected || !given) return false
  const a = normalize(expected)
  return a.length > 0 && a === normalize(given)
}

/** Tekst w koszyku pod nazwą modelu: numer wybrany przez klienta albo informacja o przydziale. */
export function editionLineText(size: number | null, number: number | undefined): string {
  if (!size) return ''
  return number ? `Egzemplarz ${pieceLabel(number, size)}` : `Egzemplarz z nakładu ${size} szt. — numer przy zamówieniu`
}
