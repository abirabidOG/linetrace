import JSZip from 'jszip';
import type { BackgroundMode, ImageQueueItem } from './types';

/**
 * Downloads a string as an SVG file.
 */
export function downloadSvgFile(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Rasterizes SVG to high-resolution PNG at 1x, 2x, or 4x scale.
 */
export async function downloadPngFile(
  svgContent: string,
  baseFilename: string,
  scale: 1 | 2 | 4 = 2,
  background: BackgroundMode = 'transparent',
  width?: number,
  height?: number
): Promise<void> {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG for PNG rasterization'));
    img.src = url;
  });

  const baseW = width || img.naturalWidth || 512;
  const baseH = height || img.naturalHeight || 512;

  const canvas = document.createElement('canvas');
  canvas.width = baseW * scale;
  canvas.height = baseH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Canvas 2D context unavailable');
  }

  // Draw background if not transparent
  if (background === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (background === 'dark') {
    ctx.fillStyle = '#0B0B0D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  canvas.toBlob((pngBlob) => {
    if (!pngBlob) return;
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    const cleanName = baseFilename.replace(/\.[^/.]+$/, '');
    a.href = pngUrl;
    a.download = `${cleanName}-${scale}x.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  }, 'image/png');
}

/**
 * Phase 2: Rasterize SVG to exact target dimension (512, 1024, 2000 px)
 */
export async function downloadPngDimension(
  svgContent: string,
  baseFilename: string,
  targetDimension: 512 | 1024 | 2000 = 1024,
  background: 'transparent' | 'white' = 'transparent'
): Promise<void> {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG for PNG rasterization'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetDimension;
  canvas.height = targetDimension;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Canvas 2D context unavailable');
  }

  if (background === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetDimension, targetDimension);
  } else {
    ctx.clearRect(0, 0, targetDimension, targetDimension);
  }

  const w = img.naturalWidth || targetDimension;
  const h = img.naturalHeight || targetDimension;
  const scale = Math.min(targetDimension / w, targetDimension / h);
  const dw = w * scale;
  const dh = h * scale;
  const dx = (targetDimension - dw) / 2;
  const dy = (targetDimension - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
  URL.revokeObjectURL(url);

  canvas.toBlob((pngBlob) => {
    if (!pngBlob) return;
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    const cleanName = baseFilename.replace(/\.[^/.]+$/, '');
    a.href = pngUrl;
    a.download = `${cleanName}-${targetDimension}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  }, 'image/png');
}

/**
 * Phase 2: Generates a seamless repeating pattern SVG from the traced shape with density and spacing controls
 */
export function generatePatternSvg(
  svgContent: string,
  width = 800,
  height = 800,
  density = 1, // 0.5 (sparse) to 2.0 (dense)
  spacing = 24 // extra spacing in px
): string {
  const pathMatches = svgContent.match(/<path[\s\S]*?\/>/gi) || [];
  const innerPaths = pathMatches.join('\n      ');
  const baseSize = 80;
  const cellSize = Math.max(40, Math.round(baseSize / density + spacing));
  const motifScale = (baseSize / 500) * density;
  const offset = cellSize / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="traced-pattern" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
      <g transform="translate(${offset}, ${offset}) scale(${motifScale}) translate(-250, -250)">
        ${innerPaths}
      </g>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#F4F2EC"/>
  <rect width="100%" height="100%" fill="url(#traced-pattern)"/>
</svg>`;
}

/**
 * Phase 2: CSS snippet for repeating pattern
 */
export function getPatternCssSnippet(
  svgContent: string,
  density = 1,
  spacing = 24
): string {
  const patternSvg = generatePatternSvg(svgContent, 400, 400, density, spacing);
  const base64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(patternSvg)))
    : Buffer.from(patternSvg).toString('base64');
  return `/* LineTrace Pattern Background */\nbackground-color: #F4F2EC;\nbackground-image: url('data:image/svg+xml;base64,${base64}');\nbackground-repeat: repeat;\nbackground-size: ${Math.round(80 / density + spacing)}px ${Math.round(80 / density + spacing)}px;`;
}


/**
 * Phase 2: Generates real SVG mock templates (Business Card, Avatar, Sticker Sheet)
 */
export function generateTemplateSvg(
  svgContent: string,
  template: 'business_card' | 'avatar' | 'sticker_sheet'
): string {
  const pathMatches = svgContent.match(/<path[\s\S]*?\/>/gi) || [];
  const innerPaths = pathMatches.join('\n      ');

  if (template === 'business_card') {
    // 1050 x 600 px (3.5" x 2" at 300 DPI)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="600" viewBox="0 0 1050 600">
  <rect width="1050" height="600" fill="#F4F2EC"/>
  <rect x="40" y="40" width="970" height="520" rx="16" fill="#FFFFFF" stroke="#C9C7C1" stroke-width="2"/>
  <g transform="translate(100, 150) scale(0.6)">
    ${innerPaths}
  </g>
  <text x="500" y="240" font-family="'Inter Tight', system-ui, sans-serif" font-weight="800" font-size="36" fill="#0B0B0D">ALEXANDER MAHMUD</text>
  <text x="500" y="285" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="18" fill="#5846F6">CREATIVE DIRECTOR & FOUNDER</text>
  <line x1="500" y1="320" x2="900" y2="320" stroke="#C9C7C1" stroke-width="1.5"/>
  <text x="500" y="360" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#4F4E55">hello@brand.studio • +1 (555) 019-2831</text>
  <text x="500" y="395" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#4F4E55">www.brand.studio • London, United Kingdom</text>
</svg>`;
  }

  if (template === 'avatar') {
    // 600 x 600 px circular avatar profile badge
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#F4F2EC"/>
  <circle cx="300" cy="300" r="240" fill="#FFFFFF" stroke="#5846F6" stroke-width="8"/>
  <g transform="translate(150, 150) scale(0.6)">
    ${innerPaths}
  </g>
</svg>`;
  }

  // Sticker Sheet (1200 x 1600 px with 3x4 grid)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#FFFFFF"/>
  <text x="600" y="90" font-family="'Inter Tight', sans-serif" font-weight="800" font-size="32" text-anchor="middle" fill="#0B0B0D">PRECISION DIE-CUT STICKER SHEET</text>
  <text x="600" y="130" font-family="Inter, sans-serif" font-size="18" text-anchor="middle" fill="#4F4E55">Kiss-Cut Vector Badges • 300 DPI Print Ready</text>
  <g transform="translate(100, 180)">
    ${[0, 1, 2].map((col) =>
      [0, 1, 2, 3].map((row) => `
      <g transform="translate(${col * 350}, ${row * 330})">
        <rect width="300" height="280" rx="24" fill="#F4F2EC" stroke="#C9C7C1" stroke-dasharray="6,4" stroke-width="2"/>
        <g transform="translate(50, 40) scale(0.4)">
          ${innerPaths}
        </g>
      </g>`).join('')
    ).join('')}
  </g>
</svg>`;
}

/**
 * Copies SVG text directly to the clipboard.
 */
export async function copySvgToClipboard(svgContent: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(svgContent);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = svgContent;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Packages all traced SVGs (and high-resolution PNGs if requested) into a single ZIP archive.
 */
export async function downloadAllAsZip(
  items: ImageQueueItem[],
  includePng: boolean = false,
  pngScale: 1 | 2 | 4 = 2,
  background: BackgroundMode = 'transparent'
): Promise<void> {
  const zip = new JSZip();
  const validItems = items.filter((item) => item.svgOutput && item.status === 'done');

  if (validItems.length === 0) {
    throw new Error('No completed vector traces available to package');
  }

  const svgFolder = zip.folder('svg') || zip;
  const pngFolder = includePng ? zip.folder('png') : null;

  for (const item of validItems) {
    const cleanName = item.name.replace(/\.[^/.]+$/, '');
    svgFolder.file(`${cleanName}.svg`, item.svgOutput!);

    if (includePng && pngFolder) {
      try {
        const svgBlob = new Blob([item.svgOutput!], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to rasterize PNG for zip'));
          img.src = url;
        });

        const w = (item.width || 512) * pngScale;
        const h = (item.height || 512) * pngScale;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          if (background === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
          } else if (background === 'dark') {
            ctx.fillStyle = '#0B0B0D';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          const pngDataUrl = canvas.toDataURL('image/png');
          const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
          pngFolder.file(`${cleanName}-${pngScale}x.png`, base64Data, { base64: true });
        }
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn(`Could not add PNG for ${cleanName} to zip:`, err);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = zipUrl;
  a.download = 'linetrace-vectors.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
}
