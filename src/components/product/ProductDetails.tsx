import Link from 'next/link'

import { Accordion, type AccordionItem } from '@/components/ui/Accordion'
import { RichText, hasRichText } from '@/components/ui/RichText'
import { LEGAL_SLUGS } from '@/lib/constants'
import { formatPLN } from '@/lib/money'
import { noOrphans } from '@/lib/typography'
import type { Product, Setting, ShippingMethod } from '@/payload-types'

const cm = (value: number) => `${String(value).replace('.', ',')} cm`

function DefinitionRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <dl className="max-w-xl">
      {rows.map((row) => (
        <div className="flex justify-between gap-6 border-b border-line py-3 last:border-b-0" key={row.label}>
          <dt className="text-ink-soft">{row.label}</dt>
          <dd className="tabular text-right font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="grid max-w-[66ch] gap-3 text-ink-soft">
      {text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => (
          <p key={index}>{noOrphans(line)}</p>
        ))}
    </div>
  )
}

export function dimensionRows(dimensions: Product['dimensions']): Array<{ label: string; value: string }> {
  if (!dimensions) return []
  const rows: Array<{ label: string; value: string }> = []
  const add = (label: string, value: number | null | undefined) => {
    if (typeof value === 'number' && value > 0) rows.push({ label, value: cm(value) })
  }
  add('Szerokość', dimensions.width)
  add('Głębokość', dimensions.depth)
  add('Wysokość', dimensions.height)
  add('Wysokość siedziska', dimensions.seatHeight)
  add('Głębokość siedziska', dimensions.seatDepth)
  if (dimensions.sleepWidth && dimensions.sleepLength) {
    rows.push({
      label: 'Powierzchnia spania',
      value: `${String(dimensions.sleepWidth).replace('.', ',')} × ${cm(dimensions.sleepLength)}`,
    })
  }
  return rows
}

/** Producent do informacji wymaganej przez przepisy o bezpieczeństwie produktów (GPSR). */
export function resolveManufacturer(
  product: Product,
  settings: Setting,
): { name: string; address?: string | null; email?: string | null } | null {
  if (product.manufacturer?.name) {
    return {
      name: product.manufacturer.name,
      address: product.manufacturer.address,
      email: product.manufacturer.email,
    }
  }

  const manufacturer = settings.manufacturer
  if (manufacturer?.sameAsSeller) {
    const company = settings.company
    if (!company?.legalName) return null
    const cityLine = [company.postalCode, company.city].filter(Boolean).join(' ')
    return {
      name: company.legalName,
      address: [company.street, cityLine].filter(Boolean).join(', '),
      email: settings.contact?.email,
    }
  }

  if (manufacturer?.name) {
    return { name: manufacturer.name, address: manufacturer.address, email: manufacturer.email }
  }
  return null
}

type Props = {
  product: Product
  settings: Setting
  shippingMethods: ShippingMethod[]
}

export function ProductDetails({ product, settings, shippingMethods }: Props) {
  const items: AccordionItem[] = []
  const open: string[] = []

  if (hasRichText(product.description)) {
    items.push({ value: 'opis', title: 'Opis', content: <RichText data={product.description} /> })
    open.push('opis')
  }

  const dimensions = dimensionRows(product.dimensions)
  if (dimensions.length > 0) {
    items.push({ value: 'wymiary', title: 'Wymiary', content: <DefinitionRows rows={dimensions} /> })
    open.push('wymiary')
  }

  const specs = (product.specs ?? []).filter((spec) => spec.label && spec.value)
  if (specs.length > 0) {
    items.push({
      value: 'dane',
      title: 'Dane techniczne',
      content: <DefinitionRows rows={specs.map((spec) => ({ label: spec.label, value: spec.value }))} />,
    })
  }

  if (product.materials?.trim()) {
    items.push({ value: 'materialy', title: 'Materiały i wypełnienie', content: <Paragraphs text={product.materials} /> })
  }

  if (product.care?.trim()) {
    items.push({ value: 'pielegnacja', title: 'Pielęgnacja', content: <Paragraphs text={product.care} /> })
  }

  items.push({
    value: 'dostawa',
    title: 'Dostawa i zwroty',
    content: (
      <div className="grid max-w-[66ch] gap-4 text-ink-soft">
        {shippingMethods.length > 0 && (
          <ul className="grid gap-2">
            {shippingMethods.map((method) => (
              <li className="flex flex-wrap justify-between gap-x-6 text-ink" key={method.id}>
                <span>
                  {method.name}
                  {method.deliveryTime ? <span className="text-ink-soft"> · {method.deliveryTime}</span> : null}
                </span>
                <span className="tabular font-medium">{method.price > 0 ? formatPLN(method.price) : 'bezpłatnie'}</span>
              </li>
            ))}
          </ul>
        )}
        <p>
          {noOrphans('Szczegóły znajdziesz na stronach ')}
          <Link className="text-ink underline decoration-1 underline-offset-[3px]" href={`/${LEGAL_SLUGS.delivery}`}>
            Dostawa i płatności
          </Link>
          {' oraz '}
          <Link className="text-ink underline decoration-1 underline-offset-[3px]" href={`/${LEGAL_SLUGS.returns}`}>
            Zwroty i reklamacje
          </Link>
          .
        </p>
      </div>
    ),
  })

  const manufacturer = resolveManufacturer(product, settings)
  if (manufacturer || product.safetyInfo?.trim()) {
    items.push({
      value: 'producent',
      title: 'Producent i bezpieczeństwo',
      content: (
        <div className="grid max-w-[66ch] gap-4 text-ink-soft">
          {manufacturer && (
            <p>
              <span className="font-medium text-ink">{manufacturer.name}</span>
              {manufacturer.address ? (
                <>
                  <br />
                  {manufacturer.address}
                </>
              ) : null}
              {manufacturer.email ? (
                <>
                  <br />
                  <a className="underline decoration-1 underline-offset-[3px]" href={`mailto:${manufacturer.email}`}>
                    {manufacturer.email}
                  </a>
                </>
              ) : null}
            </p>
          )}
          {product.safetyInfo?.trim() && <Paragraphs text={product.safetyInfo} />}
        </div>
      ),
    })
  }

  return <Accordion defaultOpen={open} items={items} />
}
