import { lazy, Suspense, useEffect, useState } from "react"
import "./ShaderBackground.css"

// Code-split the shader: the WebGPU runtime (three + the TS compiler that
// shader-lab bundles) is ~1.3 MB gzipped. Only load it when WebGPU is
// supported, so mobile/fallback users never download it.
const ExportedShader = lazy(() =>
  import("./Shader").then((m) => ({ default: m.ExportedShader }))
)

type Status = "checking" | "webgpu" | "fallback"

/**
 * The shader-lab composition is WebGPU-only. Many mobile browsers don't have
 * WebGPU yet, so we detect support (an actual adapter, not just `navigator.gpu`)
 * and render an on-brand CSS fallback when it's unavailable. Append `?fallback`
 * to the URL to force the fallback for testing.
 */
export function ShaderBackground() {
  const [status, setStatus] = useState<Status>("checking")

  useEffect(() => {
    let cancelled = false

    const forced =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("fallback")
    if (forced) {
      setStatus("fallback")
      return
    }

    async function detect() {
      try {
        const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
        if (!gpu) {
          if (!cancelled) setStatus("fallback")
          return
        }
        const adapter = await gpu.requestAdapter()
        if (!cancelled) setStatus(adapter ? "webgpu" : "fallback")
      } catch {
        if (!cancelled) setStatus("fallback")
      }
    }

    void detect()
    return () => {
      cancelled = true
    }
  }, [])

  // Fallback (also shown briefly while detecting, so there's no blank flash,
  // and as the Suspense fallback while the shader chunk loads)
  const fallback = (
    <div className="fallback" aria-hidden="true">
      <div className="fallback-glow" />
      <div className="fallback-text">dumb studio</div>
      <div className="fallback-scanlines" />
    </div>
  )

  if (status === "webgpu") {
    return <Suspense fallback={fallback}>
        <ExportedShader />
      </Suspense>
  }

  return fallback
}
