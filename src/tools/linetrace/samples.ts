export interface SampleItem {
  id: string;
  name: string;
  svg: string;
  filename: string;
}

export const SAMPLE_ICONS: SampleItem[] = [
  {
    id: 'icon-camera',
    name: 'Camera Icon',
    filename: 'icon-camera.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <path d="M24 40 L40 40 L48 28 L80 28 L88 40 L104 40 C110 40 114 44 114 50 L114 96 C114 102 110 106 104 106 L24 106 C18 106 14 102 14 96 L14 50 C14 44 18 40 24 40 Z" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="64" cy="73" r="22" fill="none" stroke="#111111" stroke-width="6"/>
      <circle cx="94" cy="50" r="4" fill="#111111"/>
    </svg>`,
  },
  {
    id: 'icon-shield',
    name: 'Shield Icon',
    filename: 'icon-shield.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <path d="M64 20 L100 34 C100 74 64 104 64 108 C64 104 28 74 28 34 Z" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 64 L58 74 L80 50" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'icon-compass',
    name: 'Compass Icon',
    filename: 'icon-compass.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <circle cx="64" cy="64" r="44" fill="none" stroke="#111111" stroke-width="6"/>
      <polygon points="78,48 50,60 48,78 76,66" fill="none" stroke="#111111" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="64" cy="64" r="3" fill="#111111"/>
    </svg>`,
  },
  {
    id: 'icon-heart',
    name: 'Heart Icon',
    filename: 'icon-heart.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <path d="M64 98 C64 98 22 72 22 46 C22 32 34 22 46 22 C55 22 61 28 64 33 C67 28 73 22 82 22 C94 22 106 32 106 46 C106 72 64 98 64 98 Z" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'icon-bookmark',
    name: 'Bookmark Icon',
    filename: 'icon-bookmark.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <path d="M36 22 L92 22 C96 22 98 25 98 28 L98 106 L64 86 L30 106 L30 28 C30 25 32 22 36 22 Z" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'icon-lightning',
    name: 'Lightning Icon',
    filename: 'icon-lightning.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#FFFFFF"/>
      <polygon points="68,16 34,70 62,70 58,112 94,56 66,56" fill="none" stroke="#111111" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`,
  },
];

export const SAMPLE_LOGO: SampleItem = {
  id: 'sample-logo',
  name: 'Geometric Monogram Logo',
  filename: 'sample-logo-monogram.svg',
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <rect width="256" height="256" fill="#FFFFFF"/>
    <g transform="translate(128,128)">
      <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="none" stroke="#111111" stroke-width="10" stroke-linejoin="round"/>
      <polygon points="0,-54 47,-27 47,27 0,54 -47,27 -47,-27" fill="none" stroke="#111111" stroke-width="8" stroke-linejoin="round"/>
      <line x1="0" y1="-90" x2="0" y2="-54" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <line x1="78" y1="-45" x2="47" y2="-27" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <line x1="78" y1="45" x2="47" y2="27" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <line x1="0" y1="90" x2="0" y2="54" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <line x1="-78" y1="45" x2="-47" y2="27" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <line x1="-78" y1="-45" x2="-47" y2="-27" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="14" fill="#111111"/>
    </g>
  </svg>`,
};

export const SAMPLE_SKETCH: SampleItem = {
  id: 'sample-sketch',
  name: 'Hand-Drawn Botanical Sketch',
  filename: 'sample-sketch-botanical.svg',
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <rect width="256" height="256" fill="#FFFFFF"/>
    <!-- Organic hand-drawn botanical stem and curved leaves with sketch line variations -->
    <path d="M 60 210 Q 95 160 120 120 Q 155 70 190 35" fill="none" stroke="#1E1E1E" stroke-width="5" stroke-linecap="round"/>
    <path d="M 58 208 Q 94 158 118 118 Q 154 68 188 36" fill="none" stroke="#333333" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Top Leaf -->
    <path d="M 190 35 C 160 30 140 50 150 75 C 165 65 185 45 190 35 Z" fill="none" stroke="#222222" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 152 70 Q 170 50 185 38" fill="none" stroke="#444444" stroke-width="2"/>
    <line x1="162" y1="60" x2="155" y2="50" stroke="#555555" stroke-width="1.8"/>
    <line x1="172" y1="52" x2="168" y2="44" stroke="#555555" stroke-width="1.8"/>

    <!-- Left Leaf 1 -->
    <path d="M 120 120 C 70 110 50 135 65 165 C 90 155 110 135 120 120 Z" fill="none" stroke="#1F1F1F" stroke-width="4.2" stroke-linejoin="round"/>
    <path d="M 68 160 Q 92 138 118 122" fill="none" stroke="#333333" stroke-width="2.2"/>
    <line x1="82" y1="150" x2="72" y2="140" stroke="#555555" stroke-width="1.8"/>
    <line x1="98" y1="138" x2="88" y2="128" stroke="#555555" stroke-width="1.8"/>
    <line x1="108" y1="130" x2="102" y2="122" stroke="#555555" stroke-width="1.8"/>

    <!-- Right Leaf 1 -->
    <path d="M 135 100 C 180 85 200 110 185 140 C 160 130 145 115 135 100 Z" fill="none" stroke="#252525" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 180 136 Q 160 116 137 102" fill="none" stroke="#333333" stroke-width="2.2"/>
    <line x1="170" y1="126" x2="180" y2="116" stroke="#555555" stroke-width="1.8"/>
    <line x1="156" y1="116" x2="166" y2="106" stroke="#555555" stroke-width="1.8"/>

    <!-- Left Leaf 2 -->
    <path d="M 85 170 C 45 175 35 195 50 215 C 70 205 80 188 85 170 Z" fill="none" stroke="#222222" stroke-width="3.8" stroke-linejoin="round"/>
    <path d="M 52 210 Q 68 190 83 172" fill="none" stroke="#444444" stroke-width="2"/>
    <line x1="62" y1="200" x2="56" y2="192" stroke="#666666" stroke-width="1.5"/>
    <line x1="72" y1="188" x2="68" y2="182" stroke="#666666" stroke-width="1.5"/>
  </svg>`,
};

export function sampleToBlob(sample: SampleItem): Blob {
  return new Blob([sample.svg], { type: 'image/svg+xml' });
}

export function sampleToFile(sample: SampleItem): File {
  return new File([sampleToBlob(sample)], sample.filename, {
    type: 'image/svg+xml',
    lastModified: Date.now(),
  });
}
