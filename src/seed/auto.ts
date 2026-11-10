/**
 * Uruchamiane automatycznie podczas wdrożenia (pnpm deploy:build), po migracjach bazy.
 * Przy pierwszym wdrożeniu wgrywa dane startowe, przy kolejnych nie robi nic.
 * Błąd na tym etapie nie zatrzymuje wdrożenia — sklep wystartuje pusty, a dane można
 * wgrać później poleceniem `pnpm seed`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seed } from './seed'

try {
  const payload = await getPayload({ config })
  const result = await seed(payload)
  payload.logger.info(
    result.status === 'skipped'
      ? `Dane startowe: pominięto (${result.reason})`
      : `Dane startowe wgrane: ${JSON.stringify(result.created)}`,
  )
} catch (error) {
  console.error('Dane startowe: nie udało się ich wgrać podczas wdrożenia.', error)
}

process.exit(0)
