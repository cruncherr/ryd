/**
 * Dane startowe sklepu. Wszystko, co tu jest, to PUNKT WYJŚCIA przygotowany na podstawie
 * zdjęć: nazwy, ceny i opisy są przykładowe i w panelu są oznaczone jako „do sprawdzenia".
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
    lead: 'RYD to meble tapicerowane wybierane tak, jak sami chcielibyśmy z nich korzystać.',
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
  functions: {
    eyebrow: 'Funkcje',
    title: 'Jedna sofa, *kilka* ustawień',
    text: 'Zobacz, jak zmienia się Bergen: od sofy z opuszczonymi zagłówkami po wygodne łóżko.',
    productSlug: 'sofa-rozkladana-bergen',
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
  storeName: 'RYD',
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
    title: 'RYD — sofy rozkładane i meble tapicerowane',
    description:
      'Sofy rozkładane z funkcją spania: sprężyste wypełnienie, staranne wykonanie i tkaniny przyjemne w dotyku. Dostawa na terenie całej Polski.',
    imageFile: 'lund-01',
  },
}
