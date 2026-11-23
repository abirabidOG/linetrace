import ImageTracer from './imagetracer.js';
import type {
  TraceOptions,
  PreprocessingOptions,
  PresetConfig,
  PresetType,
  PipelineStage,
} from './types';
import { preprocessImage } from './preprocessing';
import { computeQualityMetrics } from './qualityMetrics';

export const PRESET_CONFIGS: Record<Exclude<PresetType, 'custom'>, PresetConfig> = {
  icon: {
    threshold: 180,
    autoThreshold: true,
    despeckle: true,
    invert: false,
    grayscale: true,
    quality: 'standard',
    pathOptimization: 0.55, // Clean, rounded curves, balanced nodes
    colorMode: 'mono',
    posterizeColors: 4,
  },
  logo: {
    threshold: 128,
    autoThreshold: true,
    despeckle: false,
    invert: false,
    grayscale: true,
    quality: 'precise',
    pathOptimization: 0.25, // High fidelity, keeps fine crisp geometric lines and curves
    colorMode: 'mono',
    posterizeColors: 4,
  },
  sketch: {
    threshold: 200,
    autoThreshold: true,
    despeckle: false,
    invert: false,
    grayscale: true,
    quality: 'standard',
    pathOptimization: 0.45, // Balanced tolerance for hand-drawn pencil/ink strokes
    colorMode: 'mono',
    posterizeColors: 4,
  },
  signature: {
    threshold: 110,
    autoThreshold: false,
    despeckle: false,
    invert: false,
    grayscale: true,
    quality: 'precise',
    pathOptimization: 0.15, // Keeps thin hair-lines and delicate signature loops
    colorMode: 'mono',
    posterizeColors: 4,
  },
};

export interface TraceProgressCallback {
  (stage: PipelineStage, progress: number): void;
}

export interface TraceResult {
  svg: string;
  preprocessedDataUrl: string;
  metrics: {
    pixelIoU: number;
    pathCount: number;
    nodeCount: number;
    openGaps: number;
  };
}

/**
 * Normalizes and post-processes raw ImageTracer SVG output:
 * - Strips unwanted descriptions, comments, and fractional opacity jitter
 * - Ensures scalable viewBox="0 0 w h" and responsive width="100%" height="100%"
 * - In Mono mode: strips near-white background path (RGB >= 235) and recolors ink paths
 * - Applies stroke harmonization if toggled
 * - Injects background if requested (white or dark)
 */
export function cleanTracedSvg(
  rawSvg: string,
  width: number,
  height: number,
  options: TraceOptions
): string {
  let cleaned = rawSvg;

  // Remove comment & XML header
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/desc="[^"]*"/g, '');

  // Standardize root SVG element: responsive 100% sizing and clean viewBox
  cleaned = cleaned.replace(
    /<svg[^>]*>/i,
    `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`
  );

  const strokeHex = options.strokeColor || '#111111';

  // Mono Mode Line Art Extraction
  if (options.colorMode === 'mono') {
    // In Mono mode, remove light background paths (RGB >= 235)
    cleaned = cleaned.replace(
      /<path\b[^>]*\bfill="rgb\((\d+),\s*(\d+),\s*(\d+)\)"[^>]*\/>/gi,
      (match, r, g, b) => {
        if (+r >= 235 && +g >= 235 && +b >= 235) {
          return ''; // Strip white/near-white background path
        }
        // Normalize black/dark strokes with chosen ink color
        let p = match;
        p = p.replace(/fill="[^"]*"/, `fill="${strokeHex}"`);
        if (options.harmonizeStroke) {
          const targetWidth = Math.max(0.5, options.targetStrokeWidth || 2);
          p = p.replace(/stroke="[^"]*"/, `stroke="${strokeHex}"`);
          p = p.replace(/stroke-width="[^"]*"/, `stroke-width="${targetWidth}"`);
          if (!p.includes('stroke-linecap')) {
            p = p.replace(/>$/, ' stroke-linecap="round" stroke-linejoin="round"/>');
          }
        } else {
          p = p.replace(/stroke="[^"]*"/, `stroke="${strokeHex}"`);
          p = p.replace(
            /stroke-width="[^"]*"/,
            `stroke-width="0.3" stroke-linejoin="round" stroke-linecap="round"`
          );
        }
        // Clean fractional opacity jitter like opacity="0.996078431372549"
        p = p.replace(/\s*opacity="0\.99\d+"/g, '');
        return p;
      }
    );
  }

  // Inject user background if not transparent
  if (options.background === 'white') {
    cleaned = cleaned.replace(
      /(<svg[^>]*>)/i,
      `$1\n  <rect width="100%" height="100%" fill="#FFFFFF"/>`
    );
  } else if (options.background === 'dark') {
    cleaned = cleaned.replace(
      /(<svg[^>]*>)/i,
      `$1\n  <rect width="100%" height="100%" fill="#0B0B0D"/>`
    );
  }

  return cleaned.trim();
}

/**
 * Centerline thinning algorithm (Zhang-Suen) for signatures, monoline strokes and calligraphy
 */
export function traceCenterline(
  imageData: ImageData,
  options: TraceOptions,
  upscaleFactor: number = 1
): string {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;

  // 1. Create binary 2D grid: 1 = stroke (dark), 0 = background (light)
  const grid = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    grid[i / 4] = a > 128 && lum < 160 ? 1 : 0;
  }

  // 2. Zhang-Suen thinning iterations
  let changed = true;
  const toDelete = new Uint8Array(w * h);

  while (changed) {
    changed = false;

    // Sub-iteration 1
    toDelete.fill(0);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (grid[idx] !== 1) continue;

        const p2 = grid[(y - 1) * w + x];
        const p3 = grid[(y - 1) * w + x + 1];
        const p4 = grid[y * w + x + 1];
        const p5 = grid[(y + 1) * w + x + 1];
        const p6 = grid[(y + 1) * w + x];
        const p7 = grid[(y + 1) * w + x - 1];
        const p8 = grid[y * w + x - 1];
        const p9 = grid[(y - 1) * w + x - 1];

        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;

        let A = 0;
        if (p2 === 0 && p3 === 1) A++;
        if (p3 === 0 && p4 === 1) A++;
        if (p4 === 0 && p5 === 1) A++;
        if (p5 === 0 && p6 === 1) A++;
        if (p6 === 0 && p7 === 1) A++;
        if (p7 === 0 && p8 === 1) A++;
        if (p8 === 0 && p9 === 1) A++;
        if (p9 === 0 && p2 === 1) A++;
        if (A !== 1) continue;

        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        toDelete[idx] = 1;
        changed = true;
      }
    }
    for (let i = 0; i < grid.length; i++) {
      if (toDelete[i] === 1) grid[i] = 0;
    }

    // Sub-iteration 2
    toDelete.fill(0);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (grid[idx] !== 1) continue;

        const p2 = grid[(y - 1) * w + x];
        const p3 = grid[(y - 1) * w + x + 1];
        const p4 = grid[y * w + x + 1];
        const p5 = grid[(y + 1) * w + x + 1];
        const p6 = grid[(y + 1) * w + x];
        const p7 = grid[(y + 1) * w + x - 1];
        const p8 = grid[y * w + x - 1];
        const p9 = grid[(y - 1) * w + x - 1];

        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;

        let A = 0;
        if (p2 === 0 && p3 === 1) A++;
        if (p3 === 0 && p4 === 1) A++;
        if (p4 === 0 && p5 === 1) A++;
        if (p5 === 0 && p6 === 1) A++;
        if (p6 === 0 && p7 === 1) A++;
        if (p7 === 0 && p8 === 1) A++;
        if (p8 === 0 && p9 === 1) A++;
        if (p9 === 0 && p2 === 1) A++;
        if (A !== 1) continue;

        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        toDelete[idx] = 1;
        changed = true;
      }
    }
    for (let i = 0; i < grid.length; i++) {
      if (toDelete[i] === 1) grid[i] = 0;
    }
  }

  // 3. Trace skeleton into SVG path segments
  const visited = new Uint8Array(w * h);
  const pathSegments: string[] = [];
  const scale = 1 / upscaleFactor;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (grid[idx] === 1 && !visited[idx]) {
        let cx = x;
        let cy = y;
        const strokePts: [number, number][] = [[cx, cy]];
        visited[idx] = 1;

        let walking = true;
        while (walking) {
          walking = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              const ny = cy + dy;
              const nidx = ny * w + nx;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[nidx] === 1 && !visited[nidx]) {
                visited[nidx] = 1;
                cx = nx;
                cy = ny;
                strokePts.push([cx, cy]);
                walking = true;
                break;
              }
            }
            if (walking) break;
          }
        }

        if (strokePts.length >= 2) {
          const step = Math.max(1, Math.round(1 + (options.pathOptimization || 0.5) * 2));
          const simplified: [number, number][] = [];
          for (let p = 0; p < strokePts.length; p += step) {
            simplified.push(strokePts[p]);
          }
          if (simplified[simplified.length - 1] !== strokePts[strokePts.length - 1]) {
            simplified.push(strokePts[strokePts.length - 1]);
          }

          let d = `M ${(simplified[0][0] * scale).toFixed(1)} ${(simplified[0][1] * scale).toFixed(1)}`;
          for (let p = 1; p < simplified.length; p++) {
            d += ` L ${(simplified[p][0] * scale).toFixed(1)} ${(simplified[p][1] * scale).toFixed(1)}`;
          }
          pathSegments.push(d);
        }
      }
    }
  }

  const origW = Math.round(w * scale);
  const origH = Math.round(h * scale);
  const strokeColor = options.strokeColor || '#111111';
  const strokeWidth = options.targetStrokeWidth || 2.5;

  const bgRect =
    options.background === 'white'
      ? `<rect width="${origW}" height="${origH}" fill="#FFFFFF"/>`
      : options.background === 'dark'
      ? `<rect width="${origW}" height="${origH}" fill="#0B0B0D"/>`
      : '';

  const pathElements = pathSegments
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('\n  ');

  return `<svg viewBox="0 0 ${origW} ${origH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  ${bgRect}
  ${pathElements}
</svg>`;
}

/**
 * Runs the complete client-side tracing pipeline:
 * 1. Image Analysis (compute effective threshold & preview)
 * 2. High-Resolution Subpixel Supersampling (for small icons/images)
 * 3. Preprocessing (grayscale, invert, threshold, despeckle)
 * 4. Path Tracing (ImageTracerJS contour generation with subpixel spline fitting)
 * 5. Output Generation (clean SVG serialization & real IoU metrics)
 */
export async function executeTracePipeline(
  sourceCanvas: HTMLCanvasElement,
  preOptions: PreprocessingOptions,
  traceOptions: TraceOptions,
  onProgress?: TraceProgressCallback
): Promise<TraceResult> {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // Stage 1: Image Analysis
  onProgress?.('analyzing', 20);
  await new Promise((r) => setTimeout(r, 16));

  // Compute preprocessed preview at original resolution for thumbnail & diff
  const preResult = await preprocessImage(sourceCanvas, preOptions);

  // Stage 2: Path Tracing with Subpixel Supersampling
  onProgress?.('tracing', 45);
  await new Promise((r) => setTimeout(r, 16));

  // Determine upscale factor to eliminate coarse pixel staircasing on small assets
  const maxDim = Math.max(width, height);
  const targetDim = 1024;
  const upscaleFactor =
    maxDim < targetDim ? Math.min(4, Math.max(1, Math.round(targetDim / maxDim))) : 1;

  let scaledCanvas = sourceCanvas;
  if (upscaleFactor > 1) {
    scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = width * upscaleFactor;
    scaledCanvas.height = height * upscaleFactor;
    const sCtx = scaledCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#FFFFFF';
      sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    }
  }

  // Preprocess scaled image for trace input
  const traceInput =
    upscaleFactor > 1
      ? await preprocessImage(scaledCanvas, preOptions)
      : preResult;

  // Determine ImageTracer parameters for smooth quadratic bezier curves
  const opt = traceOptions.pathOptimization ?? 0.5;
  const isPrecise = traceOptions.quality === 'precise';
  const isFast = traceOptions.quality === 'fast';

  // Linear tolerance: low values prevent snapping curves into straight polygon edges
  const ltres = isPrecise
    ? 0.04 + opt * 0.05
    : isFast
    ? 0.12 + opt * 0.15
    : 0.06 + opt * 0.08;

  // Quadratic spline error tolerance for smooth continuous bezier curves
  const qtres = isPrecise
    ? 0.45 + opt * 0.35
    : isFast
    ? 0.90 + opt * 0.60
    : 0.65 + opt * 0.45;

  // Path omit threshold
  const pathomit = isPrecise
    ? 0
    : isFast
    ? Math.max(2, Math.round(2 + opt * 6))
    : Math.max(1, Math.round(1 + opt * 3));

  const tracerConfig: Record<string, any> = {
    corsenabled: false,
    ltres: +ltres.toFixed(3),
    qtres: +qtres.toFixed(3),
    pathomit,
    rightangleenhance: false, // Never force curves into 90-degree orthogonal steps
    scale: +(1 / upscaleFactor).toFixed(4), // Scaled back to original coordinates with subpixel precision
    roundcoords: 2, // 2 decimal places for fractional subpixel coordinates
    viewbox: true,
    desc: false,
    strokewidth: 0, // No dilation stroke
    linefilter: true,
    blurradius: 1,
    blurdelta: 20,
  };

  if (traceOptions.colorMode === 'mono') {
    tracerConfig.colorsampling = 0;
    tracerConfig.numberofcolors = 2;
  } else if (traceOptions.colorMode === 'posterize') {
    tracerConfig.colorsampling = 0;
    tracerConfig.numberofcolors = Math.min(
      8,
      Math.max(2, traceOptions.posterizeColors || 4)
    );
  } else {
    // Original colors
    tracerConfig.colorsampling = 2;
    tracerConfig.numberofcolors = 16;
  }

  // Stage 3: Curve Optimization
  onProgress?.('optimizing', 70);
  await new Promise((r) => setTimeout(r, 16));

  const inputImageData =
    traceOptions.colorMode === 'mono'
      ? traceInput.imageData
      : scaledCanvas
          .getContext('2d', { willReadFrequently: true })!
          .getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);

  let rawSvg: string;
  if (traceOptions.centerline) {
    // Phase 2: Centerline tracing mode (skeletonized strokes for signatures & thin line art)
    rawSvg = traceCenterline(inputImageData, traceOptions, upscaleFactor);
  } else {
    rawSvg = (ImageTracer as any).imagedataToSVG(
      inputImageData,
      tracerConfig
    );
  }

  // Stage 4: Output Generation
  onProgress?.('generating', 90);
  await new Promise((r) => setTimeout(r, 16));

  const finalSvg = cleanTracedSvg(rawSvg, width, height, traceOptions);

  // Compute honest, genuine quality metrics against native preprocessed bitmap
  const metrics = await computeQualityMetrics(
    finalSvg,
    preResult.imageData,
    width,
    height
  );

  onProgress?.('done', 100);

  return {
    svg: finalSvg,
    preprocessedDataUrl: preResult.dataUrl,
    metrics,
  };
}
