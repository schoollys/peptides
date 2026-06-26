'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Анимированный mesh-градиент на WebGL (в духе hero Stripe «Helios»).
 *
 * Реализация без внешних зависимостей: полноэкранный треугольник + фрагментный
 * шейдер, который смешивает brand/accent-цвета через несколько движущихся
 * радиальных «пятен» с доменным варпингом (плавно, без noise-библиотек).
 *
 * Деградация:
 *  - нет WebGL  → компонент ничего не рендерит (под ним остаётся CSS .stripe-mesh);
 *  - prefers-reduced-motion → рисуется один статичный кадр, без requestAnimationFrame.
 */

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;

// Accent-палитра (Stripe mesh): cream → orange → magenta → ruby → lavender → indigo
const vec3 CREAM    = vec3(1.000, 0.898, 0.855);
const vec3 ORANGE   = vec3(1.000, 0.380, 0.094);
const vec3 MAGENTA  = vec3(0.956, 0.294, 0.800);
const vec3 RUBY     = vec3(0.917, 0.133, 0.380);
const vec3 LAVENDER = vec3(0.498, 0.490, 0.988);
const vec3 INDIGO   = vec3(0.388, 0.357, 1.000);
const vec3 BASE     = vec3(0.984, 0.969, 1.000);

// Мягкое радиальное пятно
float blob(vec2 uv, vec2 c, float r) {
  float d = distance(uv, c);
  return smoothstep(r, 0.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  uv.x *= aspect;

  float t = uTime * 0.08;

  // Лёгкий доменный варп — «дыхание» ткани
  uv += 0.035 * vec2(
    sin(uv.y * 3.0 + t * 1.3),
    cos(uv.x * 3.0 + t * 1.1)
  );

  // Центры пятен дрейфуют, концентрируясь в правом-верхнем углу (как ribbon)
  vec2 cOrange   = vec2(aspect * (0.92 + 0.05 * sin(t * 0.9)), 0.82 + 0.05 * cos(t * 0.7));
  vec2 cMagenta  = vec2(aspect * (0.98 + 0.04 * cos(t * 0.8)), 0.55 + 0.06 * sin(t * 0.9));
  vec2 cRuby     = vec2(aspect * (0.86 + 0.06 * sin(t * 1.1)), 0.34 + 0.05 * cos(t * 0.6));
  vec2 cLavender = vec2(aspect * (0.68 + 0.07 * cos(t * 0.7)), 0.70 + 0.07 * sin(t * 0.8));
  vec2 cCream    = vec2(aspect * (0.78 + 0.05 * sin(t * 0.6)), 0.95 + 0.04 * cos(t * 0.5));
  vec2 cIndigo   = vec2(aspect * (0.74 + 0.05 * cos(t * 1.0)), 0.40 + 0.06 * sin(t * 0.7));

  vec3 col = BASE;
  col = mix(col, LAVENDER, blob(uv, cLavender, 0.95) * 0.85);
  col = mix(col, INDIGO,   blob(uv, cIndigo,   0.70) * 0.70);
  col = mix(col, CREAM,    blob(uv, cCream,    0.85) * 0.90);
  col = mix(col, ORANGE,   blob(uv, cOrange,   0.85) * 0.95);
  col = mix(col, MAGENTA,  blob(uv, cMagenta,  0.80) * 0.90);
  col = mix(col, RUBY,     blob(uv, cRuby,     0.78) * 0.88);

  // Прозрачность: насыщенно в правом-верхнем углу, плавно гаснет влево-вниз,
  // чтобы текст hero оставался читаемым.
  vec2 p = gl_FragCoord.xy / uRes;
  float alpha = smoothstep(0.0, 0.85, (p.x * 0.65 + p.y * 0.55));
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function WebglMesh({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true }) ||
        canvas.getContext('experimental-webgl', { premultipliedAlpha: false })) as
        | WebGLRenderingContext
        | null

    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) {
      setFailed(true)
      return
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(prog)

    // Полноэкранный треугольник
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    function resize() {
      if (!canvas || !gl) return
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    let raf = 0
    const start = performance.now()

    function draw(now: number) {
      if (!gl) return
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(draw)
    }

    if (reduced) {
      // один статичный кадр
      gl.uniform1f(uTime, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      const lose = gl.getExtension('WEBGL_lose_context')
      lose?.loseContext()
    }
  }, [])

  if (failed) return null

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
