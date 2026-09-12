"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { progression, type Settings } from "@/lib/aip/domain";
export type PortraitHandle = { exportImage: () => Promise<Blob | null> };
const vertex = `attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0,1);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D photo; uniform vec4 amounts; uniform float strength; uniform float split; uniform vec2 crop; uniform vec3 alignment;
float g(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d)*2.);}
void main(){vec2 q=uv; if(uv.x>=split){float side=uv.x<.5?-1.:1.;
q.x-=side*.025*amounts.x*g(uv,vec2(.5+side*.17,.49),vec2(.12,.12))*strength;
q.x-=side*.022*amounts.y*g(uv,vec2(.5+side*.16,.34),vec2(.13,.14))*strength;
q.y-=(uv.y-.411)*.28*amounts.z*g(uv,vec2(.5,.411),vec2(.115,.064))*strength;
q.y-=.014*amounts.w*(g(uv,vec2(.38,.66),vec2(.11,.06))+g(uv,vec2(.62,.66),vec2(.11,.06)))*strength;
}q=(q-.5)/alignment.x+.5-vec2(alignment.y,alignment.z);q=(q-.5)*crop+.5;gl_FragColor=texture2D(photo,clamp(q,vec2(.001),vec2(.999)));}`;
export const Portrait = forwardRef<
  PortraitHandle,
  {
    src: string;
    settings: Settings;
    split: number;
    overlay: boolean;
    onStatus?: (ready: boolean) => void;
  }
>(function Portrait({ src, settings, split, overlay, onStatus }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<{
    gl: WebGLRenderingContext;
    p: WebGLProgram;
    crop: number[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [generation, setGeneration] = useState(0);
  useImperativeHandle(
    ref,
    () => ({
      exportImage: async () => {
        const c = canvas.current;
        if (!c || !renderer.current || !loaded) return null;
        const output = document.createElement("canvas");
        output.width = c.width;
        output.height = c.height + 85;
        const ctx = output.getContext("2d")!;
        ctx.fillStyle = "#0e1919";
        ctx.fillRect(0, 0, output.width, output.height);
        ctx.drawImage(c, 0, 0);
        ctx.fillStyle = "#c5efdc";
        ctx.font = "22px sans-serif";
        ctx.fillText("AIP / Appearance exploration", 25, c.height + 33);
        ctx.font = "15px sans-serif";
        ctx.fillStyle = "#b5c6bd";
        ctx.fillText(
          "Illustrative image editing. Not a treatment prediction or clinical plan.",
          25,
          c.height + 60,
        );
        return new Promise((resolve) =>
          output.toBlob(resolve, "image/jpeg", 0.94),
        );
      },
    }),
    [loaded],
  );
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    setError("");
    onStatus?.(false);
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext("webgl", {
      preserveDrawingBuffer: true,
      alpha: false,
    });
    if (!gl) {
      setError(
        "Your browser cannot render this appearance preview. The original remains visible.",
      );
      return;
    }
    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error("Preview shader unavailable");
      return s;
    };
    let p: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let buffer: WebGLBuffer | null = null;
    const shaders: WebGLShader[] = [];
    try {
      p = gl.createProgram()!;
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ] as const) {
        const shader = compile(type, source);
        shaders.push(shader);
        gl.attachShader(p, shader);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error("Preview unavailable");
      gl.useProgram(p);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(p, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      const img = new Image();
      img.onload = () => {
        if (!alive || !p) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        const ratio = img.width / img.height;
        renderer.current = {
          gl,
          p,
          crop: ratio > 0.75 ? [0.75 / ratio, 1] : [1, ratio / 0.75],
        };
        setLoaded(true);
        setGeneration((n) => n + 1);
        onStatus?.(true);
      };
      img.onerror = () => {
        if (alive)
          setError(
            "This portrait could not be loaded. Please try another image.",
          );
      };
      img.src = src;
    } catch {
      setError("The appearance renderer is unavailable on this device.");
    }
    const lost = (e: Event) => {
      e.preventDefault();
      setError("The graphics session was interrupted. Reload to continue.");
      onStatus?.(false);
    };
    c.addEventListener("webglcontextlost", lost);
    return () => {
      alive = false;
      renderer.current = null;
      c.removeEventListener("webglcontextlost", lost);
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (p) gl.deleteProgram(p);
      shaders.forEach((s) => gl.deleteShader(s));
    };
  }, [src, onStatus]);
  useEffect(() => {
    const r = renderer.current;
    if (!r || !loaded) return;
    const { gl, p, crop } = r;
    gl.useProgram(p);
    gl.viewport(0, 0, 750, 1000);
    gl.uniform4f(
      gl.getUniformLocation(p, "amounts"),
      settings.cheek / 100,
      settings.jaw / 100,
      settings.lip / 100,
      settings.brow / 100,
    );
    gl.uniform1f(
      gl.getUniformLocation(p, "strength"),
      (settings.intensity / 100) * progression(settings.phase),
    );
    gl.uniform1f(gl.getUniformLocation(p, "split"), split / 100);
    gl.uniform2f(gl.getUniformLocation(p, "crop"), crop[0], crop[1]);
    gl.uniform3f(
      gl.getUniformLocation(p, "alignment"),
      settings.alignment.zoom,
      settings.alignment.x,
      settings.alignment.y,
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [settings, split, loaded, generation]);
  return (
    <>
      <img
        className="portrait portrait-fallback"
        src={src}
        alt="Original portrait"
      />
      <canvas
        ref={canvas}
        width={750}
        height={1000}
        className={`portrait render-canvas ${loaded && !error ? "ready" : ""}`}
        role="img"
        aria-label="Interactive illustrative appearance preview; not a treatment prediction"
      />
      <div className="portrait-vignette" />
      <div className="scan-corners" />
      {overlay && (
        <svg className="face-map" viewBox="0 0 300 400" aria-hidden="true">
          <path d="M92 143 Q150 117 208 143 M87 201 Q150 228 213 201 M100 244 Q150 277 200 244 M150 130V280 M96 159L84 205L105 243L150 279L195 243L216 205L204 159" />
          {[
            [96, 159],
            [204, 159],
            [84, 205],
            [216, 205],
            [150, 210],
            [105, 243],
            [195, 243],
            [150, 279],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2" />
          ))}
        </svg>
      )}
      {error && (
        <div className="render-error" role="alert">
          {error}
        </div>
      )}
      <div className="stage-coordinates">
        AIP / VISION LAB
        <br />
        ILLUSTRATIVE STUDY
      </div>
      <div className="portrait-caption">
        <span>ORIGINAL</span>
        <span>APPEARANCE PREVIEW</span>
      </div>
      <div className="comparison-line" style={{ left: `${split}%` }}>
        <span>‹ ›</span>
      </div>
    </>
  );
});
