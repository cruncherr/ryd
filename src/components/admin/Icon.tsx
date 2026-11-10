/** Mały znak w rogu panelu. */
export default function Icon() {
  return (
    <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
      <rect fill="currentColor" height="24" rx="5" width="24" />
      <text
        fill="var(--theme-bg, #fff)"
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
        x="12"
        y="16.5"
      >
        R
      </text>
    </svg>
  )
}
