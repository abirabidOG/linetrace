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
    pathOptimization: 0.7, // High smoothing, clean curves, fewer nodes
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
    pathOptimization: 0.3, // Low smoothing, keeps fine crisp detail
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
    pathOptimization: 0.5, // Balanced tolerance for hand-drawn strokes
    colorMode: 'mono',
    posterizeColors: 4,
  },
  signature: {
    threshold: 100,
    autoThreshold: false,
    despeckle: false,
    invert: false,
    grayscale: true,
    quality: 'precise',
    pathOptimization: 0.2, // Low threshold, keeps delicate thin loops & strokes
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
 * - Strips unwanted descriptions and comments
 * - Handles Mono color mapping and background transparency
 * - Applies stroke harmonization if toggled
 * - Rounds coordinates and ensures scalable viewBox
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

  // Ensure standard SVG headers and responsive viewBox
  if (!cleaned.includes('viewBox')) {
    cleaned = cleaned.replace(
      /<svg/i,
      `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"`
    );
  }

  // Mono Mode Line Art Extraction
  if (options.colorMode === 'mono') {
    // In Mono mode, ImageTracer creates a white background path and black stroke paths.
    // We isolate and remove any background bounding path (fill="rgb(255,255,255)")
    cleaned = cleaned.replace(
      /<path\s+fill="rgb\(255,\s*255,\s*255\)"[^>]*\/>/gi,
      ''
    );

    // Apply user selected ink color to remaining paths
    const strokeHex = options.strokeColor || '#111111';

    if (options.harmonizeStroke) {
      // Stroke harmonization mode: render with uniform stroke width
      const targetWidth = Math.max(0.5, options.targetStrokeWidth || 2);
      cleaned = cleaned.replace(
        /<path\s+fill="rgb\([^"]+\)"\s+stroke="rgb\([^"]+\)"\s+stroke-width="[^"]*"/gi,
        `<path fill="${strokeHex}" stroke="${strokeHex}" stroke-width="${targetWidth}" stroke-linecap="round" stroke-linejoin="round"`
      );
    } else {
      // Standard vector fill with smooth edge stroke
      cleaned = cleaned.replace(
        /<path\s+fill="rgb\([^"]+\)"\s+stroke="rgb\([^"]+\)"/gi,
        `<path fill="${strokeHex}" stroke="${strokeHex}"`
      );
    }
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
 * 1. Image Analysis (load canvas and compute effective threshold)
 * 2. Preprocessing (grayscale, invert, threshold, despeckle)
 * 3. Path Tracing (ImageTracerJS contour generation)
 * 4. Curve Optimization (bezier spline fitting)
 * 5. Output Generation (SVG serialization & real IoU metrics)
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

  const preResult = await preprocessImage(sourceCanvas, preOptions);

  // Stage 2: Path Tracing
  onProgress?.('tracing', 45);
  await new Promise((r) => setTimeout(r, 16));

  // Determine ImageTracer parameters from UI options
  const baseTolerance =
    traceOptions.quality === 'fast'
      ? 2.2
      : traceOptions.quality === 'precise'
      ? 0.35
      : 1.0;

  // Path optimization slider (0: Exact match -> 1: Cleanest paths)
  const opt = traceOptions.pathOptimization ?? 0.5;
  const ltres = +(baseTolerance * (0.6 + opt * 1.0)).toFixed(2);
  const qtres = +(baseTolerance * (0.6 + opt * 1.0)).toFixed(2);
  const pathomit = Math.max(1, Math.round(2 + opt * 18));
  const roundcoords = opt > 0.6 ? 1 : 2;

  const tracerConfig: Record<string, any> = {
    corsenabled: false,
    ltres,
    qtres,
    pathomit,
    rightangleenhance:
      traceOptions.preset === 'icon' || traceOptions.preset === 'logo',
    scale: 1,
    roundcoords,
    viewbox: true,
    desc: false,
    strokewidth: 1,
    linefilter: opt > 0.4,
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

  // Trace the preprocessed bitmap in Mono mode, or original bitmap in Color mode
  const inputImageData =
    traceOptions.colorMode === 'mono'
      ? preResult.imageData
      : sourceCanvas
          .getContext('2d', { willReadFrequently: true })!
          .getImageData(0, 0, width, height);

  const rawSvg = (ImageTracer as any).imagedataToSVG(
    inputImageData,
    tracerConfig
  );

  // Stage 4: Output Generation
  onProgress?.('generating', 90);
  await new Promise((r) => setTimeout(r, 16));

  const finalSvg = cleanTracedSvg(rawSvg, width, height, traceOptions);

  // Compute honest, genuine quality metrics against preprocessed bitmap
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
