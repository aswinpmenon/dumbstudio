import { useEffect, useRef } from "react"
import { gsap } from "../lib/gsap"

export function Hero({ active }: { active: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!active || !root.current) return
    const ctx = gsap.context(() => {
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]")
      gsap.set(fades, { y: 26, opacity: 0 })
      gsap.to(fades, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.1,
      })

      const lines = gsap.utils.toArray<HTMLElement>(".hero__wordmark-text .line > span")
      gsap.set(lines, { yPercent: 110 })
      gsap.to(lines, {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.12,
        delay: 0.2,
      })
    }, root)
    return () => ctx.revert()
  }, [active])

  return (
    <section className="hero" id="top" ref={root} data-snap>
      <div className="hero__top">
        <span className="eyebrow" data-hero-fade>
          Web &amp; App Studio — est. 2026
        </span>
      </div>

      <h1 className="hero__wordmark-text" aria-label="dumb studio">
        <span className="line">
          <span>dumb</span>
        </span>
        <span className="line">
          <span>
            studio<em className="reg">®</em>
          </span>
        </span>
      </h1>

      <div className="hero__foot">
        <div />
        <p className="hero__intro" data-hero-fade>
          We design and develop websites and apps that move, convert, and stick
          in your head.
        </p>
      </div>
    </section>
  )
}
