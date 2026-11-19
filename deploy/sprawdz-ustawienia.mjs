// Sprawdza przed wdrożeniem, czy hosting podał ustawienia, bez których sklep nie wystartuje.
// Zamiast niejasnego błędu połączenia wypisuje po polsku, czego brakuje i gdzie to ustawić.

const env = process.env
const missing = []

if (!(env.DATABASE_URI || env.DATABASE_URL || env.POSTGRES_URL)) {
  missing.push(
    'Brak bazy danych (DATABASE_URI / DATABASE_URL / POSTGRES_URL).\n' +
      '    Na Vercelu: projekt → Storage → Create Database → Neon → podłącz do tego projektu,\n' +
      '    a potem uruchom wdrożenie ponownie (Deployments → ⋯ → Redeploy).',
  )
}

if (!env.PAYLOAD_SECRET || env.PAYLOAD_SECRET.length < 32) {
  missing.push(
    'Brak tajnego klucza PAYLOAD_SECRET (co najmniej 32 losowe znaki).\n' +
      '    Na Vercelu: Settings → Environment Variables.',
  )
}

if (missing.length > 0) {
  console.error('\n✗ Wdrożenie przerwane — brakuje ustawień sklepu:\n')
  for (const item of missing) console.error(`  • ${item}\n`)
  process.exit(1)
}

console.log('✓ Ustawienia sklepu są kompletne.')
