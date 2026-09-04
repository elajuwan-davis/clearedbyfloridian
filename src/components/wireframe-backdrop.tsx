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
const SPEED = 5.2; // world units / second

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
    for (let i = 0; i < 78; i += 1) {
      const side = rand() < 0.5 ? -1 : 1;
      const w = 6 + rand() * 12;
      const d = 6 + rand() * 14;
      const h = 8 + rand() * 46;
      boxes.push({
        x: side * (9 + rand() * 46),
        z: rand() * DEPTH,
        w,
        d,
        h,
        floors: Math.max(1, Math.round(h / 5)),
        t0: rand() * 6,
        build: 2.2 + rand() * 3.4,
        copper: rand() < 0.14,
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
        const a = Math.max(0, fade * 0.3);
        seg({ x: -120, y: 0, z }, { x: 120, y: 0, z }, a, false, 1);
      }
      for (const railX of [-120, -60, 0, 60, 120]) {
        const pa = project(railX, 0, camZ + NEAR + 0.5);
        const pb = project(railX, 0, camZ + DEPTH * 0.75);
        if (pa && pb) {
          const g = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
          g.addColorStop(0, "rgba(255,255,255,0.22)");
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
          b.t0 = t + rand() * 1.2;
          b.h = 8 + rand() * 46;
          b.floors = Math.max(1, Math.round(b.h / 5));
          b.x = (rand() < 0.5 ? -1 : 1) * (9 + rand() * 46);
          b.copper = rand() < 0.14;
        }

        const dist = b.z - camZ;
        const depthFade = Math.max(0, Math.min(1, 1 - (dist - NEAR) / (DEPTH * 0.72)));
        if (depthFade <= 0.01) continue;
        const p = reduce ? 1 : Math.max(0, Math.min(1, (t - b.t0) / b.build));
        if (p <= 0) continue;
        const eased = 1 - Math.pow(1 - p, 2);
        const hh = b.h * eased;
        const base = 0.78 * depthFade * (0.45 + 0.55 * p);
        const lw = Math.max(0.6, 1.15 * depthFade);

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
          const a = f === rings ? base * 1.25 : base * 0.72;
          for (let i = 0; i < 4; i += 1) {
            const [ax, az] = corners[i];
            const [bx, bz] = corners[(i + 1) % 4];
            seg({ x: ax, y, z: az }, { x: bx, y, z: bz }, a, b.copper, lw * 0.9);
          }
        }
        // interior mullions — a couple of vertical studs per face
        const studs = 2;
        for (let s = 1; s <= studs; s += 1) {
          const fx = x0 + ((x1 - x0) * s) / (studs + 1);
          seg({ x: fx, y: 0, z: z0 }, { x: fx, y: hh, z: z0 }, base * 0.5, false, lw * 0.7);
          const fz = z0 + ((z1 - z0) * s) / (studs + 1);
          seg({ x: x0, y: 0, z: fz }, { x: x0, y: hh, z: fz }, base * 0.35, false, lw * 0.7);
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
