import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { FIRST_ORDER_SEQUENCE } from './format'

export { FIRST_ORDER_SEQUENCE, formatOrderNumber, sanitizeOrderPrefix } from './format'

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
