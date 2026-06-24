import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { gsap } from "../lib/gsap"

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

function rndRadius() {
  const r = () => Math.round(35 + Math.random() * 30)
  return `${r()}% ${100 - r()}% ${r()}% ${100 - r()}% / ${r()}% ${r()}% ${
    100 - r()
  }% ${100 - r()}%`
}

export function GameMode() {
  const [active, setActive] = useState(false)
  const [shots, setShots] = useState(0)
  const layerRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const burstIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.body.classList.toggle("game-on", active)
    const root = document.getElementById("root")!
    if (!active) {
      gsap.killTweensOf(root)
      gsap.set(root, { x: 0, y: 0 })
      return
    }

    const layer = layerRef.current!

    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.pageX, y: e.pageY }
    }

    const pop = () => {
      try {
        const ctx =
          audioRef.current ||
          (audioRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)())
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = "square"
        o.frequency.setValueAtTime(420 + Math.random() * 200, ctx.currentTime)
        o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12)
        g.gain.setValueAtTime(0.05, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
        o.connect(g)
        g.connect(ctx.destination)
        o.start()
        o.stop(ctx.currentTime + 0.15)
      } catch {
        /* audio is best-effort */
      }
    }

    const shake = () => {
      gsap.killTweensOf(root)
      gsap.fromTo(
        root,
        { x: 0, y: 0 },
        {
          keyframes: [
            { x: -12, y: 8 },
            { x: 10, y: -7 },
            { x: -7, y: 5 },
            { x: 5, y: -3 },
            { x: -2, y: 1 },
            { x: 0, y: 0 },
          ],
          duration: 0.4,
          ease: "power2.out",
        }
      )
    }

    const splat = (px: number, py: number) => {
      const color = COLORS[(Math.random() * COLORS.length) | 0]
      const size = 56 + Math.random() * 96
      const wrap = document.createElement("div")
      wrap.className = "splat"
      wrap.style.left = px + "px"
      wrap.style.top = py + "px"
      wrap.style.width = size + "px"
      wrap.style.height = size + "px"
      wrap.style.setProperty("--c", color)
      wrap.style.setProperty("--r", Math.random() * 360 + "deg")

      const blob = document.createElement("span")
      blob.className = "splat__blob"
      blob.style.borderRadius = rndRadius()
      wrap.appendChild(blob)

      const n = 4 + ((Math.random() * 4) | 0)
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2
        const dist = size * 0.42 + Math.random() * size * 0.55
        const ds = 5 + Math.random() * size * 0.22
        const d = document.createElement("span")
        d.className = "splat__drop"
        d.style.left = size / 2 + Math.cos(ang) * dist + "px"
        d.style.top = size / 2 + Math.sin(ang) * dist + "px"
        d.style.width = ds + "px"
        d.style.height = ds + "px"
        wrap.appendChild(d)
      }
      layer.appendChild(wrap)
    }

    const fire = (x: number, y: number) => {
      splat(x, y)
      shake()
      pop()
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40)
      }
      setShots((s) => s + 1)
    }

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (t.closest(".game-ui")) return
      e.preventDefault()
      e.stopPropagation()

      pointerRef.current = { x: e.pageX, y: e.pageY }
      fire(pointerRef.current.x, pointerRef.current.y)

      if (burstIntervalRef.current) clearInterval(burstIntervalRef.current)
      burstIntervalRef.current = setInterval(() => {
        fire(pointerRef.current.x, pointerRef.current.y)
      }, 100)
    }

    const onPointerUp = () => {
      if (burstIntervalRef.current) {
        clearInterval(burstIntervalRef.current)
        burstIntervalRef.current = null
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("pointerup", onPointerUp, true)
    window.addEventListener("pointercancel", onPointerUp, true)
    window.addEventListener("blur", onPointerUp)
    window.addEventListener("keydown", onKey)

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("pointerup", onPointerUp, true)
      window.removeEventListener("pointercancel", onPointerUp, true)
      window.removeEventListener("blur", onPointerUp)
      window.removeEventListener("keydown", onKey)
      if (burstIntervalRef.current) {
        clearInterval(burstIntervalRef.current)
        burstIntervalRef.current = null
      }
      gsap.killTweensOf(root)
      gsap.set(root, { x: 0, y: 0 })
    }
  }, [active])

  const audioRef = useRef<AudioContext | null>(null)

  const clear = () => {
    if (layerRef.current) layerRef.current.innerHTML = ""
    setShots(0)
  }

  return (
    <>
      {createPortal(
        <button
          className="game-ui game-toggle"
          onClick={() => setActive((a) => !a)}
          aria-pressed={active}
        >
          <span className="game-toggle__switch">
            <span className="game-toggle__knob" />
          </span>
          <span className="game-toggle__label">
            handle guns?
            <svg
              className="game-toggle__scribble"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                pathLength={1}
                d="M 4 20 C 4 8, 30 4, 96 8 C 99 10, 96 30, 60 34 C 20 38, 4 25, 8 20 C 12 15, 50 12, 92 18"
              />
            </svg>
          </span>
        </button>,
        document.body
      )}

      <div className="splat-layer" ref={layerRef} aria-hidden="true" />

      {active &&
        createPortal(
          <div className="game-ui game-hud">
            <span className="game-hud__title">Shoot everything</span>
            <span className="game-hud__count">{shots} hits</span>
            <button className="game-ui game-hud__btn" onClick={clear}>
              Clear
            </button>
            <span className="game-hud__hint">Hold click to fire · Esc to exit</span>
          </div>,
          document.body
        )}
    </>
  )
}
