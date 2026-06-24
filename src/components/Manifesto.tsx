export function Manifesto() {
  return (
    <section className="manifesto container" data-snap data-scribble>
      <h2 className="manifesto__text" data-reveal>
        <span className="dropcap">M</span>ost software is
        <br />
        <span className="scribble scribble--circle">
          forgettable.
          <svg
            className="scribble-svg"
            viewBox="0 0 340 140"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              pathLength={1}
              d="M306,44 C256,14 78,7 34,42 C2,67 24,114 168,122 C312,130 332,82 300,49 C288,29 250,18 214,14"
            />
          </svg>
        </span>
        <br />
        On-brand, on-time,
        <br />
        and invisible. <span className="dropcap">W</span>e make
        <br />
        <span className="scribble scribble--underline">
          the other kind.
          <svg
            className="scribble-svg"
            viewBox="0 0 340 28"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              pathLength={1}
              d="M6,17 C72,7 150,21 214,12 C268,4 312,17 334,10"
            />
          </svg>
        </span>
      </h2>

      <div className="manifesto__meta" data-reveal>
        <span className="eyebrow">What we do</span>
        <p>
          The kind of website or app people screenshot, send to a friend, and
          actually remember, without sacrificing speed, accessibility, or the
          numbers that matter to your business.
        </p>
      </div>
    </section>
  )
}
