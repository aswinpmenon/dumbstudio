const stats = [
  { count: "40", unit: "+", label: "Projects shipped" },
  { count: "6", unit: "", label: "Years building" },
  { count: "9", unit: "", label: "Awards & features" },
  { count: "100", unit: "%", label: "Senior team" },
]

export function About() {
  return (
    <section className="section container" id="studio" data-snap>
      <div className="section-head">
        <span className="eyebrow" data-reveal>
          The studio
        </span>
      </div>

      <div className="about__grid">
        <p className="about__statement split">
          <span className="line">
            <span>A small, senior team of</span>
          </span>
          <span className="line">
            <span>designers and engineers.</span>
          </span>
          <span className="line">
            <span className="dim">No account managers. No</span>
          </span>
          <span className="line">
            <span className="dim">hand-offs to junior teams.</span>
          </span>
          <span className="line">
            <span>We&rsquo;re called dumb because</span>
          </span>
          <span className="line">
            <span>we keep it simple. The work isn&rsquo;t.</span>
          </span>
        </p>

        <div className="about__stats">
          {stats.map((s) => (
            <div className="stat" key={s.label} data-reveal>
              <div className="stat__num">
                <span data-count={s.count}>0</span>
                <span className="unit">{s.unit}</span>
              </div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
