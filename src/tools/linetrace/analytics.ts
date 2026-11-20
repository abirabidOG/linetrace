// Google Analytics 4 Integration & Key Event Tracker for LineTrace

export const GA_MEASUREMENT_ID =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GA_ID) ||
  'G-ZF1FSM8N07';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Fires trace_complete when line art is converted to vector.
 * Marked as a Key Event in GA4.
 */
export function trackTraceComplete(params: {
  preset: string;
  quality: string;
  color_mode: string;
  paths: number;
  nodes: number;
  iou: number;
  source: 'upload' | 'sample';
}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'trace_complete', {
      preset: params.preset,
      quality: params.quality,
      color_mode: params.color_mode,
      path_count: params.paths,
      node_count: params.nodes,
      pixel_iou: params.iou,
      source: params.source,
      tool: 'linetrace',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track trace_complete', err);
  }
}

/**
 * Fires download_svg on SVG vector export.
 * Marked as a Key Event in GA4.
 */
export function trackDownloadSvg(params: { filename: string; bytes: number }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'download_svg', {
      filename: params.filename,
      bytes: params.bytes,
      tool: 'linetrace',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track download_svg', err);
  }
}

/**
 * Fires download_png on high-resolution PNG export.
 * Marked as a Key Event in GA4.
 */
export function trackDownloadPng(params: { scale: number; background: string }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'download_png', {
      scale: `${params.scale}x`,
      background: params.background,
      tool: 'linetrace',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track download_png', err);
  }
}

/**
 * Fires download_all_zip on batch archive export.
 * Marked as a Key Event in GA4.
 */
export function trackDownloadAllZip(params: { count: number; include_png: boolean }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'download_all_zip', {
      file_count: params.count,
      include_png: params.include_png,
      tool: 'linetrace',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track download_all_zip', err);
  }
}

/**
 * Fires copy_svg on copying SVG markup to clipboard.
 * Marked as a Key Event in GA4.
 */
export function trackCopySvg(params: { characters: number }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'copy_svg', {
      characters: params.characters,
      tool: 'linetrace',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track copy_svg', err);
  }
}
