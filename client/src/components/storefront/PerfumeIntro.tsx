"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";
import "./PerfumeIntro.css";

/*
 * Splash intro for the home page: a branded perfume bottle that mists
 * the screen away on a visitor's first arrival of the session. It is
 * a fixed overlay — the real page stays in the initial HTML underneath,
 * so SEO and no-JS users are unaffected — and it is pure CSS/SVG, so
 * it adds no dependencies to the bundle. Returning visitors and users
 * who prefer reduced motion skip it before the first paint.
 */

type Phase = "ready" | "spraying" | "misting" | "leaving";

const SESSION_KEY = "bethel-intro-done";
const SPRAY_MS = 1400;
const MIST_MS = 2800;
const FADE_MS = 1000;

/* useLayoutEffect before paint on the client, plain effect on SSR. */
const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/* sessionStorage can throw in private modes; the module flag keeps
   client-side navigation from replaying the intro within this load. */
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

/* Spray droplets: travel offset, stagger, size and softness. The mix
   of sharp and blurred dots reads as fine perfume mist, and the extra
   downward travel at the end of each arc mimics gravity. */
const SPRAY_DOTS = [
  { dx: 96, dy: -44, delay: 0, size: 6, blur: 0 },
  { dx: 128, dy: -14, delay: 0.04, size: 4, blur: 1 },
  { dx: 66, dy: -64, delay: 0.07, size: 5, blur: 0.5 },
  { dx: 148, dy: -50, delay: 0.11, size: 3, blur: 1.5 },
  { dx: 104, dy: -82, delay: 0.14, size: 4, blur: 1 },
  { dx: 156, dy: -26, delay: 0.18, size: 5, blur: 0 },
  { dx: 78, dy: -30, delay: 0.21, size: 3, blur: 1.5 },
  { dx: 132, dy: -70, delay: 0.25, size: 4, blur: 0.5 },
  { dx: 88, dy: -58, delay: 0.3, size: 3, blur: 1 },
  { dx: 150, dy: -64, delay: 0.34, size: 3, blur: 1.5 },
  { dx: 112, dy: -24, delay: 0.38, size: 4, blur: 0 },
  { dx: 140, dy: -38, delay: 0.42, size: 3, blur: 1 },
  { dx: 96, dy: -74, delay: 0.46, size: 3, blur: 1.5 },
  { dx: 122, dy: -52, delay: 0.5, size: 4, blur: 0.5 },
  { dx: 160, dy: -44, delay: 0.55, size: 3, blur: 1 },
  { dx: 84, dy: -46, delay: 0.6, size: 3, blur: 1.5 },
  { dx: 134, dy: -84, delay: 0.64, size: 3, blur: 1 },
  { dx: 104, dy: -36, delay: 0.68, size: 4, blur: 0.5 },
];

function Bottle() {
  return (
    <svg
      className="perfume-intro__bottle"
      viewBox="0 0 200 300"
      role="img"
      aria-label="Bethel perfume bottle"
    >
      <defs>
        <linearGradient id="perfume-intro-glass" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#fbeef1" stopOpacity="0.96" />
          <stop offset="1" stopColor="#f3dce2" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="perfume-intro-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e293a8" />
          <stop offset="0.5" stopColor="#d47c94" />
          <stop offset="1" stopColor="#b95d77" />
        </linearGradient>
        <linearGradient id="perfume-intro-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8bda9" />
          <stop offset="0.5" stopColor="#c98d76" />
          <stop offset="1" stopColor="#a96a58" />
        </linearGradient>
        <linearGradient id="perfume-intro-neck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f8e8ed" />
          <stop offset="1" stopColor="#eccdd6" />
        </linearGradient>
        <linearGradient id="perfume-intro-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#c96a82" stopOpacity="0" />
          <stop offset="1" stopColor="#c96a82" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id="perfume-intro-body-clip">
          <path d="M30 268 V128 Q30 66 92 66 H108 Q170 66 170 128 V268 Q170 282 156 282 H44 Q30 282 30 268 Z" />
        </clipPath>
      </defs>

      {/* Grounding shadow */}
      <ellipse cx="100" cy="287" rx="62" ry="7" fill="#9e405a" opacity="0.13" />

      {/* Glass body, lit from the left */}
      <path
        d="M30 268 V128 Q30 66 92 66 H108 Q170 66 170 128 V268 Q170 282 156 282 H44 Q30 282 30 268 Z"
        fill="url(#perfume-intro-glass)"
        stroke="#e6d3d8"
      />
      <rect
        x="30"
        y="66"
        width="140"
        height="216"
        fill="url(#perfume-intro-shade)"
        clipPath="url(#perfume-intro-body-clip)"
      />

      {/* Rose liquid with a lit surface */}
      <path
        d="M44 162 H156 V266 Q156 282 142 282 H58 Q44 282 44 266 Z"
        fill="url(#perfume-intro-liquid)"
        opacity="0.82"
      />
      <rect x="46" y="162" width="108" height="6" rx="3" fill="#f4bcca" opacity="0.85" />

      {/* Glass highlights */}
      <rect x="45" y="92" width="12" height="138" rx="6" fill="#ffffff" opacity="0.55" />
      <rect x="61" y="96" width="5" height="92" rx="2.5" fill="#ffffff" opacity="0.35" />

      {/* Neck */}
      <path d="M82 44 L118 44 L124 66 L76 66 Z" fill="url(#perfume-intro-neck)" stroke="#e6d3d8" />

      {/* Label */}
      <rect x="54" y="172" width="92" height="78" rx="14" fill="#fffdfc" stroke="#eadfdf" />
      <line x1="72" y1="186" x2="128" y2="186" stroke="#d9c4ca" strokeWidth="1" />
      <text
        x="100"
        y="214"
        textAnchor="middle"
        fill="#9e405a"
        fontSize="24"
        fontWeight="600"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        Bethel
      </text>
      <text
        x="100"
        y="230"
        textAnchor="middle"
        fill="#756b6e"
        fontSize="6.5"
        fontWeight="600"
        letterSpacing="2.2"
        style={{ fontFamily: "var(--font-sans), Arial, sans-serif" }}
      >
        PERFUME &amp; MART
      </text>
      <line x1="72" y1="238" x2="128" y2="238" stroke="#d9c4ca" strokeWidth="1" />

      {/* Metallic cap and nozzle — presses down while spraying */}
      <g className="perfume-intro__cap">
        <rect x="76" y="14" width="48" height="30" rx="9" fill="url(#perfume-intro-metal)" />
        <rect x="82" y="18" width="7" height="22" rx="3.5" fill="#ffffff" opacity="0.35" />
        <rect x="120" y="22" width="16" height="9" rx="4" fill="url(#perfume-intro-metal)" />
        <circle cx="134" cy="26.5" r="2.6" fill="#fff0f6" />
      </g>
    </svg>
  );
}

export default function PerfumeIntro() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("ready");

  /* Decide before the first paint: returning visitors and reduced-
     motion users never see the splash; first-timers get it with the
     background scroll locked while it is up. `?intro` in the URL
     forces the splash on for testing. The session is only marked as
     seen once the visitor sprays or skips — never here, or StrictMode's
     double effect pass would hide the intro instantly. */
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

  /* Advance the timeline: spray burst, then the mist billows out,
     then the overlay fades to reveal the page. */
  useEffect(() => {
    if (phase === "ready") return;

    const nextPhase: Phase | null =
      phase === "spraying" ? "misting" : phase === "misting" ? "leaving" : null;

    const timer = window.setTimeout(
      () => {
        if (nextPhase) {
          setPhase(nextPhase);
        } else {
          setVisible(false);
        }
      },
      phase === "spraying" ? SPRAY_MS : phase === "misting" ? MIST_MS : FADE_MS
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  const spray = useCallback(() => {
    if (phase !== "ready") return;
    markIntroSeen();
    setPhase("spraying");
  }, [phase]);

  const skip = useCallback(() => {
    if (phase !== "ready") return;
    markIntroSeen();
    setPhase("leaving");
  }, [phase]);

  /* Escape skips the intro for keyboard users. */
  useEffect(() => {
    if (phase !== "ready") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, skip]);

  if (!visible) return null;

  return (
    <div className={`perfume-intro perfume-intro--${phase}`}>
      {/*
        Runs while the HTML is still parsing — before the first paint —
        so returning visitors never even glimpse the splash. Mirrors the
        checks in the layout effect above.
      */}
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

      <header className="perfume-intro__brand">
        <span className="perfume-intro__wordmark">Bethel</span>
        <span className="perfume-intro__tagline">Perfume &amp; Mart</span>
      </header>

      <section
        className="perfume-intro__stage"
        aria-label="Welcome to Bethel Perfume and Mart"
      >
        <p className="perfume-intro__eyebrow">
          A little mist, a beautiful beginning.
        </p>

        <div className="perfume-intro__figure">
          <span className="perfume-intro__halo" aria-hidden="true" />
          <Bottle />

          <span className="perfume-intro__plume" aria-hidden="true" />

          <span className="perfume-intro__spray" aria-hidden="true">
            {SPRAY_DOTS.map((dot, index) => (
              <i
                key={index}
                style={
                  {
                    "--dx": `${dot.dx}px`,
                    "--dy": `${dot.dy}px`,
                    "--d": `${dot.delay}s`,
                    "--s": `${dot.size}px`,
                    "--b": `${dot.blur}px`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </div>

        <button
          type="button"
          className="perfume-intro__button"
          onClick={spray}
          disabled={phase !== "ready"}
        >
          <span className="perfume-intro__button-dot" aria-hidden="true" />
          {phase === "ready" ? "Press to spray" : "Releasing the mist"}
        </button>
      </section>

      <p className="perfume-intro__hint" aria-hidden={phase !== "ready"}>
        {phase === "ready"
          ? "Press to reveal the collection"
          : "Let the fragrance take you in"}
      </p>

      {phase === "ready" && (
        <button type="button" className="perfume-intro__skip" onClick={skip}>
          Skip intro
        </button>
      )}

      <div className="perfume-intro__mist" aria-hidden="true">
        <div className="perfume-intro__cloud perfume-intro__cloud--one" />
        <div className="perfume-intro__cloud perfume-intro__cloud--two" />
        <div className="perfume-intro__cloud perfume-intro__cloud--three" />
        <div className="perfume-intro__veil" />
      </div>
    </div>
  );
}
