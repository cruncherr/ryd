import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  RichText as LexicalRichText,
  LinkJSXConverter,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import { Fragment, type ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { headingId } from '@/lib/richtext/headings'
import { noOrphans } from '@/lib/typography'

// Znaczniki formatowania tekstu w edytorze (bity).
const BOLD = 1
const ITALIC = 2
const STRIKETHROUGH = 4
const UNDERLINE = 8
const CODE = 16
const SUBSCRIPT = 32
const SUPERSCRIPT = 64

const TODO = /(\[UZUPEŁNIJ[^\]]*\])/g

/** Miejsca oznaczone w szkicach jako [UZUPEŁNIJ: …] wyróżniamy, żeby nie umknęły przed publikacją. */
function withTodoMarks(text: string): ReactNode {
  const parts = text.split(TODO)
  if (parts.length === 1) return noOrphans(text)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark className="todo-mark" key={index}>
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{noOrphans(part)}</Fragment>
    ),
  )
}

type AnyNode = { type?: string; text?: string; children?: unknown[] }

function plainText(node: unknown): string {
  const current = node as AnyNode
  if (current.type === 'text') return current.text ?? ''
  return (current.children ?? []).map(plainText).join('')
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({
    internalDocToHref: ({ linkNode }) => {
      const doc = linkNode.fields.doc
      const value = doc?.value
      const slug = value && typeof value === 'object' && 'slug' in value ? String(value.slug) : ''
      if (!slug) return '/'
      return doc?.relationTo === 'products' ? `/produkt/${slug}` : `/${slug}`
    },
  }),
  // Nagłówki dostają kotwice, do których prowadzi spis treści i do których można podać odnośnik.
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag
    const text = plainText(node)
    return <Tag id={Tag === 'h2' || Tag === 'h3' ? headingId(text) : undefined}>{nodesToJSX({ nodes: node.children })}</Tag>
  },
  text: ({ node }) => {
    let content: ReactNode = withTodoMarks(node.text)
    if (node.format & BOLD) content = <strong>{content}</strong>
    if (node.format & ITALIC) content = <em>{content}</em>
    if (node.format & STRIKETHROUGH) content = <s>{content}</s>
    if (node.format & UNDERLINE) content = <span className="underline">{content}</span>
    if (node.format & CODE) content = <code>{content}</code>
    if (node.format & SUBSCRIPT) content = <sub>{content}</sub>
    if (node.format & SUPERSCRIPT) content = <sup>{content}</sup>
    return content
  },
})

type Props = {
  data: SerializedEditorState | null | undefined
  className?: string
}

/** Treść z edytora panelu (opis produktu, strony informacyjne) w typografii sklepu. */
export function RichText({ data, className }: Props) {
  if (!data?.root?.children?.length) return null
  return <LexicalRichText className={cn('prose-ryd', className)} converters={converters} data={data} />
}

/** Czy pole z edytora ma jakąkolwiek treść. */
export function hasRichText(data: { root?: { children?: unknown[] } } | null | undefined): boolean {
  const children = data?.root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  return children.some((child) => {
    const node = child as { children?: unknown[]; type?: string }
    return node.type !== 'paragraph' || (Array.isArray(node.children) && node.children.length > 0)
  })
}
