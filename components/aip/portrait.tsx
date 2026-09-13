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
import { renderBeard } from "@/lib/aip/beard-render";
import PhotographicControls, { type PhotoResult } from './photographic-controls';
import { photoRenderKey } from '@/lib/aip/photographic';
import { inspectionAlignment } from "@/lib/aip/inspection";
export type PortraitHandle = { exportImage: () => Promise<Blob | null> };
const vertex = `attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0,1);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D photo; uniform vec4 regions[9]; uniform vec2 moves[9]; uniform vec4 lips; uniform float lipScale; uniform vec4 lipShape; uniform float split; uniform vec2 crop; uniform vec3 alignment;
uniform sampler2D hairMask; uniform vec3 hairTint; uniform float hairMix;
uniform sampler2D beardTexture; uniform float beardMix; uniform sampler2D refinedPhoto; uniform float refinedMix; uniform float refinedSample;
float g(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d)*2.);}
void main(){vec2 source=(uv-.5)/alignment.x+.5-vec2(alignment.y,alignment.z);source=(source-.5)*crop+.5;vec2 q=source;
if(uv.x>=split){for(int i=0;i<9;i++){q-=moves[i]*g(source,regions[i].xy,regions[i].zw);}
vec2 d=source-lips.xy;float fullness=mix(lipShape.y,lipShape.x,smoothstep(-.005,.005,d.y));
q-=d*vec2(.16*lipScale+.3*lipShape.z,fullness)*g(source,lips.xy,lips.zw);
float cupid=g(source,lips.xy+vec2(-lips.z*.25,lips.w*.32),lips.zw*vec2(.22,.48))+g(source,lips.xy+vec2(lips.z*.25,lips.w*.32),lips.zw*vec2(.22,.48));q.y-=cupid*lipShape.w*lips.w*.17;
}vec3 color=refinedMix>0.&&uv.x>=split?texture2D(refinedPhoto,clamp(q,vec2(.001),vec2(.999))).rgb:texture2D(photo,clamp(q,vec2(.001),vec2(.999))).rgb;
if(uv.x>=split && hairMix>0.){float mask=smoothstep(.4,.95,texture2D(hairMask,q).r);float light=dot(color,vec3(.299,.587,.114));
// Retain deep strand shadows and original highlights instead of a flat color coat.
vec3 tint=hairTint*(.12+pow(light,.72)*1.65)+vec3(pow(light,3.)*.22);color=mix(color,clamp(tint,0.,1.),mask*hairMix);}
if(uv.x>=split && beardMix>0.){vec4 beard=texture2D(beardTexture,q);float light=dot(color,vec3(.299,.587,.114));color=mix(color,beard.rgb*(.75+light*.5),beard.a*beardMix);}


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
    beardTexture: WebGLTexture;
    beardKey: string;
    refinedTexture: WebGLTexture;
  } | null>(null);
  const [refined,setRefined]=useState<PhotoResult|null>(null);
  const activeRefined=refined?.key===photoRenderKey(src,settings)?refined:null;
  const [focused,setFocused]=useState(false);
  const [holdOriginal,setHoldOriginal]=useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [face, setFace] = useState<FaceGeometry | null>(null);
  const [crop, setCrop] = useState([1, 1]);
  const [hairStatus, setHairStatus] = useState("");
  const viewAlignment=focused&&face?inspectionAlignment(face,crop,settings.editMode):settings.alignment;
  const shownSplit=holdOriginal?100:split;
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
    let beardTexture: WebGLTexture | null = null;
    let refinedTexture: WebGLTexture | null = null;
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
      beardTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,beardTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.activeTexture(gl.TEXTURE0);
      refinedTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,refinedTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.activeTexture(gl.TEXTURE0);
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
          c.width=Math.min(1440,Math.max(900,img.width));c.height=Math.round(c.width/0.75);
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
            beardTexture:beardTexture!,beardKey:"",refinedTexture:refinedTexture!,
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
      if (beardTexture) gl.deleteTexture(beardTexture);
      if (refinedTexture) gl.deleteTexture(refinedTexture);
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
      r.maskReady && !settings.previewOriginal && color !== "original" && !(activeRefined?.region==='hair')
        ? (settings.hairStrength ?? 90)/100
        : 0,
    );
    gl.uniform1i(gl.getUniformLocation(p,'refinedPhoto'),3);
    gl.uniform1f(gl.getUniformLocation(p,'refinedMix'),activeRefined&&!settings.previewOriginal?1:0);
    gl.uniform1f(gl.getUniformLocation(p,'refinedSample'),activeRefined?.sample&&activeRefined.region==='beard'?1:0);
    if(activeRefined){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,r.refinedTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,activeRefined.canvas);gl.activeTexture(gl.TEXTURE0);}
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    let warpSettings=settings;
    if(activeRefined){
      if(activeRefined.region==='lips')warpSettings={...settings,lip:0,lipUpper:0,lipLower:0,lipWidth:0,lipCupid:0};
      if(activeRefined.region==='jawline')warpSettings={...settings,jaw:0,chin:0};
      if(activeRefined.region==='full')warpSettings={...settings,cheek:0,jaw:0,brow:0,lip:0,lipUpper:0,lipLower:0,lipWidth:0,lipCupid:0,chin:0};
    }
    const warp = createWarp(warpSettings, face);
    gl.uniform4fv(gl.getUniformLocation(p, "regions[0]"), warp.regions);
    gl.uniform2fv(gl.getUniformLocation(p, "moves[0]"), warp.moves);
    gl.uniform4fv(gl.getUniformLocation(p, "lips"), warp.lip);
    gl.uniform1f(gl.getUniformLocation(p, "lipScale"), warp.lipScale);
    gl.uniform4fv(gl.getUniformLocation(p, "lipShape"), warp.lipShape);
    const beardKey=[settings.beard??'original',settings.beardDensity??50,settings.beardColor??'espresso'].join(':');
    if(r.beardKey!==beardKey){const texture=renderBeard(face,settings,r.image.width,r.image.height);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,r.beardTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture);gl.activeTexture(gl.TEXTURE0);r.beardKey=beardKey;}
    gl.uniform1i(gl.getUniformLocation(p,'beardTexture'),2);
    gl.uniform1f(gl.getUniformLocation(p,'beardMix'),settings.previewOriginal||(activeRefined?.region==='beard')?0:1);
    gl.uniform1f(gl.getUniformLocation(p, "split"), shownSplit / 100);
    gl.uniform2f(gl.getUniformLocation(p, "crop"), crop[0], crop[1]);
    gl.uniform3f(
      gl.getUniformLocation(p, "alignment"),
      viewAlignment.zoom,
      viewAlignment.x,
      viewAlignment.y,
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [settings, shownSplit, focused, loaded, generation, refined]);
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
      {loaded&&!error&&<PhotographicControls src={src} settings={settings} onResult={setRefined}/>}
      {loaded&&!error&&<div className="portrait-inspect-controls"><button aria-pressed={!focused} onClick={()=>setFocused(false)}>Full portrait</button><button aria-pressed={focused} onClick={()=>setFocused(true)}>Region close-up</button><button onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setHoldOriginal(true);}} onPointerUp={()=>setHoldOriginal(false)} onPointerCancel={()=>setHoldOriginal(false)} onLostPointerCapture={()=>setHoldOriginal(false)} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();setHoldOriginal(true);}}} onKeyUp={()=>setHoldOriginal(false)} onBlur={()=>setHoldOriginal(false)}>Hold original</button></div>}
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
                ((point.x - 0.5) / crop[0] + viewAlignment.x) *
                  viewAlignment.zoom +
                0.5;
              const y =
                ((point.y - 0.5) / crop[1] + viewAlignment.y) *
                  viewAlignment.zoom +
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
        {activeRefined&&!settings.previewOriginal?activeRefined.label:face ? "LANDMARK-ALIGNED PREVIEW" : "ORIGINAL PHOTO"}
      </div>
      {loaded && (
        <div className="portrait-caption">
          <span>{shownSplit > 0 ? "ORIGINAL" : ""}</span>
          <span>{shownSplit < 100 ? activeRefined?.label??"APPEARANCE PREVIEW" : ""}</span>
        </div>
      )}
      {loaded && shownSplit > 0 && shownSplit < 100 && (
        <div className="comparison-line" style={{ left: `${split}%` }}>
          <span>‹ ›</span>
        </div>
      )}
    </>
  );
});
