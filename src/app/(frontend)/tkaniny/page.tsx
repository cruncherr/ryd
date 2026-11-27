import type { Metadata } from 'next'

import { SamplePicker } from '@/components/fabric/SamplePicker'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { fabricOption } from '@/lib/configurator'
import { LEGAL_SLUGS } from '@/lib/constants'
import { pageMetadata } from '@/lib/metadata'
import { getFabrics, getPageBySlug, getSettings } from '@/lib/queries'
import { noOrphans } from '@/lib/typography'

const TITLE = 'Tkaniny i kolory'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Próbnik tkanin',
    description: 'Tkaniny, w których szyjemy nasze sofy i narożniki: welur, szenil, bouclé i inne. Zamów bezpłatne próbki i zobacz kolor w swoim wnętrzu.',
    path: '/tkaniny',
  })
}

export default async function FabricsPage({ searchParams }: PageProps<'/tkaniny'>) {
  const [fabricDocs, settings, privacyPage, params] = await Promise.all([
    getFabrics(),
    getSettings(),
    getPageBySlug(LEGAL_SLUGS.privacy),
    searchParams,
  ])
  const fabrics = fabricDocs.map(fabricOption).filter((fabric) => fabric.colors.length > 0)
  const samplesEnabled = settings.samples?.enabled !== false && fabrics.length > 0
  const max = Math.max(1, Math.min(20, settings.samples?.max ?? 6))
  const colorCount = fabrics.reduce((total, fabric) => total + fabric.colors.filter((color) => color.available).length, 0)
  const preselected = typeof params.probka === 'string' ? params.probka : null
  const suppliers = [...new Set(fabrics.map((fabric) => fabric.supplier).filter(Boolean))]
  const from = suppliers.length === 1 ? ` polskiej firmy ${suppliers[0]}` : ''

  return (
    <div className="shell pt-8 pb-28 md:pt-12 md:pb-36">
      <Breadcrumbs items={[{ label: 'Strona główna', href: '/' }, { label: 'Próbnik tkanin' }]} />
      <header className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow text-brand">Próbnik tkanin</p>
          <h1 className="display-1 mt-4 text-[clamp(2.75rem,1.6rem+4.2vw,5rem)]">{TITLE}</h1>
        </div>
        <p className="lead lg:col-span-5 lg:pb-2">
          {noOrphans(
            samplesEnabled
              ? `${fabrics.length} kolekcji tkanin${from} i ${colorCount} kolorów, w których szyjemy nasze meble. Kliknij kolor, aby dodać próbkę — do ${max} próbek wyślemy bezpłatnie.`
              : 'Tkaniny i kolory, w których szyjemy nasze meble. Napisz do nas, jeśli chcesz zobaczyć próbkę na żywo.',
          )}
        </p>
      </header>

      {fabrics.length === 0 ? (
        <p className="mt-16 text-ink-soft">Próbnik jest w przygotowaniu. Zajrzyj wkrótce.</p>
      ) : (
        <SamplePicker
          fabrics={fabrics}
          max={max}
          note={settings.samples?.note ?? null}
          preselected={preselected}
          privacyUrl={privacyPage ? `/${LEGAL_SLUGS.privacy}` : null}
          samplesEnabled={samplesEnabled}
          sellerName={settings.company?.legalName ?? null}
        />
      )}
    </div>
  )
}
