import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import wordmark from "@/assets/cleard-wordmark.png.asset.json";

/* ------------------------------- BRAND TOKENS ------------------------------ */

const NAVY = "#0a1a30";
const BLUE = "#1e6fd9";
const CYAN = "#7ec3ec";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* ------------------------------ WIREFRAME DATA ---------------------------- */

type V3 = [number, number, number];
type Seg = { a: V3; b: V3; s: number };

const W = 3; // half width  (x)
const D = 2; // half depth  (z)
const H = 2.6; // wall height
const RIDGE = 4.25; // main ridge height

function build(): Seg[] {
  const L: Seg[] = [];
  const add = (a: V3, b: V3, s: number) => L.push({ a, b, s });

  /* ---- 1. site plan: dashed boundary + tick dimension lines ---- */
  const bx = 6.2;
  const bz = 4.6;
  const dash = (from: V3, to: V3) => {
    const steps = 28;
    for (let i = 0; i < steps; i += 2) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      const p = (t: number): V3 => [
        from[0] + (to[0] - from[0]) * t,
        from[1],
        from[2] + (to[2] - from[2]) * t,
      ];
      add(p(t0), p(t1), 1);
    }
  };
  dash([-bx, 0, -bz], [bx, 0, -bz]);
  dash([bx, 0, -bz], [bx, 0, bz]);
  dash([bx, 0, bz], [-bx, 0, bz]);
  dash([-bx, 0, bz], [-bx, 0, -bz]);
  // dimension lines with ticks (front + right edge)
  const dimZ = bz + 0.75;
  add([-bx, 0, dimZ], [bx, 0, dimZ], 1);
  for (let x = -bx; x <= bx + 0.01; x += bx / 3) add([x, 0, dimZ - 0.22], [x, 0, dimZ + 0.22], 1);
  const dimX = bx + 0.75;
  add([dimX, 0, -bz], [dimX, 0, bz], 1);
  for (let z = -bz; z <= bz + 0.01; z += bz / 2) add([dimX - 0.22, 0, z], [dimX + 0.22, 0, z], 1);

  /* ---- 2. foundation / floor grid ---- */
  for (let x = -W; x <= W + 0.01; x += 1) add([x, 0, -D], [x, 0, D], 2);
  for (let z = -D; z <= D + 0.01; z += 1) add([-W, 0, z], [W, 0, z], 2);
  // footing offset
  add([-W - 0.25, 0, -D - 0.25], [W + 0.25, 0, -D - 0.25], 2);
  add([W + 0.25, 0, -D - 0.25], [W + 0.25, 0, D + 0.25], 2);
  add([W + 0.25, 0, D + 0.25], [-W - 0.25, 0, D + 0.25], 2);
  add([-W - 0.25, 0, D + 0.25], [-W - 0.25, 0, -D - 0.25], 2);

  /* ---- 3. vertical framing studs (extrude upward) ---- */
  for (let x = -W; x <= W + 0.01; x += 0.75) {
    add([x, 0, -D], [x, H, -D], 3);
    add([x, 0, D], [x, H, D], 3);
  }
  for (let z = -D + 0.5; z <= D - 0.5 + 0.01; z += 0.5) {
    add([-W, 0, z], [-W, H, z], 3);
    add([W, 0, z], [W, H, z], 3);
  }

  /* ---- 4. top plates + stud mesh noggins ---- */
  for (const y of [H, H - 0.14]) {
    add([-W, y, -D], [W, y, -D], 4);
    add([W, y, -D], [W, y, D], 4);
    add([W, y, D], [-W, y, D], 4);
    add([-W, y, D], [-W, y, -D], 4);
  }
  for (const y of [H / 2]) {
    add([-W, y, -D], [W, y, -D], 4);
    add([W, y, -D], [W, y, D], 4);
    add([W, y, D], [-W, y, D], 4);
    add([-W, y, D], [-W, y, -D], 4);
  }
  // diagonal let-in bracing
  add([-W, 0, D], [-W + 1.5, H, D], 4);
  add([W, 0, D], [W - 1.5, H, D], 4);
  add([-W, 0, -D], [-W + 1.5, H, -D], 4);
  add([W, 0, -D], [W - 1.5, H, -D], 4);

  /* ---- 5. main gable + cross gable + rafters ---- */
  // ridge
  add([-W, RIDGE, 0], [W, RIDGE, 0], 5);
  // eave to ridge slopes at both ends (gable triangles)
  for (const x of [-W, W]) {
    add([x, H, -D], [x, RIDGE, 0], 5);
    add([x, H, D], [x, RIDGE, 0], 5);
    add([x, H, -D], [x, H, D], 5);
    // gable-end collar tie + king post
    add([x, RIDGE, 0], [x, H + 0.05, 0], 5);
    add([x, (H + RIDGE) / 2, -D / 2], [x, (H + RIDGE) / 2, D / 2], 5);
  }
  // rafters every 0.75 along x
  for (let x = -W; x <= W + 0.01; x += 0.75) {
    add([x, H, -D], [x, RIDGE, 0], 5);
    add([x, H, D], [x, RIDGE, 0], 5);
  }
  // roof plane purlins
  for (let t = 0.25; t < 1; t += 0.25) {
    const y = H + (RIDGE - H) * t;
    const z = D * (1 - t);
    add([-W, y, -z], [W, y, -z], 5);
    add([-W, y, z], [W, y, z], 5);
  }
  // cross gable / dormer running in +Z, ridge along z
  const cx0 = 0.5;
  const cx1 = 2.4;
  const cxm = (cx0 + cx1) / 2;
  const cRidge = 3.7;
  const cz = D + 1.15;
  add([cxm, cRidge, 0.2], [cxm, cRidge, cz], 5);
  for (const z of [0.2, cz]) {
    add([cx0, H, z], [cxm, cRidge, z], 5);
    add([cx1, H, z], [cxm, cRidge, z], 5);
    add([cx0, H, z], [cx1, H, z], 5);
  }
  for (let z = 0.2; z <= cz + 0.01; z += 0.55) {
    add([cx0, H, z], [cxm, cRidge, z], 5);
    add([cx1, H, z], [cxm, cRidge, z], 5);
  }
  add([cx0, H, 0.2], [cx0, H, cz], 5);
  add([cx1, H, 0.2], [cx1, H, cz], 5);
  add([cx0, 0, cz], [cx0, H, cz], 5);
  add([cx1, 0, cz], [cx1, H, cz], 5);
  add([cx0, 0, cz], [cx1, 0, cz], 5);
  add([cxm, cRidge, cz], [cxm, H + 0.05, cz], 5);

  /* ---- 6. porch, chimney, windows ---- */
  // porch deck
  const px0 = -W;
  const px1 = -0.1;
  const pz = D + 1.3;
  const pY = 0.32;
  add([px0, pY, D], [px1, pY, D], 6);
  add([px0, pY, pz], [px1, pY, pz], 6);
  add([px0, pY, D], [px0, pY, pz], 6);
  add([px1, pY, D], [px1, pY, pz], 6);
  for (let x = px0; x <= px1 + 0.01; x += 0.6) add([x, pY, D], [x, pY, pz], 6);
  for (let x = px0; x <= px1 + 0.01; x += 0.6) add([x, 0, D + 0.05], [x, pY, D + 0.05], 6);
  // porch posts + railing
  for (const x of [px0, px0 + 0.95, px0 + 1.9, px1]) {
    add([x, pY, pz], [x, H, pz], 6);
    add([x, pY, pz - 0.02], [x, pY + 1.05, pz - 0.02], 6);
  }
  for (const y of [pY + 0.5, pY + 1.05]) add([px0, y, pz], [px1, y, pz], 6);
  for (let x = px0 + 0.15; x <= px1 - 0.1; x += 0.28) add([x, pY, pz], [x, pY + 1.05, pz], 6);
  add([px0, H, pz], [px1, H, pz], 6);
  add([px0, H, pz], [px0, H, D], 6);
  add([px1, H, pz], [px1, H, D], 6);
  add([px0, H + 0.55, (D + pz) / 2], [px1, H + 0.55, (D + pz) / 2], 6);
  add([px0, H, pz], [px0, H + 0.55, (D + pz) / 2], 6);
  add([px1, H, pz], [px1, H + 0.55, (D + pz) / 2], 6);
  // steps
  for (let i = 0; i < 3; i++) {
    const y = pY - (i + 1) * 0.11;
    const z = pz + (i + 1) * 0.22;
    add([px0 + 0.6, y, z], [px0 + 1.9, y, z], 6);
    add([px0 + 0.6, y, z], [px0 + 0.6, y + 0.11, z - 0.22], 6);
    add([px0 + 1.9, y, z], [px0 + 1.9, y + 0.11, z - 0.22], 6);
    add([px0 + 0.6, y, z], [px0 + 1.9, y, z], 6);
  }
  // door
  add([-1.35, 0.32, pz - 1.3], [-1.35, 2.2, pz - 1.3], 6);
  add([-0.6, 0.32, pz - 1.3], [-0.6, 2.2, pz - 1.3], 6);
  add([-1.35, 2.2, pz - 1.3], [-0.6, 2.2, pz - 1.3], 6);
  add([-1.35, 1.75, pz - 1.3], [-0.6, 1.75, pz - 1.3], 6);
  // chimney
  const chx = -2.1;
  const chz = -0.75;
  const cw = 0.42;
  const ch = 5.15;
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    add([chx + dx * cw, 1.6, chz + dz * cw], [chx + dx * cw, ch, chz + dz * cw], 6);
  }
  for (const y of [ch, ch - 0.3, 1.6]) {
    add([chx - cw, y, chz - cw], [chx + cw, y, chz - cw], 6);
    add([chx + cw, y, chz - cw], [chx + cw, y, chz + cw], 6);
    add([chx + cw, y, chz + cw], [chx - cw, y, chz + cw], 6);
    add([chx - cw, y, chz + cw], [chx - cw, y, chz - cw], 6);
  }

  // multi-pane windows: plane "front" (z = D), "right" (x = W), "back" (z = -D)
  const win = (
    face: "front" | "right" | "back",
    u: number,
    y0: number,
    w: number,
    h: number,
    cols: number,
    rows: number,
  ) => {
    const at = (uu: number, yy: number): V3 =>
      face === "right" ? [W, yy, uu] : [uu, yy, face === "front" ? D : -D];
    // frame + sill
    add(at(u, y0), at(u + w, y0), 6);
    add(at(u + w, y0), at(u + w, y0 + h), 6);
    add(at(u + w, y0 + h), at(u, y0 + h), 6);
    add(at(u, y0 + h), at(u, y0), 6);
    add(at(u - 0.08, y0 - 0.08), at(u + w + 0.08, y0 - 0.08), 6);
    // mullions
    for (let c = 1; c < cols; c++) {
      const uu = u + (w * c) / cols;
      add(at(uu, y0), at(uu, y0 + h), 6);
    }
    for (let r = 1; r < rows; r++) {
      const yy = y0 + (h * r) / rows;
      add(at(u, yy), at(u + w, yy), 6);
    }
  };
  win("front", 0.9, 1.0, 1.1, 1.25, 3, 2);
  win("front", 2.35, 1.0, 0.5, 1.25, 2, 2);
  win("right", -1.5, 1.0, 1.0, 1.25, 2, 3);
  win("right", 0.25, 1.0, 1.0, 1.25, 2, 3);
  win("back", -2.2, 1.05, 0.9, 1.1, 2, 2);
  win("back", -0.4, 1.05, 0.9, 1.1, 2, 2);
  // gable vent (small diamond)
  add([W, 3.2, -0.35], [W, 3.6, 0], 6);
  add([W, 3.6, 0], [W, 3.2, 0.35], 6);
  add([W, 3.2, 0.35], [W, 2.95, 0], 6);
  add([W, 2.95, 0], [W, 3.2, -0.35], 6);

  return L;
}

/* --------------------------- BUILD SEQUENCE TIMING ------------------------ */

const STAGE_SPAN = 0.85; // stagger window per stage
const DRAW = 0.5; // per-line draw time
const GAP = 0.18;
const STAGES = 6;
const STAGE_LEN = STAGE_SPAN + DRAW + GAP;
export const BUILD_TIME = STAGES * STAGE_LEN;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function Wireframe({ onDone }: { onDone: () => void }) {
  const segs = useMemo(build, []);
  const group = useRef<THREE.Group>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const { geometry, delays } = useMemo(() => {
    const counts: Record<number, number> = {};
    const idx = segs.map((s) => {
      counts[s.s] = (counts[s.s] ?? 0) + 1;
      return counts[s.s] - 1;
    });
    const delays = segs.map((s, i) => {
      const total = counts[s.s];
      return (s.s - 1) * STAGE_LEN + (idx[i] / Math.max(1, total - 1)) * STAGE_SPAN;
    });
    const pos = new Float32Array(segs.length * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, delays };
  }, [segs]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, dt) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    if (!done.current) {
      const arr = geometry.getAttribute("position").array as Float32Array;
      for (let i = 0; i < segs.length; i++) {
        const { a, b } = segs[i];
        const p = Math.min(1, Math.max(0, (t - delays[i]) / DRAW));
        const e = easeOut(p);
        arr[i * 6 + 0] = a[0];
        arr[i * 6 + 1] = a[1];
        arr[i * 6 + 2] = a[2];
        arr[i * 6 + 3] = a[0] + (b[0] - a[0]) * e;
        arr[i * 6 + 4] = a[1] + (b[1] - a[1]) * e;
        arr[i * 6 + 5] = a[2] + (b[2] - a[2]) * e;
      }
      geometry.getAttribute("position").needsUpdate = true;
      geometry.computeBoundingSphere();
      if (t > BUILD_TIME) {
        done.current = true;
        onDone();
      }
    }

    if (group.current) {
      const spin = (Math.PI * 2) / 52; // one turn ≈ 52s
      const ramp = Math.min(1, Math.max(0, (t - BUILD_TIME * 0.72) / 2));
      group.current.rotation.y += dt * spin * ramp;
      // additive mouse tilt (few degrees max)
      const tx = -pointer.current.y * 0.06;
      const tz = pointer.current.x * 0.05;
      group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, dt * 2.5);
      group.current.rotation.z += (tz - group.current.rotation.z) * Math.min(1, dt * 2.5);
    }
  });

  const scale = size.width < 640 ? 0.78 : size.width < 1024 ? 0.9 : 1;

  return (
    <group ref={group} position={[0, -1.4, 0]} scale={scale}>
      <lineSegments ref={lines} geometry={geometry}>
        <lineBasicMaterial
          color={CYAN}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {/* faint duplicate for depth-glow */}
      <lineSegments geometry={geometry} scale={1.004}>
        <lineBasicMaterial
          color={BLUE}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <DimensionLabels />
    </group>
  );
}

/* --------------------------- BLUEPRINT DIMENSIONS ------------------------- */

function labelTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = CYAN;
  ctx.font = "600 34px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const LABELS: { text: string; pos: V3 }[] = [
  { text: "82'-0\"", pos: [0, 0.05, 5.95] },
  { text: "27'-4\"", pos: [-4.1, 0.05, 5.35] },
  { text: "61'-6\"", pos: [7.35, 0.05, 0] },
  { text: "18'-0\"", pos: [6.9, 0.05, -3.4] },
  { text: "SETBACK 10'", pos: [-6.5, 0.05, -3.2] },
];

function DimensionLabels() {
  const ref = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const textures = useMemo(() => LABELS.map((l) => labelTexture(l.text)), []);
  useFrame((state) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - t0.current;
    const o = Math.min(1, Math.max(0, (t - STAGE_LEN * 0.5) / 1.2));
    ref.current?.children.forEach((child) => {
      const m = (child as THREE.Sprite).material as THREE.SpriteMaterial;
      m.opacity = o * 0.85;
    });
  });
  return (
    <group ref={ref}>
      {LABELS.map((l, i) => (
        <sprite key={l.text} position={l.pos} scale={[1.9, 0.48, 1]}>
          <spriteMaterial
            map={textures[i]}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/* --------------------------------- SCENE --------------------------------- */

function HouseScene({ onDone }: { onDone: () => void }) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      camera={{ position: [11, 8.5, 12], zoom: 52, near: -100, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0.6, 0)}
      style={{ width: "100%", height: "100%" }}
    >
      <Wireframe onDone={onDone} />
    </Canvas>
  );
}

/* ---------------------------------- NAV ---------------------------------- */

const NAV = [
  { to: "/product", label: "Product" },
  { to: "/join", label: "For Contractors" },
  { to: "/pricing", label: "Pricing" },
] as const;

function HeroNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,26,48,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(126,195,236,0.16)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center">
          <img src={wordmark.url} alt="Cleard" className="h-6 w-auto" />
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13.5px] no-underline transition-colors"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/join"
          hash="request"
          className="inline-flex items-center px-4 py-2 text-[13px] font-semibold no-underline"
          style={{
            background: `linear-gradient(135deg, ${BLUE}, #2f8ef0)`,
            color: "#fff",
            boxShadow: `0 0 24px rgba(30,111,217,0.45)`,
          }}
        >
          Get Early Access
        </Link>
      </div>
    </header>
  );
}

/* --------------------------------- HERO ---------------------------------- */

export function ClearedHero() {
  const [built, setBuilt] = useState(false);
  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ background: NAVY, color: "#fff", fontFamily: SANS }}
    >
      <HeroNav />

      {/* blueprint grid: fine + coarse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(126,195,236,0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(126,195,236,0.055) 1px, transparent 1px),
            linear-gradient(to right, rgba(126,195,236,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(126,195,236,0.10) 1px, transparent 1px)`,
          backgroundSize: "44px 44px, 44px 44px, 230px 230px, 230px 230px",
        }}
      />
      {/* radial glow behind the model */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 52% at 33% 50%, rgba(30,111,217,0.42) 0%, rgba(30,111,217,0.12) 45%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: `linear-gradient(to bottom, transparent, ${NAVY})` }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-5 pb-16 pt-28 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-32">
        {/* 3D model */}
        <div
          className="relative order-1 h-[340px] sm:h-[420px] lg:h-[600px]"
          style={{ filter: "drop-shadow(0 0 18px rgba(126,195,236,0.45))" }}
        >
          <HouseScene onDone={() => setBuilt(true)} />
        </div>

        {/* copy panel */}
        <div
          className="order-2 text-center lg:text-left"
          style={{
            opacity: built ? 1 : 0,
            transform: built ? "none" : "translateY(22px)",
            transition: "opacity 900ms ease, transform 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <img
            src={wordmark.url}
            alt="Cleard"
            className="mx-auto h-10 w-auto lg:mx-0 lg:h-12"
            style={{ transitionDelay: "80ms" }}
          />
          <p
            className="mt-6 text-[13px] font-semibold uppercase sm:text-[15px]"
            style={{ color: CYAN, letterSpacing: "0.26em" }}
          >
            Run projects. Not paperwork.
          </p>
          <p
            className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed lg:mx-0"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            Permitting, private plan review, inspections, licensing, insurance, and lien rights — one
            platform, every jurisdiction along the coast.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              to="/join"
              hash="request"
              className="inline-flex items-center px-6 py-3 text-[14px] font-semibold no-underline"
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #3b9bf5)`,
                color: "#fff",
                boxShadow: "0 0 34px rgba(30,111,217,0.5)",
              }}
            >
              Get Early Access
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 text-[14px] font-semibold no-underline"
              style={{ border: `1px solid rgba(126,195,236,0.45)`, color: "#fff" }}
            >
              See A Live Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClearedHero;
