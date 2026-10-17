"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "./PerfumeIntro.css";

/*
 * Splash intro for the home page. The Canva "Bethel" scene design —
 * orbs, film grain, entrance choreography and the blush-rose glass
 * bottle — driven by the earlier canvas mist engine: a jet of fine
 * droplets that fall under gravity, soft blush and rose puffs that
 * trail the spray, and a fog billow that fills the screen before the
 * overlay fades to reveal the page. The sequence plays itself once
 * per session; the real page stays in the initial HTML underneath
 * (SEO and no-JS users are unaffected) and there are no dependencies.
 * `?intro` in the URL forces the splash on.
 */

type Phase = "entering" | "playing" | "leaving";
type MistMode = "spray" | "fog";

const SESSION_KEY = "bethel-intro-done";
const ENTER_TO_SPRAY_MS = 1100;
const SPRAY_TO_FOG_MS = 2400;
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

/* ---- Canvas mist engine ---------------------------------------------------
   The earlier spray engine. "spray" emits fast droplets in a narrow
   cone (they drag and fall under gravity) plus soft puffs that lag
   behind the jet and keep expanding; "fog" emits big slow puffs that
   drift out in every direction. Puffs are drawn from pre-rendered
   radial-gradient sprites. */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  a: number;
  age: number;
  life: number;
  kind: 0 | 1 | 2; // 0 droplet, 1 blush puff, 2 rose puff
}

interface MistController {
  start: (mode: MistMode) => void;
  stop: () => void;
  destroy: () => void;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function makeSprite(rgb: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");

  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.45, `rgba(${rgb},0.45)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }

  return c;
}

function createMistController(
  canvas: HTMLCanvasElement,
  nozzle: SVGElement,
  scene: HTMLElement
): MistController {
  const maybeCtx = canvas.getContext("2d", { alpha: true });

  if (!maybeCtx) {
    return { start: () => {}, stop: () => {}, destroy: () => {} };
  }

  /* Hoisted function declarations don't keep the null narrowing, so
     bind the context to an explicitly non-null constant. */
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const sprites: (HTMLCanvasElement | null)[] = [
    null,
    makeSprite("247,205,219"),
    makeSprite("214,128,153"),
  ];
  const ps: Particle[] = [];

  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let mode: MistMode = "spray";
  let emitUntil = 0;
  let running = false;
  let delay = 0;
  let pumpTimer = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const origin = () => {
    const tip = nozzle.getBoundingClientRect();
    const bounds = canvas.getBoundingClientRect();

    return {
      x: tip.right - bounds.left,
      y: tip.top + tip.height / 2 - bounds.top,
    };
  };

  /* Expected `rate * dt` spawns per frame, with the fraction randomised. */
  const count = (rate: number, dt: number) =>
    Math.floor(rate * dt + Math.random());

  const emit = (dt: number) => {
    const { x, y } = origin();
    const k = Math.min(Math.max(W / 1000, 0.55), 1.2);

    if (mode === "spray") {
      /* Fine, fast droplets in a narrow cone that fall under gravity. */
      for (let i = count(9, dt); i > 0; i--) {
        const ang = rnd(-0.3, 0.18);
        const sp = rnd(7, 17) * k;

        ps.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: rnd(0.7, 1.8),
          grow: 0,
          a: rnd(0.5, 0.95),
          age: 0,
          life: rnd(26, 58),
          kind: 0,
        });
      }

      /* Soft mist that lags behind the jet and keeps expanding. */
      for (let i = count(1.6, dt); i > 0; i--) {
        const ang = rnd(-0.4, 0.25);
        const sp = rnd(2.5, 7) * k;

        ps.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: rnd(5, 10),
          grow: rnd(0.35, 0.9),
          a: rnd(0.25, 0.5),
          age: 0,
          life: rnd(70, 120),
          kind: Math.random() < 0.6 ? 1 : 2,
        });
      }
    } else {
      /* Fog: big slow puffs that drift out in every direction. */
      for (let i = count(0.6, dt); i > 0; i--) {
        const ang = rnd(0, Math.PI * 2);
        const sp = rnd(1, 5) * k;

        ps.push({
          x: x + rnd(-40, 40),
          y: y + rnd(-40, 40),
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: rnd(55, 100),
          grow: rnd(0.9, 1.8),
          a: rnd(0.4, 0.7),
          age: 0,
          life: rnd(90, 140),
          kind: Math.random() < 0.5 ? 1 : 2,
        });
      }
    }
  };

  const tick = (t: number) => {
    const dt = Math.min(Math.max((t - last) / 16.67, 0.5), 3);
    last = t;
    ctx.clearRect(0, 0, W, H);

    if (t < emitUntil) emit(dt);

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      const k = p.age / p.life;

      if (k >= 1) {
        ps.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.kind === 0) {
        const drag = Math.pow(0.94, dt);
        p.vx *= drag;
        p.vy = p.vy * drag + 0.14 * dt;
      } else {
        const drag = Math.pow(0.965, dt);
        p.vx = p.vx * drag + rnd(-0.05, 0.05) * dt;
        p.vy = p.vy * drag - 0.01 * dt;
        p.r += p.grow * dt;
      }

      const env = k < 0.12 ? k / 0.12 : (1 - k) / 0.88;
      ctx.globalAlpha = p.a * env;

      if (p.kind === 0) {
        ctx.fillStyle = "#b9657e";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.drawImage(sprites[p.kind]!, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    }

    ctx.globalAlpha = 1;

    if (ps.length || t < emitUntil) {
      raf = requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };

  const stop = () => {
    window.clearTimeout(delay);
    window.clearTimeout(pumpTimer);
    delay = 0;
    pumpTimer = 0;
    cancelAnimationFrame(raf);
    raf = 0;
    running = false;
    emitUntil = 0;
    ps.length = 0;
    ctx.clearRect(0, 0, W, H);
    scene.classList.remove("is-spraying");
  };

  const start = (m: MistMode) => {
    mode = m;

    /* The pump presses down while the spray leaves the nozzle. */
    if (m === "spray") {
      scene.classList.add("is-spraying");
      window.clearTimeout(pumpTimer);
      pumpTimer = window.setTimeout(
        () => scene.classList.remove("is-spraying"),
        600
      );
    }

    window.clearTimeout(delay);

    /* Spray waits a beat so the nozzle is pressed down first. */
    delay = window.setTimeout(
      () => {
        emitUntil = performance.now() + (m === "spray" ? 650 : 1000);

        if (!running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      },
      m === "spray" ? 120 : 0
    );
  };

  const destroy = () => {
    stop();
    window.removeEventListener("resize", resize);
  };

  window.addEventListener("resize", resize);
  resize();

  return { start, stop, destroy };
}

/* ---- Bottle --------------------------------------------------------------
   The Canva artwork: a blush-rose glass bottle with thick bevels, a
   lit liquid surface, a cream label and a cylindrical rose-gold cap
   with a side atomizer. Gradient ids are prefixed to stay unique. */

function Bottle({ nozzleRef }: { nozzleRef: React.RefObject<SVGEllipseElement | null> }) {
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
  const mistRef = useRef<MistController | null>(null);

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

    const controller = createMistController(canvas, nozzle, scene);
    mistRef.current = controller;

    return () => {
      controller.destroy();
      mistRef.current = null;
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

  /* The choreography: the bottle sprays by itself, the mist thickens
     into a fog, then the overlay finishes and fades to reveal the
     page. */
  useEffect(() => {
    if (phase !== "playing") return;

    const sprayTimer = window.setTimeout(
      () => mistRef.current?.start("spray"),
      ENTER_TO_SPRAY_MS
    );
    const fogTimer = window.setTimeout(
      () => mistRef.current?.start("fog"),
      SPRAY_TO_FOG_MS
    );
    const finishTimer = window.setTimeout(finish, PLAY_DURATION_MS);

    return () => {
      window.clearTimeout(sprayTimer);
      window.clearTimeout(fogTimer);
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
          onClick={() => mistRef.current?.start("spray")}
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
