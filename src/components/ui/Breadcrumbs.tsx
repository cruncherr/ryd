import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/** Ścieżka nawigacji („okruszki”) nad tytułem strony. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ścieżka nawigacji">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-soft">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li className={isLast ? 'flex min-w-0 items-center gap-2' : 'flex items-center gap-2'} key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link className="link-line" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                // Ostatni element (bieżąca strona) przy bardzo długiej nazwie kończy się wielokropkiem.
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'truncate text-ink' : undefined} title={isLast ? item.label : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-ink-faint">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
