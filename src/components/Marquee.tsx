const ITEMS = [
  "Web Development",
  "App Development",
  "Motion",
  "WebGL",
  "Design Systems",
  "E-Commerce",
  "Performance",
]

export function Marquee() {
  const row = (
    <span className="marquee__group" aria-hidden="true">
      {ITEMS.map((t) => (
        <span className="marquee__item" key={t}>
          {t}
          <span className="marquee__star">✱</span>
        </span>
      ))}
    </span>
  )

  return (
    <section className="marquee" aria-label="What we do">
      <div className="marquee__track">
        {row}
        {row}
      </div>
    </section>
  )
}
