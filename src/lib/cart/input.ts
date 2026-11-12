import { z } from 'zod'

import { CART_LIMITS } from '@/lib/constants'

/**
 * Koszyk w postaci przysyłanej przez przeglądarkę: wyłącznie identyfikatory i ilości.
 * Ceny, nazwy i dostępność serwer zawsze bierze z bazy.
 */

const lineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(CART_LIMITS.maxQuantityPerLine),
})

export const cartInputSchema = z.array(lineSchema).max(CART_LIMITS.maxLines)

export type CartInput = z.infer<typeof cartInputSchema>

/** Odczytuje koszyk przysłany przez przeglądarkę; odrzuca wszystko, co nie pasuje do wzorca. */
export function parseCartInput(raw: unknown): CartInput {
  const parsed = cartInputSchema.safeParse(raw)
  if (!parsed.success) return []

  // Łączymy powtórzone pozycje tego samego produktu i koloru.
  const merged = new Map<string, CartInput[number]>()
  for (const line of parsed.data) {
    const key = `${line.productId}:${line.variantId}`
    const existing = merged.get(key)
    merged.set(key, {
      ...line,
      quantity: Math.min(CART_LIMITS.maxQuantityPerLine, (existing?.quantity ?? 0) + line.quantity),
    })
  }
  return [...merged.values()]
}
