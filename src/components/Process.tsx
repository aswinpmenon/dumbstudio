const steps = [
  {
    num: "01",
    title: "Discover",
    body: "We dig into your goals, users, and constraints. No fluff, just the brief that actually matters.",
  },
  {
    num: "02",
    title: "Design",
    body: "Directions, prototypes, and a design system. We make it feel right before a line of production code.",
  },
  {
    num: "03",
    title: "Build",
    body: "Clean, tested, animated. We engineer for performance and ship in tight, visible increments.",
  },
  {
    num: "04",
    title: "Ship",
    body: "Launch, measure, iterate. We stick around to make the thing better, not just live.",
  },
]

export function Process() {
  return (
    <section className="section container" id="process" data-snap>
      <div className="section-head">
        <h2 className="display split">
          <span className="line">
            <span>How we</span>
          </span>
          <span className="line">
            <span>work.</span>
          </span>
        </h2>
        <span className="eyebrow" data-reveal>
          Process / 04 steps
        </span>
      </div>

      <div className="process__grid">
        {steps.map((s, i) => (
          <div
            className="process__step"
            key={s.num}
            data-reveal
            data-delay={(i * 0.08).toFixed(2)}
          >
            <span className="process__num">{s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
