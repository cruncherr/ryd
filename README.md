# RYD — sklep internetowy z meblami tapicerowanymi

Kompletny sklep: witryna dla klientów, koszyk i zamówienia, e-maile, panel administracyjny po polsku oraz baza danych. Nazwa „RYD”, ceny, opisy i wymiary to **dane przykładowe** — zmienisz je w panelu, bez dotykania kodu.

Ten plik ma dwie części: [dla właściciela sklepu](#dla-właściciela-sklepu) (jak uruchomić sklep i z niego korzystać) oraz [dla programisty](#dla-programisty).

---

## Dla właściciela sklepu

### Co dostajesz

- **Witryna**: strona główna, lista produktów, strona produktu z galerią, kolorami i pokazem funkcji, koszyk, formularz zamówienia, strona potwierdzenia (działa też jako „stan zamówienia”), kontakt, strony informacyjne.
- **Zamówienia**: przelew tradycyjny, płatność przy odbiorze, opcjonalnie płatność online (BLIK, szybki przelew, karta — przez Stripe). Ceny zawsze liczy serwer, nigdy przeglądarka klienta.
- **E-maile**: potwierdzenie dla klienta (z regulaminem i zasadami zwrotów w załączniku), powiadomienie dla Ciebie, „płatność zaksięgowana”, „zamówienie wysłane”.
- **Panel administracyjny** (`/admin`): produkty, zdjęcia, zamówienia, wiadomości od klientów, strony, ustawienia. Pulpit pokazuje listę kontrolną — co jeszcze trzeba zrobić przed startem.
- **Wymogi prawne**: przycisk „Zamawiam z obowiązkiem zapłaty”, najniższa cena z 30 dni przy promocjach, dane producenta (GPSR), baner zgody na pliki cookie (tylko gdy włączysz analitykę), szkice regulaminu, polityki prywatności oraz zasad zwrotów.
- **Tryb przygotowania**: dopóki sklepu nie uruchomisz, widać żółty pasek, wyszukiwarki go nie indeksują, a zamówienia są oznaczane jako testowe. Możesz spokojnie wszystko sprawdzić.

### Czego potrzebujesz

| Co | Po co | Uwagi |
| --- | --- | --- |
| Konto na [Vercel](https://vercel.com) | hosting sklepu | Plan darmowy (Hobby) jest wyłącznie do użytku niekomercyjnego — do sprzedaży potrzebny jest plan płatny (Pro). Sprawdź aktualny cennik. |
| Baza danych Neon i magazyn Blob | dane sklepu i zdjęcia | Dodaje się je kilkoma kliknięciami w projekcie Vercel (zakładka *Storage*). |
| Skrzynka e-mail z dostępem SMTP | wysyłka potwierdzeń | Najlepiej w Twojej domenie, np. `sklep@twojadomena.pl`. Dane SMTP poda dostawca poczty. |
| Własna domena | adres sklepu | Podpinasz ją w ustawieniach projektu Vercel (*Domains*). |
| Konto Stripe (opcjonalnie) | płatności online | Sklep działa także bez niego. |

Sklep można też postawić na dowolnym serwerze z Node.js i PostgreSQL — patrz [inny hosting](#inny-hosting-niż-vercel).

### Uruchomienie krok po kroku (Vercel)

Nazwy przycisków w serwisie Vercel mogą się z czasem nieznacznie zmieniać — kolejność kroków pozostaje ta sama.

1. **Zaimportuj repozytorium.** W Vercelu wybierz *Add New → Project* i wskaż to repozytorium z GitHuba.
2. **Wpisz ustawienia** (na ekranie konfiguracji projektu albo później w *Settings → Environment Variables*):

   | Nazwa | Wartość |
   | --- | --- |
   | `PAYLOAD_SECRET` | losowy ciąg, min. 32 znaki (np. z generatora haseł). Nie zmieniaj go później. |
   | `ADMIN_EMAIL` | Twój adres e-mail — login do panelu |
   | `ADMIN_PASSWORD` | hasło startowe do panelu (zmienisz je po pierwszym logowaniu) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | dane skrzynki, z której sklep wysyła e-maile |

   Pełna lista z opisami jest w pliku [`.env.example`](.env.example).
3. **Dodaj bazę danych i magazyn zdjęć.** W projekcie otwórz *Storage* i dodaj bazę **Postgres (Neon)** oraz magazyn **Blob**, podłączając oba do tego projektu. Vercel sam ustawi potrzebne adresy i klucze.

   > Jeśli Vercel uruchomił pierwsze wdrożenie od razu po imporcie, zakończy się ono błędem — sklep nie miał jeszcze bazy. To normalne i niczego nie psuje.
4. **Wdróż** (*Deployments → Redeploy*, jeśli pierwsze wdrożenie się nie powiodło). Wdrożenie tworzy tabele w bazie, wgrywa dane startowe (3 sofy, zdjęcia, szkice stron) i zakłada Twoje konto administratora.
5. **Zaloguj się** pod adresem `https://twoj-adres/admin`, zmień hasło (ikona konta w prawym górnym rogu), a potem usuń `ADMIN_PASSWORD` z ustawień Vercela.

   > Jeśli nie podasz `ADMIN_EMAIL` i `ADMIN_PASSWORD`, pierwsze konto zakłada się na stronie `/admin` — i może to zrobić **każdy**, kto wejdzie tam przed Tobą. Dlatego zalecamy podanie ich przed wdrożeniem.
6. **Podepnij domenę** (*Settings → Domains*). Adres w e-mailach i odnośnikach zaktualizuje się sam przy następnym wdrożeniu.

### Zanim włączysz sprzedaż — lista kontrolna

Pulpit panelu pokazuje, co zostało do zrobienia. Sklepu **nie da się uruchomić**, dopóki obowiązkowe punkty nie są gotowe — to celowe zabezpieczenie przed startem z przykładowymi cenami.

1. **Dane sprzedawcy** — *Ustawienia sklepu → Firma*: pełna nazwa, adres, NIP. Trafiają do regulaminu, stopki i e-maili.
2. **Kontakt dla klientów** — *Ustawienia sklepu → Sklep*: e-mail i telefon.
3. **Produkty** — *Sklep → Produkty*: sprawdź **nazwę, cenę, wymiary, opis, czas realizacji i zdjęcia** każdego produktu, potem odznacz „Dane przykładowe”. Zdjęcia pochodzą z Twoich materiałów; nazwy modeli (Bergen, Lund, Visby), ceny i opisy są wymyślone na potrzeby prezentacji.
4. **Metody dostawy** — *Sklep → Metody dostawy*: prawdziwe ceny i opis, potem odznacz „Dane przykładowe”.
5. **Płatności** — *Ustawienia sklepu → Zamówienia i płatności*: numer rachunku do przelewów, ewentualna dopłata za pobranie.
6. **Regulamin i strony informacyjne** — *Treści → Strony*: szkice mają miejsca oznaczone `[UZUPEŁNIJ: …]` (na stronie podświetlone na żółto). Uzupełnij je, a następnie odznacz „Treść przykładowa”. **Regulamin, politykę prywatności i zasady zwrotów pokaż prawnikowi** — szkice są punktem wyjścia, nie poradą prawną.
7. **Producent (GPSR)** — *Ustawienia sklepu → Firma*: zaznacz, że producentem jesteś Ty, albo podaj dane producenta.
8. **Poczta** — dane SMTP w ustawieniach hostingu (krok 2 powyżej). Złóż zamówienie testowe i sprawdź, czy e-mail doszedł.
9. Zalecane: teksty strony głównej (*Treści → Strona główna*) i adres do powiadomień o zamówieniach.

Gdy wszystko gotowe: *Ustawienia sklepu → Sklep → Stan sklepu → „Uruchomiony — sprzedaż włączona”*. Od tej chwili wyszukiwarki mogą indeksować sklep, a zamówienia są prawdziwe.

Zamówienia testowe możesz usunąć w panelu. Numeracja nie wraca do początku — pierwsze prawdziwe zamówienie dostanie kolejny numer (to bezpieczne: numery nigdy się nie powtarzają).

### Codzienna praca

**Zamówienia** (*Sprzedaż → Zamówienia*)

- Nowe zamówienie przychodzi e-mailem i pojawia się na pulpicie.
- Przelew wpłynął? Ustaw *Płatność → Opłacone* — klient dostanie e-mail „Płatność zaksięgowana”.
- Wysyłasz mebel? Wpisz numer przesyłki i link do śledzenia (zakładka *Realizacja*), ustaw *Status → Wysłane* — klient dostanie e-mail z tymi danymi.
- Z prawej strony zamówienia widać, czy e-maile faktycznie wyszły. Jeśli nie (np. poczta była niedostępna), pojawia się przycisk **„Wyślij ponownie”**.
- Zamówień nie usuwaj — anuluj je statusem „Anulowane”, żeby zachować historię.

**Produkty**

- Każdy kolor ma własne zdjęcia; pierwsze zdjęcie pierwszego dostępnego koloru jest zdjęciem głównym.
- *Cena promocyjna* niższa od regularnej włącza promocję: sklep sam pokaże przekreśloną cenę, procent obniżki i **najniższą cenę z 30 dni przed obniżką** (wymóg prawny).
- *Dostępność → Chwilowo niedostępny* wyłącza możliwość zakupu, ale zostawia produkt w ofercie.
- Zdjęcia najlepiej na białym tle, w poziomie, min. 2000 px szerokości — sklep sam przygotuje mniejsze wersje.

**Wiadomości** (*Sprzedaż → Wiadomości*) — zapytania z formularza kontaktowego. Odpowiadasz zwykłym e-mailem (odpowiedź na powiadomienie trafia prosto do klienta).

**Treści** — strony informacyjne, teksty strony głównej, menu i stopka (*Ustawienia sklepu → Menu i stopka*). Stronę „Kontakt” możesz dostosować, tworząc w *Stronach* stronę o adresie `kontakt`.

### Płatności online (opcjonalnie)

Nazwy sekcji w panelu Stripe mogą się różnić od podanych — szukaj części przeznaczonej dla programistów.

1. Załóż konto [Stripe](https://stripe.com/pl) i włącz w nim metody płatności, których chcesz używać (BLIK, Przelewy24, karty).
2. W Stripe: *Developers → API keys* — skopiuj *Secret key* do ustawienia `STRIPE_SECRET_KEY` na hostingu.
3. W Stripe: *Developers → Webhooks → Add endpoint*:
   - adres: `https://twojadomena.pl/platnosc/stripe/webhook`
   - zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   - skopiuj *Signing secret* do ustawienia `STRIPE_WEBHOOK_SECRET`.
4. Wdróż sklep ponownie, a w panelu zaznacz *Ustawienia sklepu → Zamówienia i płatności → Płatności online*.
5. **Najpierw przetestuj na kluczach testowych Stripe** (tryb *Test mode*), dopiero potem wpisz klucze produkcyjne.

Klient płaci na stronie Stripe — sklep nie widzi i nie przechowuje danych kart.

### Statystyki i reklamy (opcjonalnie)

Wpisz identyfikator **Google Analytics 4** lub **Meta Pixel** w *Ustawienia sklepu → Wyszukiwarki i analityka*. Sklep sam pokaże klientom baner zgody i uruchomi pomiar **dopiero po zgodzie**. Mierzone są: obejrzenie produktu, dodanie do koszyka, rozpoczęcie zamówienia i zakup. Bez wpisanych identyfikatorów baner się nie pojawia, bo sklep nie używa wtedy żadnych ciasteczek śledzących.

### Co zostało sprawdzone, a co nie

**Sprawdzone** (na wersji produkcyjnej zainstalowanej od zera, na komputerze i ekranie telefonu):

- cały zakup: produkt → koszyk → formularz → zamówienie → strona potwierdzenia; przelew i płatność przy odbiorze;
- walidacja formularzy, zapamiętywanie wpisanych danych, ochrona przed podwójnym zamówieniem;
- wysyłka e-maili przez serwer SMTP (testowy), załączniki, ponowna wysyłka z panelu;
- zmiany statusów w panelu i wynikające z nich e-maile;
- instalacja na pustej bazie oraz kolejne wdrożenie (migracje);
- 70 testów jednostkowych i 24 testy przeglądarkowe (`pnpm test`, `pnpm test:e2e`).

**Niesprawdzone — zrób to przed startem:**

- **Wdrożenie na Vercel** (baza Neon, magazyn Blob). Sklep jest zbudowany według oficjalnych zaleceń dla tego hostingu, ale samo wdrożenie nie było wykonywane w trakcie prac.
- **Płatności online.** Obsługa powiadomień od Stripe była testowana podpisanymi zgłoszeniami próbnymi; prawdziwe połączenie ze Stripe — nie (wymaga Twojego konta). Przetestuj na kluczach testowych.
- **Dostarczalność e-maili** u Twojego dostawcy poczty (ustaw rekordy SPF i DKIM domeny, inaczej wiadomości mogą trafiać do spamu).
- **Prawdziwe telefony i przeglądarki inne niż Chrome** (Safari, Firefox) — sprawdzono w emulacji telefonu w Chromium.
- **Google Analytics i Meta Pixel** — sprawdzono, że uruchamiają się dopiero po zgodzie i dostają zdarzenia; nie sprawdzono, co widać w ich panelach.
- **Treści prawne** — szkice wymagają uzupełnienia i przeglądu prawnika.

---

## Dla programisty

### Technologie

Next.js 16 (App Router, React 19) · Payload CMS 3 (panel i API w tej samej aplikacji) · PostgreSQL · Tailwind CSS 4 · Base UI · zustand (koszyk w `localStorage`) · Stripe (opcjonalnie) · nodemailer · vitest · Playwright.

> Next.js w tej wersji różni się od wcześniejszych — przed zmianami w kodzie zajrzyj do `node_modules/next/dist/docs/` (patrz `AGENTS.md`).

### Uruchomienie lokalne

Wymagania: Node.js 22, pnpm 10, PostgreSQL 14 lub nowszy.

```bash
cp .env.example .env        # uzupełnij DATABASE_URI i PAYLOAD_SECRET
pnpm install
pnpm migrate                # tworzy tabele w pustej bazie
pnpm seed                   # dane startowe: 3 produkty, zdjęcia, strony
pnpm dev                    # http://localhost:3000
```

Panel: `http://localhost:3000/admin` (pierwsze konto zakładasz na ekranie logowania albo podając `ADMIN_EMAIL` i `ADMIN_PASSWORD` przed `pnpm seed`).

Bez danych SMTP e-maile nie są wysyłane — sklep zapisuje ostrzeżenie w dzienniku. Ustaw `EMAIL_PREVIEW_DIR`, żeby każda wiadomość zapisywała się jako plik HTML.

### Polecenia

| Polecenie | Działanie |
| --- | --- |
| `pnpm dev` | serwer deweloperski |
| `pnpm build` / `pnpm start` | budowa i uruchomienie wersji produkcyjnej |
| `pnpm deploy:build` | migracje → dane startowe (tylko za pierwszym razem) → budowa. Używane przez hosting. |
| `pnpm migrate` / `pnpm migrate:create nazwa` | wykonanie / utworzenie migracji bazy |
| `pnpm seed` | ręczne wgranie danych startowych (`SEED_FORCE=1` uzupełnia brakujące, niczego nie nadpisuje) |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | kontrola jakości i testy jednostkowe |
| `pnpm test:e2e` | testy przeglądarkowe na działającym sklepie (`E2E_BASE_URL`) |
| `pnpm generate:types` · `pnpm generate:importmap` | po zmianach w kolekcjach / komponentach panelu |

### Baza danych i migracje

- Tabele tworzą się automatycznie **tylko w `pnpm dev`**. Na serwerze strukturę zmieniają wyłącznie migracje (`src/migrations`).
- Po zmianie pól w kolekcjach: `pnpm migrate:create opis-zmiany`, sprawdź wygenerowany plik i dodaj go do repozytorium. Wdrożenie wykona migrację samo.
- **Nigdy nie uruchamiaj `pnpm dev` na bazie produkcyjnej.** Tryb deweloperski zostawia w bazie znacznik, po którym `payload migrate` zatrzymuje się na pytaniu o potwierdzenie — a tym samym kolejne wdrożenie.
- Numery zamówień pochodzą z tabeli `counters` (jedno polecenie `INSERT … ON CONFLICT … RETURNING`), więc nie powtarzają się nawet przy równoczesnych zamówieniach.
- Wdrożenia podglądowe (Preview) na Vercelu używają tych samych zmiennych co produkcja, o ile ich nie rozdzielisz — dla gałęzi z nowymi migracjami ustaw osobną bazę.

### Struktura

```
src/
  app/(frontend)/        witryna sklepu (strony, układ, style)
  app/(payload)/         panel administracyjny i API Payload
  collections/, globals/ model danych: produkty, zamówienia, strony, ustawienia…
  components/            komponenty witryny (ui, product, cart, checkout, consent…) i panelu (admin)
  lib/                   logika: ceny, koszyk, zamówienia, e-maile, płatności, SEO, walidacja
  migrations/            migracje bazy
  seed/                  dane startowe (treści i zdjęcia w katalogu /seed)
tests/unit, tests/e2e    testy
```

Kilka zasad, na których opiera się sklep:

- **Kwoty powstają tylko na serwerze** (`src/lib/cart/pricing.ts`). Przeglądarka przysyła identyfikatory i ilości; jeśli suma różni się od tej, którą widział klient, zamówienie nie powstaje i klient potwierdza nowe podsumowanie.
- **Zamówienia i wiadomości** są dostępne wyłącznie dla zalogowanych administratorów; witryna zapisuje je przez serwer. Strona zamówienia klienta jest chroniona losowym kluczem w adresie.
- **Uruchomienie sklepu** blokuje walidacja pola „Stan sklepu” (`src/lib/launch.ts`).
- **Ruch i dotyk**: animacje tylko `transform`/`opacity`, krótkie, z wariantem dla „ograniczonego ruchu”; efekty najechania tylko na urządzeniach ze wskaźnikiem.

### Inny hosting niż Vercel

Wystarczy serwer z Node.js 22 i PostgreSQL:

```bash
pnpm install --frozen-lockfile
pnpm deploy:build
pnpm start            # domyślnie port 3000; ustaw przed nim serwer z HTTPS (np. Caddy lub nginx)
```

Ustaw `NEXT_PUBLIC_SERVER_URL` na publiczny adres sklepu. Bez `BLOB_READ_WRITE_TOKEN` zdjęcia zapisują się w katalogu `/media` — uwzględnij go w kopiach zapasowych razem z bazą.

### Licencje

Kroje pisma Fraunces i Inter — licencja SIL OFL (pliki w `public/fonts`). Umiejętności projektowe użyte podczas prac: [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT).
