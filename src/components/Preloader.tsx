import { useEffect, useRef } from "react"
import { gsap } from "../lib/gsap"

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const c = { v: 0 }
      const tl = gsap.timeline({ onComplete })
      tl.to(
        c,
        {
          v: 100,
          duration: 2.1,
          ease: "power2.inOut",
          onUpdate: () => {
            if (count.current)
              count.current.textContent = String(Math.round(c.v))
          },
        },
        0
      )
        .to(bar.current, { width: "100%", duration: 2.1, ease: "power2.inOut" }, 0)
        .to(root.current, {
          yPercent: -100,
          duration: 1,
          ease: "power4.inOut",
          delay: 0.25,
        })
    }, root)
    return () => ctx.revert()
  }, [onComplete])

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__mark">dumb studio</div>
      <div className="preloader__row">
        <div className="preloader__count">
          <span ref={count}>0</span>
        </div>
        <div className="preloader__label">
          web &amp; app
          <br />
          development
        </div>
      </div>
      <div className="preloader__bar" ref={bar} />
    </div>
  )
}
