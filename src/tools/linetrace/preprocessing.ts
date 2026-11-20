import type { PreprocessingOptions } from './types';

/**
 * Calculates optimal binary threshold using Otsu's method.
 * Maximizes inter-class variance of the luminance histogram.
 */
export function calculateOtsuThreshold(imageData: ImageData): number {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    // Standard perceptual luminance
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[lum]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varianceBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varianceBetween > maxVariance) {
      maxVariance = varianceBetween;
      threshold = t;
    }
  }

  // Safety bounds for line art
  return Math.min(240, Math.max(15, threshold));
}

/**
 * Applies a 3x3 morphological despeckle filter to eliminate isolated single-pixel dust and scanner noise.
 */
function applyDespeckle(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): void {
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const isDark = copy[idx] < threshold;

      // Only check dark pixels to clean noise specks
      if (isDark) {
        let darkNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            if (copy[nIdx] < threshold) {
              darkNeighbors++;
            }
          }
        }

        // If isolated with 0 or 1 neighbor, turn it to white background
        if (darkNeighbors <= 1) {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
        }
      }
    }
  }
}

export interface PreprocessingResult {
  imageData: ImageData;
  dataUrl: string;
  effectiveThreshold: number;
}

/**
 * Runs full canvas preprocessing on the source image:
 * 1. Grayscale luminance conversion
 * 2. Inversion (for white-on-black inputs)
 * 3. Thresholding (Otsu auto or manual slider)
 * 4. Despeckle noise removal
 * 5. Generates high-speed live preview data URL
 */
export async function preprocessImage(
  sourceCanvas: HTMLCanvasElement,
  options: PreprocessingOptions
): Promise<PreprocessingResult> {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Unable to acquire 2D rendering context from canvas');
  }

  const { width, height } = sourceCanvas;
  const srcImageData = ctx.getImageData(0, 0, width, height);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    throw new Error('Unable to create output canvas context');
  }

  const outImageData = outCtx.createImageData(width, height);
  const src = srcImageData.data;
  const dst = outImageData.data;

  // Determine threshold
  const effectiveThreshold = options.autoThreshold
    ? calculateOtsuThreshold(srcImageData)
    : options.threshold;

  // 1. Grayscale & Invert & Threshold
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];

    // Transparent pixel treated as white background
    if (a < 16) {
      dst[i] = 255;
      dst[i + 1] = 255;
      dst[i + 2] = 255;
      dst[i + 3] = 255;
      continue;
    }

    let lum: number;
    if (options.grayscale) {
      lum = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
    } else {
      lum = Math.round((src[i] + src[i + 1] + src[i + 2]) / 3);
    }

    if (options.invert) {
      lum = 255 - lum;
    }

    // Binary separation
    const val = lum <= effectiveThreshold ? 0 : 255;
    dst[i] = val;
    dst[i + 1] = val;
    dst[i + 2] = val;
    dst[i + 3] = 255;
  }

  // 2. Despeckle if enabled
  if (options.despeckle) {
    applyDespeckle(dst, width, height, effectiveThreshold);
  }

  outCtx.putImageData(outImageData, 0, 0);
  const dataUrl = outCanvas.toDataURL('image/png');

  return {
    imageData: outImageData,
    dataUrl,
    effectiveThreshold,
  };
}
