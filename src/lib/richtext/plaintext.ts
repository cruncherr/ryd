/**
 * Zamienia treść z edytora (np. regulamin) na zwykły tekst — do załączników e-maili.
 * Zachowuje to, co w dokumencie prawnym istotne: nagłówki, akapity oraz numerację punktów,
 * do której odwołują się kolejne postanowienia.
 */

type LexicalNode = {
  type?: string
  text?: string
  tag?: string
  listType?: string
  start?: number
  value?: number
  fields?: { url?: string; linkType?: string; doc?: { relationTo?: string; value?: unknown } | null }
  children?: LexicalNode[]
}

type Options = {
  /** Publiczny adres sklepu — do rozwinięcia odnośników wewnętrznych. */
  siteUrl?: string
}

const INDENT = '   '

function linkUrl(node: LexicalNode, options: Options): string {
  const fields = node.fields
  if (!fields) return ''
  if (fields.linkType === 'internal') {
    const value = fields.doc?.value
    const slug = value && typeof value === 'object' && 'slug' in value ? String((value as { slug: unknown }).slug) : ''
    if (!slug) return ''
    const path = fields.doc?.relationTo === 'products' ? `/produkt/${slug}` : `/${slug}`
    return `${options.siteUrl ?? ''}${path}`
  }
  return typeof fields.url === 'string' ? fields.url : ''
}

/** Tekst w obrębie jednego akapitu: napisy, twarde złamania wiersza i odnośniki. */
function inline(nodes: LexicalNode[] | undefined, options: Options): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === 'text') return node.text ?? ''
      if (node.type === 'linebreak') return '\n'
      if (node.type === 'tab') return ' '
      if (node.type === 'link' || node.type === 'autolink') {
        const label = inline(node.children, options)
        const url = linkUrl(node, options)
        if (!url || url === label || url.replace(/^mailto:|^tel:/, '') === label) return label
        return `${label} (${url})`
      }
      return inline(node.children, options)
    })
    .join('')
}

function listLines(list: LexicalNode, depth: number, options: Options): string[] {
  const ordered = list.listType === 'number'
  let counter = typeof list.start === 'number' ? list.start : 1
  const lines: string[] = []

  for (const item of list.children ?? []) {
    const nested = (item.children ?? []).filter((child) => child.type === 'list')
    const own = (item.children ?? []).filter((child) => child.type !== 'list')
    const text = inline(own, options).trim()

    if (text) {
      // Edytor zapisuje numer przy każdym punkcie — lista przerwana wyliczeniem liczy dalej (…4, wyliczenie, 5).
      if (ordered && typeof item.value === 'number') counter = item.value
      const marker = ordered ? `${counter}. ` : '– '
      const prefix = INDENT.repeat(depth)
      const continuation = `${prefix}${' '.repeat(marker.length)}`
      lines.push(`${prefix}${marker}${text.replace(/\n/g, `\n${continuation}`)}`)
      counter += 1
    }
    // Punkt, który zawiera wyłącznie listę zagnieżdżoną, nie dostaje własnego numeru.
    for (const child of nested) lines.push(...listLines(child, depth + (text ? 1 : 0), options))
  }
  return lines
}

function block(node: LexicalNode, options: Options, previous?: LexicalNode): string {
  switch (node.type) {
    case 'heading': {
      const text = inline(node.children, options).trim()
      if (!text) return ''
      return node.tag === 'h1' || node.tag === 'h2' ? `${text.toUpperCase()}\n${'-'.repeat(Math.min(text.length, 60))}` : text
    }
    case 'list': {
      // Wyliczenie stojące tuż po liście numerowanej jest rozwinięciem jej ostatniego punktu — dostaje wcięcie.
      const nested = node.listType !== 'number' && previous?.type === 'list' && previous.listType === 'number'
      return listLines(node, nested ? 1 : 0, options).join('\n')
    }
    case 'quote':
      return inline(node.children, options)
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'horizontalrule':
      return '-'.repeat(40)
    case 'table':
      return (node.children ?? [])
        .map((row) => (row.children ?? []).map((cell) => (cell.children ?? []).map((child) => block(child, options)).join(' ').trim()).join(' | '))
        .join('\n')
    default:
      return inline(node.children, options).trim()
  }
}

export function richTextToPlainText(data: unknown, options: Options = {}): string {
  const root = (data as { root?: LexicalNode } | null | undefined)?.root
  if (!root?.children) return ''
  return root.children
    .map((node, index, all) => block(node, options, all[index - 1]))
    .filter((text) => text !== '')
    .join('\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}
