import { useEffect, useRef } from "react"

/**
 * WebGL liquid-glass lens layer for the nav. Because Chromium can't refract a
 * backdrop via CSS feDisplacementMap, we do it in WebGL: the magnetic wordmark
 * (a live <canvas>) is uploaded as a texture and bent through each nav pill's
 * rounded-rect lens (edge falloff + chromatic aberration + specular rim). The
 * canvas sits behind the pill chrome; pills are marked with [data-lens].
 */
const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uCanvas;      // canvas size in device px
uniform float uDpr;
uniform vec4 uLens;        // x,y,w,h in CSS px (viewport coords)
uniform float uRadius;     // px
uniform vec4 uWord;        // wordmark rect x,y,w,h in CSS px
uniform sampler2D uTex;    // wordmark texture
uniform float uScale;      // refraction strength (px)
uniform float uChroma;
uniform float uDepth;      // edge band (px)

float rr(vec2 p, vec2 hf, float r){
  vec2 q = abs(p) - (hf - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// sample wordmark in viewport px -> uv, transparent outside
vec4 sampleWord(vec2 vp){
  vec2 uv = (vp - uWord.xy) / uWord.zw;
  if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uTex, uv);
}

void main(){
  // fragment position in CSS px, top-left origin
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uDpr;

  vec2 c = uLens.xy + uLens.zw * 0.5;
  vec2 hf = uLens.zw * 0.5;
  vec2 p = frag - c;
  float d = rr(p, hf, uRadius);
  if(d > 0.0) { discard; }

  // outward normal via SDF gradient
  float e = 1.5;
  float gx = rr(p + vec2(e, 0.0), hf, uRadius) - rr(p - vec2(e, 0.0), hf, uRadius);
  float gy = rr(p + vec2(0.0, e), hf, uRadius) - rr(p - vec2(0.0, e), hf, uRadius);
  vec2 n = normalize(vec2(gx, gy) + 1e-6);

  // refraction magnitude: strong at rim, fading to centre (domed)
  float mag = clamp(1.0 + d / uDepth, 0.0, 1.0);
  mag = mag * mag;
  vec2 disp = -n * mag * uScale;

  // chromatic split
  vec4 cr = sampleWord(frag + disp * (1.0 + uChroma));
  vec4 cg = sampleWord(frag + disp);
  vec4 cb = sampleWord(frag + disp * (1.0 - uChroma));
  vec3 wm = vec3(cr.r, cg.g, cb.b);
  float wa = max(max(cr.r, cg.g), cb.b);          // wordmark presence (additive red on black)

  // glass surface: rim light + directional specular + faint tint
  float rim = 1.0 - clamp(-d / 2.5, 0.0, 1.0);     // bright 2.5px rim
  float spec = pow(clamp(0.45 + 0.55 * (-n.y), 0.0, 1.0), 3.0) * mag; // top-edge sheen
  float tint = 0.08;

  vec3 col = wm * 1.05 + rim * 0.5 + spec * 0.35;
  float a = clamp(wa * 1.15 + rim * 0.55 + tint, 0.0, 1.0);

  gl_FragColor = vec4(col, a);
}
`

export function GlassLensCanvas({
  scale = 22,
  chroma = 0.16,
  depth = 16,
}: {
  scale?: number
  chroma?: number
  depth?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    if (!gl) return

    const compile = (t: number, s: string) => {
      const sh = gl.createShader(t)!
      gl.shaderSource(sh, s)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(sh))
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(prog, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const U = (name: string) => gl.getUniformLocation(prog, name)
    const uCanvas = U("uCanvas")
    const uDpr = U("uDpr")
    const uLens = U("uLens")
    const uRadius = U("uRadius")
    const uWord = U("uWord")
    const uScale = U("uScale")
    const uChroma = U("uChroma")
    const uDepth = U("uDepth")
    const uTex = U("uTex")

    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let raf = 0
    let cancelled = false
    const STRIP = 120 // px tall region at the top the lens covers

    const render = () => {
      if (cancelled) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const cw = Math.round(w * dpr)
      const ch = Math.round(STRIP * dpr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      gl.viewport(0, 0, cw, ch)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      const word = document.querySelector<HTMLCanvasElement>(
        "[data-wordmark] canvas"
      )
      const lenses = Array.from(
        document.querySelectorAll<HTMLElement>("[data-lens]")
      )
      if (word && lenses.length) {
        // upload wordmark frame
        gl.bindTexture(gl.TEXTURE_2D, tex)
        try {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            word
          )
        } catch {
          /* canvas not ready yet */
        }
        const wr = word.getBoundingClientRect()
        gl.uniform2f(uCanvas, cw, ch)
        gl.uniform1f(uDpr, dpr)
        gl.uniform1f(uScale, scale)
        gl.uniform1f(uChroma, chroma)
        gl.uniform1f(uDepth, depth)
        gl.uniform4f(uWord, wr.left, wr.top, wr.width, wr.height)
        gl.uniform1i(uTex, 0)

        for (const el of lenses) {
          const r = el.getBoundingClientRect()
          if (r.top > STRIP) continue
          gl.uniform4f(uLens, r.left, r.top, r.width, r.height)
          gl.uniform1f(uRadius, Math.min(r.height / 2, r.width / 2))
          gl.drawArrays(gl.TRIANGLES, 0, 3)
        }
      }
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [scale, chroma, depth])

  return <canvas ref={ref} className="nav__lens" aria-hidden="true" />
}
