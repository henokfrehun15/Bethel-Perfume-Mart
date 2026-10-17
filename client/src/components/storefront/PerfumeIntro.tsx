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

type Phase = "ready" | "spraying" | "leaving";

const SESSION_KEY = "bethel-intro-shown";
const MIST_MS = 1700;
const FADE_MS = 700;

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

/* Spray particles: travel offset, stagger and size per dot. */
const SPRAY_DOTS = [
  { dx: 92, dy: -46, delay: 0, size: 7 },
  { dx: 124, dy: -16, delay: 0.05, size: 5 },
  { dx: 64, dy: -68, delay: 0.09, size: 6 },
  { dx: 146, dy: -52, delay: 0.12, size: 4 },
  { dx: 102, dy: -84, delay: 0.16, size: 5 },
  { dx: 154, dy: -28, delay: 0.2, size: 6 },
  { dx: 76, dy: -32, delay: 0.24, size: 4 },
  { dx: 128, dy: -72, delay: 0.28, size: 5 },
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
        <linearGradient id="perfume-intro-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="1" stopColor="#f7e5e9" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="perfume-intro-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d97f96" />
          <stop offset="1" stopColor="#c96a82" />
        </linearGradient>
        <linearGradient id="perfume-intro-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b3808f" />
          <stop offset="1" stopColor="#9e405a" />
        </linearGradient>
      </defs>

      {/* Cap, nozzle and neck */}
      <rect x="76" y="14" width="48" height="30" rx="9" fill="url(#perfume-intro-cap)" />
      <rect x="120" y="22" width="16" height="9" rx="4" fill="#9e405a" />
      <circle cx="134" cy="26.5" r="2.6" fill="#fff0f6" />
      <path d="M82 44 L118 44 L124 66 L76 66 Z" fill="#f2dce2" stroke="#eadfe2" />

      {/* Glass body */}
      <path
        d="M30 268 V128 Q30 66 92 66 H108 Q170 66 170 128 V268 Q170 282 156 282 H44 Q30 282 30 268 Z"
        fill="url(#perfume-intro-glass)"
        stroke="#e6d6da"
      />

      {/* Rose liquid */}
      <path
        d="M44 158 H156 V266 Q156 282 142 282 H58 Q44 282 44 266 Z"
        fill="url(#perfume-intro-liquid)"
        opacity="0.78"
      />

      {/* Glass highlight */}
      <rect x="45" y="92" width="13" height="140" rx="6.5" fill="#ffffff" opacity="0.5" />

      {/* Label */}
      <rect x="54" y="176" width="92" height="72" rx="14" fill="#fffdfc" stroke="#eadfdf" />
      <text
        x="100"
        y="213"
        textAnchor="middle"
        fill="#9e405a"
        fontSize="25"
        fontWeight="600"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        Bethel
      </text>
      <text
        x="100"
        y="233"
        textAnchor="middle"
        fill="#756b6e"
        fontSize="7"
        fontWeight="600"
        letterSpacing="2.4"
        style={{ fontFamily: "var(--font-sans), Arial, sans-serif" }}
      >
        PERFUME &amp; MART
      </text>
    </svg>
  );
}

export default function PerfumeIntro() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("ready");

  /* Decide before the first paint: returning visitors and reduced-
     motion users never see the splash; first-timers get it with the
     background scroll locked while it is up. */
  useClientLayoutEffect(() => {
    if (!visible) return;

    const prefersReduced = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (prefersReduced || hasSeenIntro()) {
      setVisible(false);
      return;
    }

    markIntroSeen();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  /* Advance the timeline: the mist expands, then the overlay fades. */
  useEffect(() => {
    if (phase === "ready") return;

    const timer = window.setTimeout(
      () => {
        if (phase === "spraying") {
          setPhase("leaving");
        } else {
          setVisible(false);
        }
      },
      phase === "spraying" ? MIST_MS : FADE_MS
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  const spray = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("spraying");
  }, [phase]);

  const skip = useCallback(() => {
    if (phase !== "ready") return;
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
