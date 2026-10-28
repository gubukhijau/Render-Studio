export interface SampleSketch {
  id: string;
  title: string;
  projectType: 'Exterior' | 'Interior' | 'Landscape' | 'Commercial';
  defaultStyle: 'Minimalist' | 'Modern Tropical' | 'Contemporary' | 'Industrial' | 'Scandinavian' | 'Luxury';
  defaultMaterials: string[];
  defaultLighting: 'daylight' | 'golden hour' | 'overcast' | 'sunset' | 'night';
  defaultAspectRatio: '1:1' | '4:3' | '3:2' | '16:9';
  description: string;
  dataUrl: string;
}

// Convert SVG to clean Base64 Data URL
function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}

const villaSketchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#f8f7f4"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8e5dc" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grid)"/>

  <!-- Horizon & Ground line -->
  <line x1="60" y1="620" x2="1140" y2="620" stroke="#1c2027" stroke-width="3"/>
  <line x1="60" y1="628" x2="1140" y2="628" stroke="#8b8778" stroke-width="1" stroke-dasharray="8,6"/>

  <!-- Cantilever Upper Box -->
  <polygon points="260,260 920,260 880,440 220,440" fill="#ffffff" fill-opacity="0.9" stroke="#1c2027" stroke-width="3.5" stroke-linejoin="round"/>
  <!-- Upper overhang depth -->
  <polygon points="920,260 980,290 940,470 880,440" fill="#ebe7dd" stroke="#1c2027" stroke-width="2.5"/>
  <polygon points="220,440 880,440 940,470 280,470" fill="#dad5c8" stroke="#1c2027" stroke-width="2.5"/>

  <!-- Upper Ribbon Glass Window -->
  <polygon points="280,300 860,300 840,410 260,410" fill="#d8e2dc" fill-opacity="0.5" stroke="#1c2027" stroke-width="2"/>
  <line x1="450" y1="300" x2="440" y2="410" stroke="#1c2027" stroke-width="2"/>
  <line x1="650" y1="300" x2="640" y2="410" stroke="#1c2027" stroke-width="2"/>
  <!-- Window mullions & reflections -->
  <line x1="300" y1="310" x2="380" y2="400" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="480" y1="310" x2="570" y2="400" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>

  <!-- Lower Ground Floor (Recessed Glass & Stone Wall) -->
  <polygon points="320,470 840,470 840,620 320,620" fill="#fcfbf9" stroke="#1c2027" stroke-width="3"/>
  <!-- Stone feature wall on left -->
  <polygon points="180,380 320,380 320,620 180,620" fill="#ebe7dd" stroke="#1c2027" stroke-width="3"/>
  <!-- Stone texture lines -->
  <line x1="180" y1="420" x2="320" y2="420" stroke="#9d9889" stroke-width="1.5"/>
  <line x1="180" y1="470" x2="320" y2="470" stroke="#9d9889" stroke-width="1.5"/>
  <line x1="180" y1="520" x2="320" y2="520" stroke="#9d9889" stroke-width="1.5"/>
  <line x1="180" y1="570" x2="320" y2="570" stroke="#9d9889" stroke-width="1.5"/>

  <!-- Lower Glass Sliding Doors -->
  <rect x="360" y="490" width="220" height="130" fill="#d8e2dc" fill-opacity="0.4" stroke="#1c2027" stroke-width="2"/>
  <rect x="580" y="490" width="220" height="130" fill="#d8e2dc" fill-opacity="0.4" stroke="#1c2027" stroke-width="2"/>
  <line x1="470" y1="490" x2="470" y2="620" stroke="#1c2027" stroke-width="2"/>
  <line x1="690" y1="490" x2="690" y2="620" stroke="#1c2027" stroke-width="2"/>

  <!-- Reflection Pool / Terrace Foreground -->
  <polygon points="120,640 1080,640 1020,730 180,730" fill="#edf4f2" stroke="#1c2027" stroke-width="2.5"/>
  <line x1="200" y1="670" x2="1000" y2="670" stroke="#b2c9c2" stroke-width="1.5" stroke-dasharray="12,10"/>
  <line x1="240" y1="700" x2="960" y2="700" stroke="#b2c9c2" stroke-width="1.5" stroke-dasharray="16,12"/>

  <!-- Architectural Trees & Landscaping -->
  <path d="M 980,620 C 970,550 960,480 970,420 C 985,360 1030,340 1050,380 C 1070,420 1060,520 1040,620 Z" fill="#e2ebd8" stroke="#1c2027" stroke-width="2"/>
  <line x1="1010" y1="620" x2="1010" y2="400" stroke="#1c2027" stroke-width="2"/>

  <!-- Human Scale Figure -->
  <circle cx="890" cy="560" r="6" fill="#1c2027"/>
  <line x1="890" y1="566" x2="890" y2="600" stroke="#1c2027" stroke-width="2.5"/>
  <line x1="890" y1="600" x2="885" y2="620" stroke="#1c2027" stroke-width="2"/>
  <line x1="890" y1="600" x2="895" y2="620" stroke="#1c2027" stroke-width="2"/>

  <!-- Title annotation -->
  <text x="70" y="90" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="700" fill="#1c2027">PROJECT: VILLA MONOLITH</text>
  <text x="70" y="120" font-family="'Manrope', sans-serif" font-size="14" font-weight="500" fill="#716d63">SOUTH-FACING FACADE SCHEMATIC SKETCH // REV 04</text>
</svg>`;

const interiorSketchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#f8f7f4"/>
  <defs>
    <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8e5dc" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grid2)"/>

  <!-- Perspective Room Outline (One-Point Perspective) -->
  <polygon points="100,100 1100,100 880,240 320,240" fill="#ebe7dd" stroke="#1c2027" stroke-width="2.5"/> <!-- Ceiling -->
  <polygon points="100,700 1100,700 880,560 320,560" fill="#dfdacd" stroke="#1c2027" stroke-width="2.5"/> <!-- Floor -->
  <polygon points="100,100 320,240 320,560 100,700" fill="#e4e0d4" stroke="#1c2027" stroke-width="2.5"/> <!-- Left Wall -->
  <polygon points="1100,100 880,240 880,560 1100,700" fill="#d9d3c5" stroke="#1c2027" stroke-width="2.5"/> <!-- Right Wall -->
  <rect x="320" y="240" width="560" height="320" fill="#ffffff" stroke="#1c2027" stroke-width="3"/> <!-- Back Wall -->

  <!-- Left Floor-to-Ceiling Glass Opening with Mountain View -->
  <polygon points="140,160 290,260 290,530 140,640" fill="#dce6e5" stroke="#1c2027" stroke-width="2"/>
  <line x1="215" y1="210" x2="215" y2="585" stroke="#1c2027" stroke-width="2.5"/>

  <!-- Wooden Slat Feature on Back Wall -->
  <rect x="340" y="260" width="220" height="280" fill="#efe8db" stroke="#1c2027" stroke-width="2"/>
  <line x1="360" y1="260" x2="360" y2="540" stroke="#bca891" stroke-width="2"/>
  <line x1="380" y1="260" x2="380" y2="540" stroke="#bca891" stroke-width="2"/>
  <line x1="400" y1="260" x2="400" y2="540" stroke="#bca891" stroke-width="2"/>
  <line x1="420" y1="260" x2="420" y2="540" stroke="#bca891" stroke-width="2"/>
  <line x1="440" y1="260" x2="440" y2="540" stroke="#bca891" stroke-width="2"/>
  <line x1="460" y1="260" x2="460" y2="540" stroke="#bca891" stroke-width="2"/>

  <!-- Floating Media Console & Minimal Fireplace -->
  <rect x="340" y="480" width="520" height="50" fill="#292e38" stroke="#1c2027" stroke-width="2.5"/>
  <rect x="620" y="410" width="180" height="70" fill="#1c2027" stroke="#1c2027" stroke-width="2"/>

  <!-- Low Profile Scandinavian Sofa & Lounge -->
  <polygon points="460,530 820,530 870,640 400,640" fill="#ffffff" stroke="#1c2027" stroke-width="3"/>
  <polygon points="400,640 870,640 860,670 390,670" fill="#d0cdc5" stroke="#1c2027" stroke-width="2"/>
  <!-- Cushions -->
  <rect x="440" y="520" width="180" height="60" rx="6" fill="#eae8e2" stroke="#1c2027" stroke-width="2"/>
  <rect x="640" y="520" width="180" height="60" rx="6" fill="#eae8e2" stroke="#1c2027" stroke-width="2"/>

  <!-- Coffee Table (Travertine/Glass) -->
  <polygon points="520,660 760,660 740,710 490,710" fill="#faf8f5" stroke="#1c2027" stroke-width="2.5"/>

  <!-- Overhead Architectural Track Lighting -->
  <line x1="360" y1="180" x2="840" y2="180" stroke="#1c2027" stroke-width="2.5"/>
  <circle cx="440" cy="180" r="5" fill="#1c2027"/>
  <circle cx="560" cy="180" r="5" fill="#1c2027"/>
  <circle cx="680" cy="180" r="5" fill="#1c2027"/>
  <circle cx="800" cy="180" r="5" fill="#1c2027"/>

  <!-- Text Annotations -->
  <text x="70" y="90" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="700" fill="#1c2027">INTERIOR: SCANDINAVIAN RESIDENCE</text>
  <text x="70" y="120" font-family="'Manrope', sans-serif" font-size="14" font-weight="500" fill="#716d63">MAIN LIVING LOUNGE &amp; TIMBER FEATURE WALL</text>
</svg>`;

const commercialTowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#f8f7f4"/>
  <defs>
    <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e8e5dc" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grid3)"/>

  <!-- Ground Plaza Line -->
  <line x1="80" y1="680" x2="1120" y2="680" stroke="#1c2027" stroke-width="3"/>

  <!-- Tower Body (Perspective looking up) -->
  <polygon points="460,80 740,110 770,680 430,680" fill="#ffffff" stroke="#1c2027" stroke-width="3"/>
  <polygon points="740,110 840,150 870,680 770,680" fill="#ebe7dd" stroke="#1c2027" stroke-width="2.5"/>

  <!-- Sky Garden Cutout on Tower Floor 18 -->
  <polygon points="450,340 750,360 750,420 440,400" fill="#dce6d5" stroke="#1c2027" stroke-width="2.5"/>
  <line x1="450" y1="420" x2="750" y2="420" stroke="#1c2027" stroke-width="2"/>

  <!-- Tower Curtain Wall Grid Lines -->
  <!-- Vertical Mullions -->
  <line x1="490" y1="90" x2="480" y2="680" stroke="#716d63" stroke-width="1.5"/>
  <line x1="530" y1="95" x2="530" y2="680" stroke="#716d63" stroke-width="1.5"/>
  <line x1="570" y1="100" x2="580" y2="680" stroke="#716d63" stroke-width="1.5"/>
  <line x1="620" y1="103" x2="630" y2="680" stroke="#716d63" stroke-width="1.5"/>
  <line x1="670" y1="106" x2="680" y2="680" stroke="#716d63" stroke-width="1.5"/>
  <line x1="710" y1="108" x2="730" y2="680" stroke="#716d63" stroke-width="1.5"/>

  <!-- Horizontal Floor Slabs -->
  <line x1="460" y1="140" x2="845" y2="175" stroke="#1c2027" stroke-width="2"/>
  <line x1="455" y1="200" x2="850" y2="230" stroke="#1c2027" stroke-width="2"/>
  <line x1="450" y1="260" x2="855" y2="285" stroke="#1c2027" stroke-width="2"/>
  <line x1="440" y1="460" x2="860" y2="480" stroke="#1c2027" stroke-width="2"/>
  <line x1="435" y1="520" x2="865" y2="535" stroke="#1c2027" stroke-width="2"/>
  <line x1="430" y1="580" x2="868" y2="590" stroke="#1c2027" stroke-width="2"/>

  <!-- Podium Canopy -->
  <polygon points="320,600 890,600 940,680 280,680" fill="#dad5c8" stroke="#1c2027" stroke-width="3"/>

  <!-- Title Annotation -->
  <text x="70" y="90" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="700" fill="#1c2027">COMMERCIAL: THE NEXUS TOWER</text>
  <text x="70" y="120" font-family="'Manrope', sans-serif" font-size="14" font-weight="500" fill="#716d63">MIXED-USE SUSTAINABLE OFFICE &amp; SKY ATRIUM</text>
</svg>`;

export const SAMPLE_SKETCHES: SampleSketch[] = [
  {
    id: 'villa-monolith',
    title: 'Modern Minimalist Villa Facade',
    projectType: 'Exterior',
    defaultStyle: 'Modern Tropical',
    defaultMaterials: ['concrete', 'natural wood', 'glass', 'stone'],
    defaultLighting: 'golden hour',
    defaultAspectRatio: '16:9',
    description: 'Cantilevered upper volume with ribbon glazing, stone accent wall, and reflection pool terrace.',
    dataUrl: svgToDataUrl(villaSketchSvg),
  },
  {
    id: 'scandi-interior',
    title: 'Scandinavian Living Space',
    projectType: 'Interior',
    defaultStyle: 'Scandinavian',
    defaultMaterials: ['natural wood', 'concrete', 'glass', 'travertine'],
    defaultLighting: 'daylight',
    defaultAspectRatio: '16:9',
    description: 'Floor-to-ceiling panoramic glass, timber slat feature wall, low-profile lounge furniture, and architectural track lighting.',
    dataUrl: svgToDataUrl(interiorSketchSvg),
  },
  {
    id: 'nexus-tower',
    title: 'The Nexus Commercial Tower',
    projectType: 'Commercial',
    defaultStyle: 'Contemporary',
    defaultMaterials: ['glass', 'black steel', 'concrete', 'bronze metal'],
    defaultLighting: 'sunset',
    defaultAspectRatio: '16:9',
    description: 'High-rise glazed curtain wall tower with integrated sky garden atrium and broad entrance canopy.',
    dataUrl: svgToDataUrl(commercialTowerSvg),
  },
];
