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
