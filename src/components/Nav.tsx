export function Nav() {
  const scribbleSvg = (
    <svg
      className="nav__link-scribble"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        pathLength={1}
        d="M 4 20 C 4 8, 30 4, 96 8 C 99 10, 96 30, 60 34 C 20 38, 4 25, 8 20 C 12 15, 50 12, 92 18"
      />
    </svg>
  )

  return (
    <header className="nav">
      <a className="nav__logo" href="#top">
        dumb studio
      </a>

      <nav className="nav__links">
        <a href="#services">
          Services
          {scribbleSvg}
        </a>
        <a href="#process">
          Process
          {scribbleSvg}
        </a>
        <a href="#studio">
          Studio
          {scribbleSvg}
        </a>
        <a href="#contact" className="nav__cta">
          Let&rsquo;s work
        </a>
      </nav>
    </header>
  )
}
