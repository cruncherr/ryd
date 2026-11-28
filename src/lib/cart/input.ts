import { z } from 'zod'

import { configKey } from '@/lib/configurator'
import { CART_LIMITS, MAX_EDITION_SIZE } from '@/lib/constants'

/**
 * Koszyk w postaci przysyłanej przez przeglądarkę: wyłącznie identyfikatory, wybór klienta i ilości.
 * Ceny, nazwy i dostępność serwer zawsze bierze z bazy.
 */

const id = z.string().min(1).max(64)

const configSchema = z
  .object({
    size: id.optional(),
    fabric: z.number().int().positive().optional(),
    color: id.optional(),
    legs: id.optional(),
    side: z.enum(['left', 'right']).optional(),
    number: z.number().int().min(1).max(MAX_EDITION_SIZE).optional(),
    invite: z.string().trim().min(1).max(32).optional(),
  })
  .strip()

const lineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: id,
  quantity: z.number().int().min(1).max(CART_LIMITS.maxQuantityPerLine),
  config: configSchema.optional(),
})

export const cartInputSchema = z.array(lineSchema).max(CART_LIMITS.maxLines)

export type CartInput = z.infer<typeof cartInputSchema>

/** Odczytuje koszyk przysłany przez przeglądarkę; odrzuca wszystko, co nie pasuje do wzorca. */
export function parseCartInput(raw: unknown): CartInput {
  const parsed = cartInputSchema.safeParse(raw)
  if (!parsed.success) return []

  // Łączymy powtórzone pozycje tego samego produktu w tej samej konfiguracji.
  const merged = new Map<string, CartInput[number]>()
  for (const line of parsed.data) {
    const config = line.config && Object.keys(line.config).length > 0 ? line.config : undefined
    const key = `${line.productId}:${line.variantId}:${configKey(config)}`
    const existing = merged.get(key)
    // Wybrany numer to jeden konkretny egzemplarz — taka pozycja ma zawsze ilość 1.
    const max = config?.number ? 1 : CART_LIMITS.maxQuantityPerLine
    const invite = config?.invite ?? existing?.config?.invite
    const mergedConfig = config || invite ? { ...(config ?? {}), ...(invite ? { invite } : {}) } : undefined
    merged.set(key, {
      productId: line.productId,
      variantId: line.variantId,
      quantity: Math.min(max, (existing?.quantity ?? 0) + line.quantity),
      ...(mergedConfig ? { config: mergedConfig } : {}),
    })
  }
  return [...merged.values()]
}
