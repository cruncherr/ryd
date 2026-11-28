import { TOPTEXTIL_FABRICS } from './toptextil'

/**
 * Dane startowe sklepu. Wszystko, co tu jest, to PUNKT WYJŚCIA przygotowany na podstawie
 * zdjęć: nazwy, ceny i opisy są przykładowe i w panelu są oznaczone jako „do sprawdzenia”.
 * Sklep nie pozwoli włączyć sprzedaży, dopóki właściciel ich nie zweryfikuje.
 */

export type SeedImage = {
  /** Nazwa pliku w katalogu seed/media (bez rozszerzenia). */
  file: string
  alt: string
}

export type SeedProduct = {
  title: string
  slug: string
  shortDescription: string
  price: number
  leadTime: string
  sortOrder: number
  variant: {
    name: string
    fabric?: string
    swatchColor: string
    images: SeedImage[]
  }
  functionViews: Array<{ label: string; caption: string; file: string }>
  features: Array<{ title: string; text: string }>
  /** Opis w Markdownie (akapity oddzielone pustą linią). */
  description: string
  specs: Array<{ label: string; value: string }>
  care: string
}

const CARE =
  'Odkurzaj tkaninę miękką końcówką odkurzacza.\nŚwieże plamy osuszaj czystą, lekko wilgotną ściereczką — bez pocierania.\nNie używaj wybielaczy ani silnych detergentów.'

export const PRODUCTS: SeedProduct[] = [
  {
    title: 'Sofa rozkładana Bergen',
    slug: 'sofa-rozkladana-bergen',
    shortDescription:
      'Pikowana sofa z regulowanymi zagłówkami i wysuwaną funkcją spania. Miękka w dotyku, stabilna w siedzeniu.',
    price: 4290,
    leadTime: 'Realizacja zamówienia: 3–5 tygodni',
    sortOrder: 10,
    variant: {
      name: 'Grafitowy',
      swatchColor: '#54585C',
      images: [
        { file: 'bergen-01', alt: 'Sofa Bergen w kolorze grafitowym, widok pod kątem z prawej strony, zagłówki podniesione' },
        { file: 'bergen-03', alt: 'Sofa Bergen w kolorze grafitowym, widok pod kątem z lewej strony, zagłówki podniesione' },
        { file: 'bergen-02', alt: 'Sofa Bergen w kolorze grafitowym, widok z przodu, zagłówki opuszczone' },
        { file: 'bergen-04', alt: 'Sofa Bergen w kolorze grafitowym, widok z przodu, zagłówki podniesione' },
        { file: 'bergen-05', alt: 'Sofa Bergen z jednym podniesionym zagłówkiem, widok z lewej strony' },
        { file: 'bergen-06', alt: 'Sofa Bergen z jednym podniesionym zagłówkiem, widok z prawej strony' },
        { file: 'bergen-07', alt: 'Sofa Bergen z wysuniętą dolną częścią funkcji spania' },
        { file: 'bergen-08', alt: 'Sofa Bergen rozłożona do spania, widok z przodu' },
      ],
    },
    functionViews: [
      { label: 'Sofa', caption: 'Zagłówki opuszczone — niska, spokojna linia oparcia.', file: 'bergen-02' },
      { label: 'Zagłówki', caption: 'Podnosisz je, gdy chcesz wygodnie oprzeć głowę.', file: 'bergen-04' },
      { label: 'Wysuwanie', caption: 'Dolna część wyjeżdża do przodu na kółkach.', file: 'bergen-07' },
      { label: 'Łóżko', caption: 'Materac podnosisz za uchwyt do wysokości siedziska.', file: 'bergen-08' },
    ],
    features: [
      {
        title: 'Regulowane zagłówki',
        text: 'Podnosisz je, gdy chcesz oprzeć głowę, i opuszczasz, gdy sofa ma wyglądać lżej.',
      },
      {
        title: 'Wysuwana funkcja spania',
        text: 'Dolna część wyjeżdża na kółkach, a materac podnosisz jednym ruchem za uchwyt.',
      },
      {
        title: 'Pikowane siedzisko i oparcie',
        text: 'Podział na miękkie pola, które równo podpierają ciało.',
      },
    ],
    description: `Bergen to sofa do codziennego wypoczynku: głębokie, pikowane siedzisko, wysokie oparcie i zagłówki, które podnosisz wtedy, gdy chcesz oprzeć głowę.

Kiedy potrzebujesz dodatkowego miejsca do spania, wysuwasz dolną część i jednym ruchem podnosisz materac za uchwyt. Po złożeniu sofa wygląda tak, jakby funkcji spania w ogóle nie miała.`,
    specs: [
      { label: 'Funkcja spania', value: 'tak, wysuwana' },
      { label: 'Zagłówki', value: 'regulowane' },
      { label: 'Kolor nóżek', value: 'czarny' },
    ],
    care: CARE,
  },
  {
    title: 'Sofa rozkładana Lund',
    slug: 'sofa-rozkladana-lund',
    shortDescription:
      'Sofa z luźnymi poduchami, funkcją spania i pojemnikiem na pościel. Welurowa tkanina i smukłe czarne nóżki.',
    price: 3690,
    leadTime: 'Realizacja zamówienia: 3–5 tygodni',
    sortOrder: 20,
    variant: {
      name: 'Granatowy',
      fabric: 'Welur',
      swatchColor: '#123A70',
      images: [
        { file: 'lund-01', alt: 'Sofa Lund w kolorze granatowym, widok pod kątem z prawej strony' },
        { file: 'lund-02', alt: 'Sofa Lund w kolorze granatowym, widok pod kątem z lewej strony' },
        { file: 'lund-03', alt: 'Sofa Lund w kolorze granatowym, widok z lewej strony, widoczny bok z przeszyciami' },
        { file: 'lund-04', alt: 'Sofa Lund bez poduch oparcia' },
        { file: 'lund-05', alt: 'Sofa Lund z wysuniętym siedziskiem' },
        { file: 'lund-06', alt: 'Sofa Lund rozłożona do spania' },
        { file: 'lund-07', alt: 'Sofa Lund rozłożona do spania, widok z góry' },
        { file: 'lund-08', alt: 'Sofa Lund z otwartym pojemnikiem na pościel' },
      ],
    },
    functionViews: [
      { label: 'Sofa', caption: 'Dwie duże poduchy oparcia układasz tak, jak Ci wygodnie.', file: 'lund-02' },
      { label: 'Bez poduch', caption: 'Zdejmujesz poduchy — oparcie jest gotowe do rozłożenia.', file: 'lund-04' },
      { label: 'Wysuwanie', caption: 'Siedzisko wysuwa się do przodu.', file: 'lund-05' },
      { label: 'Łóżko', caption: 'Oparcie kładzie się na płasko i tworzy równą powierzchnię spania.', file: 'lund-06' },
    ],
    features: [
      {
        title: 'Funkcja spania',
        text: 'Siedzisko wysuwa się do przodu, a oparcie kładzie na płasko.',
      },
      {
        title: 'Pojemnik na pościel',
        text: 'Kołdrę i poduszki chowasz pod siedziskiem.',
      },
      {
        title: 'Luźne poduchy oparcia',
        text: 'Dwie duże poduchy, które układasz tak, jak Ci wygodnie.',
      },
      {
        title: 'Dopracowane detale',
        text: 'Wypustki na froncie i przeszycia na bokach.',
      },
    ],
    description: `Lund łączy lekką formę z wygodą dużych, miękkich poduch oparcia. Wywinięte boki z przeszyciami i wypustki na froncie dodają jej charakteru, a smukłe czarne nóżki unoszą bryłę nad podłogą.

Na co dzień sofa, w razie potrzeby łóżko: siedzisko wysuwa się do przodu, a oparcie kładzie na płasko, tworząc równą powierzchnię do spania. Pod siedziskiem jest pojemnik na pościel.`,
    specs: [
      { label: 'Funkcja spania', value: 'tak' },
      { label: 'Pojemnik na pościel', value: 'tak' },
      { label: 'Kolor nóżek', value: 'czarny' },
    ],
    care: CARE,
  },
  {
    title: 'Sofa rozkładana Visby',
    slug: 'sofa-rozkladana-visby',
    shortDescription:
      'Sofa z pikowanym oparciem, funkcją spania i pojemnikiem na pościel. Prosta bryła na jasnych nóżkach.',
    price: 3290,
    leadTime: 'Realizacja zamówienia: 3–5 tygodni',
    sortOrder: 30,
    variant: {
      name: 'Granatowy',
      fabric: 'Welur',
      swatchColor: '#1D4A78',
      images: [
        { file: 'visby-01', alt: 'Sofa Visby w kolorze granatowym, widok pod kątem z prawej strony' },
        { file: 'visby-02', alt: 'Sofa Visby w kolorze granatowym, widok pod kątem z lewej strony' },
        { file: 'visby-03', alt: 'Sofa Visby rozłożona do spania, widok z prawej strony' },
        { file: 'visby-04', alt: 'Sofa Visby rozłożona do spania, widok z lewej strony' },
        { file: 'visby-05', alt: 'Sofa Visby rozłożona do spania, widok z góry' },
        { file: 'visby-06', alt: 'Sofa Visby z otwartym pojemnikiem na pościel' },
      ],
    },
    functionViews: [
      { label: 'Sofa', caption: 'Oparcie pikowane guzikami i szerokie boki z wypustką.', file: 'visby-01' },
      { label: 'Łóżko', caption: 'Siedzisko wysuwa się do przodu, oparcie kładzie się na płasko.', file: 'visby-03' },
      { label: 'Pojemnik', caption: 'Pościel chowasz pod siedziskiem.', file: 'visby-06' },
    ],
    features: [
      {
        title: 'Funkcja spania',
        text: 'Rozkładasz ją w chwilę: siedzisko do przodu, oparcie na płasko.',
      },
      {
        title: 'Pojemnik na pościel',
        text: 'Kołdrę i poduszki chowasz pod siedziskiem.',
      },
      {
        title: 'Pikowane oparcie',
        text: 'Poduchy oparcia przeszyte i zapięte guzikami.',
      },
    ],
    description: `Visby to prosta, ponadczasowa bryła: szerokie boki z wypustką, oparcie pikowane guzikami i jasne nóżki, które ocieplają granatowy welur.

Rozkładanie zajmuje chwilę — siedzisko wysuwa się do przodu, a oparcie kładzie na płasko. Pościel schowasz w pojemniku pod siedziskiem.`,
    specs: [
      { label: 'Funkcja spania', value: 'tak' },
      { label: 'Pojemnik na pościel', value: 'tak' },
      { label: 'Kolor nóżek', value: 'jasne drewno' },
    ],
    care: CARE,
  },
  {
    title: 'Narożnik rozkładany Oslo',
    slug: 'naroznik-rozkladany-oslo',
    shortDescription:
      'Narożnik z szezlongiem, funkcją spania i dwoma pojemnikami na pościel. Miękkie poduchy oparcia i smukłe czarne nóżki.',
    price: 4890,
    leadTime: 'Realizacja zamówienia: 3–5 tygodni',
    sortOrder: 40,
    variant: {
      name: 'Grafitowy',
      fabric: 'Welur',
      swatchColor: '#33394A',
      images: [
        { file: 'oslo-01', alt: 'Narożnik Oslo w kolorze grafitowym z szezlongiem po prawej, widok pod kątem' },
        { file: 'oslo-02', alt: 'Narożnik Oslo w kolorze grafitowym, widok z boku od strony podłokietnika' },
        { file: 'oslo-03', alt: 'Narożnik Oslo z poduchami oparcia, widok z góry' },
        { file: 'oslo-04', alt: 'Narożnik Oslo bez poduch oparcia, widok z góry' },
        { file: 'oslo-05', alt: 'Narożnik Oslo rozłożony do spania, widok z góry' },
        { file: 'oslo-06', alt: 'Narożnik Oslo z otwartymi pojemnikami na pościel pod siedziskiem i w szezlongu' },
        { file: 'oslo-07', alt: 'Zbliżenie siedziska i szezlonga narożnika Oslo z wypustką na krawędziach' },
      ],
    },
    functionViews: [
      { label: 'Narożnik', caption: 'Szezlong po prawej, trzy miękkie poduchy oparcia.', file: 'oslo-01' },
      { label: 'Łóżko', caption: 'Siedzisko wysuwa się i tworzy z szezlongiem duże miejsce do spania.', file: 'oslo-05' },
      { label: 'Pojemniki', caption: 'Pościel chowasz pod siedziskiem, a drobiazgi w szezlongu.', file: 'oslo-06' },
    ],
    features: [
      {
        title: 'Duże miejsce do spania',
        text: 'Po rozłożeniu siedzisko i szezlong tworzą jedną szeroką powierzchnię.',
      },
      {
        title: 'Dwa pojemniki',
        text: 'Jeden pod siedziskiem, drugi w szezlongu — klapa unosi się na podnośnikach.',
      },
      {
        title: 'Miękkie oparcie',
        text: 'Trzy luźne poduchy z wypustką — możesz je ułożyć tak, jak Ci wygodnie.',
      },
    ],
    description: `Oslo to narożnik na co dzień i dla gości: szezlong do wyciągnięcia nóg, trzy miękkie poduchy oparcia i smukłe boki z wypustką. Czarne metalowe nóżki unoszą bryłę, dzięki czemu wygląda lekko.

Na noc siedzisko wysuwa się do przodu i razem z szezlongiem tworzy duże miejsce do spania. Pościel schowasz w pojemniku pod siedziskiem, a koce i poduszki — w szezlongu, którego klapa unosi się na podnośnikach.`,
    specs: [
      { label: 'Funkcja spania', value: 'tak' },
      { label: 'Pojemnik na pościel', value: 'tak, pod siedziskiem i w szezlongu' },
      { label: 'Szezlong', value: 'po prawej stronie (jak na zdjęciach)' },
      { label: 'Kolor nóżek', value: 'czarny metal' },
    ],
    care: CARE,
  },
]

export const CATEGORY = {
  title: 'Sofy',
  slug: 'sofy',
  description:
    'Sofy rozkładane z funkcją spania. Sprężyste wypełnienie, staranne wykonanie i tkaniny przyjemne w dotyku.',
}

export const SHIPPING = [
  {
    name: 'Dostawa kurierska',
    description: 'Dostawa pod wskazany adres na terenie Polski. Kurier kontaktuje się telefonicznie przed dostawą.',
    price: 199,
    deliveryTime: '2–5 dni roboczych od wysyłki',
    allowCod: true,
    sortOrder: 10,
  },
  {
    name: 'Dostawa z wniesieniem',
    description: 'Dostawa pod wskazany adres z wniesieniem mebla do mieszkania.',
    price: 349,
    deliveryTime: '2–7 dni roboczych od wysyłki',
    allowCod: true,
    sortOrder: 20,
  },
]

export const PAGES = [
  {
    title: 'O nas',
    slug: 'o-nas',
    lead: 'VELURO to meble tapicerowane wybierane tak, jak sami chcielibyśmy z nich korzystać.',
    file: 'o-nas.md',
    showCompanyDetails: false,
  },
  {
    title: 'Dostawa i płatności',
    slug: 'dostawa-i-platnosci',
    lead: 'Jak dostarczamy meble i w jaki sposób można zapłacić za zamówienie.',
    file: 'dostawa-i-platnosci.md',
    showCompanyDetails: false,
  },
  {
    title: 'Zwroty i reklamacje',
    slug: 'zwroty-i-reklamacje',
    lead: 'Co zrobić, jeśli chcesz zwrócić mebel albo coś jest z nim nie tak.',
    file: 'zwroty-i-reklamacje.md',
    showCompanyDetails: true,
  },
  {
    title: 'Regulamin sklepu',
    slug: 'regulamin',
    lead: 'Zasady składania zamówień, płatności, dostawy, zwrotów i reklamacji.',
    file: 'regulamin.md',
    showCompanyDetails: true,
  },
  {
    title: 'Polityka prywatności',
    slug: 'polityka-prywatnosci',
    lead: 'Jakie dane zbieramy, po co i jakie masz w związku z tym prawa.',
    file: 'polityka-prywatnosci.md',
    showCompanyDetails: true,
  },
]

export const DETAIL_IMAGES: SeedImage[] = [
  { file: 'detal-wypelnienie', alt: 'Zbliżenie pikowanego siedziska i oparcia sofy' },
  { file: 'detal-wykonanie', alt: 'Zbliżenie pikowanego oparcia i wypustki na boku sofy' },
  { file: 'detal-tkanina', alt: 'Zbliżenie tkaniny na boku sofy' },
]

export const HOMEPAGE = {
  hero: {
    eyebrow: 'Meble tapicerowane',
    title: 'Sofy, na których chce się zostać *dłużej*',
    text: 'Sprężyste wypełnienie, staranne szwy i funkcja spania, która działa bez wysiłku. Meble tapicerowane do codziennego wypoczynku.',
    primaryLabel: 'Zobacz sofy',
    primaryUrl: '/sklep',
    secondaryLabel: 'Poznaj jakość',
    secondaryUrl: '/#jakosc',
    imageFile: 'lund-01',
  },
  usps: [
    { title: 'Funkcja spania', text: 'W każdej sofie z naszej oferty' },
    { title: 'Dostawa w całej Polsce', text: 'Termin ustalamy telefonicznie' },
    { title: '14 dni na zwrot', text: 'Na zasadach opisanych w regulaminie' },
    { title: 'Pomoc w wyborze', text: 'Odpowiemy na pytania o wymiary i tkaniny' },
  ],
  collection: {
    eyebrow: 'Kolekcja',
    title: 'Trzy sofy, każda rozkłada się do spania',
    text: 'Różne charaktery, ta sama dbałość o wygodę i wykonanie.',
  },
  quality: {
    eyebrow: 'Jakość',
    title: 'Jakość, którą czuć od *pierwszego dotyku*',
    text: 'Dobry mebel poznaje się po detalach, których na co dzień się nie zauważa.',
    items: [
      {
        title: 'Wypełnienie',
        text: 'Sprężyste siedziska i oparcia: miękkie, kiedy siadasz, i stabilne, kiedy siedzisz dłużej. Wracają do kształtu, gdy wstajesz.',
        imageFile: 'detal-wypelnienie',
      },
      {
        title: 'Wykonanie',
        text: 'Równe szwy, starannie prowadzone wypustki i pikowania. To detale, które decydują o tym, jak mebel wygląda po latach.',
        imageFile: 'detal-wykonanie',
      },
      {
        title: 'Tkanina',
        text: 'Miękkie w dotyku tkaniny o przyjemnej strukturze, dobrane z myślą o codziennym użytkowaniu.',
        imageFile: 'detal-tkanina',
      },
    ],
  },
  story: {
    eyebrow: 'O marce',
    title: 'Meble, z których *sami* chcielibyśmy korzystać',
    text: 'Sofa ma być wygodna na co dzień i od święta. Dlatego stawiamy na staranne wykonanie i wypełnienia dobrej jakości, a nie na krótkotrwały efekt.',
    linkLabel: 'Poznaj nas',
    linkUrl: '/o-nas',
  },
  contact: {
    title: 'Masz pytania przed zakupem?',
    text: 'Pomożemy dobrać sofę do Twojego wnętrza, podamy wymiary i opowiemy o tkaninach.',
  },
}

export const SETTINGS = {
  storeName: 'VELURO',
  tagline: 'Meble tapicerowane',
  headerNav: [
    { label: 'Sofy', url: '/sklep' },
    { label: 'Jakość', url: '/#jakosc' },
    { label: 'O nas', url: '/o-nas' },
    { label: 'Kontakt', url: '/kontakt' },
  ],
  footerNav: [
    { label: 'Dostawa i płatności', url: '/dostawa-i-platnosci' },
    { label: 'Zwroty i reklamacje', url: '/zwroty-i-reklamacje' },
    { label: 'Regulamin sklepu', url: '/regulamin' },
    { label: 'Polityka prywatności', url: '/polityka-prywatnosci' },
  ],
  footerText: 'Meble tapicerowane wykonane starannie, z myślą o codziennym wypoczynku.',
  seo: {
    title: 'VELURO — sofy rozkładane i meble tapicerowane',
    description:
      'Sofy rozkładane z funkcją spania: sprężyste wypełnienie, staranne wykonanie i tkaniny przyjemne w dotyku. Dostawa na terenie całej Polski.',
    imageFile: 'lund-01',
  },
}

/* ---------- Konfigurator (dane przykładowe — do sprawdzenia w panelu) ---------- */

export type SeedFabric = {
  slug: string
  name: string
  type: 'velvet' | 'boucle' | 'chenille' | 'corduroy' | 'weave' | 'leather'
  surchargePercent: number
  description: string
  features: Array<'easy_clean' | 'water_repellent' | 'pet_friendly' | 'durable' | 'soft' | 'fire_retardant' | 'oeko_tex' | 'recycled'>
  composition: string
  martindale: number | null
  weight: string
  supplier: string
  datasheetUrl: string | null
  link: string
  /** Nazwa koloru = numer z katalogu producenta; pliki zdjęć w seed/media/tkaniny (bez rozszerzenia). */
  colors: Array<{ name: string; swatchColor: string; swatchFile: string | null; photoFile: string | null }>
}

/** Biblioteka tkanin: kolekcje partnera Toptextil (src/seed/toptextil.ts). */
export const FABRICS: SeedFabric[] = TOPTEXTIL_FABRICS

/** Przykładowe tkaniny z pierwszej wersji konfiguratora — zastępowane tkaninami Toptextil przy wdrożeniu. */
export const LEGACY_SAMPLE_FABRICS = ['Welur hydrofobowy', 'Szenil', 'Bouclé', 'Sztruks', 'Plecionka']

type SeedSize = {
  label: string
  priceDelta: number
  width: number
  depth: number
  height: number
  sleepWidth: number
  sleepLength: number
  bodyDepth?: number
  chaiseWidth?: number
}

export type SeedConfigurator = {
  sizes: SeedSize[]
  /** Nazwy tkanin z FABRICS, w kolejności wyświetlania. */
  fabrics: string[]
  legs: Array<{ name: string; swatchColor: string; priceDelta: number }>
  sideChoice?: boolean
  defaultSide?: 'left' | 'right'
  /** Tkanina i kolor, w których mebel jest na zdjęciach. */
  photo: { fabric: string; color: string }
  /** Kategoria inna niż domyślna (slug). */
  category?: string
}

const LEGS_BLACK = [
  { name: 'Czarny metal', swatchColor: '#1E1E1E', priceDelta: 0 },
  { name: 'Dąb naturalny', swatchColor: '#B88A58', priceDelta: 190 },
  { name: 'Złoty mosiądz', swatchColor: '#B4925A', priceDelta: 290 },
]

export const CONFIGURATORS: Record<string, SeedConfigurator> = {
  'sofa-rozkladana-bergen': {
    sizes: [
      { label: '2-osobowa', priceDelta: -600, width: 182, depth: 98, height: 92, sleepWidth: 120, sleepLength: 195 },
      { label: '3-osobowa', priceDelta: 0, width: 222, depth: 98, height: 92, sleepWidth: 150, sleepLength: 195 },
      { label: '3-osobowa XL', priceDelta: 500, width: 246, depth: 98, height: 92, sleepWidth: 170, sleepLength: 195 },
    ],
    fabrics: ['Greta', 'Rugia', 'Magic Velvet', 'Hygge', 'Baloo'],
    legs: [],
    photo: { fabric: 'Greta', color: '884' },
  },
  'sofa-rozkladana-lund': {
    sizes: [
      { label: '2-osobowa', priceDelta: -500, width: 176, depth: 96, height: 88, sleepWidth: 125, sleepLength: 195 },
      { label: '3-osobowa', priceDelta: 0, width: 214, depth: 96, height: 88, sleepWidth: 155, sleepLength: 195 },
      { label: '3-osobowa XL', priceDelta: 450, width: 236, depth: 96, height: 88, sleepWidth: 175, sleepLength: 195 },
    ],
    fabrics: ['Magic Velvet', 'Rugia', 'Baloo', 'Cord', 'Hygge', 'Greta'],
    legs: LEGS_BLACK,
    photo: { fabric: 'Magic Velvet', color: '2297' },
  },
  'sofa-rozkladana-visby': {
    sizes: [
      { label: '2-osobowa', priceDelta: -400, width: 172, depth: 92, height: 86, sleepWidth: 120, sleepLength: 190 },
      { label: '3-osobowa', priceDelta: 0, width: 208, depth: 92, height: 86, sleepWidth: 145, sleepLength: 190 },
      { label: '3-osobowa XL', priceDelta: 400, width: 228, depth: 92, height: 86, sleepWidth: 165, sleepLength: 190 },
    ],
    fabrics: ['Magic Velvet', 'Rugia', 'Baloo', 'Cord', 'Hygge', 'Greta'],
    legs: [
      { name: 'Jasny buk', swatchColor: '#D3B48C', priceDelta: 0 },
      { name: 'Czarny metal', swatchColor: '#1E1E1E', priceDelta: 0 },
      { name: 'Orzech', swatchColor: '#6A4A34', priceDelta: 190 },
    ],
    photo: { fabric: 'Magic Velvet', color: '2226' },
  },
  'naroznik-rozkladany-oslo': {
    sizes: [
      { label: 'Narożnik 250', priceDelta: -400, width: 250, depth: 160, height: 88, sleepWidth: 145, sleepLength: 200, bodyDepth: 95, chaiseWidth: 90 },
      { label: 'Narożnik 275', priceDelta: 0, width: 275, depth: 170, height: 88, sleepWidth: 155, sleepLength: 210, bodyDepth: 95, chaiseWidth: 95 },
      { label: 'Narożnik 300', priceDelta: 600, width: 300, depth: 180, height: 88, sleepWidth: 165, sleepLength: 220, bodyDepth: 98, chaiseWidth: 100 },
    ],
    fabrics: ['Hygge', 'Magic Velvet', 'Rugia', 'Baloo', 'Cord', 'Greta'],
    legs: LEGS_BLACK,
    sideChoice: true,
    defaultSide: 'right',
    photo: { fabric: 'Hygge', color: '2554' },
    category: 'narozniki',
  },
}

export const CORNER_CATEGORY = {
  title: 'Narożniki',
  slug: 'narozniki',
  description:
    'Narożniki rozkładane z szezlongiem i pojemnikami na pościel. Stronę szezlonga, wymiar i tkaninę wybierasz przy zamówieniu.',
}

/** Nowe sekcje strony głównej i odświeżone teksty — wgrywane, dopóki teksty są oznaczone „do sprawdzenia”. */
export const HOMEPAGE_V2 = {
  hero: {
    eyebrow: 'Sofy i narożniki szyte na zamówienie',
    title: 'Twój wymiar. Twoja tkanina. *Twoja sofa.*',
    text: 'Wybierz model, a potem dopasuj wymiar, tkaninę i nóżki. Cenę widzisz od razu, a mebel szyjemy specjalnie dla Ciebie.',
    primaryLabel: 'Skonfiguruj sofę',
    primaryUrl: '/sklep',
    secondaryLabel: 'Zamów próbki tkanin',
    secondaryUrl: '/tkaniny',
  },
  usps: [
    { title: 'Szyte na zamówienie', text: 'Wymiar, tkanina i nóżki według Twojego wyboru' },
    { title: 'Bezpłatne próbki tkanin', text: 'Zobacz kolor na żywo, zanim zamówisz' },
    { title: 'Funkcja spania', text: 'W każdym modelu: na co dzień sofa, w razie potrzeby łóżko' },
    { title: '14 dni na zwrot', text: 'Na zasadach opisanych w regulaminie' },
  ],
  collection: {
    eyebrow: 'Modele',
    title: 'Wybierz model, *resztę* dopasujesz',
    text: 'Każdy w kilku wymiarach i wielu kolorach tkanin. Cena zmienia się na bieżąco, gdy konfigurujesz.',
  },
  steps: {
    eyebrow: 'Jak to działa',
    title: 'Twoja sofa w *trzech* krokach',
    text: 'Wszystko wybierasz na stronie, a cenę widzisz od razu — bez wizyty w salonie i bez czekania na wycenę.',
    items: [
      {
        title: 'Wybierz model i wymiar',
        text: 'Każdy model ma kilka szerokości. Rysunek z wymiarami pomoże sprawdzić, czy zmieści się w Twoim salonie.',
      },
      {
        title: 'Dobierz tkaninę i kolor',
        text: 'Welur, szenil, bouclé, sztruks albo plecionka — tkaniny Toptextil. Zamów bezpłatne próbki i zobacz kolor w swoim wnętrzu.',
      },
      {
        title: 'Szyjemy i dostarczamy',
        text: 'Mebel powstaje na Twoje zamówienie. Termin dostawy potwierdzimy telefonicznie.',
      },
    ],
  },
  fabrics: {
    eyebrow: 'Próbnik tkanin',
    title: 'Dotknij, *zanim* wybierzesz',
    text: 'Kolor na ekranie to nie to samo co tkanina pod dłonią. Zaznacz kilka próbek — wyślemy je bezpłatnie.',
  },
}

export const SETTINGS_V2 = {
  announcement: 'Szyjemy na zamówienie · Bezpłatne próbki tkanin · Dostawa w całej Polsce',
  headerNav: [
    { label: 'Sofy', url: '/sklep/sofy' },
    { label: 'Narożniki', url: '/sklep/narozniki' },
    { label: 'Tkaniny', url: '/tkaniny' },
    { label: 'O nas', url: '/o-nas' },
    { label: 'Kontakt', url: '/kontakt' },
  ],
}

/* ---------- Edycje numerowane (dane przykładowe — do sprawdzenia w panelu) ---------- */

export type SeedEdition = {
  code: string
  size: number
  status: 'open' | 'invite' | 'announced'
  /** Przykładowy kod zaproszenia — do zmiany w panelu przed wysłaniem zaproszeń. */
  inviteCode?: string
  /** Cena egzemplarza w wymiarze podstawowym. */
  price: number
  leadTime: string
  /** Dopłaty za wymiar wg nazwy wymiaru z konfiguratora. */
  sizeDeltas: Record<string, number>
  /** Dopłaty za nóżki wg nazwy. */
  legDeltas?: Record<string, number>
}

const HANDMADE = 'Wykonanie ręczne: 8–10 tygodni'

/** Każdy model to osobna, numerowana edycja — z nakładem, oznaczeniem i ceną kolekcji limitowanej. */
export const EDITIONS: Record<string, SeedEdition> = {
  'sofa-rozkladana-bergen': {
    code: '01',
    size: 50,
    status: 'open',
    price: 28900,
    leadTime: HANDMADE,
    sizeDeltas: { '2-osobowa': -3900, '3-osobowa': 0, '3-osobowa XL': 3500 },
  },
  'sofa-rozkladana-lund': {
    code: '02',
    size: 50,
    status: 'open',
    price: 24500,
    leadTime: HANDMADE,
    sizeDeltas: { '2-osobowa': -3400, '3-osobowa': 0, '3-osobowa XL': 3100 },
    legDeltas: { 'Czarny metal': 0, 'Dąb naturalny': 1200, 'Złoty mosiądz': 1900 },
  },
  'sofa-rozkladana-visby': {
    code: '03',
    size: 40,
    status: 'invite',
    inviteCode: 'VISBY-PRIVE',
    price: 21900,
    leadTime: HANDMADE,
    sizeDeltas: { '2-osobowa': -2900, '3-osobowa': 0, '3-osobowa XL': 2700 },
    legDeltas: { 'Jasny buk': 0, 'Czarny metal': 0, Orzech: 1200 },
  },
  'naroznik-rozkladany-oslo': {
    code: '04',
    size: 30,
    status: 'open',
    price: 38500,
    leadTime: 'Wykonanie ręczne: 10–12 tygodni',
    sizeDeltas: { 'Narożnik 250': -4200, 'Narożnik 275': 0, 'Narożnik 300': 4800 },
  },
}

export const HOMEPAGE_V3 = {
  hero: {
    eyebrow: 'Kolekcja I · Edycje numerowane',
    title: 'Pięćdziesiąt egzemplarzy. *Ani jednego więcej.*',
    text: 'Każdy model VELURO powstaje w numerowanym nakładzie i jest wykonywany ręcznie na zamówienie. Gdy ostatni egzemplarz znajdzie właściciela, model nie wraca do produkcji.',
    primaryLabel: 'Zobacz edycje',
    primaryUrl: '/#edycje',
    secondaryLabel: 'Lista prywatna',
    secondaryUrl: '/#lista-prywatna',
  },
  usps: [
    { title: '50', text: 'egzemplarzy — największy nakład, w jakim powstaje model VELURO.' },
    { title: 'Nº', text: 'Każdy egzemplarz ma własny numer, certyfikat autentyczności i właściciela w rejestrze.' },
    { title: '0', text: 'wznowień. Wyczerpana edycja nie wraca do produkcji.' },
  ],
  collection: {
    eyebrow: 'Edycje',
    title: 'Każdy egzemplarz *policzony*',
    text: 'Liczba przy modelu pochodzi prosto z rejestru: to egzemplarze, które wciąż czekają na właściciela.',
  },
  steps: {
    eyebrow: 'Od rezerwacji do dostawy',
    title: 'Zakup, który *celebrujemy*',
    text: '',
    items: [
      {
        title: 'Wybór numeru',
        text: 'Wybierz model, konfigurację i numer egzemplarza. Zapiszemy go w rejestrze na Twoje nazwisko.',
      },
      {
        title: 'Rozmowa z atelier',
        text: 'Opiekun z atelier zadzwoni, by potwierdzić wymiar, tkaninę i termin. Próbki tkanin wyślemy przed rozpoczęciem pracy.',
      },
      {
        title: 'Wykonanie i certyfikat',
        text: 'Egzemplarz powstaje ręcznie. Otrzymujesz certyfikat autentyczności z numerem i nazwiskiem właściciela.',
      },
      {
        title: 'Dostawa z wniesieniem',
        text: 'Przywozimy, wnosimy i ustawiamy mebel na miejscu. Opakowanie zabieramy ze sobą.',
      },
    ],
  },
  fabrics: {
    eyebrow: 'Materiały',
    title: 'Tkanina, którą *poczujesz* przed zakupem',
    text: 'Wybrane tkaniny polskiej firmy Toptextil. Zaznacz kilka kolorów — próbki wyślemy bezpłatnie.',
  },
  privateList: {
    eyebrow: 'Lista prywatna',
    title: 'Kolejne edycje *najpierw* dla listy prywatnej',
    text: 'Osoby z listy dostają zaproszenie do przedsprzedaży, zanim model pojawi się w sklepie — i jako pierwsze wybierają numery egzemplarzy.',
    note: 'Piszemy tylko wtedy, gdy mamy coś do pokazania.',
  },
  contact: {
    title: 'Porozmawiajmy o *Twoim* egzemplarzu',
    text: 'Opiekun z atelier odpowie na pytania o wymiary, tkaniny i termin wykonania. Zadzwoń albo napisz — oddzwonimy.',
  },
}

export const SETTINGS_V3 = {
  announcement: 'Kolekcja I · Każdy model w nakładzie do 50 numerowanych egzemplarzy',
  headerNav: [
    { label: 'Kolekcja', url: '/sklep' },
    { label: 'Materiały', url: '/tkaniny' },
    { label: 'Atelier', url: '/o-nas' },
    { label: 'Lista prywatna', url: '/#lista-prywatna' },
    { label: 'Kontakt', url: '/kontakt' },
  ],
  tagline: 'Meble tapicerowane w numerowanych edycjach',
  footerText: 'Meble tapicerowane wydawane w numerowanych edycjach. Każdy egzemplarz ma numer, certyfikat i właściciela.',
}

/** Dostawa dopasowana do mebla za kilkadziesiąt tysięcy złotych: z wniesieniem i ustawieniem, w cenie. */
export const WHITE_GLOVE = {
  from: { name: 'Dostawa z wniesieniem', price: 349 },
  to: {
    name: 'Dostawa z wniesieniem i ustawieniem',
    description: 'Przywozimy egzemplarz, wnosimy go do mieszkania, ustawiamy na miejscu i zabieramy opakowanie. Termin ustalamy telefonicznie.',
    price: 0,
    deliveryTime: 'w terminie uzgodnionym z atelier',
    allowCod: false,
  },
  /** Zwykła dostawa kurierska nie pasuje do edycji — wyłączamy ją, jeśli nikt jej nie zmieniał. */
  retire: { name: 'Dostawa kurierska', price: 199 },
}
