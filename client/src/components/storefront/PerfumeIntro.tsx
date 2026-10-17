"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import "./PerfumeIntro.css";

/*
 * Splash intro for the home page, from the Canva "Bethel" scene design.
 * A realistic glass bottle sprays a canvas-driven mist: a bright jet
 * plus fine droplets, large droplets and soft cloud puffs, each with
 * drag, gravity and wobble. The sequence plays itself once per
 * session — entrance choreography, automatic spray, then the overlay
 * fades to reveal the page. The real page stays in the initial HTML
 * underneath (SEO and no-JS users are unaffected) and there are no
 * dependencies. `?intro` in the URL forces the splash on.
 */

type Phase = "entering" | "playing" | "leaving";

const SESSION_KEY = "bethel-intro-done";
const ENTER_TO_SPRAY_MS = 1100;
const PLAY_DURATION_MS = 6700;
const FADE_MS = 900;

const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

let shownThisSession = false;

function hasSeenIntro() {
  if (shownThisSession) return true;

  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  shownThisSession = true;

  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode — the module flag covers this page load */
  }
}

/* ---- Canvas spray engine ------------------------------------------------
   Ported from the Canva scene. Three particle kinds share one loop:
   "fine" droplets spray fast and fall, "large" droplets catch the
   light, "cloud" puffs expand and drift. A gradient jet leaves the
   nozzle for the first ~2.7s. Emission tapers over time. */

type ParticleKind = "cloud" | "large" | "fine";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  age: number;
  life: number;
  drag: number;
  depth: number;
  phase: number;
  wobble: number;
  kind: ParticleKind;
  warm: boolean;
}

interface SprayController {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

function createSprayController(
  canvas: HTMLCanvasElement,
  nozzle: SVGElement,
  scene: HTMLElement
): SprayController {
  const maybeCtx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!maybeCtx) {
    return { start: () => {}, stop: () => {}, destroy: () => {} };
  }

  /* Hoisted function declarations don't keep the null narrowing, so
     bind the context to an explicitly non-null constant. */
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const randless = (phase: number) => 1.25 + 0.25 * Math.sin(phase);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles: Particle[] = [];
  let raf = 0;
  let pumpTimer = 0;
  let active = false;
  let startTime = 0;
  let previousTime = 0;
  let emitCarry = 0;

  function resize() {
    const bounds = scene.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

    if (
      canvas.width === Math.round(bounds.width * nextDpr) &&
      canvas.height === Math.round(bounds.height * nextDpr)
    ) {
      return;
    }

    width = bounds.width;
    height = bounds.height;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nozzlePoint() {
    const tip = nozzle.getBoundingClientRect();
    const bounds = canvas.getBoundingClientRect();

    return {
      x: tip.right - bounds.left,
      y: tip.top + tip.height / 2 - bounds.top,
    };
  }

  function addParticle(origin: { x: number; y: number }, kind: ParticleKind) {
    const cloud = kind === "cloud";
    const large = kind === "large";
    const speed = cloud ? rand(48, 130) : large ? rand(125, 245) : rand(165, 390);
    const angle = cloud ? rand(-0.34, 0.34) : large ? rand(-0.28, 0.32) : rand(-0.18, 0.18);

    particles.push({
      x: origin.x + rand(0, 3),
      y: origin.y + rand(-1.5, 1.5),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: cloud ? rand(9, 23) : large ? rand(2, 4.5) : rand(0.45, 1.65),
      alpha: cloud ? rand(0.07, 0.15) : large ? rand(0.43, 0.78) : rand(0.42, 0.88),
      age: 0,
      life: cloud ? rand(1.2, 2.5) : large ? rand(0.7, 1.55) : rand(0.55, 1.45),
      drag: cloud ? rand(0.45, 0.8) : rand(0.7, 0.91),
      depth: rand(0.7, 1.35),
      phase: rand(0, 7),
      wobble: rand(4, 21),
      kind,
      warm: Math.random() < 0.18,
    });
  }

  function emit(origin: { x: number; y: number }, dt: number, t: number) {
    const strength = t < 0.4 ? 1 : t < 1.5 ? 0.83 : t < 2.25 ? 0.52 : 0.24;

    emitCarry += dt * 230 * strength;

    const count = Math.min(90, Math.floor(emitCarry));
    emitCarry -= count;

    for (let i = 0; i < count; i++) {
      const choice = Math.random();
      addParticle(origin, choice < 0.23 ? "cloud" : choice < 0.27 ? "large" : "fine");
    }

    if (particles.length > 1250) {
      particles.splice(0, particles.length - 1250);
    }
  }

  function jet(point: { x: number; y: number }, t: number) {
    if (t > 2.7) return;

    const opacity = t < 2.25 ? 1 : Math.max(0, (2.7 - t) / 0.45);
    const length = Math.min(83, 35 + t * 115);
    const end = Math.min(width + 20, point.x + length);

    ctx.save();
    ctx.lineCap = "round";

    const glow = ctx.createLinearGradient(point.x, point.y, end, point.y);
    glow.addColorStop(0, `rgba(255,249,234,${0.96 * opacity})`);
    glow.addColorStop(0.3, `rgba(218,242,255,${0.7 * opacity})`);
    glow.addColorStop(1, "rgba(158,210,245,0)");
    ctx.strokeStyle = glow;

    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.quadraticCurveTo(point.x + length * 0.55, point.y - 1, end, point.y + 2);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(Math.min(end, point.x + 59), point.y);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = `rgba(255,255,250,${opacity})`;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(Math.min(end, point.x + 39), point.y);
    ctx.stroke();

    ctx.restore();
  }

  function draw(p: Particle) {
    const progress = Math.min(1, p.age / p.life);
    const alpha = p.alpha * Math.pow(1 - progress, 1.2) * Math.min(1, 0.45 + p.age * 12);

    if (alpha < 0.003) return;

    if (p.kind === "cloud") {
      const radius = p.r * p.depth * (1 + progress * 1.6);
      const color = p.warm ? "255,237,220" : "190,228,249";
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 1.8);

      gradient.addColorStop(0, `rgba(${color},${alpha})`);
      gradient.addColorStop(0.37, `rgba(${color},${alpha * 0.52})`);
      gradient.addColorStop(1, `rgba(${color},0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radius * 1.8, radius * randless(p.phase), p.phase * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(${p.warm ? "255,238,219" : "218,245,255"},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.depth, 0, Math.PI * 2);
      ctx.fill();

      if (p.kind === "large") {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.25, Math.max(0.5, p.r * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function frame(now: number) {
    if (!active) return;

    const dt = Math.min(Math.max((now - previousTime) / 1000, 0), 0.05);
    previousTime = now;
    const t = (now - startTime) / 1000;
    const origin = nozzlePoint();

    ctx.clearRect(0, 0, width, height);

    if (!reduced.matches && t < 2.65) emit(origin, dt, t);

    particles = particles.filter(
      (p) =>
        p.age < p.life && p.x < width + 100 && p.y > -100 && p.y < height + 100
    );

    for (const p of particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(p.age * 11 + p.phase) * p.wobble * dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy += (p.kind === "cloud" ? -12 : 19) * dt;
    }

    for (const p of particles) if (p.kind === "cloud") draw(p);

    jet(origin, reduced.matches ? Math.min(t, 0.35) : t);

    for (const p of particles) if (p.kind !== "cloud") draw(p);

    if (t < (reduced.matches ? 0.65 : 5.5) && (t < 2.7 || particles.length)) {
      raf = requestAnimationFrame(frame);
    } else {
      active = false;
      raf = 0;
      particles = [];
      ctx.clearRect(0, 0, width, height);
    }
  }

  function stop() {
    active = false;
    cancelAnimationFrame(raf);
    raf = 0;
    window.clearTimeout(pumpTimer);
    pumpTimer = 0;
    particles = [];
    emitCarry = 0;
    ctx.clearRect(0, 0, width, height);
    scene.classList.remove("is-spraying");
  }

  function start() {
    stop();
    resize();
    startTime = performance.now();
    previousTime = startTime;
    active = true;

    scene.classList.add("is-spraying");
    window.clearTimeout(pumpTimer);
    pumpTimer = window.setTimeout(
      () => scene.classList.remove("is-spraying"),
      600
    );

    const origin = nozzlePoint();

    if (!reduced.matches) {
      for (let i = 0; i < 32; i++) {
        addParticle(origin, i % 5 === 0 ? "cloud" : "fine");
      }
    }

    jet(origin, 0);
    raf = requestAnimationFrame(frame);
  }

  function destroy() {
    stop();
    window.removeEventListener("resize", resize);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  return { start, stop, destroy };
}

/* ---- Bottle --------------------------------------------------------------
   The Canva artwork: a blush-rose glass bottle with thick bevels, a
   lit liquid surface, a cream label and a cylindrical rose-gold cap
   with a side atomizer. Gradient ids are prefixed to stay unique. */

function Bottle({ nozzleRef }: { nozzleRef: RefObject<SVGEllipseElement | null> }) {
  return (
    <svg
      className="perfume-intro__bottle"
      viewBox="0 0 360 495"
      role="img"
      aria-labelledby="perfume-intro-bottle-title"
    >
      <title id="perfume-intro-bottle-title">
        Bethel perfume in a blush-rose glass bottle with a rose-gold cap
        and side atomizer
      </title>

      <defs>
        <linearGradient id="pi-glass" x1="0" y1="0" x2="1" y2="0.12">
          <stop stopColor="#74414e" stopOpacity="0.85" />
          <stop offset="0.035" stopColor="#f7c9cb" stopOpacity="0.85" />
          <stop offset="0.085" stopColor="#b36d79" stopOpacity="0.68" />
          <stop offset="0.17" stopColor="#f9dce0" stopOpacity="0.48" />
          <stop offset="0.48" stopColor="#fff2ed" stopOpacity="0.32" />
          <stop offset="0.83" stopColor="#eeb4bb" stopOpacity="0.52" />
          <stop offset="0.95" stopColor="#98515f" stopOpacity="0.78" />
          <stop offset="0.985" stopColor="#fce4dc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#6d3c48" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="pi-liquid" x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#e9a5ae" stopOpacity="0.55" />
          <stop offset="0.43" stopColor="#d88494" stopOpacity="0.62" />
          <stop offset="0.84" stopColor="#c16e7d" stopOpacity="0.74" />
          <stop offset="1" stopColor="#914959" stopOpacity="0.86" />
        </linearGradient>
        <linearGradient id="pi-heel" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fce9e3" stopOpacity="0.46" />
          <stop offset="0.26" stopColor="#a85869" stopOpacity="0.8" />
          <stop offset="0.64" stopColor="#f9d3ce" stopOpacity="0.8" />
          <stop offset="0.88" stopColor="#874250" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fae6dd" />
        </linearGradient>
        <linearGradient id="pi-metal" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#75434a" />
          <stop offset="0.08" stopColor="#be817e" />
          <stop offset="0.22" stopColor="#f8d9c4" />
          <stop offset="0.38" stopColor="#b76e6d" />
          <stop offset="0.55" stopColor="#f1c5af" />
          <stop offset="0.76" stopColor="#a35e63" />
          <stop offset="0.91" stopColor="#e7ae9d" />
          <stop offset="1" stopColor="#79454e" />
        </linearGradient>
        <linearGradient id="pi-cap" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#75434b" />
          <stop offset="0.08" stopColor="#bd7778" />
          <stop offset="0.22" stopColor="#f6d3bc" />
          <stop offset="0.39" stopColor="#bd7775" />
          <stop offset="0.57" stopColor="#d99a8b" />
          <stop offset="0.8" stopColor="#a66168" />
          <stop offset="0.94" stopColor="#e6b5a2" />
          <stop offset="1" stopColor="#70414a" />
        </linearGradient>
        <linearGradient id="pi-cream" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#e9d9cf" stopOpacity="0.93" />
          <stop offset="0.3" stopColor="#fffaf2" stopOpacity="0.95" />
          <stop offset="0.75" stopColor="#fff5ec" stopOpacity="0.94" />
          <stop offset="1" stopColor="#e9d5c9" stopOpacity="0.92" />
        </linearGradient>
        <radialGradient id="pi-shadow">
          <stop stopColor="#8e5260" stopOpacity="0.47" />
          <stop offset="1" stopColor="#8e5260" stopOpacity="0" />
        </radialGradient>
        <filter id="pi-soft">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id="pi-chamber">
          <path d="M79 164Q79 156 88 156H272Q281 156 281 164V426Q281 435 271 436H89Q79 435 79 426Z" />
        </clipPath>
      </defs>

      {/* Floor shadows */}
      <ellipse cx="180" cy="457" rx="143" ry="21" fill="url(#pi-shadow)" filter="url(#pi-soft)" />
      <ellipse cx="180" cy="459" rx="108" ry="7" fill="#b4747d" opacity="0.14" />

      {/* Short neck sits behind the broad glass shoulders */}
      <path d="M151 128H209V164H151Z" fill="#b97b7b" stroke="#f6d0bf" strokeOpacity="0.75" />
      <path d="M153 131H207V159H153Z" fill="#f5c9c1" opacity="0.37" />
      <rect x="138" y="135" width="84" height="21" rx="4" fill="url(#pi-metal)" stroke="#8d5559" strokeWidth="1.2" />
      <path d="M142 139H218M142 151H218" stroke="#ffebd8" strokeOpacity="0.68" strokeWidth="1.2" />

      {/* Outer glass with a thick bevel and an inset chamber */}
      <rect x="64" y="150" width="232" height="301" rx="10" fill="url(#pi-glass)" stroke="#9c6470" strokeOpacity="0.85" strokeWidth="2.5" />
      <path
        d="M75 157Q75 153 83 153H277Q285 153 285 161V433Q285 442 275 443H85Q75 443 75 433Z"
        fill="none"
        stroke="#fff0e7"
        strokeOpacity="0.66"
        strokeWidth="5"
      />
      <path
        d="M84 162Q84 159 91 159H269Q276 159 276 166V424Q276 431 269 431H91Q84 431 84 424Z"
        fill="#fae0dc"
        fillOpacity="0.24"
        stroke="#a25b6b"
        strokeOpacity="0.59"
        strokeWidth="3"
      />

      <g clipPath="url(#pi-chamber)">
        <path d="M79 164H281V436H79Z" fill="#ffe7e2" opacity="0.2" />
        <path d="M79 255Q127 251 180 254Q233 257 281 252V437H79Z" fill="url(#pi-liquid)" />
        <path d="M80 255Q128 251 180 254Q231 257 280 252" fill="none" stroke="#fff4e9" strokeOpacity="0.83" strokeWidth="2.3" />
        <path d="M82 259Q130 255 180 258Q230 260 278 256" fill="none" stroke="#9e5867" strokeOpacity="0.47" strokeWidth="2.3" />
        <path d="M91 170Q128 177 155 168" fill="none" stroke="#fff9ed" strokeOpacity="0.58" strokeWidth="7" filter="url(#pi-soft)" />
        <path d="M194 173Q237 166 269 178" fill="none" stroke="#fef0e6" strokeOpacity="0.32" strokeWidth="5" filter="url(#pi-soft)" />
        <path d="M103 181Q110 177 114 182V310Q111 322 105 309Z" fill="#fffaf0" opacity="0.19" filter="url(#pi-soft)" />
        <path d="M250 191Q256 184 260 193V355Q256 364 251 355Z" fill="#fff6ec" opacity="0.14" />
        <path d="M174 163V252" stroke="#a35c69" strokeOpacity="0.23" strokeWidth="3" />
        <path d="M182 165V250" stroke="#fff8ea" strokeOpacity="0.37" strokeWidth="2" />
        <path d="M79 410Q180 422 281 410V451H79Z" fill="url(#pi-heel)" opacity="0.88" />
        <path d="M86 421Q180 432 274 421" fill="none" stroke="#ffebe0" strokeOpacity="0.55" strokeWidth="8" filter="url(#pi-soft)" />
      </g>

      <path d="M73 170V422Q73 435 83 439M287 170V422Q287 435 277 439" fill="none" stroke="#fff4e9" strokeOpacity="0.58" strokeWidth="4" />
      <path d="M82 167V423M278 167V423" fill="none" stroke="#8c4557" strokeOpacity="0.56" strokeWidth="5" />
      <path d="M91 161Q180 158 269 161M89 434Q180 441 271 434" fill="none" stroke="#fff9ed" strokeOpacity="0.64" strokeWidth="2.4" />
      <path d="M67 438Q180 448 293 438" fill="none" stroke="#81434f" strokeOpacity="0.57" strokeWidth="5" />
      <path d="M78 445Q180 451 282 445" fill="none" stroke="#fff1e8" strokeOpacity="0.78" strokeWidth="2.5" />

      {/* Quiet cream label */}
      <rect x="107" y="302" width="146" height="88" rx="2" fill="url(#pi-cream)" stroke="#fff8ed" strokeOpacity="0.74" strokeWidth="1" />
      <rect x="111" y="306" width="138" height="80" fill="none" stroke="#b88784" strokeOpacity="0.33" strokeWidth="0.8" />
      <text
        x="180"
        y="348"
        textAnchor="middle"
        fontSize="29"
        fill="#704750"
        letterSpacing="-1"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        Bethel
      </text>
      <text
        x="180"
        y="369"
        textAnchor="middle"
        fontSize="7.4"
        letterSpacing="2.1"
        fill="#8c6570"
        style={{ fontFamily: "var(--font-sans), Arial, sans-serif" }}
      >
        PERFUME &amp; MART
      </text>

      <path d="M68 177Q69 165 77 160M292 177Q291 165 283 160" fill="none" stroke="#fff8ef" strokeOpacity="0.67" strokeWidth="2.5" />

      {/* Cylindrical rose-gold cap */}
      <ellipse cx="180" cy="137" rx="39" ry="5" fill="#764550" opacity="0.31" />
      <rect x="143" y="42" width="74" height="96" rx="7" fill="url(#pi-cap)" stroke="#85525a" strokeWidth="1.4" />
      <ellipse cx="180" cy="43" rx="36.5" ry="5" fill="#e8b9a8" stroke="#ffe0ca" strokeOpacity="0.65" />
      <path d="M149 50V128" stroke="#fff1dc" strokeOpacity="0.58" strokeWidth="2.4" />
      <path d="M211 51V129" stroke="#77434f" strokeOpacity="0.47" strokeWidth="2" />
      <path d="M148 132Q180 135 212 132" fill="none" stroke="#fce1cf" strokeOpacity="0.72" strokeWidth="2" />

      {/* Side atomizer — the pump presses down while spraying */}
      <g id="perfume-intro-pump">
        <path d="M209 48H243Q250 48 253 54L250 63H210Z" fill="url(#pi-metal)" stroke="#8d565d" />
        <path d="M219 51H246" stroke="#fff1df" strokeOpacity="0.7" strokeWidth="1.6" />
        <ellipse cx="251" cy="57" rx="5.5" ry="6" fill="#a36769" stroke="#f6d6bf" strokeOpacity="0.8" />
        <ellipse ref={nozzleRef} cx="253" cy="57" rx="2.3" ry="2.7" fill="#71454d" />
        <circle cx="252.4" cy="56.1" r="0.65" fill="#fff1dc" opacity="0.83" />
      </g>
    </svg>
  );
}

/* ---- Component ------------------------------------------------------------ */

export default function PerfumeIntro() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("entering");

  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nozzleRef = useRef<SVGEllipseElement>(null);
  const sprayRef = useRef<SprayController | null>(null);

  /* Decide before the first paint: returning visitors and reduced-
     motion users never see the splash; first-timers get it with the
     background scroll locked while it is up. The session is only
     marked seen once the sequence finishes or is skipped. */
  useClientLayoutEffect(() => {
    if (!visible) return;

    const forced = new URLSearchParams(window.location.search).has("intro");
    const prefersReduced = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (!forced && (prefersReduced || hasSeenIntro())) {
      setVisible(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  /* Canvas engine lifecycle */
  useEffect(() => {
    const canvas = canvasRef.current;
    const nozzle = nozzleRef.current;
    const scene = sceneRef.current;

    if (!canvas || !nozzle || !scene) return;

    const controller = createSprayController(canvas, nozzle, scene);
    sprayRef.current = controller;

    return () => {
      controller.destroy();
      sprayRef.current = null;
    };
  }, []);

  const finish = useCallback(() => {
    markIntroSeen();
    setPhase("leaving");
  }, []);

  /* entering -> playing: swap the class only after the hidden state
     has painted, so the entrance transitions actually run. */
  useEffect(() => {
    if (!visible || phase !== "entering") return;

    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setPhase("playing"));
    });

    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [visible, phase]);

  /* The choreography: the bottle sprays by itself, then the overlay
     finishes and fades to reveal the page. */
  useEffect(() => {
    if (phase !== "playing") return;

    const sprayTimer = window.setTimeout(
      () => sprayRef.current?.start(),
      ENTER_TO_SPRAY_MS
    );
    const finishTimer = window.setTimeout(finish, PLAY_DURATION_MS);

    return () => {
      window.clearTimeout(sprayTimer);
      window.clearTimeout(finishTimer);
    };
  }, [phase, finish]);

  /* leaving -> unmount once the fade completes */
  useEffect(() => {
    if (phase !== "leaving") return;

    const timer = window.setTimeout(() => setVisible(false), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  /* Escape skips the intro */
  useEffect(() => {
    if (!visible || phase === "leaving") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, phase, finish]);

  if (!visible) return null;

  return (
    <div ref={sceneRef} className={`perfume-intro perfume-intro--${phase}`}>
      {/* Runs while the HTML is still parsing so returning visitors
          never glimpse the splash. Mirrors the layout effect above. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(new URLSearchParams(location.search).has('intro'))return;" +
            "var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;" +
            "var s=false;try{s=sessionStorage.getItem('" +
            SESSION_KEY +
            "')==='1'}catch(e){}" +
            "if(r||s)document.documentElement.classList.add('perfume-intro-hide')" +
            "}catch(e){}})()",
        }}
      />

      <noscript>
        <style>{".perfume-intro{display:none !important}"}</style>
      </noscript>

      <div className="perfume-intro__orb perfume-intro__orb--one" aria-hidden="true" />
      <div className="perfume-intro__orb perfume-intro__orb--two" aria-hidden="true" />

      <div className="perfume-intro__content">
        <p className="perfume-intro__eyebrow">A moment, made yours</p>
        <h1 className="perfume-intro__brand">Bethel</h1>
        <p className="perfume-intro__descriptor">PERFUME &amp; MART</p>

        <div className="perfume-intro__stage">
          <Bottle nozzleRef={nozzleRef} />
        </div>

        <p className="perfume-intro__tagline">A little luxury, every day.</p>
        <div className="perfume-intro__rule" aria-hidden="true" />
      </div>

      <canvas ref={canvasRef} className="perfume-intro__canvas" aria-hidden="true" />

      <div className="perfume-intro__controls">
        <button
          type="button"
          className="perfume-intro__button"
          onClick={() => sprayRef.current?.start()}
          autoFocus
        >
          Press to spray
        </button>
        <button type="button" className="perfume-intro__button" onClick={finish}>
          Skip intro
        </button>
      </div>
    </div>
  );
}
