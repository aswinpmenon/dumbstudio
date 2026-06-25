import { useEffect, useRef, useState } from "react"
import { gsap } from "../lib/gsap"

type Emo =
  | "happy"
  | "grin"
  | "surprised"
  | "wink"
  | "love"
  | "sad"
  | "dizzy"
  | "cool"

const EMOS: Emo[] = [
  "happy",
  "grin",
  "surprised",
  "wink",
  "love",
  "sad",
  "dizzy",
  "cool",
]

const WORDS = [
  "click!!",
  "again!",
  "hi!",
  "wee!",
  "more!",
  "hehe",
  "boop!",
  "yes!",
  ":D",
  "poke!",
]

interface SphereSplash {
  id: number
  x: number
  y: number
  color: string
  size: number
  borderRadius: string
}

function rndRadius() {
  const r = () => Math.round(35 + Math.random() * 30)
  return `${r()}% ${100 - r()}% ${r()}% ${100 - r()}% / ${r()}% ${r()}% ${
    100 - r()
  }% ${100 - r()}%`
}

const COLORS = [
  "#ff2d16",
  "#ff7a00",
  "#ffd400",
  "#19d36b",
  "#13b7ff",
  "#7a5cff",
  "#ff3ea5",
  "#f4f1ea",
]

function heart(cx: number, cy: number) {
  return `M ${cx} ${cy + 5} C ${cx - 7} ${cy - 3}, ${cx - 4} ${cy - 9}, ${cx} ${
    cy - 4
  } C ${cx + 4} ${cy - 9}, ${cx + 7} ${cy - 3}, ${cx} ${cy + 5} Z`
}

/** Reference face: big bloomed white eyes + glowing grin with a dark mouth. */
function Face({ emo }: { emo: Emo }) {
  // Dark mouth interior (drawn first, unglowed)
  const darkMouth = () => {
    switch (emo) {
      case "surprised":
        return <ellipse cx={50} cy={62} rx={7} ry={9} className="mouth" />
      case "sad":
        return null
      case "dizzy":
        return null
      default:
        return <path className="mouth" d="M31 58 Q50 83 69 58 Q50 72 31 58 Z" />
    }
  }

  // White, glowing features (now flat black cartoon features)
  const white = () => {
    switch (emo) {
      case "surprised":
        return (
          <>
            <ellipse
              cx={50}
              cy={62}
              rx={7}
              ry={9}
              className="w-stroke"
              style={{ strokeWidth: 5 }}
            />
            <circle cx={39} cy={44} r={6} className="pupil" />
            <circle cx={63} cy={41} r={6} className="pupil" />
          </>
        )
      case "wink":
        return (
          <>
            <path className="w-stroke" d="M30 56 Q50 78 70 60" />
            <path className="w-stroke" d="M29 45 Q39 38 49 45" />
            <circle cx={63} cy={41} r={6} className="pupil" />
          </>
        )
      case "love":
        return (
          <>
            <path className="w-stroke" d="M29 54 Q50 80 71 54" />
            <path className="pupil" d={heart(39, 44)} />
            <path className="pupil" d={heart(63, 41)} />
          </>
        )
      case "sad":
        return (
          <>
            <path className="w-stroke" d="M34 70 Q50 58 66 70" />
            <path className="w-stroke" d="M28 38 L46 42" />
            <path className="w-stroke" d="M72 38 L54 42" />
            <circle cx={40} cy={47} r={4.5} className="pupil" />
            <circle cx={62} cy={45} r={4.5} className="pupil" />
          </>
        )
      case "dizzy":
        return (
          <>
            <path
              className="w-stroke"
              d="M32 64 q4 -6 8 0 t8 0 t8 0"
            />
            <path className="w-stroke" d="M32 38 L46 50 M46 38 L32 50" />
            <path className="w-stroke" d="M56 36 L70 48 M70 36 L56 48" />
          </>
        )
      case "cool":
        return (
          <>
            <path className="w-stroke" d="M30 58 Q50 76 70 58" />
            <path className="w-stroke" d="M28 44 L46 44" />
            <path className="w-stroke" d="M54 42 L72 42" />
          </>
        )
      default:
        // happy / grin — the reference look
        return (
          <>
            <path className="w-stroke smile" d="M30 58 Q50 81 70 58" />
            <circle cx={38} cy={43} r={5.5} className="pupil" />
            <circle cx={64} cy={39} r={5.5} className="pupil" />
          </>
        )
    }
  }

  return (
    <svg className="emote__face" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id="emoteGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {darkMouth()}
      <g filter="url(#emoteGlow)">{white()}</g>
    </svg>
  )
}

interface EmoteSphereProps {
  loaded?: boolean
}

export function EmoteSphere({ loaded = false }: EmoteSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLButtonElement>(null)
  const [emo, setEmo] = useState<Emo>("happy")
  const [bubble, setBubble] = useState<{ id: number; word: string } | null>(null)
  const [splashes, setSplashes] = useState<SphereSplash[]>([])

  const floatRef = useRef<gsap.core.Tween | null>(null)
  const phys = useRef({ x: 0, y: 0, vx: 0, vy: 0, flying: false, raf: 0, size: 0 })
  const lastScrollRef = useRef(window.scrollY)

  const [isIntro, setIsIntro] = useState(true)
  const [bounceDone, setBounceDone] = useState(false)

  const startIntro = () => {
    const el = wrapRef.current
    const ball = ballRef.current
    if (!el || !ball) return

    floatRef.current?.pause()

    const r = el.getBoundingClientRect()
    const targetX = r.left
    const targetY = r.top + (window.scrollY || 0)

    const vh = window.innerHeight
    const p = phys.current
    p.size = r.width
    p.x = -p.size
    p.y = -p.size

    el.classList.add("emote--flying", "emote--intro")
    gsap.set(el, { transform: `translate(${p.x}px, ${p.y}px)` })

    const tl = gsap.timeline({
      onComplete: () => {
        setBounceDone(true)
      }
    })

    // Horizontal movement across the entire animation duration (1.8s)
    tl.to(p, {
      x: targetX,
      duration: 1.8,
      ease: "power1.out",
      onUpdate: () => {
        el.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    }, 0)

    // Vertical bounce movement:
    const floorY = vh - p.size // Extreme bottom of the viewport!

    // 1. Fall from top-left to extreme bottom floor
    tl.to(p, {
      y: floorY,
      duration: 0.7,
      ease: "power2.in",
      onUpdate: () => {
        el.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    }, 0)

    // Fall stretch
    tl.to(ball, {
      scaleX: 0.8,
      scaleY: 1.28,
      duration: 0.5,
      ease: "power1.inOut"
    }, 0.1)

    // 2. Extreme bottom impact squish
    tl.to(ball, {
      scaleX: 1.4,
      scaleY: 0.6,
      duration: 0.1,
      ease: "power1.out"
    }, 0.7)

    // 3. Bounce up from extreme bottom to peak above landing position
    const peakY = targetY - 45
    tl.to(p, {
      y: peakY,
      duration: 0.5,
      ease: "power1.out",
      onUpdate: () => {
        el.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    }, 0.8)

    // Rise stretch
    tl.to(ball, {
      scaleX: 0.86,
      scaleY: 1.2,
      duration: 0.25,
      ease: "power1.out"
    }, 0.8)

    // Return to normal scale near the peak
    tl.to(ball, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.25,
      ease: "power1.in"
    }, 1.05)

    // 4. Fall from peak to final landing targetY
    tl.to(p, {
      y: targetY,
      duration: 0.35,
      ease: "power1.in",
      onUpdate: () => {
        el.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    }, 1.3)

    // Land stretch
    tl.to(ball, {
      scaleX: 0.92,
      scaleY: 1.1,
      duration: 0.25,
      ease: "power1.in"
    }, 1.3)

    // 5. Landing squish
    tl.to(ball, {
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 0.12,
      ease: "power1.out"
    }, 1.65)

    // Elastic settle back to normal scale
    tl.to(ball, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.6,
      ease: "elastic.out(1, 0.3)"
    }, 1.77)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      startIntro()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (bounceDone && loaded) {
      const el = wrapRef.current
      const ball = ballRef.current
      if (el && ball) {
        el.classList.remove("emote--flying", "emote--intro")
        el.style.transform = ""
        gsap.set(el, { x: 0, y: 0 })
        gsap.set(ball, { scaleX: 1, scaleY: 1 })
        floatRef.current?.resume()
        setIsIntro(false)
      }
    }
  }, [bounceDone, loaded])

  const [isDead, setIsDeadState] = useState(false)
  const [isReviving, setIsRevivingState] = useState(false)
  const [, setReviveClicks] = useState(0)

  const isDeadRef = useRef(false)
  const isRevivingRef = useRef(false)

  const setIsDead = (val: boolean) => {
    isDeadRef.current = val
    setIsDeadState(val)
  }
  const setIsReviving = (val: boolean) => {
    isRevivingRef.current = val
    setIsRevivingState(val)
  }

  const startRevival = () => {
    const el = wrapRef.current
    if (!el) return

    setIsReviving(true)
    setBubble({ id: Date.now(), word: "rising!" })
    setEmo("happy")

    const p = phys.current
    const startX = p.x
    const startY = p.y

    // 1. Clear transform and remove emote--flying to measure the natural target position on the page
    const originalTransform = el.style.transform
    el.style.transform = ""
    el.classList.remove("emote--flying")
    void el.offsetWidth

    // 2. Measure page-relative target coordinates
    const naturalRect = el.getBoundingClientRect()
    const targetX = naturalRect.left
    const targetY = naturalRect.top + (window.scrollY || 0)

    // 3. Restore translation transform and put emote--flying back to perform the tween
    el.style.transform = originalTransform
    el.classList.add("emote--flying")
    void el.offsetWidth

    // 4. Animate p.x and p.y using GSAP
    gsap.fromTo(
      p,
      { x: startX, y: startY },
      {
        x: targetX,
        y: targetY,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          el.style.transform = `translate(${p.x}px, ${p.y}px)`
        },
        onComplete: () => {
          setIsReviving(false)
          setIsDead(false)
          setBubble(null)

          el.classList.remove("emote--flying")
          el.style.transform = ""
          el.style.removeProperty("--paint")
          gsap.set(el, { x: 0, y: 0 })
          floatRef.current?.resume()
          setEmo("happy")
          setSplashes([])
        }
      }
    )
  }

  // Idle float (paused while the ball is in flight)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce && wrapRef.current) {
      floatRef.current = gsap.to(wrapRef.current, {
        y: -12,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    }
    return () => {
      floatRef.current?.kill()
    }
  }, [])

  // Physics: launch + bounce when shot in game mode; reset when game exits
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const loop = () => {
      const p = phys.current
      if (isDeadRef.current || isRevivingRef.current) {
        return
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = p.size
      const g = 0.6
      const rest = 0.86 // bouncier

      p.vy += g
      p.x += p.vx
      p.y += p.vy

      const currentScrollY = window.scrollY || 0
      const floorY = currentScrollY + vh - s
      const ceilingY = currentScrollY

      if (p.x < 0) {
        p.x = 0
        p.vx = -p.vx * rest
      }
      if (p.x + s > vw) {
        p.x = vw - s
        p.vx = -p.vx * rest
      }
      if (p.y < ceilingY) {
        p.y = ceilingY
        p.vy = -p.vy * rest
      }
      let onFloor = false
      if (p.y > floorY) {
        const penetration = p.y - floorY
        p.y = floorY
        p.vy = -Math.abs(p.vy) * rest
        if (penetration > 1) {
          p.vy = Math.min(p.vy, -penetration * 0.5)
        }
        p.vx *= 0.9
        onFloor = true
        if (Math.abs(p.vy) < 1.1) p.vy = 0
      }
      p.vx *= 0.994

      el.style.transform = `translate(${p.x}px, ${p.y}px)`

      // Rest at the bottom but keep listening (scroll re-kicks it)
      if (onFloor && Math.abs(p.vy) < 0.5 && Math.abs(p.vx) < 0.25) {
        p.y = floorY
        el.style.transform = `translate(${p.x}px, ${p.y}px)`
        p.flying = false
        p.raf = 0
        return
      }
      p.raf = requestAnimationFrame(loop)
    }

    const onShot = (e: Event) => {
      // If shot, ensure the ball is alive
      setIsDead(false)
      setIsReviving(false)
      setBubble(null)

      const detail = (e as CustomEvent).detail as {
        x: number
        y: number
        color?: string
      }
      const p = phys.current
      const r = el.getBoundingClientRect()
      p.size = r.width
      const cx = r.left + r.width / 2

      // Create a localized paint splash on the sphere surface
      const splashColor = detail.color || COLORS[(Math.random() * COLORS.length) | 0]
      const relX = ((detail.x - r.left) / r.width) * 100
      const relY = ((detail.y - r.top) / r.height) * 100
      const splashSize = 25 + Math.random() * 30

      const newSplash: SphereSplash = {
        id: Date.now() + Math.random(),
        x: relX,
        y: relY,
        color: splashColor,
        size: splashSize,
        borderRadius: rndRadius(),
      }

      setSplashes((prev) => [...prev, newSplash])

      // Initialize scroll tracker baseline to current scroll position
      lastScrollRef.current = window.scrollY

      if (p.flying || el.classList.contains("emote--flying")) {
        // already loose — add a fresh whack
        p.vy -= 12
        p.vx += (cx - detail.x) * 0.12 + (Math.random() * 2 - 1) * 6
      } else {
        const currentScrollY = window.scrollY || 0
        p.x = r.left
        p.y = r.top + currentScrollY
        p.vx = (cx - detail.x) * 0.16 + (Math.random() * 2 - 1) * 7
        p.vy = -(16 + Math.random() * 8)
        floatRef.current?.pause()
        gsap.set(el, { y: 0, x: 0 })
        el.classList.add("emote--flying")
      }
      p.flying = true
      setEmo("dizzy")
      if (!p.raf) p.raf = requestAnimationFrame(loop)
    }

    // While the ball is loose, scrolling changes the viewport boundaries.
    // We wake up the physics loop so it falls to the new bottom of the screen.
    const onScroll = () => {
      const p = phys.current
      if (!p.size || !el.classList.contains("emote--flying")) {
        return
      }

      if (isDeadRef.current || isRevivingRef.current) {
        return
      }

      p.flying = true

      // Wake up the physics loop if it was idle
      if (!p.raf) p.raf = requestAnimationFrame(loop)
    }

    const onReset = () => {
      const p = phys.current
      if (p.raf) cancelAnimationFrame(p.raf)
      p.raf = 0
      p.flying = false
      
      const wasShot = el.classList.contains("emote--flying")

      if (wasShot) {
        floatRef.current?.pause()

        setIsDead(true)
        setReviveClicks(0)
        setEmo("sad")

        setBubble({ id: Date.now(), word: "I'm dead" })

        setTimeout(() => {
          if (isDeadRef.current && !isRevivingRef.current) {
            setBubble({ id: Date.now(), word: "click 3 times to revive" })
          }
        }, 2000)
      } else {
        // Was never shot: do a silent, normal reset
        setIsDead(false)
        setIsReviving(false)
        setBubble(null)
        el.classList.remove("emote--flying")
        el.style.transform = ""
        el.style.removeProperty("--paint")
        gsap.set(el, { x: 0, y: 0 })
        floatRef.current?.resume()
        setEmo("happy")
        setSplashes([])
      }
    }

    window.addEventListener("emote-shot", onShot)
    window.addEventListener("emote-reset", onReset)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("emote-shot", onShot)
      window.removeEventListener("emote-reset", onReset)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  // Normal (non-game) click: swap emotion, pop a bubble, squash
  const react = () => {
    if (isIntro) return
    if (document.body.classList.contains("game-on")) return

    if (isDead) {
      if (isReviving) return

      setReviveClicks((prev) => {
        const next = prev + 1

        if (ballRef.current) {
          gsap.fromTo(
            ballRef.current,
            { scaleX: 1.15, scaleY: 0.85 },
            { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" }
          )
        }

        if (next === 1) {
          setBubble({ id: Date.now(), word: "2 more..." })
        } else if (next === 2) {
          setBubble({ id: Date.now(), word: "1 more!" })
        } else if (next >= 3) {
          startRevival()
        }
        return next
      })
      return
    }

    setEmo((cur) => {
      let next = cur
      while (next === cur) next = EMOS[(Math.random() * EMOS.length) | 0]
      return next
    })
    setBubble({ id: Date.now(), word: WORDS[(Math.random() * WORDS.length) | 0] })
    if (ballRef.current) {
      gsap.fromTo(
        ballRef.current,
        { scaleX: 1.18, scaleY: 0.84 },
        { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" }
      )
    }
  }

  return (
    <div className="emote" ref={wrapRef}>
      {bubble && (
        <div className="emote__bubble" key={bubble.id}>
          <span>{bubble.word}</span>
          <svg className="emote__spark" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 2 L20 12 M20 28 L20 38 M2 20 L12 20 M28 20 L38 20 M7 7 L14 14 M26 26 L33 33 M33 7 L26 14 M14 26 L7 33" />
          </svg>
        </div>
      )}
      <button
        type="button"
        className="emote__ball"
        ref={ballRef}
        onClick={react}
        aria-label="Poke the blob"
      >
        {splashes.map((s) => (
          <span
            key={s.id}
            className="emote__splash"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}%`,
              height: `${s.size}%`,
              "--c": s.color,
              "--r": s.borderRadius,
            } as React.CSSProperties}
          />
        ))}
        <span className="emote__shading" />
        <Face emo={emo} />
      </button>

      {isReviving && (
        <div className="emote__angel-gear">
          {/* Left Wing */}
          <svg className="emote__wing emote__wing--left" viewBox="0 0 100 100" aria-hidden="true">
            <path
              d="M 90 50 C 60 10, 20 20, 10 40 C 5 50, 15 60, 30 55 C 20 65, 30 75, 45 70 C 40 80, 55 85, 70 75 C 80 68, 85 60, 90 50 Z"
              fill="#fbfff4"
              stroke="#0a0a0a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Right Wing */}
          <svg className="emote__wing emote__wing--right" viewBox="0 0 100 100" aria-hidden="true">
            <path
              d="M 10 50 C 40 10, 80 20, 90 40 C 95 50, 85 60, 70 55 C 80 65, 70 75, 55 70 C 60 80, 45 85, 30 75 C 20 68, 15 60, 10 50 Z"
              fill="#fbfff4"
              stroke="#0a0a0a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Halo */}
          <svg className="emote__halo" viewBox="0 0 100 40" aria-hidden="true">
            <ellipse
              cx="50"
              cy="20"
              rx="36"
              ry="10"
              fill="#ffd400"
              stroke="#0a0a0a"
              strokeWidth="6"
            />
            <ellipse
              cx="50"
              cy="20"
              rx="24"
              ry="6"
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="4"
            />
          </svg>
        </div>
      )}

      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <filter id="hand-drawn-1">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" seed="1" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hand-drawn-2">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hand-drawn-3">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" seed="3" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
