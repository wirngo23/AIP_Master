"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { type Settings } from "@/lib/aip/domain";
import { createWarp, type FaceGeometry } from "@/lib/aip/appearance";
import { analyzeFace } from "@/lib/aip/face-analysis";
import { analyzeHair } from "@/lib/aip/hair-analysis";
import { HAIR_COLORS } from "@/lib/aip/hair";
export type PortraitHandle = { exportImage: () => Promise<Blob | null> };
const vertex = `attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0,1);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D photo; uniform vec4 regions[9]; uniform vec2 moves[9]; uniform vec4 lips; uniform float lipScale; uniform vec4 lipShape; uniform float split; uniform vec2 crop; uniform vec3 alignment;
uniform sampler2D hairMask; uniform vec3 hairTint; uniform float hairMix;
uniform vec4 faceFrame; uniform float beardStyle; uniform float beardMix; uniform vec3 beardTint;
float g(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d)*2.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 source=(uv-.5)/alignment.x+.5-vec2(alignment.y,alignment.z);source=(source-.5)*crop+.5;vec2 q=source;
if(uv.x>=split){for(int i=0;i<9;i++){q-=moves[i]*g(source,regions[i].xy,regions[i].zw);}
vec2 d=source-lips.xy;float fullness=mix(lipShape.y,lipShape.x,smoothstep(-.005,.005,d.y));
q-=d*vec2(.16*lipScale+.3*lipShape.z,fullness)*g(source,lips.xy,lips.zw);
float cupid=g(source,lips.xy+vec2(-lips.z*.25,lips.w*.32),lips.zw*vec2(.22,.48))+g(source,lips.xy+vec2(lips.z*.25,lips.w*.32),lips.zw*vec2(.22,.48));q.y-=cupid*lipShape.w*lips.w*.17;
}vec3 color=texture2D(photo,clamp(q,vec2(.001),vec2(.999))).rgb;
if(uv.x>=split && hairMix>0.){float mask=smoothstep(.65,.95,texture2D(hairMask,q).r);float light=dot(color,vec3(.299,.587,.114));vec3 tint=hairTint*(.5+light*1.8)+vec3(pow(light,4.)*.15);color=mix(color,clamp(tint,0.,1.),mask*hairMix);}
if(uv.x>=split && beardMix>0.){
vec2 f=(q-faceFrame.xy)/faceFrame.zw;float edge=abs(f.x);float bottom=.014+.34*pow(edge/.5,2.);float top=.28+.2*edge;
float base=smoothstep(bottom,bottom+.025,f.y)*(1.-smoothstep(top-.025,top,f.y))*(1.-smoothstep(.40,.46,edge));
float mouth=1.-smoothstep(.65,1.05,length((q-lips.xy)/(lips.zw*vec2(1.15,1.18))));
float moustache=g(q,lips.xy+vec2(0.,lips.w*1.05),lips.zw*vec2(.92,.55));moustache=smoothstep(.08,.4,moustache);
float mask=base*(1.-mouth);
if(beardStyle>2.5&&beardStyle<3.5)mask*=1.-smoothstep(.17,.23,edge);
if(beardStyle>3.5&&beardStyle<4.5)mask=moustache*(1.-mouth);
else if(beardStyle>4.5)mask*=1.-smoothstep(bottom+.045,bottom+.095,f.y);
else mask=max(mask,moustache*(1.-mouth));
vec2 grain=q*vec2(1300.,1900.);float strand=hash(floor(grain));float tip=1.-smoothstep(.12,.48,abs(fract(grain.x)-.5));float fibers=smoothstep(.26,.8,strand)*tip;
float light=dot(color,vec3(.299,.587,.114));vec3 tone=beardTint*(.5+light)+vec3(light*.08);
color=mix(color,tone,mask*beardMix*(.16+.84*fibers));}
gl_FragColor=vec4(color,1.);}`;
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
    face: FaceGeometry;
    image: HTMLImageElement;
    maskTexture: WebGLTexture;
    maskReady: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [face, setFace] = useState<FaceGeometry | null>(null);
  const [crop, setCrop] = useState([1, 1]);
  const [hairStatus, setHairStatus] = useState("");
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
    setFace(null);
    setHairStatus("");
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
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        throw new Error("Preview shader unavailable");
      }
      return s;
    };
    let p: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let maskTexture: WebGLTexture | null = null;
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
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      maskTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        1,
        1,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0]),
      );
      gl.activeTexture(gl.TEXTURE0);
      const img = new Image();
      img.onload = async () => {
        if (!alive || !p) return;
        try {
          const detected = await analyzeFace(img);
          if (!alive || !p) return;
          gl.activeTexture(gl.TEXTURE0);
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
          const imageCrop =
            ratio > 0.75 ? [0.75 / ratio, 1] : [1, ratio / 0.75];
          renderer.current = {
            gl,
            p,
            crop: imageCrop,
            face: detected,
            image: img,
            maskTexture: maskTexture!,
            maskReady: false,
          };
          setFace(detected);
          setCrop(imageCrop);
          setLoaded(true);
          setGeneration((n) => n + 1);
          onStatus?.(true);
        } catch (e) {
          if (alive) {
            setError(
              e instanceof Error
                ? e.message
                : "Face analysis unavailable. Try again with a front-facing photo.",
            );
            onStatus?.(false);
          }
        }
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
      if (maskTexture) gl.deleteTexture(maskTexture);
      if (buffer) gl.deleteBuffer(buffer);
      if (p) gl.deleteProgram(p);
      shaders.forEach((s) => gl.deleteShader(s));
    };
  }, [src, onStatus]);
  useEffect(() => {
    let alive = true;
    const r = renderer.current;
    if (!r || !loaded) return;
    if (
      settings.previewOriginal ||
      !settings.hairColor ||
      settings.hairColor === "original"
    ) {
      setHairStatus("");
      return;
    }
    if (r.maskReady) {
      setHairStatus("");
      return;
    }
    setHairStatus("Detecting hair on this device…");
    void analyzeHair(r.image)
      .then((mask) => {
        if (!alive || renderer.current !== r) return;
        const gl = r.gl;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, r.maskTexture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.LUMINANCE,
          mask.width,
          mask.height,
          0,
          gl.LUMINANCE,
          gl.UNSIGNED_BYTE,
          mask.bytes,
        );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.activeTexture(gl.TEXTURE0);
        r.maskReady = true;
        setHairStatus("");
        setGeneration((n) => n + 1);
      })
      .catch(() => {
        if (alive)
          setHairStatus(
            "Hair preview unavailable for this photo. The original hair is preserved.",
          );
      });
    return () => {
      alive = false;
    };
  }, [src, loaded, settings.hairColor, settings.previewOriginal]);
  useEffect(() => {
    const r = renderer.current;
    if (!r || !loaded) return;
    const { gl, p, crop, face } = r;
    gl.useProgram(p);
    gl.uniform1i(gl.getUniformLocation(p, "photo"), 0);
    gl.uniform1i(gl.getUniformLocation(p, "hairMask"), 1);
    const color = settings.hairColor ?? "original";
    gl.uniform3fv(gl.getUniformLocation(p, "hairTint"), HAIR_COLORS[color]);
    gl.uniform1f(
      gl.getUniformLocation(p, "hairMix"),
      r.maskReady && !settings.previewOriginal && color !== "original"
        ? (settings.hairStrength ?? 90)/100
        : 0,
    );
    gl.viewport(0, 0, 750, 1000);
    const warp = createWarp(settings, face);
    gl.uniform4fv(gl.getUniformLocation(p, "regions[0]"), warp.regions);
    gl.uniform2fv(gl.getUniformLocation(p, "moves[0]"), warp.moves);
    gl.uniform4fv(gl.getUniformLocation(p, "lips"), warp.lip);
    gl.uniform1f(gl.getUniformLocation(p, "lipScale"), warp.lipScale);
    gl.uniform4fv(gl.getUniformLocation(p, "lipShape"), warp.lipShape);
    const chin=face.chin??{x:face.lips.x,y:face.lips.y-face.height*.22};
    gl.uniform4f(gl.getUniformLocation(p,"faceFrame"),chin.x,chin.y,face.width,face.height);
    gl.uniform1f(gl.getUniformLocation(p,"beardStyle"),["original","stubble","boxed","goatee","mustache","chinstrap"].indexOf(settings.beard??"original"));
    gl.uniform1f(gl.getUniformLocation(p,"beardMix"),!settings.previewOriginal&&settings.beard&&settings.beard!=="original"?(settings.beardDensity??50)/100:0);
    gl.uniform3fv(gl.getUniformLocation(p,"beardTint"),HAIR_COLORS[settings.beardColor??"espresso"]);
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
      {hairStatus && (
        <div className="analysis-status" role="status">
          {hairStatus}
        </div>
      )}
      {overlay && face && (
        <svg className="face-map" viewBox="0 0 300 400" aria-hidden="true">
          {[...face.cheeks, ...face.jaw, ...face.brows, face.lips].map(
            (point, i) => {
              const x =
                ((point.x - 0.5) / crop[0] + settings.alignment.x) *
                  settings.alignment.zoom +
                0.5;
              const y =
                ((point.y - 0.5) / crop[1] + settings.alignment.y) *
                  settings.alignment.zoom +
                0.5;
              return <circle key={i} cx={x * 300} cy={(1 - y) * 400} r="2" />;
            },
          )}
        </svg>
      )}
      {!loaded && !error && (
        <div className="analysis-status" role="status">
          Analyzing facial features on this device…
        </div>
      )}
      {error && (
        <div className="render-error" role="alert">
          {error}
        </div>
      )}
      <div className="stage-coordinates">
        AIP / VISION LAB
        <br />
        {face ? "LANDMARK-ALIGNED PREVIEW" : "ORIGINAL PHOTO"}
      </div>
      {loaded && (
        <div className="portrait-caption">
          <span>{split > 0 ? "ORIGINAL" : ""}</span>
          <span>{split < 100 ? "APPEARANCE PREVIEW" : ""}</span>
        </div>
      )}
      {loaded && split > 0 && split < 100 && (
        <div className="comparison-line" style={{ left: `${split}%` }}>
          <span>‹ ›</span>
        </div>
      )}
    </>
  );
});
