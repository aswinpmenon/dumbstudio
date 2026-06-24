const base = import.meta.env.BASE_URL

export function Showcase() {
  return (
    <section className="section container showcase">
      <div className="section-head">
        <h2 className="display split">
          <span className="line">
            <span>Built to be</span>
          </span>
          <span className="line">
            <span>remembered.</span>
          </span>
        </h2>
        <span className="eyebrow" data-reveal>
          Craft / Motion
        </span>
      </div>

      <div className="showcase__media" data-reveal>
        <span className="showcase__tag">Selected work</span>
        <img src={`${base}poster.jpg`} alt="dumb studio work" />
      </div>

      <p className="showcase__caption lead" data-reveal>
        Every pixel earns its place. We obsess over motion, texture, and the
        little moments that make a product feel alive.
      </p>
    </section>
  )
}
