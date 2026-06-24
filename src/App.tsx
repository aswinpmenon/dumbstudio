import { useCallback, useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import Snap from "lenis/snap"
import { gsap, ScrollTrigger } from "./lib/gsap"
import "./sections.css"

import { Preloader } from "./components/Preloader"
import { Nav } from "./components/Nav"
import { Hero } from "./components/Hero"
import { Marquee } from "./components/Marquee"
import { Manifesto } from "./components/Manifesto"
import { Services } from "./components/Services"
import { Process } from "./components/Process"
import { About } from "./components/About"
import { Contact } from "./components/Contact"
import { Footer } from "./components/Footer"
import { GameMode } from "./components/GameMode"

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)

  const handleLoaded = useCallback(() => setLoaded(true), [])

  // Smooth scroll (Lenis) synced with GSAP's ticker + ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on("scroll", ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    document.body.classList.add("is-loading")

    // Anchor links scroll smoothly through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute("href")!
      if (id.length < 2) return
      const el = document.querySelector(id)
      if (el) {
        e.preventDefault()
        lenis.scrollTo(el as HTMLElement, { offset: 0 })
      }
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  // Set up scroll-triggered reveals once the preloader is done
  useEffect(() => {
    if (!loaded) return
    document.body.classList.remove("is-loading")
    lenisRef.current?.scrollTo(0, { immediate: true })

    const ctx = gsap.context(() => {
      // Line-mask headings (hero handled separately by <Hero active />)
      gsap.utils.toArray<HTMLElement>(".split:not(.hero-split)").forEach((el) => {
        const spans = el.querySelectorAll<HTMLElement>(".line > span")
        gsap.set(spans, { yPercent: 110, autoAlpha: 1 })
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () =>
            gsap.to(spans, {
              yPercent: 0,
              duration: 1,
              ease: "power4.out",
              stagger: 0.09,
            }),
        })
      })

      // Generic fade-up reveals
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.set(el, { y: 34, opacity: 0 })
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(el, {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              delay: parseFloat(el.dataset.delay || "0"),
            }),
        })
      })

      // Parallax media
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const wrap =
          (el.closest("[data-parallax-wrap]") as HTMLElement) || el
        gsap.to(el, {
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        })
      })

      // Count-up stats
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0")
        const obj = { v: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: target,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(obj.v).toString()
              },
            }),
        })
      })
    })

    // Hand-drawn marks: draw in when their section scrolls into view.
    const scribbleIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-drawn")
            scribbleIO.unobserve(e.target)
          }
        })
      },
      { threshold: 0.35 }
    )
    document
      .querySelectorAll<HTMLElement>("[data-scribble]")
      .forEach((el) => scribbleIO.observe(el))

    // Section snapping: gently align the viewport to each section's top
    // as the user settles. Proximity (not mandatory) so tall sections
    // taller than the viewport stay freely scrollable. Lower threshold +
    // softer easing keeps it from feeling grabby.
    let snap: Snap | null = null
    if (lenisRef.current) {
      snap = new Snap(lenisRef.current, {
        type: "proximity",
        distanceThreshold: "16%",
        duration: 1.1,
        easing: (t: number) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      })
      document
        .querySelectorAll<HTMLElement>("main > section[data-snap]")
        .forEach((el) => snap!.addElement(el, { align: ["start"] }))
    }

    ScrollTrigger.refresh()
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener("load", onLoad)

    return () => {
      window.removeEventListener("load", onLoad)
      scribbleIO.disconnect()
      snap?.destroy()
      ctx.revert()
    }
  }, [loaded])

  return (
    <>
      {!loaded && <Preloader onComplete={handleLoaded} />}
      <Nav />
      <main>
        <Hero active={loaded} />
        <Marquee />
        <Manifesto />
        <Services />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
      {loaded && <GameMode />}
    </>
  )
}
