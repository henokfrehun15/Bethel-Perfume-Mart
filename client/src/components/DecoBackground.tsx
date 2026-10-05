/**
 * Art-deco line-work background: fan rays, concentric corner arcs
 * and a seal medallion in bronze and sage — the classic perfume-
 * house vocabulary, deliberately free of floral motifs. Mounted
 * once in the root layout so the draw-in plays a single time per
 * visit.
 */
export default function DecoBackground() {
  return (
    <div className="deco-background" aria-hidden="true">
      <svg
        className="deco-svg"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* =====================================================
            BOTTOM-LEFT FAN
            Rays and concentric arcs radiating from the corner,
            like a deco sunburst.
        ====================================================== */}

        <g>
          <path className="deco-line deco-ray-1" pathLength="1000" d="M-40 940 L473 850" />
          <path className="deco-line deco-ray-2" pathLength="1000" d="M-40 940 L553 700" />
          <path className="deco-line deco-ray-3" pathLength="1000" d="M-40 940 L557 538" />
          <path className="deco-line deco-ray-4" pathLength="1000" d="M-40 940 L488 394" />
          <path className="deco-line deco-ray-5" pathLength="1000" d="M-40 940 L342 329" />
          <path className="deco-line deco-ray-6" pathLength="1000" d="M-40 940 L179 338" />
          <path className="deco-line deco-ray-7" pathLength="1000" d="M-40 940 L32 425" />

          <path className="deco-line deco-line-fine deco-fan-arc-1" pathLength="1000" d="M236 891 A280 280 0 0 0 -1 663" />
          <path className="deco-line deco-line-fine deco-fan-arc-2" pathLength="1000" d="M366 831 A420 420 0 0 0 69 534" />
          <path className="deco-line deco-line-fine deco-fan-arc-3" pathLength="1000" d="M486 749 A560 560 0 0 0 152 414" />
        </g>

        {/* =====================================================
            BOTTOM-RIGHT FAN
            A smaller mirrored echo so wide screens are framed on
            both edges.
        ====================================================== */}

        <g transform="translate(1200 0) scale(-1 1)">
          <path className="deco-line deco-ray-2" pathLength="1000" d="M-40 940 L553 700" />
          <path className="deco-line deco-ray-3" pathLength="1000" d="M-40 940 L557 538" />
          <path className="deco-line deco-ray-4" pathLength="1000" d="M-40 940 L488 394" />
          <path className="deco-line deco-ray-5" pathLength="1000" d="M-40 940 L342 329" />

          <path className="deco-line deco-line-fine deco-fan-arc-1" pathLength="1000" d="M236 891 A280 280 0 0 0 -1 663" />
          <path className="deco-line deco-line-fine deco-fan-arc-2" pathLength="1000" d="M366 831 A420 420 0 0 0 69 534" />
        </g>

        {/* =====================================================
            TOP-LEFT CONCENTRIC ARCS
            Quarter arcs anchored off-canvas, like radio rings.
        ====================================================== */}

        <g>
          <path className="deco-line deco-line-fine deco-corner-arc-1" pathLength="1000" d="M140 -60 A200 200 0 0 1 -60 140" />
          <path className="deco-line deco-line-fine deco-corner-arc-2" pathLength="1000" d="M240 -60 A300 300 0 0 1 -60 240" />
          <path className="deco-line deco-line-sage deco-line-fine deco-corner-arc-3" pathLength="1000" d="M340 -60 A400 400 0 0 1 -60 340" />
          <path className="deco-line deco-line-fine deco-corner-arc-4" pathLength="1000" d="M440 -60 A500 500 0 0 1 -60 440" />

          <path className="deco-dotted deco-corner-dotted" pathLength="1000" d="M290 -60 A350 350 0 0 1 -60 290" />
        </g>

        {/* =====================================================
            SEAL MEDALLION
            Double ring with a slowly rotating dotted orbit and
            tick marks, like a fragrance-house seal.
        ====================================================== */}

        <g transform="translate(960 220)">
          <circle className="deco-medallion-ring deco-medallion-outer" r="110" />
          <circle className="deco-medallion-dotted" r="84" />
          <circle className="deco-medallion-ring deco-medallion-core" r="26" />
          <circle className="deco-dot deco-medallion-center" r="5" />

          <path className="deco-tick deco-tick-1" d="M1054 220 L1062 220" />
          <path className="deco-tick deco-tick-2" d="M1026 153 L1032 148" />
          <path className="deco-tick deco-tick-3" d="M960 126 L960 118" />
          <path className="deco-tick deco-tick-4" d="M894 153 L888 148" />
          <path className="deco-tick deco-tick-5" d="M866 220 L858 220" />
          <path className="deco-tick deco-tick-6" d="M894 287 L888 292" />
          <path className="deco-tick deco-tick-7" d="M960 314 L960 322" />
          <path className="deco-tick deco-tick-8" d="M1026 287 L1032 292" />
        </g>

        {/* =====================================================
            STREAMLINES
            Two long, quiet curves sweeping across the lower page.
        ====================================================== */}

        <path
          className="deco-line deco-line-sage deco-line-fine deco-stream-1"
          pathLength="1000"
          d="M-60 700 C250 640, 500 660, 760 600 C900 570, 1020 570, 1140 540"
        />

        <path
          className="deco-line deco-line-sage deco-line-fine deco-stream-2"
          pathLength="1000"
          d="M-60 760 C300 720, 600 740, 900 680 C1000 662, 1080 655, 1160 640"
        />

        {/* =====================================================
            ACCENTS
            Small deco dots and diamond outlines.
        ====================================================== */}

        <circle className="deco-dot deco-dot-1" cx="180" cy="180" r="3" />
        <circle className="deco-dot deco-dot-2" cx="1080" cy="480" r="3" />
        <circle className="deco-dot deco-dot-3" cx="620" cy="120" r="2.5" />
        <circle className="deco-dot deco-dot-4" cx="90" cy="560" r="3" />
        <circle className="deco-dot deco-dot-5" cx="1120" cy="150" r="2.5" />

        <path className="deco-diamond deco-diamond-1" d="M300 128 L312 140 L300 152 L288 140 Z" />
        <path className="deco-diamond deco-diamond-2" d="M1060 680 L1070 690 L1060 700 L1050 690 Z" />
      </svg>
    </div>
  );
}
