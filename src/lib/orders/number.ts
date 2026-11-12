import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/** Pierwsze zamówienie w sklepie dostaje ten numer — czterocyfrowy wygląda poważniej niż „1". */
export const FIRST_ORDER_SEQUENCE = 1001

const MAX_PREFIX_LENGTH = 8

/** „ryd ", „R&D" → „RYD", „RD". Pusty początek jest dozwolony — wtedy numer to same cyfry. */
export function sanitizeOrderPrefix(prefix: string | null | undefined): string {
  return (prefix ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_PREFIX_LENGTH)
}

export function formatOrderNumber(prefix: string | null | undefined, sequence: number): string {
  const clean = sanitizeOrderPrefix(prefix)
  return clean ? `${clean}-${sequence}` : String(sequence)
}

/**
 * Pobiera kolejny numer zamówienia. Jedno polecenie do bazy zwiększa licznik i od razu
 * zwraca nową wartość, więc dwa zamówienia złożone w tej samej chwili nigdy nie dostaną
 * tego samego numeru, a numer usuniętego zamówienia nie zostanie wydany ponownie.
 */
export async function nextOrderSequence(payload: Payload): Promise<number> {
  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO "counters" ("key", "value", "updated_at", "created_at")
    VALUES ('order', ${FIRST_ORDER_SEQUENCE}, now(), now())
    ON CONFLICT ("key") DO UPDATE SET "value" = "counters"."value" + 1, "updated_at" = now()
    RETURNING "value"
  `)

  const value = Number(result.rows[0]?.value)
  if (!Number.isInteger(value) || value < FIRST_ORDER_SEQUENCE) {
    throw new Error('Nie udało się nadać numeru zamówienia')
  }
  return value
}
