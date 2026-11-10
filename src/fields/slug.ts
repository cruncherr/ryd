import { slugField, type Field } from 'payload'

import { slugify } from '@/lib/slugify'

/**
 * Pole „adres strony" tworzone automatycznie z nazwy (z obsługą polskich znaków).
 * Po zapisaniu adres się nie zmienia, żeby nie psuć linków, które ktoś już udostępnił.
 */
export function polishSlugField(useAsSlug = 'title'): Field {
  return slugField({
    useAsSlug,
    position: 'sidebar',
    slugify: ({ valueToSlugify }) =>
      typeof valueToSlugify === 'string' ? slugify(valueToSlugify) : undefined,
    overrides: (field) => {
      for (const child of field.fields) {
        if ('name' in child && child.name === 'slug') {
          child.label = 'Adres strony (slug)'
          child.admin = {
            ...child.admin,
            description:
              'Końcówka adresu w przeglądarce. Tworzy się sama z nazwy — zwykle nie trzeba jej zmieniać.',
          }
        }
        if ('name' in child && child.name === 'generateSlug') {
          child.label = 'Twórz adres automatycznie'
        }
      }
      return field
    },
  })
}
