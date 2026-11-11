import config from '@payload-config'
import { getPayload } from 'payload'

/** Połączenie z bazą i panelem (Payload samo pilnuje, żeby było tylko jedno). */
export function getPayloadClient() {
  return getPayload({ config })
}
