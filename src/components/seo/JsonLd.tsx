import type { JsonLdData } from '@/lib/seo'

/**
 * Opis strony dla wyszukiwarek (dane strukturalne). Znak „<” jest zamieniany na bezpieczny
 * odpowiednik, żeby żaden tekst z panelu nie mógł „zamknąć” znacznika i wstrzyknąć kodu.
 */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} type="application/ld+json" />
}
