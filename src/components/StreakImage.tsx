import { useEffect, useRef } from "react"
import { ScrollTrigger } from "../lib/gsap"

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Vertical "streak / pixel-stretch" reveal, driven by uProgress (0..1).
// Each column resolves on a staggered schedule: while unresolved it is a thin
// vertical line whose pixels are smeared (clamped) into long streaks; as it
// resolves the line widens and the smear settles into the real image.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uTime;
uniform vec2 uCover;
uniform float uCols;
uniform vec3 uBg;

float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

void main() {
  // cover-fit sampling coordinates
  vec2 uv = (vUv - 0.5) * uCover + 0.5;

  float colId = floor(vUv.x * uCols);
  float r = hash(colId);
  float r2 = hash(colId + 57.3);

  // staggered per-column progress
  float p = clamp((uProgress - r * 0.5) / 0.5, 0.0, 1.0);
  p = smoothstep(0.0, 1.0, p);

  // vertical smear: large offset when unresolved, settling to 0
  float dir = r2 > 0.5 ? 1.0 : -1.0;
  float wobble = sin(uTime * 1.2 + colId) * 0.015 * (1.0 - p);
  float offset = (1.0 - p) * (0.35 + r * 0.65) * dir + wobble;
  float y = clamp(uv.y + offset, 0.0015, 0.9985);

  vec3 img = texture2D(uTex, vec2(uv.x, y)).rgb;

  // thin line when unresolved -> full column when resolved (gaps show bg)
  float within = fract(vUv.x * uCols);
  float lw = mix(0.1, 1.0, p);
  float edge = 0.04;
  float line = smoothstep(lw, lw - edge, within);

  vec3 col = mix(uBg, img, line);
  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh))
  }
  return sh
}

export function StreakImage({
  src,
  className,
  cols = 150,
}: {
  src: string
  className?: string
  cols?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progress = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext("webgl", {
      antialias: true,
      premultipliedAlpha: false,
    })
    if (!gl) return

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = {
      progress: gl.getUniformLocation(program, "uProgress"),
      time: gl.getUniformLocation(program, "uTime"),
      cover: gl.getUniformLocation(program, "uCover"),
      cols: gl.getUniformLocation(program, "uCols"),
      bg: gl.getUniformLocation(program, "uBg"),
      tex: gl.getUniformLocation(program, "uTex"),
    }
    gl.uniform1f(u.cols, cols)
    gl.uniform3f(u.bg, 0.027, 0.027, 0.027)
    gl.uniform1i(u.tex, 0)

    // texture
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([7, 7, 7, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    let imgAspect = 1
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgAspect = img.width / img.height
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      resize()
    }
    img.src = src

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl!.viewport(0, 0, canvas.width, canvas.height)
      // cover fit
      const canvasAspect = w / h
      let sx = 1
      let sy = 1
      if (canvasAspect > imgAspect) sy = imgAspect / canvasAspect
      else sx = canvasAspect / imgAspect
      gl!.uniform2f(u.cover, sx, sy)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // scroll-driven progress
    const st = ScrollTrigger.create({
      trigger: canvas,
      start: "top 88%",
      end: "top 32%",
      scrub: 0.6,
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })

    let raf = 0
    const start = performance.now()
    const loop = () => {
      gl.uniform1f(u.progress, progress.current)
      gl.uniform1f(u.time, (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      st.kill()
      gl.deleteProgram(program)
      gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
    }
  }, [src, cols])

  return <canvas ref={canvasRef} className={className} />
}
