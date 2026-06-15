import { useEffect, useMemo, useRef } from "react"
import "./VideoBackground.css"

/**
 * Looping background video. Replaces the WebGPU shader so it plays everywhere,
 * including mobile. `muted` + `playsInline` are required for autoplay on iOS/
 * Android; a poster frame shows instantly while the video loads. Smaller phones
 * get a lighter 720p encode.
 */
export function VideoBackground() {
  const base = import.meta.env.BASE_URL
  const videoRef = useRef<HTMLVideoElement>(null)

  const src = useMemo(() => {
    const small =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
    return `${base}${small ? "video-720.mp4" : "video-1080.mp4"}`
  }, [base])

  // React doesn't reliably reflect the `muted` prop to the DOM attribute, and
  // some browsers gate autoplay on that. Force it muted and kick off playback.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    void video.play().catch(() => {
      /* autoplay may be blocked until a user gesture; the poster stays up */
    })
  }, [])

  return (
    <video
      ref={videoRef}
      className="bg-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={`${base}poster.jpg`}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
