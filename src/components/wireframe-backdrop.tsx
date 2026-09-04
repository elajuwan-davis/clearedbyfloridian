import { useEffect, useRef } from "react";

/**
 * Code-drawn wireframe city backdrop.
 * Black ground, white structural lines, sparse copper accents. Volumes draw
 * themselves in floor-by-floor while the camera drifts forward, forever.
 * No video, no dependencies — plain canvas 2D with a hand-rolled projection.
 */

const COPPER = "#9C6B3F";

type Box = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  floors: number;
  t0: number;
  build: number;
  copper: boolean;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPTH = 220; // world depth of the recycled band
const NEAR = 6;
const SPEED = 9.5; // world units / second

export function WireframeBackdrop({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const rand = mulberry32(20260904);
    const boxes: Box[] = [];
    for (let i = 0; i < 96; i += 1) {
      const side = rand() < 0.5 ? -1 : 1;
      const w = 8 + rand() * 10;
      const d = 9 + rand() * 12;
      const h = 26 + rand() * 74;
      boxes.push({
        x: side * (9 + rand() * 46),
        z: rand() * DEPTH,
        w,
        d,
        h,
        floors: Math.max(3, Math.round(h / 4)),
        t0: rand() * 3,
        build: 1.1 + rand() * 1.6,
        copper: rand() < 0.18,
      });
    }

    let dpr = 1;
    let vw = 0;
    let vh = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = canvas.clientWidth;
      vh = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(vw * dpr));
      canvas.height = Math.max(1, Math.floor(vh * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let start = performance.now();
    let last = start;

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const camZ = reduce ? 0 : t * SPEED;

      const focal = Math.max(vw, 900) * 0.9;
      const cx = vw * 0.52;
      const cy = vh * 0.58;
      const eye = 16;

      ctx.clearRect(0, 0, vw, vh);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, vw, vh);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const project = (x: number, y: number, z: number) => {
        const zr = z - camZ;
        if (zr < NEAR) return null;
        const s = focal / zr;
        return { sx: cx + x * s, sy: cy - (y - eye) * s, zr };
      };

      const seg = (
        a: { x: number; y: number; z: number },
        b: { x: number; y: number; z: number },
        alpha: number,
        copper: boolean,
        width: number,
      ) => {
        const pa = project(a.x, a.y, a.z);
        const pb = project(b.x, b.y, b.z);
        if (!pa || !pb) return;
        ctx.strokeStyle = copper
          ? `rgba(156,107,63,${Math.min(1, alpha * 1.35).toFixed(3)})`
          : `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.stroke();
      };

      // ground grid — lateral rungs + two long rails
      const gridStep = 10;
      const firstZ = Math.ceil((camZ + NEAR) / gridStep) * gridStep;
      for (let z = firstZ; z < camZ + DEPTH * 0.75; z += gridStep) {
        const fade = 1 - (z - camZ) / (DEPTH * 0.75);
        const a = Math.max(0, fade * 0.45);
        seg({ x: -120, y: 0, z }, { x: 120, y: 0, z }, a, false, 1);
      }
      for (const railX of [-120, -60, 0, 60, 120]) {
        const pa = project(railX, 0, camZ + NEAR + 0.5);
        const pb = project(railX, 0, camZ + DEPTH * 0.75);
        if (pa && pb) {
          const g = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
          g.addColorStop(0, "rgba(255,255,255,0.38)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.sx, pa.sy);
          ctx.lineTo(pb.sx, pb.sy);
          ctx.stroke();
        }
      }

      for (const b of boxes) {
        // recycle behind the camera and let it rebuild
        if (b.z - camZ < NEAR) {
          b.z += DEPTH;
          b.t0 = t + rand() * 0.5;
          b.h = 26 + rand() * 74;
          b.floors = Math.max(3, Math.round(b.h / 4));
          b.x = (rand() < 0.5 ? -1 : 1) * (11 + rand() * 42);
          b.copper = rand() < 0.18;
        }

        const dist = b.z - camZ;
        const depthFade = Math.max(0, Math.min(1, 1 - (dist - NEAR) / (DEPTH * 0.72)));
        if (depthFade <= 0.01) continue;
        const p = reduce ? 1 : Math.max(0, Math.min(1, (t - b.t0) / b.build));
        if (p <= 0) continue;
        const eased = 1 - Math.pow(1 - p, 2);
        const hh = b.h * eased;
        const base = Math.min(1, 1.15 * depthFade * (0.55 + 0.45 * p));
        const lw = Math.max(0.75, 1.5 * depthFade);

        const x0 = b.x - b.w / 2;
        const x1 = b.x + b.w / 2;
        const z0 = b.z;
        const z1 = b.z + b.d;
        const corners: Array<[number, number]> = [
          [x0, z0],
          [x1, z0],
          [x1, z1],
          [x0, z1],
        ];

        // verticals
        for (const [x, z] of corners) {
          seg({ x, y: 0, z }, { x, y: hh, z }, base, b.copper, lw);
        }
        // floor rings
        const rings = Math.max(1, Math.round(b.floors * eased));
        for (let f = 0; f <= rings; f += 1) {
          const y = Math.min(hh, (b.h / b.floors) * f);
          const a = f === rings ? Math.min(1, base * 1.3) : base * 0.86;
          for (let i = 0; i < 4; i += 1) {
            const [ax, az] = corners[i];
            const [bx, bz] = corners[(i + 1) % 4];
            seg({ x: ax, y, z: az }, { x: bx, y, z: bz }, a, b.copper, lw * 0.9);
          }
        }
        // facade mullions on all four faces — reads as a building, not a block
        const studs = 4;
        for (let s = 1; s <= studs; s += 1) {
          const fx = x0 + ((x1 - x0) * s) / (studs + 1);
          seg({ x: fx, y: 0, z: z0 }, { x: fx, y: hh, z: z0 }, base * 0.62, false, lw * 0.7);
          seg({ x: fx, y: 0, z: z1 }, { x: fx, y: hh, z: z1 }, base * 0.4, false, lw * 0.6);
          const fz = z0 + ((z1 - z0) * s) / (studs + 1);
          seg({ x: x0, y: 0, z: fz }, { x: x0, y: hh, z: fz }, base * 0.5, false, lw * 0.7);
          seg({ x: x1, y: 0, z: fz }, { x: x1, y: hh, z: fz }, base * 0.5, false, lw * 0.7);
        }
        // roof crown + core shaft
        if (eased > 0.98) {
          seg({ x: x0, y: hh, z: z0 }, { x: x1, y: hh, z: z1 }, base * 0.45, b.copper, lw * 0.7);
          seg({ x: x1, y: hh, z: z0 }, { x: x0, y: hh, z: z1 }, base * 0.45, b.copper, lw * 0.7);
          seg({ x: b.x, y: hh, z: b.z + b.d / 2 }, { x: b.x, y: hh + 4, z: b.z + b.d / 2 }, base * 0.8, true, lw * 0.8);
        }
      }

      void dt;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame((n) => {
      start = n;
      last = n;
      render(n);
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", background: "#000000", ...style }}
    />
  );
}
