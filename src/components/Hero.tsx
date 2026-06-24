import { useEffect, useRef, useState } from "react"
import { gsap } from "../lib/gsap"

const CHARS = "abcdefghijklmnopqrstuvwxyz"

function getCharDelay(index: number): number {
  return 0.3 + index * 0.08 + ((index * index + 3) % 7) * 0.07
}

function ScrambledChar({
  targetChar,
  delay,
  active,
}: {
  targetChar: string
  delay: number
  active: boolean
}) {
  const [displayChar, setDisplayChar] = useState(targetChar)
  const [isCycling, setIsCycling] = useState(false)

  useEffect(() => {
    if (!active) {
      const timeoutId = setTimeout(() => {
        setDisplayChar(targetChar)
        setIsCycling(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    const startTimeoutId = setTimeout(() => {
      setIsCycling(true)
    }, 0)

    const interval = setInterval(() => {
      const randomChar = CHARS[Math.floor(Math.random() * CHARS.length)]
      setDisplayChar(randomChar)
    }, 45)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setDisplayChar(targetChar)
      setIsCycling(false)
    }, delay * 1000)

    return () => {
      clearTimeout(startTimeoutId)
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [targetChar, delay, active])

  return (
    <span className={isCycling ? "char-cycle is-cycling" : "char-cycle"}>
      {displayChar}
    </span>
  )
}

function ScrambledWord({ text, active }: { text: string; active: boolean }) {
  return (
    <>
      {text.split("").map((char, index) => (
        <ScrambledChar
          key={index}
          targetChar={char}
          delay={getCharDelay(index)}
          active={active}
        />
      ))}
    </>
  )
}

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
      gsap.set(lines, { yPercent: 110, autoAlpha: 1 })
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
          <span>
            <ScrambledWord text="dumb" active={active} />
          </span>
        </span>
        <span className="line">
          <span>
            <ScrambledWord text="studio" active={active} />
            <em className="reg">®</em>
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
