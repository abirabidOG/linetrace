export type PresetType = 'icon' | 'logo' | 'sketch' | 'signature' | 'custom';
export type QualityMode = 'fast' | 'standard' | 'precise';
export type ColorMode = 'mono' | 'original' | 'posterize';
export type BackgroundMode = 'transparent' | 'white' | 'dark';

export type PipelineStage =
  | 'idle'
  | 'analyzing'
  | 'tracing'
  | 'optimizing'
  | 'generating'
  | 'done'
  | 'error';

export interface PreprocessingOptions {
  threshold: number; // 0 - 255
  autoThreshold: boolean;
  despeckle: boolean;
  invert: boolean;
  grayscale: boolean;
}

export interface TraceOptions {
  preset: PresetType;
  quality: QualityMode;
  pathOptimization: number; // 0 (exact match) to 1 (cleanest paths), default 0.5
  colorMode: ColorMode;
  posterizeColors: number; // 2 - 8
  strokeColor: string; // default #111111
  harmonizeStroke: boolean;
  targetStrokeWidth: number; // in px, e.g. 2
  background: BackgroundMode;
  centerline?: boolean; // Phase 2: Centerline tracing for signatures/strokes
}

export interface QualityReadout {
  pixelIoU: number; // 0 - 100 percentage (actual computed IoU)
  pathCount: number;
  nodeCount: number;
  openGaps: number;
}

export interface ImageQueueItem {
  id: string;
  name: string;
  size: number;
  type: string;
  originalUrl: string;
  width: number;
  height: number;
  preprocessedDataUrl?: string;
  svgOutput?: string;
  metrics?: QualityReadout;
  status: 'queued' | 'processing' | 'done' | 'error';
  stage: PipelineStage;
  progress: number;
  errorMessage?: string;
}

export interface PresetConfig {
  threshold: number;
  autoThreshold: boolean;
  despeckle: boolean;
  invert: boolean;
  grayscale: boolean;
  quality: QualityMode;
  pathOptimization: number;
  colorMode: ColorMode;
  posterizeColors: number;
}
