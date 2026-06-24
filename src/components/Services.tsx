const services = [
  {
    index: "01",
    title: "Web development",
    body: "From marketing sites to complex web apps and storefronts. Engineered for speed, animated with intent, and built to scale. We sweat the milliseconds and the micro-interactions.",
    tags: [
      "Next.js",
      "React",
      "TypeScript",
      "WebGL / Three.js",
      "Headless CMS",
      "E-commerce",
      "Webflow",
      "Performance",
    ],
  },
  {
    index: "02",
    title: "App development",
    body: "Native and cross-platform apps from prototype to App Store. Product thinking, polished interfaces, and solid engineering. Apps that feel inevitable in the hand.",
    tags: [
      "React Native",
      "Expo",
      "Swift",
      "Kotlin",
      "Prototyping",
      "APIs & Backend",
      "Design Systems",
      "Release",
    ],
  },
]

export function Services() {
  return (
    <section className="section container" id="services" data-snap>
      <div className="section-head">
        <h2 className="display split">
          <span className="line">
            <span>What we</span>
          </span>
          <span className="line">
            <span>do best.</span>
          </span>
        </h2>
        <span className="eyebrow" data-reveal>
          Services / 2
        </span>
      </div>

      <div className="services">
        {services.map((s) => (
          <article className="service" key={s.index}>
            <div data-reveal>
              <span className="service__index">{s.index}</span>
              <h3 className="display service__title">{s.title}</h3>
            </div>
            <div className="service__body" data-reveal data-delay="0.08">
              <p>{s.body}</p>
              <div className="service__tags">
                {s.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
