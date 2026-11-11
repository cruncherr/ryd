/**
 * Pasek widoczny, dopóki sklep jest w trybie przygotowania.
 * Informuje odwiedzających, że zamówienia są testowe i nie będą realizowane.
 */
export function PreviewBar() {
  return (
    <div className="bg-notice text-ink" role="status">
      <p className="shell py-2 text-center text-[0.8125rem] leading-snug font-medium">
        Sklep w przygotowaniu — tryb testowy. Zamówienia złożone teraz nie będą realizowane.
      </p>
    </div>
  )
}

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-ink text-paper">
      <p className="shell py-2 text-center text-[0.8125rem] leading-snug font-medium">{text}</p>
    </div>
  )
}
