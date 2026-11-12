import { slugify } from '@/lib/slugify'

type LexicalNode = { type?: string; tag?: string; text?: string; children?: LexicalNode[] }

function textOf(node: LexicalNode): string {
  if (node.type === 'text') return node.text ?? ''
  return (node.children ?? []).map(textOf).join('')
}

/** Kotwica nagłówka — ta sama funkcja nadaje identyfikator w treści i buduje odnośnik w spisie treści. */
export function headingId(text: string): string {
  return slugify(text) || 'sekcja'
}

export type TocEntry = { id: string; text: string }

/** Nagłówki drugiego poziomu z treści strony — do spisu treści długich dokumentów. */
export function extractHeadings(data: unknown): TocEntry[] {
  const root = (data as { root?: LexicalNode } | null | undefined)?.root
  const seen = new Set<string>()
  const entries: TocEntry[] = []

  for (const node of root?.children ?? []) {
    if (node.type !== 'heading' || node.tag !== 'h2') continue
    const text = textOf(node).trim()
    const id = headingId(text)
    // Dwa nagłówki o tym samym brzmieniu: w spisie zostaje pierwszy (do niego prowadzi kotwica).
    if (!text || seen.has(id)) continue
    seen.add(id)
    entries.push({ id, text })
  }
  return entries
}
