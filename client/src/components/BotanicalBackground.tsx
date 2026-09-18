export default function BotanicalBackground() {
  return (
    <div className="botanical-background" aria-hidden="true">
      <svg
        className="botanical-svg"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* =====================================================
            BRANCHES
            All branches originate from the bottom-left.
        ====================================================== */}

        <g className="botanical-branches">
          {/* Main branches */}
          <path
            className="branch branch-1"
            d="M-40 930 C70 790, 140 650, 280 560 C390 490, 470 430, 575 390"
          />

          <path
            className="branch branch-2"
            d="M-30 930 C80 800, 100 610, 170 430 C220 310, 270 210, 350 120"
          />

          <path
            className="branch branch-3"
            d="M-20 920 C130 820, 240 720, 350 600 C430 510, 500 450, 620 390"
          />

          <path
            className="branch branch-4"
            d="M-30 930 C150 880, 300 850, 450 790 C570 740, 650 670, 720 590"
          />

          <path
            className="branch branch-5"
            d="M0 900 C100 750, 190 690, 250 550 C310 410, 390 330, 500 270"
          />

          <path
            className="branch branch-6"
            d="M-20 940 C180 900, 320 870, 470 850 C600 830, 710 780, 830 700"
          />

          {/* Branches extending around the central flower */}
          <path
            className="branch branch-7"
            d="M300 570 C390 530, 450 470, 520 410 C560 375, 590 360, 650 350"
          />

          <path
            className="branch branch-8"
            d="M520 410 C610 430, 690 470, 770 450 C850 430, 900 390, 970 330"
          />

          <path
            className="branch branch-9"
            d="M570 430 C650 520, 730 560, 830 560 C900 560, 970 520, 1040 470"
          />

          <path
            className="branch branch-10"
            d="M410 500 C470 560, 500 630, 570 690 C630 740, 720 750, 790 730"
          />
        </g>

        {/* =====================================================
            SMALL OFFSHOOTS
        ====================================================== */}

        <g className="botanical-offshoots">
          <path
            className="offshoot offshoot-1"
            d="M165 435 C125 390, 100 350, 105 300"
          />

          <path
            className="offshoot offshoot-2"
            d="M220 610 C180 570, 155 525, 160 470"
          />

          <path
            className="offshoot offshoot-3"
            d="M350 600 C330 550, 335 510, 365 470"
          />

          <path
            className="offshoot offshoot-4"
            d="M470 430 C430 390, 425 350, 445 310"
          />

          <path
            className="offshoot offshoot-5"
            d="M620 390 C650 340, 680 315, 720 300"
          />

          <path
            className="offshoot offshoot-6"
            d="M720 590 C760 550, 800 530, 840 525"
          />

          <path
            className="offshoot offshoot-7"
            d="M830 700 C870 670, 900 640, 915 600"
          />

          <path
            className="offshoot offshoot-8"
            d="M470 790 C450 750, 455 710, 480 680"
          />

          <path
            className="offshoot offshoot-9"
            d="M770 450 C800 410, 835 395, 870 390"
          />

          <path
            className="offshoot offshoot-10"
            d="M830 560 C850 520, 880 500, 915 490"
          />
        </g>

        {/* =====================================================
            LEAVES
        ====================================================== */}

        <g className="botanical-leaves">
          <ellipse className="leaf leaf-1" cx="105" cy="300" rx="13" ry="30" transform="rotate(-35 105 300)" />
          <ellipse className="leaf leaf-2" cx="130" cy="385" rx="12" ry="27" transform="rotate(55 130 385)" />

          <ellipse className="leaf leaf-3" cx="160" cy="470" rx="13" ry="31" transform="rotate(-40 160 470)" />
          <ellipse className="leaf leaf-4" cx="185" cy="555" rx="12" ry="29" transform="rotate(55 185 555)" />

          <ellipse className="leaf leaf-5" cx="270" cy="560" rx="13" ry="31" transform="rotate(-50 270 560)" />
          <ellipse className="leaf leaf-6" cx="340" cy="505" rx="12" ry="29" transform="rotate(40 340 505)" />

          <ellipse className="leaf leaf-7" cx="365" cy="470" rx="13" ry="31" transform="rotate(-35 365 470)" />
          <ellipse className="leaf leaf-8" cx="430" cy="390" rx="12" ry="28" transform="rotate(50 430 390)" />

          <ellipse className="leaf leaf-9" cx="445" cy="310" rx="13" ry="30" transform="rotate(-35 445 310)" />
          <ellipse className="leaf leaf-10" cx="500" cy="270" rx="12" ry="29" transform="rotate(50 500 270)" />

          <ellipse className="leaf leaf-11" cx="720" cy="300" rx="13" ry="31" transform="rotate(40 720 300)" />
          <ellipse className="leaf leaf-12" cx="680" cy="330" rx="12" ry="28" transform="rotate(-45 680 330)" />

          <ellipse className="leaf leaf-13" cx="840" cy="525" rx="13" ry="31" transform="rotate(55 840 525)" />
          <ellipse className="leaf leaf-14" cx="800" cy="550" rx="12" ry="28" transform="rotate(-40 800 550)" />

          <ellipse className="leaf leaf-15" cx="915" cy="600" rx="13" ry="31" transform="rotate(45 915 600)" />
          <ellipse className="leaf leaf-16" cx="870" cy="670" rx="12" ry="28" transform="rotate(-50 870 670)" />

          <ellipse className="leaf leaf-17" cx="480" cy="680" rx="13" ry="31" transform="rotate(45 480 680)" />
          <ellipse className="leaf leaf-18" cx="560" cy="690" rx="12" ry="29" transform="rotate(-45 560 690)" />

          <ellipse className="leaf leaf-19" cx="870" cy="390" rx="13" ry="31" transform="rotate(50 870 390)" />
          <ellipse className="leaf leaf-20" cx="915" cy="490" rx="12" ry="28" transform="rotate(-40 915 490)" />
        </g>

        {/* =====================================================
            SMALL FLOWER BUDS
        ====================================================== */}

        <g className="botanical-buds">
          <ellipse className="bud bud-1" cx="105" cy="270" rx="9" ry="18" />
          <ellipse className="bud bud-2" cx="220" cy="430" rx="9" ry="18" />
          <ellipse className="bud bud-3" cx="365" cy="450" rx="9" ry="18" />
          <ellipse className="bud bud-4" cx="445" cy="280" rx="9" ry="18" />
          <ellipse className="bud bud-5" cx="720" cy="270" rx="9" ry="18" />
          <ellipse className="bud bud-6" cx="870" cy="360" rx="9" ry="18" />
          <ellipse className="bud bud-7" cx="915" cy="465" rx="9" ry="18" />
          <ellipse className="bud bud-8" cx="480" cy="650" rx="9" ry="18" />
        </g>

        {/* =====================================================
            CENTRAL FLOWER
        ====================================================== */}

        <g className="central-flower" transform="translate(575 390)">
          {/* Glow */}
          <circle className="flower-glow" cx="0" cy="0" r="95" />

          {/* Petals */}
          <ellipse className="petal petal-1" cx="0" cy="-42" rx="30" ry="55" />
          <ellipse className="petal petal-2" cx="40" cy="-15" rx="30" ry="55" transform="rotate(65 40 -15)" />
          <ellipse className="petal petal-3" cx="35" cy="30" rx="30" ry="55" transform="rotate(125 35 30)" />
          <ellipse className="petal petal-4" cx="-35" cy="30" rx="30" ry="55" transform="rotate(-125 -35 30)" />
          <ellipse className="petal petal-5" cx="-40" cy="-15" rx="30" ry="55" transform="rotate(-65 -40 -15)" />

          {/* Flower center */}
          <circle className="flower-center" cx="0" cy="0" r="13" />

          {/* Stamens */}
          <g className="stamens">
            <circle cx="0" cy="-25" r="2.5" />
            <circle cx="17" cy="-18" r="2.5" />
            <circle cx="24" cy="0" r="2.5" />
            <circle cx="16" cy="18" r="2.5" />
            <circle cx="0" cy="25" r="2.5" />
            <circle cx="-16" cy="18" r="2.5" />
            <circle cx="-24" cy="0" r="2.5" />
            <circle cx="-17" cy="-18" r="2.5" />
          </g>
        </g>

        {/* =====================================================
            FLOATING PETALS
        ====================================================== */}

        <g className="floating-petals">
          <path
            className="floating-petal floating-petal-1"
            d="M760 230 C770 215, 785 215, 790 230 C782 242, 770 245, 760 230Z"
          />

          <path
            className="floating-petal floating-petal-2"
            d="M900 270 C910 255, 925 258, 930 273 C920 282, 910 282, 900 270Z"
          />

          <path
            className="floating-petal floating-petal-3"
            d="M700 720 C710 705, 725 708, 730 723 C720 733, 710 732, 700 720Z"
          />

          <path
            className="floating-petal floating-petal-4"
            d="M980 600 C990 585, 1005 588, 1010 603 C1000 613, 990 612, 980 600Z"
          />
        </g>
      </svg>
    </div>
  );
}