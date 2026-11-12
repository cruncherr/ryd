import type { CartLine } from '@/lib/cart/store'
import type { CheckoutErrors } from '@/lib/validation'

/** Odpowiedź serwera na próbę złożenia zamówienia. */
export type PlaceOrderResult =
  | {
      ok: true
      /** Dokąd przejść: strona potwierdzenia albo strona operatora płatności. */
      redirectTo: string
      /** Czy adres prowadzi poza sklep (strona płatności). */
      external: boolean
    }
  | {
      ok: false
      message: string
      fieldErrors?: CheckoutErrors
      /**
       * `cart-changed` — ceny, dostępność albo koszt dostawy są inne niż te, które widział klient;
       * `empty-cart` — w koszyku nie ma już nic do kupienia.
       */
      reason?: 'cart-changed' | 'empty-cart'
      /** Aktualny koszyk prosto z bazy — przeglądarka podmienia nim zapisany. */
      cart?: CartLine[]
    }

export type StartPaymentResult = { ok: true; url: string } | { ok: false; message: string }
