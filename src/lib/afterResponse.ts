import { after } from 'next/server'
import type { Payload } from 'payload'

/**
 * Uruchamia zadanie dopiero po wysłaniu odpowiedzi (np. wysyłkę e-maila), żeby klient
 * ani administrator nie czekali na serwer pocztowy. Poza obsługą żądania — na przykład
 * w skryptach — zadanie startuje od razu, w tle.
 */
export function runAfterResponse(payload: Payload, task: () => Promise<void>): void {
  const guarded = () =>
    task().catch((error: unknown) => {
      payload.logger.error({ err: error }, 'Zadanie wykonywane po odpowiedzi nie powiodło się')
    })

  try {
    after(guarded)
  } catch {
    void guarded()
  }
}
