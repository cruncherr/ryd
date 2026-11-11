import Link from 'next/link'

import type { Setting } from '@/payload-types'

import { CartButton } from './CartButton'
import { HeaderShell } from './HeaderShell'
import { MobileMenu } from './MobileMenu'
import { NavLink } from './NavLink'

export function Header({ settings }: { settings: Setting }) {
  const storeName = settings.storeName || 'RYD'
  const items = (settings.headerNav ?? []).map((item) => ({ label: item.label, url: item.url }))

  return (
    <HeaderShell>
      <div className="shell grid h-16 grid-cols-[1fr_auto] items-center gap-6 md:h-[4.5rem] md:grid-cols-[1fr_auto_1fr]">
        <Link
          aria-label={`${storeName} — strona główna`}
          className="justify-self-start text-[1.3125rem] leading-none font-semibold tracking-[0.2em] uppercase"
          href="/"
        >
          {storeName}
        </Link>

        <nav aria-label="Główna" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {items.map((item) => (
              <li key={`${item.label}-${item.url}`}>
                <NavLink className="link-line text-[0.9375rem] font-medium" href={item.url}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="-mr-2 flex items-center justify-self-end">
          <CartButton />
          <MobileMenu email={settings.contact?.email} items={items} phone={settings.contact?.phone} />
        </div>
      </div>
    </HeaderShell>
  )
}
