import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Po każdej zmianie treści w panelu odświeżamy zapisane (statyczne) strony sklepu.
 * Treść zmienia się rzadko, więc odświeżamy całą witrynę naraz — prosto i bez ryzyka,
 * że gdzieś zostanie stara cena.
 */
async function revalidateSite(): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {
    // Poza serwerem Next.js (np. skrypt seed) nie ma czego odświeżać.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!req.context.skipRevalidate) await revalidateSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (!req.context.skipRevalidate) await revalidateSite()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = async ({ doc, req }) => {
  if (!req.context.skipRevalidate) await revalidateSite()
  return doc
}
