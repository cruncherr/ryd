'use client'

import { Drawer } from '@base-ui/react/drawer'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { NavLink } from './NavLink'

type Props = {
  items: Array<{ label: string; url: string }>
  phone?: string | null
  email?: string | null
}

/** Menu na telefonie: arkusz wysuwany od dołu, zamykany także przeciągnięciem w dół. */
export function MobileMenu({ items, phone, email }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Drawer.Root onOpenChange={setOpen} open={open}>
      <Drawer.Trigger aria-label="Otwórz menu" className="icon-btn md:hidden">
        <Menu aria-hidden="true" size={22} strokeWidth={1.5} />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="drawer-backdrop" />
        <Drawer.Viewport className="drawer-viewport items-end justify-center">
          <Drawer.Popup className="drawer-sheet">
            <div aria-hidden="true" className="drawer-handle" />
            <Drawer.Content className="px-6 pt-2 pb-8">
              <div className="flex items-center justify-between">
                <Drawer.Title className="eyebrow">Menu</Drawer.Title>
                <Drawer.Close aria-label="Zamknij menu" className="icon-btn -mr-2">
                  <X aria-hidden="true" size={22} strokeWidth={1.5} />
                </Drawer.Close>
              </div>
              <nav aria-label="Główna" className="mt-4">
                <ul>
                  {items.map((item) => (
                    <li className="border-b border-line" key={`${item.label}-${item.url}`}>
                      <NavLink className="display-3 block py-4" href={item.url} onNavigate={close}>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              {(phone || email) && (
                <div className="mt-8 grid gap-2 text-[0.9375rem]">
                  <p className="eyebrow">Kontakt</p>
                  {phone && (
                    <a className="font-medium" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                      {phone}
                    </a>
                  )}
                  {email && (
                    <a className="font-medium" href={`mailto:${email}`}>
                      {email}
                    </a>
                  )}
                </div>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
