/**
 * Ręczne wgranie danych startowych:  pnpm seed
 * Ponowne uzupełnienie brakujących elementów (nic nie nadpisuje):  SEED_FORCE=1 pnpm seed
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { ensureAdmin, seed } from './seed'

const payload = await getPayload({ config })

try {
  const result = await seed(payload, { force: process.env.SEED_FORCE === '1' })
  if (result.status === 'skipped') {
    payload.logger.info(`Pominięto: ${result.reason} Aby uzupełnić brakujące elementy, uruchom: SEED_FORCE=1 pnpm seed`)
  } else {
    payload.logger.info(`Dane startowe wgrane: ${JSON.stringify(result.created)}`)
  }
  if ((await ensureAdmin(payload)) === 'created') payload.logger.info('Konto administratora zostało utworzone (ADMIN_EMAIL).')
  process.exit(0)
} catch (error) {
  payload.logger.error({ err: error }, 'Nie udało się wgrać danych startowych')
  process.exit(1)
}
