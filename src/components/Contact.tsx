export function Contact() {
  return (
    <section className="contact container" id="contact" data-snap data-scribble>
      <span className="eyebrow" data-reveal>
        Let&rsquo;s talk
      </span>
      <div className="contact__cta">
        <h2 data-reveal style={{ marginTop: "1.5rem" }}>
          Let&rsquo;s build
          <br />
          something{" "}
          <span className="scribble scribble--circle">
            <a href="mailto:hello@dumbstud.io">dumb.</a>
            <svg
              className="scribble-svg"
              viewBox="0 0 240 150"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                pathLength={1}
                d="M212,46 C176,15 56,8 26,44 C2,72 22,118 122,128 C222,138 236,86 206,52 C194,32 160,20 130,16"
              />
            </svg>
          </span>
        </h2>
      </div>

      <div className="contact__row">
        <div data-reveal>
          <div className="label">Email</div>
          <a href="mailto:hello@dumbstud.io">hello@dumbstud.io</a>
        </div>
        <div data-reveal data-delay="0.06">
          <div className="label">Social</div>
          <a href="#" aria-label="Instagram">
            Instagram, X, GitHub
          </a>
        </div>
        <div data-reveal data-delay="0.12">
          <div className="label">Studio</div>
          <a href="#">Remote-first · worldwide</a>
        </div>
      </div>
    </section>
  )
}
