import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import { pl } from '@payloadcms/translations/languages/pl'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Messages } from './collections/Messages'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { ShippingMethods } from './collections/ShippingMethods'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Hosting (np. Vercel z bazą Neon) podaje adres bazy pod różnymi nazwami — przyjmujemy każdą z nich.
const databaseUrl =
  process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)
const smtpPort = Number(process.env.SMTP_PORT || 587)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Panel sklepu',
    },
    dateFormat: 'd MMM yyyy, HH:mm',
    // Wbudowany awatar zamiast Gravatara — panel nie wysyła adresu e-mail administratora na zewnątrz.
    avatar: 'default',
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
      beforeDashboard: ['@/components/admin/BeforeDashboard'],
    },
  },
  collections: [Products, Categories, ShippingMethods, Orders, Messages, Pages, Media, Users],
  globals: [Homepage, Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { pl, en },
  },
  // Bez skonfigurowanej skrzynki (zmienne SMTP_*) treść e-maili trafia do logów serwera.
  email: smtpConfigured
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || '',
        defaultFromName: process.env.SMTP_FROM_NAME || 'RYD',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpPort === 465,
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
        },
      })
    : undefined,
  sharp,
  upload: {
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  },
  plugins: [
    // Na hostingu Vercel zdjęcia trafiają do magazynu Blob (token ustawia się sam po jego podłączeniu).
    // Lokalnie, bez tokenu, pliki zapisują się w katalogu /media.
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      alwaysInsertFields: true,
    }),
  ],
  graphQL: {
    disable: true,
  },
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
