import { lazy, Suspense, useEffect, useRef, useState } from "react"

// shader-lab is WebGPU-only + heavy, so it's lazy-loaded and only mounted
// (hidden) when WebGPU is available. Its canvas is sampled live as the
// magnetic wordmark's texture. Everywhere else we warp the static poster.
const ExportedShader = lazy(() =>
  import("./ExportedShader").then((m) => ({ default: m.ExportedShader }))
)

const base = import.meta.env.BASE_URL

const VERT = `#version 300 es
precision highp float;
in vec3 aPosition; in vec2 aUv; in vec4 aDisplacementIn;
uniform vec2 uVPRatio; uniform float uDispStrength;
out vec2 vUv;
void main() {
  vec2 pos = aPosition.xy + aDisplacementIn.xy * uDispStrength;
  pos *= uVPRatio;
  gl_Position = vec4(pos, .5, 1.);
  vUv = aUv;
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTexture; uniform float uChroma; out vec4 outColor;
void main() {
  float r = texture(uTexture, vUv + vec2(uChroma, 0.0)).r;
  vec3 g = texture(uTexture, vUv).rgb;
  float b = texture(uTexture, vUv - vec2(uChroma, 0.0)).b;
  vec3 col = vec3(r, g.g, b);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  // fade the glow toward the mesh edges so it blends into the hero
  float vy = smoothstep(0.0, 0.18, min(vUv.y, 1.0 - vUv.y));
  float vx = smoothstep(0.0, 0.06, min(vUv.x, 1.0 - vUv.x));
  outColor = vec4(col, clamp(lum * 1.85, 0.0, 1.0) * vy * vx);
}`

const DEFORM = `#version 300 es
precision highp float;
in vec3 aPosition; in vec4 aDisplacementIn;
uniform vec4 uCursor; uniform vec2 uEffectsStrength; out vec4 tf_disp;
void main() {
  vec2 velocity = aDisplacementIn.zw;
  vec2 pos = aPosition.xy + aDisplacementIn.xy;
  vec2 cursorToPos = pos - uCursor.xy;
  float cursorDist = length(cursorToPos);
  float strength = clamp(1. / (1. + cursorDist / .05) - .1, 0., 1.);
  velocity += uCursor.zw * .02 * strength * uEffectsStrength.x;
  velocity += -aDisplacementIn.xy * .1;
  velocity += cursorToPos * strength * uEffectsStrength.y;
  velocity *= .90;
  tf_disp.xy = aDisplacementIn.xy + velocity * .1;
  tf_disp.zw = velocity;
  tf_disp = clamp(tf_disp, -1., 1.);
}`

const EMPTY = `#version 300 es
precision highp float; void main() {}`

export function MagneticWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackRef = useRef<HTMLImageElement>(null)
  const shaderHostRef = useRef<HTMLDivElement>(null)
  const [webgpu, setWebgpu] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function detect() {
      try {
        const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
        if (!gpu) return
        const adapter = await gpu.requestAdapter()
        if (!cancelled && adapter) setWebgpu(true)
      } catch {
        /* no webgpu -> poster only */
      }
    }
    void detect()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current!
    let raf = 0
    let cancelled = false
    let onMove: ((e: PointerEvent) => void) | null = null

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
    })
    if (!gl) {
      if (fallbackRef.current) fallbackRef.current.style.display = "block"
      return
    }

    const compile = (t: number, s: string) => {
      const sh = gl.createShader(t)!
      gl.shaderSource(sh, s)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(sh))
      return sh
    }
    const program = (vs: string, fs: string, varyings?: string[]) => {
      const p = gl.createProgram()!
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs))
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
      if (varyings)
        gl.transformFeedbackVaryings(p, varyings, gl.INTERLEAVED_ATTRIBS)
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(p))
      return p
    }
    const drawProgram = program(VERT, FRAG)
    const deformProgram = program(DEFORM, EMPTY, ["tf_disp"])

    const cols = 120
    const rows = 36
    const vertices: number[] = []
    const indices: number[] = []
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= cols; x++) {
        const u = x / cols
        const v = y / rows
        vertices.push((u * 2 - 1) * 0.965, (1 - v * 2) * 0.285, 0, u, v)
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const a = y * (cols + 1) + x
        const b = a + 1
        const c = a + cols + 1
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    const vertexCount = vertices.length / 5
    const indexCount = indices.length
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    const dispBuffers = [gl.createBuffer(), gl.createBuffer()]
    const feedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()]
    dispBuffers.forEach((buffer, i) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, vertexCount * 16, gl.DYNAMIC_COPY)
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedbacks[i])
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer)
    })
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)

    // cover-fit source canvas (matches the mesh aspect)
    const SRC_W = 2048
    const SRC_H = 600
    const src = document.createElement("canvas")
    src.width = SRC_W
    src.height = SRC_H
    const sctx = src.getContext("2d")!
    const drawCover = (img: CanvasImageSource, iw: number, ih: number) => {
      const scale = Math.max(SRC_W / iw, SRC_H / ih)
      const w = iw * scale
      const h = ih * scale
      sctx.clearRect(0, 0, SRC_W, SRC_H)
      sctx.drawImage(img, (SRC_W - w) / 2, (SRC_H - h) / 2, w, h)
    }

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

    const uploadSrc = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    }

    // static poster (default + fallback)
    let ready = false
    const poster = new Image()
    poster.onload = () => {
      drawCover(poster, poster.naturalWidth, poster.naturalHeight)
      uploadSrc()
      ready = true
    }
    poster.src = `${base}poster.jpg`

    // live shader detection (switch from poster once the host has content)
    const probe = document.createElement("canvas")
    probe.width = 4
    probe.height = 4
    const pctx = probe.getContext("2d", { willReadFrequently: true })!
    let liveReady = false
    let frame = 0
    const hostCanvas = () =>
      shaderHostRef.current?.querySelector<HTMLCanvasElement>("canvas") || null
    const probeLive = () => {
      const host = hostCanvas()
      if (!host || host.width < 2) return false
      try {
        pctx.clearRect(0, 0, 4, 4)
        pctx.drawImage(host, 0, 0, 4, 4)
        const px = pctx.getImageData(0, 0, 4, 4).data
        let sum = 0
        for (let i = 0; i < px.length; i += 4) sum += px[i] + px[i + 1] + px[i + 2]
        return sum > 30
      } catch {
        return false
      }
    }

    const mouseClient = [innerWidth / 2, innerHeight / 2]
    const mouse = [0, 0]
    const velocity = [0, 0]
    let previousTime = performance.now()
    let readIndex = 0

    const bindMesh = (
      p: WebGLProgram,
      name: string,
      size: number,
      offset: number
    ) => {
      const loc = gl.getAttribLocation(p, name)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 20, offset)
    }
    const bindDisp = (p: WebGLProgram) => {
      const loc = gl.getAttribLocation(p, "aDisplacementIn")
      gl.bindBuffer(gl.ARRAY_BUFFER, dispBuffers[readIndex])
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0)
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(rect.width * ratio))
      const h = Math.max(1, Math.round(rect.height * ratio))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    onMove = (e: PointerEvent) => {
      mouseClient[0] = e.clientX
      mouseClient[1] = e.clientY
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    const render = (now: number) => {
      if (cancelled) return
      resize()
      const rect = canvas.getBoundingClientRect()
      const dt = Math.max(0.001, Math.min((now - previousTime) / 1000, 0.05))
      previousTime = now
      const aspect = canvas.width / canvas.height

      // upload the live shader frame once it's producing content
      frame++
      if (!liveReady && frame % 15 === 0 && probeLive()) {
        liveReady = true
        ready = true
      }
      if (liveReady) {
        const host = hostCanvas()
        if (host && host.width > 1) {
          drawCover(host, host.width, host.height)
          uploadSrc()
        }
      }

      const x = 2 * ((mouseClient[0] - rect.left) / rect.width) - 1
      const y = (-2 * ((mouseClient[1] - rect.top) / rect.height) + 1) / aspect
      velocity[0] = (x - mouse[0]) / dt
      velocity[1] = (y - mouse[1]) / dt
      if (Math.hypot(velocity[0], velocity[1]) > 10) velocity.fill(0)
      mouse[0] = x
      mouse[1] = y

      const writeIndex = 1 - readIndex
      gl.useProgram(deformProgram)
      bindMesh(deformProgram, "aPosition", 3, 0)
      bindDisp(deformProgram)
      gl.uniform4f(
        gl.getUniformLocation(deformProgram, "uCursor"),
        mouse[0],
        mouse[1],
        velocity[0],
        velocity[1]
      )
      gl.uniform2f(gl.getUniformLocation(deformProgram, "uEffectsStrength"), 1, 0)
      gl.enable(gl.RASTERIZER_DISCARD)
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, feedbacks[writeIndex])
      gl.beginTransformFeedback(gl.POINTS)
      gl.drawArrays(gl.POINTS, 0, vertexCount)
      gl.endTransformFeedback()
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
      gl.disable(gl.RASTERIZER_DISCARD)
      readIndex = writeIndex

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (ready) {
        gl.useProgram(drawProgram)
        bindMesh(drawProgram, "aPosition", 3, 0)
        bindMesh(drawProgram, "aUv", 2, 12)
        bindDisp(drawProgram)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.uniform2f(gl.getUniformLocation(drawProgram, "uVPRatio"), 1, aspect)
        gl.uniform1f(gl.getUniformLocation(drawProgram, "uDispStrength"), 1)
        gl.uniform1f(gl.getUniformLocation(drawProgram, "uChroma"), 0.004)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(gl.getUniformLocation(drawProgram, "uTexture"), 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0)
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (onMove) window.removeEventListener("pointermove", onMove)
    }
  }, [])

  return (
    <div className="magnetic-wordmark" data-wordmark aria-label="dumb studio">
      <canvas ref={canvasRef} aria-hidden="true" />
      <img
        className="magnetic-wordmark__fallback"
        ref={fallbackRef}
        src={`${base}poster.jpg`}
        alt="dumb studio"
        draggable={false}
      />
      {webgpu && (
        <div
          className="magnetic-wordmark__shader-host"
          ref={shaderHostRef}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <ExportedShader />
          </Suspense>
        </div>
      )}
    </div>
  )
}
