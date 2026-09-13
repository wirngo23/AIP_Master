"use client";
import { useEffect, useRef, useState } from "react";
import type * as T from "three";
import type { OrbitControls as OrbitType } from "three/addons/controls/OrbitControls.js";
import {
  RotateCcw,
  Rotate3D,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  Scissors,
  Download,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SETTINGS, progression, type Settings } from "@/lib/aip/domain";
import {
  deformPoint,
  MUSCLES,
  muscleRay,
  viewPreset,
  type HairStyle,
} from "@/lib/aip/spatial";
import { download } from "@/lib/aip/client";
import { appearanceAmounts, expressionAmount } from "@/lib/aip/appearance";
type MuscleView = {
  visible: boolean;
  selected: string;
  showAll: boolean;
  activity: number;
  reduction: number;
  playing: boolean;
};
type Props = {
  settings?: Settings;
  clinical?: MuscleView;
  compact?: boolean;
  managed?: boolean;
  hair?: HairStyle;
  onHairChange?: (hair: HairStyle) => void;
};
export default function HeadViewer({
  settings = DEFAULT_SETTINGS,
  clinical,
  compact = false,
  managed = false,
  hair = "default",
  onHairChange,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [turntable, setTurntable] = useState(false);
  const [hairOpen, setHairOpen] = useState(false);
  const [localHair, setLocalHair] = useState<HairStyle>("default");
  const [original, setOriginal] = useState(false);
  const hairValue =
    settings.previewOriginal || original
      ? "default"
      : onHairChange
        ? hair
        : localHair;
  const live = useRef({
    settings,
    clinical,
    turntable,
    hair: hairValue,
    original,
  });
  useEffect(() => {
    live.current = { settings, clinical, turntable, hair: hairValue, original };
  }, [settings, clinical, turntable, hairValue, original]);
  const engine = useRef<{
    camera: T.PerspectiveCamera;
    controls: OrbitType;
    renderer: T.WebGLRenderer;
    draw: () => void;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    async function initialize() {
      try {
        const THREE = await import("three");
        const [{ OrbitControls }, { GLTFLoader }] = await Promise.all([
          import("three/addons/controls/OrbitControls.js"),
          import("three/addons/loaders/GLTFLoader.js"),
        ]);
        if (cancelled || !host.current) return;
        const container = host.current;
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
        camera.position.set(0, 0.15, 7);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.15, 0);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.minDistance = 4;
        controls.maxDistance = 10;
        controls.minPolarAngle = 0.2;
        controls.maxPolarAngle = Math.PI - 0.2;
        controls.autoRotateSpeed = 1;
        controls.update();
        scene.add(new THREE.HemisphereLight(0xe5f5ef, 0x172a31, 1.65));
        const key = new THREE.DirectionalLight(0xfff0df, 3.2);
        key.position.set(-3, 4, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xb9dfef, 1.7);
        fill.position.set(3, 1, 3);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0x79d9bd, 3);
        rim.position.set(1, 2, -3);
        scene.add(rim);
        const root = new THREE.Group();
        scene.add(root);
        const anatomy = new THREE.Group();
        root.add(anatomy);
        const hairstyles = new THREE.Group();
        root.add(hairstyles);
        const muscles: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>[] = [];
        let mesh: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial> | null =
          null;
        let base: Float32Array | null = null;
        let lastSettings = "";
        let lastHair = "";
        const ownedTextures: T.Texture[] = [];
        let disposed = false;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.3, 0.008, 8, 120),
          new THREE.MeshBasicMaterial({
            color: 0x5a9180,
            transparent: true,
            opacity: 0.5,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.83;
        scene.add(ring);
        const loader = new THREE.TextureLoader();
        const modelUrl = "/models/reference-head/";
        function disposeObject(object: T.Object3D) {
          object.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              const mats = Array.isArray(o.material)
                ? o.material
                : [o.material];
              mats.forEach((m) => m.dispose());
            }
          });
        }
        const lost = (event: Event) => {
          event.preventDefault();
          setError(
            "The 3D graphics session was interrupted. Reload to try again.",
          );
          setStatus("error");
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        let resizeFrame = 0;
        let previousWidth = 0, previousHeight = 0;
        const fitCanvas = () => {
          const w = container.clientWidth,
            h = container.clientHeight;
          if (!w || !h || (w === previousWidth && h === previousHeight)) return;
          previousWidth = w; previousHeight = h;
          // CSS owns layout; update only the backing buffer outside observer delivery.
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        const resize = new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(fitCanvas);
        });
        resize.observe(container);
        let visible = true;
        const observer = new IntersectionObserver((e) => {
          visible = e[0]?.isIntersecting ?? true;
        });
        observer.observe(container);
        cleanup = () => {
          disposed = true;
          renderer.setAnimationLoop(null);
          resize.disconnect();
          cancelAnimationFrame(resizeFrame);
          observer.disconnect();
          controls.dispose();
          renderer.domElement.removeEventListener("webglcontextlost", lost);
          disposeObject(root);
          disposeObject(ring);
          ownedTextures.forEach((t) => t.dispose());
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
          engine.current = null;
        };
        async function loadTexture(file: string) {
          const texture = await loader.loadAsync(modelUrl + file);
          if (disposed) texture.dispose();
          else ownedTextures.push(texture);
          return texture;
        }
        const [gltf, color, normal] = await Promise.all([
          new GLTFLoader()
            .loadAsync(modelUrl + "LeePerrySmith.glb")
            .then((model) => {
              if (disposed) disposeObject(model.scene);
              return model;
            }),
          loadTexture("Map-COL.jpg"),
          loadTexture("Infinite-Level_02_Tangent_SmoothUV.jpg"),
        ]);
        if (cancelled) {
          disposeObject(gltf.scene);
          ownedTextures.forEach((t) => t.dispose());
          return;
        }
        color.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshStandardMaterial({
          map: color,
          normalMap: normal,
          normalScale: new THREE.Vector2(0.65, 0.65),
          roughness: 0.7,
          metalness: 0,
        });
        let geometry: T.BufferGeometry | undefined;
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh && !geometry)
            geometry = o.geometry.clone();
        });
        disposeObject(gltf.scene);
        if (!geometry) throw Error("The reference model could not be read.");
        geometry.computeBoundingBox();
        const bounds = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bounds.getSize(size);
        const center = new THREE.Vector3();
        bounds.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
        geometry.scale(3.6 / size.y, 3.6 / size.y, 3.6 / size.y);
        geometry.computeVertexNormals();
        mesh = new THREE.Mesh(geometry, material);
        root.add(mesh);
        base = new Float32Array(
          geometry.getAttribute("position").array as Float32Array,
        );
        const ray = new THREE.Raycaster();
        root.updateMatrixWorld(true);
        for (const group of MUSCLES) {
          for (const side of group.paired ? [-1, 1] : [1]) {
            const anchor = muscleRay(group, side);
            ray.set(
              new THREE.Vector3(...anchor.origin),
              new THREE.Vector3(...anchor.direction),
            );
            const hit = ray.intersectObject(mesh, false)[0];
            if (!hit)
              throw Error(`Reference surface missing for ${group.name}.`);
            let shape: T.BufferGeometry;
            if (group.id.startsWith("orbicularis"))
              shape = new THREE.TorusGeometry(1, 0.16, 8, 48);
            else shape = new THREE.SphereGeometry(1, 14, 10);
            const mat = new THREE.MeshStandardMaterial({
              color: 0xad4d60,
              emissive: 0x35101b,
              transparent: true,
              opacity: 0.72,
              roughness: 0.6,
              depthWrite: false,
            });
            const patch = new THREE.Mesh(shape, mat);
            patch.position.copy(hit.point);
            const normal = hit.face!.normal.clone().normalize();
            patch.position.addScaledVector(normal, 0.025);
            patch.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 0, 1),
              normal,
            );
            patch.scale.set(...group.scale);
            patch.rotateZ(group.angle * side);
            patch.userData = { id: group.id, sy: group.scale[1] };
            anatomy.add(patch);
            muscles.push(patch);
          }
        }
        function hairStyle(style: HairStyle) {
          while (hairstyles.children.length) {
            const obj = hairstyles.children[0];
            hairstyles.remove(obj);
            disposeObject(obj);
          }
          if (style === "default") return;
          const mat = new THREE.MeshStandardMaterial({
            color: 0x201a18,
            roughness: 0.86,
          });
          const cap = new THREE.Mesh(
            new THREE.SphereGeometry(
              1,
              48,
              28,
              0,
              Math.PI * 2,
              0,
              0.5 * Math.PI,
            ),
            mat,
          );
          cap.scale.set(0.94, style === "swept" ? 1.17 : 1.06, 0.93);
          cap.position.set(style === "swept" ? 0.06 : 0, 0.84, -0.12);
          hairstyles.add(cap);
          if (style === "bob") {
            // Leave the face open; add side and rear silhouette panels only.
            const curtain = new THREE.Mesh(
              new THREE.SphereGeometry(
                1,
                48,
                20,
                Math.PI,
                Math.PI,
                Math.PI / 2,
                1.1,
              ),
              mat.clone(),
            );
            curtain.scale.set(0.94, 1.35, 0.93);
            curtain.position.copy(cap.position);
            hairstyles.add(curtain);
          }
          for (let i = 0; i < 35; i++) {
            const a = (i / 35) * Math.PI * 2;
            const points = [];
            for (let j = 0; j <= 14; j++) {
              const t = (j / 14) * 1.45;
              points.push(
                new THREE.Vector3(
                  Math.sin(t) * Math.cos(a) * 0.95 +
                    (style === "swept" ? 0.07 : 0),
                  Math.cos(t) * (style === "swept" ? 1.18 : 1.07) + 0.84,
                  Math.sin(t) * Math.sin(a) * 0.94 - 0.12,
                ),
              );
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const strand = new THREE.Mesh(
              new THREE.TubeGeometry(curve, 16, 0.0025, 3, false),
              new THREE.MeshStandardMaterial({
                color: 0x5b4432,
                roughness: 0.85,
              }),
            );
            hairstyles.add(strand);
          }
        }
        const clock = new THREE.Clock();
        const draw = () => {
          if (!mesh || !base) return;
          const state = live.current;
          const hash = JSON.stringify([state.settings, state.original]);
          if (hash !== lastSettings) {
            const p = mesh.geometry.getAttribute("position");
            const s = state.settings;
            const strength =
              state.original || s.previewOriginal
                ? 0
                : (s.intensity / 100) * progression(s.phase);
            for (let i = 0; i < p.count; i++) {
              const j = i * 3;
              const v = deformPoint(
                [base[j], base[j + 1], base[j + 2]],
                appearanceAmounts(s),
                strength,
                expressionAmount(s),
              );
              p.setXYZ(i, ...v);
            }
            p.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
            lastSettings = hash;
          }
          if (state.hair !== lastHair) {
            hairStyle(state.hair);
            lastHair = state.hair;
          }
          const c = state.clinical;
          anatomy.visible = !!c?.visible;
          if (mesh.material.transparent !== !!c?.visible) {
            mesh.material.transparent = !!c?.visible;
            mesh.material.needsUpdate = true;
          }
          mesh.material.opacity = c?.visible ? 0.32 : 1;
          mesh.material.depthWrite = !c?.visible;
          const phase = (Math.sin(clock.getElapsedTime() * 2.6) + 1) / 2;
          for (const m of muscles) {
            const chosen = m.userData.id === c?.selected;
            m.visible = !!c?.visible && (c.showAll || chosen);
            const activation =
              ((c?.activity ?? 0) / 100) *
              (1 - (c?.reduction ?? 0) / 100) *
              (c?.playing ? phase : 1);
            m.material.color.setHex(chosen ? 0xeb9d71 : 0xab4c65);
            m.material.emissive.setHex(chosen ? 0x633018 : 0x30101c);
            m.material.emissiveIntensity = 0.5 + activation;
            m.scale.y = m.userData.sy * (1 - (chosen ? 0.12 : 0) * activation);
          }
          controls.autoRotate = state.turntable;
          controls.update();
          renderer.render(scene, camera);
        };
        engine.current = { camera, controls, renderer, draw };
        renderer.setAnimationLoop(() => {
          if (visible && !document.hidden) draw();
        });
        setStatus("ready");
        resize.disconnect();
        fitCanvas();
        resize.observe(container);
        draw();
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(
            e instanceof Error
              ? e.message
              : "3D is unavailable on this device.",
          );
          cleanup();
        }
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  function preset(name: string) {
    const e = engine.current;
    if (!e) return;
    const angle = viewPreset(name);
    const d = e.camera.position.distanceTo(e.controls.target);
    e.camera.position.set(Math.sin(angle) * d, 0.15, Math.cos(angle) * d);
    e.controls.target.set(0, 0.15, 0);
    e.controls.update();
    e.draw();
    setTurntable(false);
  }
  function zoom(factor: number) {
    const e = engine.current;
    if (!e) return;
    const delta = e.camera.position.clone().sub(e.controls.target);
    delta.setLength(Math.max(4, Math.min(10, delta.length() * factor)));
    e.camera.position.copy(e.controls.target).add(delta);
    e.controls.update();
    e.draw();
  }
  function exportView() {
    const e = engine.current;
    if (!e) return;
    e.draw();
    const c = document.createElement("canvas");
    c.width = e.renderer.domElement.width;
    c.height = e.renderer.domElement.height + 110;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#101b1c";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(e.renderer.domElement, 0, 0);
    ctx.fillStyle = "#d5efe2";
    ctx.font = "17px sans-serif";
    ctx.fillText(
      "AIP / 3D reference study — illustrative, not a clinical prediction",
      20,
      c.height - 65,
    );
    ctx.font = "13px sans-serif";
    ctx.fillText(
      "Lee Perry-Smith / Infinite Realities · CC BY 3.0 · modified appearance",
      20,
      c.height - 35,
    );
    c.toBlob(
      (b) => {
        if (b) download(b, "aip-3d-reference.jpg");
      },
      "image/jpeg",
      0.94,
    );
  }
  const changeHair = (value: HairStyle) => {
    if (onHairChange) onHairChange(value);
    else setLocalHair(value);
  };
  return (
    <div className={`head-viewer ${compact ? "compact-head" : ""}`}>
      <div className="spatial-label">
        <span>
          <Rotate3D size={13} /> 3D REFERENCE SCAN
        </span>
        <span>360°</span>
      </div>
      <div
        className="head-canvas"
        ref={host}
        role="img"
        aria-label="Rotatable reference head. Drag to orbit; use the view buttons to see every side."
      />
      {status !== "ready" && (
        <div className="head-loading" role="status">
          {status === "loading" ? (
            <>
              <Rotate3D size={28} />
              <span>Preparing your 3D perspective…</span>
            </>
          ) : (
            <>
              <span>3D viewer unavailable</span>
              <p>{error}</p>
            </>
          )}
        </div>
      )}
      <div className="spatial-hint">
        Drag to rotate · Scroll or pinch to zoom
      </div>
      <div className="spatial-controls">
        <div className="view-presets">
          {["front", "left", "right", "back"].map((v) => (
            <button
              disabled={status !== "ready"}
              onClick={() => preset(v)}
              key={v}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="spatial-icons">
          <button
            className="icon-button"
            disabled={status !== "ready"}
            aria-label={
              turntable ? "Pause rotation" : "Start automatic rotation"
            }
            aria-pressed={turntable}
            onClick={() => setTurntable((v) => !v)}
          >
            {turntable ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            className="icon-button"
            disabled={status !== "ready"}
            aria-label="Zoom in"
            onClick={() => zoom(0.9)}
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="icon-button"
            disabled={status !== "ready"}
            aria-label="Zoom out"
            onClick={() => zoom(1.1)}
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="icon-button"
            disabled={status !== "ready"}
            aria-label="Download 3D view"
            onClick={exportView}
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      {!compact && !managed && (
        <div className="spatial-appearance">
          <label>
            <Switch checked={original} onCheckedChange={setOriginal} /> Original
            geometry
          </label>
          <button
            className="text-link"
            onClick={() => {
              setHairOpen((v) => !v);
            }}
            aria-expanded={hairOpen}
          >
            <Scissors size={14} /> Hair options
          </button>
        </div>
      )}
      {hairOpen && !compact && !managed && (
        <div className="hair-options">
          <Select
            value={hairValue}
            onValueChange={(v) => changeHair(v as HairStyle)}
          >
            <SelectTrigger aria-label="Optional hairstyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                Original · no hair changes
              </SelectItem>
              <SelectItem value="crop">Short crop silhouette</SelectItem>
              <SelectItem value="swept">Swept volume silhouette</SelectItem>
              <SelectItem value="bob">Bob silhouette</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="icon-button"
            aria-label="Reset hair to original"
            onClick={() => changeHair("default")}
          >
            <RotateCcw size={14} />
          </button>
          <p>
            Optional 3D style silhouettes. No hair changes are applied until you
            select one.
          </p>
        </div>
      )}
      <p className="scan-attribution">
        Reference scan:{" "}
        <a
          href="https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith_License.txt"
          target="_blank"
          rel="noreferrer"
        >
          Lee Perry-Smith / Infinite Realities · CC BY 3.0
        </a>
        . This is a separate reference person, not a 3D reconstruction of the
        selected photo.
      </p>
    </div>
  );
}
