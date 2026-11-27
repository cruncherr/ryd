export function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 })

  const missing = []
  if (!process.env.PAYLOAD_SECRET?.trim()) missing.push('Udostępnij istniejący PAYLOAD_SECRET w środowisku Development.')
  if (!(process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL)?.trim()) {
    missing.push('Podłącz bazę PostgreSQL do środowiska Development (DATABASE_URI, DATABASE_URL lub POSTGRES_URL).')
  }
  if (!missing.length) return new Response(null, { status: 404 })

  const options = { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
  if (!request.headers.get('accept')?.includes('text/html')) {
    return Response.json({ error: 'Podgląd sklepu wymaga konfiguracji.', missing }, options)
  }
  return new Response(`<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Konfiguracja podglądu · RYD</title>
<style>body{margin:0;background:#f6f3ee;color:#302e29;font:1rem/1.55 system-ui}main{max-width:42rem;margin:10vh auto;padding:2rem}h1{font:normal clamp(2rem,5vw,3.5rem)/1.1 Georgia,serif}li{margin:.75rem 0}strong{letter-spacing:.1em}</style>
<main><strong>RYD</strong><h1>Podgląd wymaga konfiguracji</h1><p>Sklep nie może jeszcze wczytać danych z panelu Payload.</p><ul>${missing.map(item => `<li>${item}</li>`).join('')}</ul><p>Po zmianie ustawień uruchom ponownie podgląd.</p></main></html>`, {
    ...options, headers: { ...options.headers, 'Content-Type': 'text/html; charset=utf-8' },
  })
}
