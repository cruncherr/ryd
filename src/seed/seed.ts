import type { Payload } from 'payload'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  CATEGORY,
  DETAIL_IMAGES,
  HOMEPAGE,
  PAGES,
  PRODUCTS,
  SETTINGS,
  SHIPPING,
  type SeedImage,
} from './data'

const SEED_DIR = path.resolve(process.cwd(), 'seed')
const context = { skipRevalidate: true }

export type SeedResult =
  | { status: 'skipped'; reason: string }
  | { status: 'done'; created: Record<string, number> }

/**
 * Wgrywa dane startowe. Działa bezpiecznie przy ponownym uruchomieniu: tworzy tylko to,
 * czego jeszcze nie ma, i nigdy nie nadpisuje zmian wprowadzonych w panelu.
 * Bez opcji `force` uruchamia się tylko raz (znacznik w ustawieniach sklepu).
 */
export async function seed(payload: Payload, options: { force?: boolean } = {}): Promise<SeedResult> {
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  if (settings.seededAt && !options.force) {
    return { status: 'skipped', reason: 'Dane startowe zostały już wgrane wcześniej.' }
  }

  const created: Record<string, number> = { media: 0, categories: 0, products: 0, shipping: 0, pages: 0 }
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const toRichText = (markdown: string) => convertMarkdownToLexical({ editorConfig, markdown })

  // --- Zdjęcia -------------------------------------------------------------
  const mediaIds = new Map<string, number>()

  async function ensureImage(image: SeedImage): Promise<number> {
    const cached = mediaIds.get(image.file)
    if (cached) return cached

    const filename = `${image.file}.jpg`
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    })
    const found = existing.docs[0]
    if (found) {
      mediaIds.set(image.file, found.id)
      return found.id
    }

    const doc = await payload.create({
      collection: 'media',
      data: { alt: image.alt },
      filePath: path.join(SEED_DIR, 'media', filename),
      context,
    })
    created.media = (created.media ?? 0) + 1
    mediaIds.set(image.file, doc.id)
    return doc.id
  }

  const altByFile = new Map<string, string>()
  for (const product of PRODUCTS) {
    for (const image of product.variant.images) altByFile.set(image.file, image.alt)
  }
  for (const image of DETAIL_IMAGES) altByFile.set(image.file, image.alt)
  const imageId = (file: string) => ensureImage({ file, alt: altByFile.get(file) ?? '' })

  // --- Kategoria -----------------------------------------------------------
  const existingCategory = await payload.find({
    collection: 'categories',
    where: { slug: { equals: CATEGORY.slug } },
    limit: 1,
    depth: 0,
  })
  let categoryId = existingCategory.docs[0]?.id
  if (!categoryId) {
    const category = await payload.create({
      collection: 'categories',
      data: { ...CATEGORY, sortOrder: 10 },
      context,
    })
    categoryId = category.id
    created.categories = 1
  }

  // --- Produkty ------------------------------------------------------------
  const productIds = new Map<string, number>()
  for (const product of PRODUCTS) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    const found = existing.docs[0]
    if (found) {
      productIds.set(product.slug, found.id)
      continue
    }

    const images: number[] = []
    for (const image of product.variant.images) images.push(await ensureImage(image))

    const functionViews = []
    for (const view of product.functionViews) {
      functionViews.push({ label: view.label, caption: view.caption, image: await imageId(view.file) })
    }

    const doc = await payload.create({
      collection: 'products',
      data: {
        title: product.title,
        slug: product.slug,
        generateSlug: false,
        category: categoryId,
        shortDescription: product.shortDescription,
        price: product.price,
        availability: 'made_to_order',
        leadTime: product.leadTime,
        variants: [
          {
            name: product.variant.name,
            fabric: product.variant.fabric,
            swatchColor: product.variant.swatchColor,
            images,
            available: true,
          },
        ],
        functionViews,
        features: product.features,
        description: toRichText(product.description),
        specs: product.specs,
        care: product.care,
        featured: true,
        sortOrder: product.sortOrder,
        sampleData: true,
        _status: 'published',
      },
      context,
    })
    productIds.set(product.slug, doc.id)
    created.products = (created.products ?? 0) + 1
  }

  // --- Metody dostawy ------------------------------------------------------
  const shippingCount = await payload.count({ collection: 'shipping-methods' })
  if (shippingCount.totalDocs === 0) {
    for (const method of SHIPPING) {
      await payload.create({
        collection: 'shipping-methods',
        data: { ...method, active: true, sampleData: true },
        context,
      })
      created.shipping = (created.shipping ?? 0) + 1
    }
  }

  // --- Strony --------------------------------------------------------------
  for (const page of PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    if (existing.docs[0]) continue

    const markdown = await fs.readFile(path.join(SEED_DIR, 'content', page.file), 'utf8')
    await payload.create({
      collection: 'pages',
      data: {
        title: page.title,
        slug: page.slug,
        generateSlug: false,
        lead: page.lead,
        content: toRichText(markdown),
        showCompanyDetails: page.showCompanyDetails,
        needsReview: true,
        _status: 'published',
      },
      context,
    })
    created.pages = (created.pages ?? 0) + 1
  }

  // --- Strona główna -------------------------------------------------------
  const homepage = await payload.findGlobal({ slug: 'homepage', depth: 0 })
  if (!homepage.hero?.title) {
    const qualityItems = []
    for (const item of HOMEPAGE.quality.items) {
      qualityItems.push({ title: item.title, text: item.text, image: await imageId(item.imageFile) })
    }

    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        needsReview: true,
        hero: {
          eyebrow: HOMEPAGE.hero.eyebrow,
          title: HOMEPAGE.hero.title,
          text: HOMEPAGE.hero.text,
          primaryLabel: HOMEPAGE.hero.primaryLabel,
          primaryUrl: HOMEPAGE.hero.primaryUrl,
          secondaryLabel: HOMEPAGE.hero.secondaryLabel,
          secondaryUrl: HOMEPAGE.hero.secondaryUrl,
          image: await imageId(HOMEPAGE.hero.imageFile),
        },
        usps: HOMEPAGE.usps,
        collection: HOMEPAGE.collection,
        functions: {
          eyebrow: HOMEPAGE.functions.eyebrow,
          title: HOMEPAGE.functions.title,
          text: HOMEPAGE.functions.text,
          product: productIds.get(HOMEPAGE.functions.productSlug),
        },
        quality: {
          eyebrow: HOMEPAGE.quality.eyebrow,
          title: HOMEPAGE.quality.title,
          text: HOMEPAGE.quality.text,
          items: qualityItems,
        },
        story: HOMEPAGE.story,
        contact: HOMEPAGE.contact,
      },
      context,
    })
  }

  // --- Ustawienia sklepu ---------------------------------------------------
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      storeName: settings.storeName || SETTINGS.storeName,
      tagline: settings.tagline || SETTINGS.tagline,
      headerNav: settings.headerNav?.length ? settings.headerNav : SETTINGS.headerNav,
      footerNav: settings.footerNav?.length ? settings.footerNav : SETTINGS.footerNav,
      footerText: settings.footerText || SETTINGS.footerText,
      seo: {
        title: settings.seo?.title || SETTINGS.seo.title,
        description: settings.seo?.description || SETTINGS.seo.description,
        image: settings.seo?.image || (await imageId(SETTINGS.seo.imageFile)),
      },
      seededAt: new Date().toISOString(),
    },
    context,
  })

  return { status: 'done', created }
}

/**
 * Zakłada pierwsze konto administratora z danych podanych w ustawieniach hostingu
 * (ADMIN_EMAIL i ADMIN_PASSWORD). Robi to tylko wtedy, gdy w panelu nie ma jeszcze żadnego konta —
 * dzięki temu nikt obcy nie zdąży zająć panelu przed właścicielem, a istniejące konta są nietykalne.
 */
export async function ensureAdmin(payload: Payload): Promise<'created' | 'exists' | 'not-configured'> {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return 'not-configured'

  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs > 0) return 'exists'

  await payload.create({ collection: 'users', data: { email, password, name: 'Administrator' }, context })
  return 'created'
}
