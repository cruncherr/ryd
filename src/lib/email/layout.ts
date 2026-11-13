/**
 * Wygląd e-maili sklepu: jedna kolumna, biała karta na tle w kolorze papieru, te same barwy co w witrynie.
 * Programy pocztowe rozumieją tylko bardzo stary HTML, dlatego układ jest zbudowany z tabel,
 * a style są wpisane bezpośrednio w znaczniki.
 */

const COLOR = {
  paper: '#f6f3ee',
  card: '#ffffff',
  ink: '#1c1a18',
  soft: '#5c574f',
  faint: '#6d675d',
  line: '#e6e1d8',
  notice: '#f6ecd0',
  accent: '#a34e2b',
} as const

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Tekst wielowierszowy (np. uwagi klienta) z zachowaniem podziału na wiersze. */
export function escapeMultiline(value: string | null | undefined): string {
  return escapeHtml(value).replace(/\n/g, '<br>')
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:28px;line-height:34px;font-weight:normal;color:${COLOR.ink};">${escapeHtml(text)}</h1>`
}

export function subheading(text: string): string {
  return `<h2 style="margin:32px 0 12px;font-family:${SANS};font-size:12px;line-height:18px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${COLOR.faint};">${escapeHtml(text)}</h2>`
}

/** Akapit; `html` musi być już bezpieczny (tekst przepuszczony przez escapeHtml). */
export function paragraph(html: string, options: { soft?: boolean } = {}): string {
  return `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:24px;color:${options.soft ? COLOR.soft : COLOR.ink};">${html}</p>`
}

export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 18px;"><tr><td style="border-radius:999px;background:${COLOR.ink};"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a></td></tr></table>`
}

export function link(label: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="color:${COLOR.ink};text-decoration:underline;">${escapeHtml(label)}</a>`
}

export function divider(): string {
  return `<div style="height:1px;line-height:1px;font-size:1px;background:${COLOR.line};margin:28px 0;">&nbsp;</div>`
}

/** Wyróżniona ramka, np. dane do przelewu albo informacja o zamówieniu testowym. */
export function panel(html: string, options: { tone?: 'neutral' | 'notice' } = {}): string {
  const background = options.tone === 'notice' ? COLOR.notice : COLOR.paper
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td style="background:${background};border-radius:10px;padding:18px 20px;font-family:${SANS};font-size:15px;line-height:24px;color:${COLOR.ink};">${html}</td></tr></table>`
}

/** Tabela „etykieta — wartość”. Wartości muszą być już bezpiecznym HTML-em. */
export function keyValues(rows: Array<[label: string, valueHtml: string]>): string {
  const body = rows
    .filter(([, value]) => value !== '')
    .map(
      ([label, value]) =>
        `<tr><td valign="top" style="padding:3px 16px 3px 0;font-family:${SANS};font-size:14px;line-height:22px;color:${COLOR.soft};white-space:nowrap;">${escapeHtml(label)}</td><td valign="top" style="padding:3px 0;font-family:${SANS};font-size:14px;line-height:22px;color:${COLOR.ink};font-weight:bold;">${value}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${body}</table>`
}

export type EmailItem = {
  title: string
  details: string
  amount: string
  imageUrl: string | null
}

export function itemsTable(items: EmailItem[]): string {
  const rows = items
    .map((item) => {
      const image = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" width="64" height="48" alt="" style="display:block;width:64px;height:48px;border-radius:6px;object-fit:cover;border:0;">`
        : `<div style="width:64px;height:48px;border-radius:6px;background:${COLOR.paper};"></div>`
      return `<tr>
<td width="64" valign="top" style="padding:12px 14px 12px 0;border-bottom:1px solid ${COLOR.line};">${image}</td>
<td valign="top" style="padding:12px 12px 12px 0;border-bottom:1px solid ${COLOR.line};font-family:${SANS};font-size:15px;line-height:22px;color:${COLOR.ink};"><strong>${escapeHtml(item.title)}</strong><br><span style="font-size:13px;color:${COLOR.soft};">${escapeHtml(item.details)}</span></td>
<td valign="top" align="right" style="padding:12px 0;border-bottom:1px solid ${COLOR.line};font-family:${SANS};font-size:15px;line-height:22px;color:${COLOR.ink};white-space:nowrap;">${escapeHtml(item.amount)}</td>
</tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLOR.line};">${rows}</table>`
}

export function totalsTable(rows: Array<[label: string, amount: string]>, total: [label: string, amount: string]): string {
  const body = rows
    .map(
      ([label, amount]) =>
        `<tr><td style="padding:4px 0;font-family:${SANS};font-size:14px;line-height:22px;color:${COLOR.soft};">${escapeHtml(label)}</td><td align="right" style="padding:4px 0;font-family:${SANS};font-size:14px;line-height:22px;color:${COLOR.ink};white-space:nowrap;">${escapeHtml(amount)}</td></tr>`,
    )
    .join('')
  const totalRow = `<tr><td style="padding:12px 0 0;font-family:${SANS};font-size:16px;line-height:24px;color:${COLOR.ink};font-weight:bold;">${escapeHtml(total[0])}</td><td align="right" style="padding:12px 0 0;font-family:${SERIF};font-size:22px;line-height:28px;color:${COLOR.ink};white-space:nowrap;">${escapeHtml(total[1])}</td></tr>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">${body}${totalRow}</table>`
}

type LayoutArgs = {
  /** Tytuł wiadomości (widoczny w karcie przeglądarki i czytnikach ekranu). */
  subject: string
  /** Krótki tekst widoczny na liście wiadomości obok tematu. */
  preheader: string
  storeName: string
  siteUrl: string
  /** Gotowy HTML treści. */
  content: string
  /** Wiersze stopki — zwykły tekst. */
  footerLines: string[]
}

export function renderLayout({ subject, preheader, storeName, siteUrl, content, footerLines }: LayoutArgs): string {
  const footer = footerLines
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join('<br>')

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<style>
@media (max-width: 520px) {
  .ryd-outer { padding: 20px 8px !important; }
  .ryd-card { padding: 28px 20px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${COLOR.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.paper};">
<tr><td align="center" class="ryd-outer" style="padding:36px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 8px 22px;font-family:${SANS};font-size:19px;line-height:28px;font-weight:bold;letter-spacing:0.3em;text-transform:uppercase;color:${COLOR.ink};"><a href="${escapeHtml(siteUrl)}" style="color:${COLOR.ink};text-decoration:none;">${escapeHtml(storeName)}</a></td></tr>
<tr><td class="ryd-card" style="background:${COLOR.card};border-radius:14px;padding:38px 36px;">
${content}
</td></tr>
<tr><td style="padding:22px 8px 0;font-family:${SANS};font-size:12px;line-height:19px;color:${COLOR.faint};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
