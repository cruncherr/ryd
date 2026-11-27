import type { Payload } from 'payload'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  CATEGORY,
  CONFIGURATORS,
  CORNER_CATEGORY,
  DETAIL_IMAGES,
  FABRICS,
  HOMEPAGE,
  HOMEPAGE_V2,
  LEGACY_SAMPLE_FABRICS,
  PAGES,
  PRODUCTS,
  SETTINGS,
  SETTINGS_V2,
  SHIPPING,
  type SeedImage,
} from './data'

const SEED_DIR = path.resolve(process.cwd(), 'seed')
// Każde wywołanie dostaje własną kopię: Payload i wtyczka magazynu zdjęć zapisują w kontekście znaczniki
// (np. skipCloudStorage po wgraniu pliku), więc wspólny obiekt sprawiłby, że kolejne zdjęcia nie trafią do magazynu.
const context = { skipRevalidate: true }

/** Zdjęcie z katalogu seed/media wgrane do biblioteki (jeśli już jest — używamy istniejącego). */
async function ensureMedia(payload: Payload, file: string, alt: string): Promise<number> {
  const filename = `${path.basename(file)}.jpg`
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
  const found = existing.docs[0]
  if (found) return found.id
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(SEED_DIR, 'media', `${file}.jpg`),
    context: { ...context },
  })
  return doc.id
}

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
      context: { ...context },
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
      context: { ...context },
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
      context: { ...context },
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
        context: { ...context },
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
      context: { ...context },
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
      context: { ...context },
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
    context: { ...context },
  })

  return { status: 'done', created }
}

/**
 * Uzupełnienia danych startowych dla sklepów, które wystartowały przed pojawieniem się konfiguratora:
 * biblioteka tkanin, wymiary i nóżki modeli, kategoria narożników, nowe sekcje strony głównej.
 *
 * Zasada: zmieniamy wyłącznie treści przykładowe, których właściciel jeszcze nie sprawdził
 * (produkt z zaznaczonym „Dane przykładowe”, strona główna z „Teksty przykładowe”) i tylko wtedy,
 * gdy dane miejsce jest puste. Uruchamiane przy każdym wdrożeniu — za drugim razem nie robi nic.
 */
export async function upgradeSeed(payload: Payload): Promise<string[]> {
  const done: string[] = []

  // --- Tkaniny ---------------------------------------------------------------
  // Biblioteka tkanin partnera (Toptextil): tworzymy brakujące kolekcje razem ze zdjęciami kolorów.
  const existingFabrics = await payload.find({ collection: 'fabrics', depth: 0, limit: 200, pagination: false })
  const existingNames = new Set(existingFabrics.docs.map((fabric) => fabric.name))
  const sortBase = existingFabrics.docs.filter((fabric) => !LEGACY_SAMPLE_FABRICS.includes(fabric.name)).length
  let createdFabrics = 0
  for (const [index, fabric] of FABRICS.entries()) {
    if (existingNames.has(fabric.name)) continue
    const colors = []
    for (const color of fabric.colors) {
      colors.push({
        name: color.name,
        swatchColor: color.swatchColor,
        available: true,
        image: color.swatchFile
          ? await ensureMedia(payload, path.join('tkaniny', color.swatchFile), `${fabric.name} ${color.name} — próbka tkaniny`)
          : null,
        photo: color.photoFile
          ? await ensureMedia(payload, path.join('tkaniny', color.photoFile), `${fabric.name} ${color.name} — tkanina na zbliżeniu`)
          : null,
      })
    }
    await payload.create({
      collection: 'fabrics',
      data: {
        name: fabric.name,
        type: fabric.type,
        surchargePercent: fabric.surchargePercent,
        description: fabric.description,
        features: fabric.features,
        composition: fabric.composition,
        martindale: fabric.martindale,
        weight: fabric.weight,
        supplier: fabric.supplier,
        datasheetUrl: fabric.datasheetUrl,
        colors,
        active: true,
        sortOrder: (sortBase + index + 1) * 10,
        // Dopłaty są propozycją sklepu — właściciel potwierdza je w panelu.
        sampleData: true,
      },
      context: { ...context },
    })
    createdFabrics += 1
  }
  if (createdFabrics > 0) done.push(`tkaniny: ${createdFabrics}`)

  const fabricDocs = await payload.find({ collection: 'fabrics', depth: 0, limit: 200, pagination: false })
  const fabricByName = new Map(fabricDocs.docs.map((fabric) => [fabric.name, fabric]))
  // Przykładowe tkaniny z pierwszej wersji (sprzed biblioteki Toptextil) — do zastąpienia.
  const legacyIds = new Set(
    fabricDocs.docs.filter((fabric) => fabric.sampleData && LEGACY_SAMPLE_FABRICS.includes(fabric.name)).map((fabric) => fabric.id),
  )

  // --- Kategoria narożników --------------------------------------------------
  const corners = await payload.find({
    collection: 'categories',
    where: { slug: { equals: CORNER_CATEGORY.slug } },
    limit: 1,
    depth: 0,
  })
  let cornerCategoryId = corners.docs[0]?.id
  const needsCorners = Object.values(CONFIGURATORS).some((config) => config.category === CORNER_CATEGORY.slug)
  if (!cornerCategoryId && needsCorners) {
    const created = await payload.create({
      collection: 'categories',
      data: { ...CORNER_CATEGORY, sortOrder: 20 },
      context: { ...context },
    })
    cornerCategoryId = created.id
    done.push('kategoria: Narożniki')
  }

  // --- Konfiguracja produktów ------------------------------------------------
  for (const [slug, config] of Object.entries(CONFIGURATORS)) {
    const found = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const product = found.docs[0]
    if (!product || !product.sampleData) continue

    const photoFabric = fabricByName.get(config.photo.fabric)
    const fabricIds = config.fabrics.flatMap((name) => {
      const fabric = fabricByName.get(name)
      return fabric ? [fabric.id] : []
    })
    const relId = (value: unknown) => (typeof value === 'object' && value !== null ? (value as { id: number }).id : value)
    const linkVariant = (variants: NonNullable<typeof product.variants>) =>
      variants.map((variant, index) =>
        index === 0 && photoFabric && (relId(variant.fabricLink) == null || legacyIds.has(relId(variant.fabricLink) as number))
          ? { ...variant, name: config.photo.color, fabric: photoFabric.name, fabricLink: photoFabric.id }
          : variant,
      )

    const configured = (product.sizes?.length ?? 0) > 0 || (product.fabrics?.length ?? 0) > 0 || (product.legs?.length ?? 0) > 0
    if (configured) {
      // Produkt skonfigurowany wcześniej na tkaninach przykładowych — podmieniamy je na tkaniny Toptextil.
      const current = (product.fabrics ?? []).map((fabric) => relId(fabric) as number)
      if (legacyIds.size === 0 || current.length === 0 || !current.every((id) => legacyIds.has(id))) continue
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { fabrics: fabricIds, variants: linkVariant(product.variants ?? []), _status: 'published' },
        context: { ...context },
      })
      done.push(`tkaniny Toptextil: ${slug}`)
      continue
    }

    const variants = linkVariant(product.variants ?? [])
    // Wybór nóżek i strony szezlonga jest teraz w konfiguratorze — w danych technicznych byłby sprzeczny.
    const specs = (product.specs ?? [])
      .filter((spec) => !(config.legs.length > 1 && spec.label === 'Kolor nóżek'))
      .map((spec) =>
        config.sideChoice && spec.label === 'Szezlong' ? { ...spec, value: 'po lewej lub po prawej stronie — do wyboru' } : spec,
      )

    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        sizes: config.sizes,
        fabrics: fabricIds,
        legs: config.legs,
        sideChoice: config.sideChoice ?? false,
        defaultSide: config.defaultSide ?? 'right',
        variants,
        specs,
        ...(config.category === CORNER_CATEGORY.slug && cornerCategoryId ? { category: cornerCategoryId } : {}),
        _status: 'published',
      },
      context: { ...context },
    })
    done.push(`konfigurator: ${slug}`)
  }

  // Tkaniny przykładowe, których nie używa już żaden produkt, znikają z próbnika.
  for (const id of legacyIds) {
    const inUse = await payload.count({ collection: 'products', where: { fabrics: { in: [id] } } })
    if (inUse.totalDocs > 0) continue
    await payload.delete({ collection: 'fabrics', id, context: { ...context } })
    done.push(`usunięto przykładową tkaninę ${id}`)
  }

  // --- Strona główna -----------------------------------------------------------
  const homepage = await payload.findGlobal({ slug: 'homepage', depth: 0 })
  if (homepage.needsReview && !homepage.steps?.title) {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: { ...homepage.hero, ...HOMEPAGE_V2.hero },
        usps: HOMEPAGE_V2.usps,
        collection: HOMEPAGE_V2.collection,
        categories: HOMEPAGE_V2.categories,
        steps: HOMEPAGE_V2.steps,
        fabrics: HOMEPAGE_V2.fabrics,
      },
      context: { ...context },
    })
    done.push('strona główna: nowe sekcje')
  }

  // --- Menu i pasek informacji -------------------------------------------------
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
  const oldNav = SETTINGS.headerNav.map((item) => `${item.label}>${item.url}`).join('|')
  const currentNav = (settings.headerNav ?? []).map((item) => `${item.label}>${item.url}`).join('|')
  const navIsDefault = currentNav === oldNav || currentNav === ''
  if (navIsDefault || !settings.announcement) {
    await payload.updateGlobal({
      slug: 'settings',
      data: {
        ...(navIsDefault ? { headerNav: SETTINGS_V2.headerNav } : {}),
        ...(!settings.announcement ? { announcement: SETTINGS_V2.announcement } : {}),
      },
      context: { ...context },
    })
    done.push('menu i pasek informacji')
  }

  return done
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

  await payload.create({ collection: 'users', data: { email, password, name: 'Administrator' }, context: { ...context } })
  return 'created'
}
