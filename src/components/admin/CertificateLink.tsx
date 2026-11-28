import type { UIFieldServerProps } from 'payload'

import './dashboard.css'

/** Odnośnik do certyfikatu autentyczności egzemplarza — ten sam, który dostaje właściciel. */
export function CertificateLink({ data }: UIFieldServerProps) {
  const token = typeof data?.token === 'string' ? data.token : null
  if (!token) return null
  return (
    <div className="ryd-order-side">
      <a className="ryd-order-side__link" href={`/certyfikat/${token}`} rel="noopener noreferrer" target="_blank">
        Certyfikat egzemplarza ↗
      </a>
    </div>
  )
}
