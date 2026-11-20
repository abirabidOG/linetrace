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

  const rawSvg = (ImageTracer as any).imagedataToSVG(
    inputImageData,
    tracerConfig
  );

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
