/**
 * Generates vector architectural SVG drawings with precision drafting linework,
 * title blocks, dimension marks, room tags, and revision stamps.
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'assets', 'blueprints');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createA101Rev03() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%" style="background:#FAF8F5; font-family:'Space Grotesk', monospace;">
  <defs>
    <!-- Drafting Grid Pattern -->
    <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAE5DE" stroke-width="0.8"/>
      <circle cx="0" cy="0" r="1" fill="#D8C9B8"/>
    </pattern>
    <pattern id="concreteHatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="16" stroke="#C8BEB2" stroke-width="1.2"/>
    </pattern>
    <pattern id="terraceTiles" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#D3C9BD" stroke-width="0.7"/>
    </pattern>
  </defs>

  <!-- Background Grid -->
  <rect width="1200" height="800" fill="url(#archGrid)" />

  <!-- Sheet Border (Drafting Passe-Partout) -->
  <rect x="25" y="25" width="1150" height="750" fill="none" stroke="#111111" stroke-width="2"/>
  <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#E3DDD5" stroke-width="1"/>

  <!-- Top Reference Coordinates Grid (1..6 & A..E) -->
  <g stroke="#9B9489" stroke-width="0.75" font-size="11" fill="#6E685F" text-anchor="middle">
    <!-- Vertical Column Grids -->
    <line x1="120" y1="35" x2="120" y2="700" stroke-dasharray="8 6"/>
    <circle cx="120" cy="50" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="120" y="54" font-weight="bold">1</text>

    <line x1="360" y1="35" x2="360" y2="700" stroke-dasharray="8 6"/>
    <circle cx="360" cy="50" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="360" y="54" font-weight="bold">2</text>

    <line x1="620" y1="35" x2="620" y2="700" stroke-dasharray="8 6"/>
    <circle cx="620" cy="50" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="620" y="54" font-weight="bold">3</text>

    <line x1="880" y1="35" x2="880" y2="700" stroke-dasharray="8 6"/>
    <circle cx="880" cy="50" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="880" y="54" font-weight="bold">4</text>

    <!-- Horizontal Column Grids -->
    <line x1="45" y1="140" x2="900" y2="140" stroke-dasharray="8 6"/>
    <circle cx="60" cy="140" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="60" y="144" font-weight="bold">A</text>

    <line x1="45" y1="380" x2="900" y2="380" stroke-dasharray="8 6"/>
    <circle cx="60" cy="380" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="60" y="384" font-weight="bold">B</text>

    <line x1="45" y1="620" x2="900" y2="620" stroke-dasharray="8 6"/>
    <circle cx="60" cy="620" r="10" fill="#FFFFFF" stroke="#111111" stroke-width="1.2"/>
    <text x="60" y="624" font-weight="bold">C</text>
  </g>

  <!-- Architectural Building Envelope (Thick Load-Bearing Masonry) -->
  <!-- Exterior Walls -->
  <g fill="#FAF6F0" stroke="#111111" stroke-width="3">
    <!-- Main Shell -->
    <polygon points="120,140 880,140 880,480 810,480 810,640 460,640 460,560 120,560"/>
  </g>

  <!-- Terrace Outdoor Deck -->
  <rect x="460" y="560" width="350" height="80" fill="url(#terraceTiles)" stroke="#111111" stroke-width="2"/>
  <text x="635" y="605" font-size="12" fill="#6E685F" text-anchor="middle" font-weight="600" letter-spacing="1">DECK TERRACE • +14.250 LVL (1800 x 7800)</text>

  <!-- Interior Structural Partitions (Thick Lines) -->
  <g stroke="#111111" stroke-width="2.5" fill="none">
    <!-- Living Gallery / Master Suite Divider -->
    <line x1="460" y1="140" x2="460" y2="560" />
    <!-- Formal Foyer Divider -->
    <line x1="120" y1="320" x2="330" y2="320" />
    <!-- Ensuite Bathroom & Walk-in Closet -->
    <line x1="680" y1="140" x2="680" y2="360" />
    <line x1="460" y1="360" x2="680" y2="360" />
    <!-- Service Vestibule -->
    <line x1="330" y1="320" x2="330" y2="560" />
  </g>

  <!-- Columns (Reinforced Concrete Structural Columns) -->
  <g fill="#111111" stroke="#111111">
    <rect x="110" y="130" width="20" height="20" />
    <rect x="350" y="130" width="20" height="20" />
    <rect x="610" y="130" width="20" height="20" />
    <rect x="870" y="130" width="20" height="20" />

    <rect x="110" y="370" width="20" height="20" />
    <rect x="350" y="370" width="20" height="20" />
    <rect x="610" y="370" width="20" height="20" />
    <rect x="870" y="370" width="20" height="20" />

    <rect x="110" y="550" width="20" height="20" />
    <rect x="450" y="550" width="20" height="20" />
    <rect x="800" y="470" width="20" height="20" />
    <rect x="800" y="630" width="20" height="20" />
  </g>

  <!-- Door Swings & Openings (Architectural Quarter-Circle Arcs) -->
  <g stroke="#6E685F" stroke-width="1.2" fill="none">
    <!-- Entrance Main Pivot Door -->
    <line x1="120" y1="220" x2="160" y2="220" stroke="#111111" stroke-width="2"/>
    <line x1="160" y1="220" x2="190" y2="185" />
    <path d="M 160 220 A 45 45 0 0 1 190 185" stroke-dasharray="3 3"/>

    <!-- Master Bedroom Door -->
    <line x1="460" y1="380" x2="500" y2="380" stroke="#111111" stroke-width="2"/>
    <line x1="500" y1="380" x2="535" y2="415" />
    <path d="M 500 380 A 45 45 0 0 1 535 415" stroke-dasharray="3 3"/>

    <!-- Terrace Sliding Pivot System -->
    <rect x="520" y="556" width="240" height="8" fill="#FFFFFF" stroke="#111111" stroke-width="1.5"/>
    <line x1="520" y1="560" x2="640" y2="560" stroke="#6E685F" stroke-width="2"/>
    <line x1="640" y1="563" x2="760" y2="563" stroke="#6E685F" stroke-width="2"/>
  </g>

  <!-- REVISION 03 CLOUD & CALLOUT (The specific engineering change) -->
  <g>
    <!-- Revision Cloud on Balcony Offset (Redline Amber/Iron highlight) -->
    <path d="M 800 480 Q 790 510 805 530 Q 825 540 815 570 Q 795 595 815 620 Q 830 645 810 655 L 810 480 Z" 
          fill="rgba(196, 98, 45, 0.08)" stroke="#C4622D" stroke-width="1.8" stroke-dasharray="6 3"/>
    
    <!-- Redline Delta Callout Triangle -->
    <polygon points="840,540 855,565 825,565" fill="#C4622D"/>
    <text x="840" y="560" font-size="10" fill="#FFFFFF" text-anchor="middle" font-weight="bold">Δ3</text>

    <!-- Revision Flag Text -->
    <rect x="865" y="535" width="290" height="48" fill="#FFFFFF" stroke="#C4622D" stroke-width="1.2" rx="3"/>
    <text x="875" y="552" font-size="11" font-weight="700" fill="#C4622D">REV 03 BALCONY OFFSET ADJUSTMENT</text>
    <text x="875" y="568" font-size="9.5" fill="#6E685F">Recessed 180mm to clear vertical plumbing chase</text>
  </g>

  <!-- Architectural Room Labels & Area Metrics -->
  <g text-anchor="middle">
    <!-- Grand Living Gallery -->
    <rect x="230" y="210" width="180" height="60" fill="#FFFFFF" stroke="#E3DDD5" stroke-width="1" rx="2"/>
    <text x="320" y="234" font-size="13" font-weight="700" fill="#111111" letter-spacing="1">GRAND SALON &amp; GALLERY</text>
    <text x="320" y="252" font-size="11" fill="#6E685F">6,400 x 9,200 mm • HT: 3,450</text>
    <text x="320" y="264" font-size="9" fill="#9B9489">Fin: Statuario Polish Dry Lay</text>

    <!-- Formal Dining Passage -->
    <rect x="200" y="410" width="170" height="50" fill="#FFFFFF" stroke="#E3DDD5" stroke-width="1" rx="2"/>
    <text x="285" y="432" font-size="12" font-weight="700" fill="#111111" letter-spacing="0.8">FORMAL DINING</text>
    <text x="285" y="448" font-size="10.5" fill="#6E685F">3,800 x 4,600 mm</text>

    <!-- Master Suite -->
    <rect x="520" y="220" width="140" height="55" fill="#FFFFFF" stroke="#E3DDD5" stroke-width="1" rx="2"/>
    <text x="590" y="242" font-size="12.5" font-weight="700" fill="#111111" letter-spacing="0.8">MASTER SUITE</text>
    <text x="590" y="258" font-size="11" fill="#6E685F">5,200 x 6,800 mm</text>

    <!-- Walk-in Wardrobe Dressing -->
    <rect x="705" y="200" width="150" height="50" fill="#FFFFFF" stroke="#E3DDD5" stroke-width="1" rx="2"/>
    <text x="780" y="222" font-size="11.5" font-weight="700" fill="#111111" letter-spacing="0.6">DRESSING SALON</text>
    <text x="780" y="238" font-size="10" fill="#6E685F">Hafele Fineline Glazing</text>
  </g>

  <!-- Dimension Leaders & Witness Lines -->
  <g stroke="#111111" stroke-width="1" font-size="10" fill="#111111" text-anchor="middle">
    <!-- Horizontal Overall Dim -->
    <line x1="120" y1="100" x2="880" y2="100"/>
    <line x1="120" y1="92" x2="120" y2="108"/>
    <line x1="880" y1="92" x2="880" y2="108"/>
    <polygon points="120,100 128,97 128,103" fill="#111111"/>
    <polygon points="880,100 872,97 872,103" fill="#111111"/>
    <text x="500" y="94" font-weight="700">OVERALL SHELL WIDTH: 21,400 mm [70'-2"]</text>

    <!-- Left Vertical Overall Dim -->
    <line x1="85" y1="140" x2="85" y2="560"/>
    <line x1="77" y1="140" x2="93" y2="140"/>
    <line x1="77" y1="560" x2="93" y2="560"/>
    <text x="80" y="355" transform="rotate(-90 80 355)" font-weight="700">OVERALL SHELL DEPTH: 14,200 mm</text>
  </g>

  <!-- Safe-Build Seal & Stamp -->
  <g transform="translate(930, 60)">
    <rect width="210" height="90" fill="#FFFFFF" stroke="#111111" stroke-width="2" rx="3"/>
    <rect x="4" y="4" width="202" height="82" fill="none" stroke="#E3DDD5" stroke-width="1"/>
    <text x="105" y="24" font-size="10" fill="#111111" text-anchor="middle" font-weight="800" letter-spacing="1.5">ATELIER SAFE-BUILD SEAL</text>
    <rect x="25" y="32" width="160" height="20" fill="#111111" rx="2"/>
    <text x="105" y="46" font-size="10" fill="#FFFFFF" text-anchor="middle" font-weight="700" letter-spacing="1">LOCKED FOR CONSTRUCTION</text>
    <text x="105" y="66" font-size="9" fill="#6E685F" text-anchor="middle">ACTIVE FIELD SPRINT: 24 SEP 2026</text>
    <text x="105" y="78" font-size="8" fill="#9B9489" text-anchor="middle">HASH: #SHA-404-REV03-CONFIRMED</text>
  </g>

  <!-- Architectural Title Block (Bottom Right Drafting Legend) -->
  <g transform="translate(700, 660)">
    <rect width="460" height="95" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
    <!-- Horizontal divides -->
    <line x1="0" y1="32" x2="460" y2="32" stroke="#E3DDD5" stroke-width="1"/>
    <line x1="0" y1="64" x2="460" y2="64" stroke="#E3DDD5" stroke-width="1"/>
    <!-- Vertical divides -->
    <line x1="140" y1="0" x2="140" y2="95" stroke="#E3DDD5" stroke-width="1"/>
    <line x1="280" y1="32" x2="280" y2="95" stroke="#E3DDD5" stroke-width="1"/>
    <line x1="380" y1="32" x2="380" y2="95" stroke="#E3DDD5" stroke-width="1"/>

    <!-- Atelier Logo & Studio info -->
    <text x="12" y="16" font-size="11" font-weight="800" fill="#111111" letter-spacing="1.5">ATELIER STUDIO 05</text>
    <text x="12" y="27" font-size="8" fill="#6E685F">Architectural Core • London / Mumbai</text>

    <!-- Project Title -->
    <text x="150" y="15" font-size="8.5" fill="#6E685F" letter-spacing="1">COMMISSION / PROJECT</text>
    <text x="150" y="27" font-size="12" font-weight="700" fill="#111111">SHARMA RESIDENCE — 4BHK JUHU</text>

    <!-- Details -->
    <text x="12" y="45" font-size="8" fill="#6E685F">DRAWING TITLE</text>
    <text x="12" y="58" font-size="10" font-weight="700" fill="#111111">FLOOR PLAN — STRUCTURAL</text>

    <text x="150" y="45" font-size="8" fill="#6E685F">LEAD ARCHITECT</text>
    <text x="150" y="58" font-size="10" font-weight="600" fill="#111111">Ar. Sameer Verma</text>

    <text x="290" y="45" font-size="8" fill="#6E685F">SCALE</text>
    <text x="290" y="58" font-size="10" font-weight="600" fill="#111111">1:50 @ A1</text>

    <text x="390" y="45" font-size="8" fill="#6E685F">REVISION</text>
    <text x="390" y="60" font-size="13" font-weight="800" fill="#111111">REV 03</text>

    <!-- Bottom row -->
    <text x="12" y="77" font-size="8" fill="#6E685F">DATE OF ISSUE</text>
    <text x="12" y="88" font-size="9.5" fill="#111111">24 SEP 2026</text>

    <text x="150" y="77" font-size="8" fill="#6E685F">REF ID</text>
    <text x="150" y="88" font-size="9.5" fill="#111111">AT-JHU-404-01</text>

    <text x="290" y="77" font-size="8" fill="#6E685F">SHEET NO.</text>
    <text x="290" y="90" font-size="11" font-weight="700" fill="#111111">A-101</text>

    <rect x="385" y="68" width="65" height="22" fill="#E8DED0" stroke="#D8C9B8" stroke-width="1" rx="2"/>
    <text x="417" y="83" font-size="9" font-weight="800" fill="#111111" text-anchor="middle">ACTIVE</text>
  </g>
</svg>`;
}

function createA101Rev02Superseded() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%" style="background:#FAF8F5; font-family:'Space Grotesk', monospace;">
  <defs>
    <pattern id="archGrid2" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAE5DE" stroke-width="0.8"/>
    </pattern>
  </defs>

  <rect width="1200" height="800" fill="url(#archGrid2)" />
  <rect x="25" y="25" width="1150" height="750" fill="none" stroke="#777777" stroke-width="2"/>

  <!-- Superseded Watermark across drawing -->
  <g transform="translate(600, 400) rotate(-30)" text-anchor="middle" opacity="0.35">
    <rect x="-350" y="-45" width="700" height="90" fill="#FFFFFF" stroke="#990000" stroke-width="3" stroke-dasharray="12 6"/>
    <text x="0" y="15" font-size="44" font-weight="900" fill="#990000" letter-spacing="8">SUPERSEDED — DO NOT USE</text>
    <text x="0" y="35" font-size="16" font-weight="700" fill="#990000">REPLACED BY REV 03 ON 24 SEP 2026</text>
  </g>

  <!-- Shell Linework (Older layout without balcony recess) -->
  <polygon points="120,140 880,140 880,480 880,640 460,640 460,560 120,560" fill="#FAF6F0" stroke="#444444" stroke-width="2.5"/>
  <line x1="460" y1="140" x2="460" y2="560" stroke="#444444" stroke-width="2"/>

  <text x="500" y="240" font-size="14" fill="#666666" font-weight="bold">HISTORIC REV 02 (ARCHIVED)</text>
  <text x="500" y="260" font-size="11" fill="#888888">Old Balcony Flush Alignment (Conflict with Plumbing)</text>

  <!-- Title Block -->
  <g transform="translate(700, 660)">
    <rect width="460" height="95" fill="#FFFFFF" stroke="#777777" stroke-width="1.5"/>
    <text x="12" y="20" font-size="11" font-weight="800" fill="#555555">ATELIER STUDIO 05</text>
    <text x="12" y="55" font-size="13" font-weight="bold" fill="#777777">A-101 • REV 02 [SUPERSEDED]</text>
  </g>
</svg>`;
}

function createKitchenK201() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%" style="background:#FAF8F5; font-family:'Space Grotesk', monospace;">
  <rect width="1200" height="800" fill="#FAF8F5"/>
  <rect x="25" y="25" width="1150" height="750" fill="none" stroke="#111111" stroke-width="2"/>

  <!-- Kitchen Island Section Elevation -->
  <g transform="translate(100, 100)">
    <text x="0" y="-20" font-size="14" font-weight="bold" fill="#111111" letter-spacing="1">MODULAR KITCHEN ISLAND ELEVATION (BLUM LEGRABOX)</text>
    
    <!-- Island Base Counter -->
    <rect x="50" y="60" width="800" height="280" fill="#F5F0E9" stroke="#111111" stroke-width="2.5"/>
    <!-- Quartz 60mm Mitered Waterfall Edge -->
    <rect x="40" y="45" width="820" height="20" fill="#E8DED0" stroke="#111111" stroke-width="2"/>
    <rect x="40" y="65" width="18" height="275" fill="#E8DED0" stroke="#111111" stroke-width="1.5"/>
    <rect x="842" y="65" width="18" height="275" fill="#E8DED0" stroke="#111111" stroke-width="1.5"/>

    <!-- Blum Drawer Modules (3 bays x 3 rows) -->
    <g stroke="#111111" stroke-width="1.5" fill="#FFFFFF">
      <!-- Bay 1 -->
      <rect x="75" y="80" width="230" height="60" />
      <rect x="75" y="155" width="230" height="85" />
      <rect x="75" y="255" width="230" height="80" />

      <!-- Bay 2 (Sink module) -->
      <rect x="335" y="80" width="230" height="60" fill="#FAF8F5"/>
      <rect x="335" y="155" width="230" height="180" />
      <text x="450" y="235" font-size="11" fill="#6E685F" text-anchor="middle">BLANCO UNDERMOUNT SINK DRAIN</text>

      <!-- Bay 3 (Integrated Dishwasher & Cutlery) -->
      <rect x="595" y="80" width="230" height="60" />
      <rect x="595" y="155" width="230" height="85" />
      <rect x="595" y="255" width="230" height="80" />
    </g>

    <!-- Hardware Handles (Gola Profile Channel) -->
    <rect x="75" y="70" width="750" height="7" fill="#111111"/>
    <rect x="75" y="145" width="750" height="7" fill="#111111"/>

    <!-- Dimension Annotations -->
    <line x1="40" y1="360" x2="860" y2="360" stroke="#111111" stroke-width="1"/>
    <text x="450" y="380" font-size="12" font-weight="700" fill="#111111" text-anchor="middle">ISLAND LENGTH: 3,200 mm [10'-6"]</text>
    
    <line x1="880" y1="45" x2="880" y2="340" stroke="#111111" stroke-width="1"/>
    <text x="910" y="200" font-size="11" font-weight="700" fill="#111111" transform="rotate(90 910 200)">HEIGHT: 910 mm</text>
  </g>

  <!-- Title Block -->
  <g transform="translate(700, 660)">
    <rect width="460" height="95" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
    <text x="12" y="22" font-size="11" font-weight="800" fill="#111111">ATELIER CONTRACTING</text>
    <text x="12" y="45" font-size="9" fill="#6E685F">DRAWING TITLE</text>
    <text x="12" y="60" font-size="11" font-weight="700" fill="#111111">KITCHEN MODULAR CARCASS &amp; ISLAND</text>
    <text x="350" y="60" font-size="14" font-weight="800" fill="#111111">REV 04</text>
  </g>
</svg>`;
}

fs.writeFileSync(path.join(outDir, 'blueprint-a101-rev03.svg'), createA101Rev03());
fs.writeFileSync(path.join(outDir, 'blueprint-a101-rev02.svg'), createA101Rev02Superseded());
fs.writeFileSync(path.join(outDir, 'blueprint-k201.svg'), createKitchenK201());

console.log("Vector blueprints generated successfully!");
