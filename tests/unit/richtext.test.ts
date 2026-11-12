import { describe, expect, it } from 'vitest'

import { hasPlaceholder } from '@/lib/launch'
import { extractHeadings, headingId } from '@/lib/richtext/headings'
import { richTextToPlainText } from '@/lib/richtext/plaintext'
import { slugify } from '@/lib/slugify'

const text = (value: string) => ({ type: 'text', text: value })
const paragraph = (...children: object[]) => ({ type: 'paragraph', children })
const heading = (tag: string, value: string) => ({ type: 'heading', tag, children: [text(value)] })
const item = (value: number, ...children: object[]) => ({ type: 'listitem', value, children })
const list = (listType: 'number' | 'bullet', ...children: object[]) => ({ type: 'list', listType, children })
const doc = (...children: object[]) => ({ root: { type: 'root', children } })

describe('treść strony jako zwykły tekst (załączniki e-maili)', () => {
  it('zachowuje numerację punktów, także po wyliczeniu w środku', () => {
    const data = doc(
      heading('h2', '§1. Postanowienia ogólne'),
      list('number', item(1, text('Pierwszy punkt.')), item(2, text('Drugi punkt:'))),
      list('bullet', item(1, text('podpunkt a;')), item(2, text('podpunkt b.'))),
      list('number', item(3, text('Trzeci punkt.'))),
    )
    expect(richTextToPlainText(data)).toBe(
      ['§1. POSTANOWIENIA OGÓLNE', '------------------------', '', '1. Pierwszy punkt.', '2. Drugi punkt:', '', '   – podpunkt a;', '   – podpunkt b.', '', '3. Trzeci punkt.'].join(
        '\n',
      ),
    )
  })

  it('rozwija odnośniki do pełnych adresów', () => {
    const data = doc(
      paragraph(
        text('Napisz na '),
        { type: 'link', fields: { linkType: 'custom', url: 'mailto:kontakt@ryd.test' }, children: [text('kontakt@ryd.test')] },
        text(' albo zobacz '),
        { type: 'link', fields: { linkType: 'internal', doc: { relationTo: 'pages', value: { slug: 'regulamin' } } }, children: [text('regulamin')] },
        text('.'),
      ),
    )
    expect(richTextToPlainText(data, { siteUrl: 'https://sklep.pl' })).toBe('Napisz na kontakt@ryd.test albo zobacz regulamin (https://sklep.pl/regulamin).')
  })

  it('znosi puste i nietypowe dane', () => {
    expect(richTextToPlainText(null)).toBe('')
    expect(richTextToPlainText({})).toBe('')
    expect(richTextToPlainText(doc(paragraph()))).toBe('')
  })
})

describe('spis treści', () => {
  it('zbiera nagłówki drugiego poziomu i nadaje im kotwice', () => {
    const data = doc(heading('h2', '§1. Postanowienia ogólne'), paragraph(text('…')), heading('h3', 'Podtytuł'), heading('h2', 'Zwroty i reklamacje'))
    expect(extractHeadings(data)).toEqual([
      { id: '1-postanowienia-ogolne', text: '§1. Postanowienia ogólne' },
      { id: 'zwroty-i-reklamacje', text: 'Zwroty i reklamacje' },
    ])
    expect(headingId('§§§')).toBe('sekcja')
  })
})

describe('adresy stron', () => {
  it('zamienia polskie znaki i odstępy', () => {
    expect(slugify('Sofa Łucja 3-osobowa')).toBe('sofa-lucja-3-osobowa')
    expect(slugify('  Zażółć gęślą jaźń!  ')).toBe('zazolc-gesla-jazn')
  })
})

describe('niewypełnione miejsca w szkicach', () => {
  it('wykrywa znacznik [UZUPEŁNIJ] w treści', () => {
    expect(hasPlaceholder(doc(paragraph(text('[UZUPEŁNIJ: adres do zwrotów]'))))).toBe(true)
    expect(hasPlaceholder(doc(paragraph(text('Gotowa treść.'))))).toBe(false)
    expect(hasPlaceholder(null)).toBe(false)
  })
})
