'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  AlertCircle,
  FileArchive,
  Shield,
  ArrowRight,
} from 'lucide-react';
import type {
  ImageQueueItem,
  TraceOptions,
  PreprocessingOptions,
  PresetType,
  QualityMode,
  ColorMode,
  BackgroundMode,
} from './types';
import {
  SAMPLE_ICONS,
  SAMPLE_LOGO,
  SAMPLE_SKETCH,
  sampleToFile,
} from './samples';
import { PRESET_CONFIGS, executeTracePipeline } from './traceEngine';
import {
  downloadSvgFile,
  downloadPngFile,
  copySvgToClipboard,
  downloadAllAsZip,
} from './export';
import {
  trackTraceComplete,
  trackDownloadSvg,
  trackDownloadPng,
  trackDownloadAllZip,
  trackCopySvg,
} from './analytics';

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const LineTraceTool: React.FC = () => {
  const [queue, setQueue] = useState<ImageQueueItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'original' | 'vector' | 'overlay' | 'diff'>('vector');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pngScale, setPngScale] = useState<1 | 2 | 4>(2);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // Trace & Preprocessing Options
  const [traceOptions, setTraceOptions] = useState<TraceOptions>({
    preset: 'icon',
    quality: 'standard',
    pathOptimization: 0.5,
    colorMode: 'mono',
    posterizeColors: 4,
    strokeColor: '#111111',
    harmonizeStroke: false,
    targetStrokeWidth: 2,
    background: 'transparent',
  });

  const [preOptions, setPreOptions] = useState<PreprocessingOptions>({
    threshold: 180,
    autoThreshold: true,
    despeckle: true,
    invert: false,
    grayscale: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSliderRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const activeItem = queue[activeIndex] || null;

  // Preset handler
  const handleSelectPreset = (preset: PresetType) => {
    if (preset === 'custom') {
      setTraceOptions((prev) => ({ ...prev, preset: 'custom' }));
      return;
    }

    const cfg = PRESET_CONFIGS[preset];
    setPreOptions({
      threshold: cfg.threshold,
      autoThreshold: cfg.autoThreshold,
      despeckle: cfg.despeckle,
      invert: cfg.invert,
      grayscale: cfg.grayscale,
    });
    setTraceOptions((prev) => ({
      ...prev,
      preset,
      quality: cfg.quality,
      pathOptimization: cfg.pathOptimization,
      colorMode: cfg.colorMode,
      posterizeColors: cfg.posterizeColors,
    }));
  };

  // Mark preset as custom when user modifies controls manually
  const markAsCustom = () => {
    if (traceOptions.preset !== 'custom') {
      setTraceOptions((prev) => ({ ...prev, preset: 'custom' }));
    }
  };

  // Convert an image file/blob to an ImageQueueItem
  const processNewFile = async (file: File): Promise<ImageQueueItem | null> => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`"${file.name}" exceeds the 10 MB limit.`);
      return null;
    }
    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const isAccepted = ACCEPTED_TYPES.includes(file.type) || isSvg || file.name.match(/\.(png|jpe?g|webp|bmp|svg)$/i);
    if (!isAccepted) {
      setErrorMessage(`"${file.name}" is not a supported format (PNG, JPG, WebP, SVG, BMP).`);
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'image/png',
            originalUrl: dataUrl,
            width: img.naturalWidth || 512,
            height: img.naturalHeight || 512,
            status: 'queued',
            stage: 'idle',
            progress: 0,
          });
        };
        img.onerror = () => {
          setErrorMessage(`Could not read image file "${file.name}".`);
          resolve(null);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const addFilesToQueue = async (files: File[]) => {
    setErrorMessage(null);
    const newItems: ImageQueueItem[] = [];
    for (const f of files.slice(0, 20 - queue.length)) {
      const item = await processNewFile(f);
      if (item) newItems.push(item);
    }
    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      setActiveIndex(queue.length);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Built-in sample loaders
  const loadIconSampleSet = () => {
    const files = SAMPLE_ICONS.map(sampleToFile);
    handleSelectPreset('icon');
    addFilesToQueue(files);
  };

  const loadLogoSample = () => {
    handleSelectPreset('logo');
    addFilesToQueue([sampleToFile(SAMPLE_LOGO)]);
  };

  const loadSketchSample = () => {
    handleSelectPreset('sketch');
    addFilesToQueue([sampleToFile(SAMPLE_SKETCH)]);
  };

  // Core trace execution on an item
  const runTraceOnItem = useCallback(
    async (item: ImageQueueItem): Promise<ImageQueueItem> => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load onto canvas'));
        img.src = item.originalUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || item.width;
      canvas.height = img.naturalHeight || item.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Pre-fill white canvas background so transparent icons and line art
      // blend cleanly with white paper without dark transparent edges
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const result = await executeTracePipeline(
        canvas,
        preOptions,
        traceOptions,
        (stage, progress) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, stage, progress } : q))
          );
        }
      );

      trackTraceComplete({
        preset: traceOptions.preset,
        quality: traceOptions.quality,
        color_mode: traceOptions.colorMode,
        paths: result.metrics.pathCount,
        nodes: result.metrics.nodeCount,
        iou: result.metrics.pixelIoU,
        source: item.name.startsWith('sample-') || item.name.startsWith('icon-') ? 'sample' : 'upload',
      });

      return {
        ...item,
        svgOutput: result.svg,
        preprocessedDataUrl: result.preprocessedDataUrl,
        metrics: result.metrics,
        status: 'done',
        stage: 'done',
        progress: 100,
      };
    },
    [preOptions, traceOptions]
  );

  const runningSignatureRef = useRef<string>('');

  // Trigger trace on active item when options change or when queued
  useEffect(() => {
    if (!activeItem || isProcessingBatch) return;

    const signature = `${activeItem.id}-${preOptions.threshold}-${preOptions.autoThreshold}-${preOptions.despeckle}-${preOptions.invert}-${preOptions.grayscale}-${traceOptions.preset}-${traceOptions.quality}-${traceOptions.pathOptimization}-${traceOptions.colorMode}-${traceOptions.posterizeColors}-${traceOptions.strokeColor}-${traceOptions.harmonizeStroke}-${traceOptions.targetStrokeWidth}-${traceOptions.background}`;

    // If this signature was already completed or is currently running, do nothing
    if (runningSignatureRef.current === signature) {
      return;
    }

    runningSignatureRef.current = signature;
    const targetItem = activeItem;

    const run = async () => {
      try {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === targetItem.id ? { ...q, status: 'processing', stage: 'analyzing', progress: 15 } : q
          )
        );
        const updated = await runTraceOnItem(targetItem);
        // Only apply if this signature is still the active one
        if (runningSignatureRef.current === signature) {
          setQueue((prev) =>
            prev.map((q) => (q.id === targetItem.id ? updated : q))
          );
        }
      } catch (err: any) {
        if (runningSignatureRef.current === signature) {
          console.error('Trace error:', err);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === targetItem.id
                ? { ...q, status: 'error', stage: 'error', errorMessage: err.message }
                : q
            )
          );
        }
      }
    };

    run();
  }, [
    activeItem?.id,
    activeItem?.status,
    preOptions,
    traceOptions,
    isProcessingBatch,
    runTraceOnItem,
  ]);

  // Batch process all remaining items
  const handleTraceAllBatch = async () => {
    setIsProcessingBatch(true);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'processing', stage: 'analyzing', progress: 20 } : q))
        );
        const updated = await runTraceOnItem(item);
        setQueue((prev) => prev.map((q, idx) => (idx === i ? updated : q)));
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: 'error', stage: 'error', errorMessage: err.message } : q
          )
        );
      }
    }
    setIsProcessingBatch(false);
    showToast('Batch vectorization complete!');
  };

  // Before/after split slider drag handlers using window listeners
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSliderRef.current = true;
  };

  const handleSliderTouchStart = () => {
    isDraggingSliderRef.current = true;
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDraggingSliderRef.current || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(pct);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSliderRef.current) {
        handleMove(e.clientX);
      }
    };

    const onMouseUp = () => {
      isDraggingSliderRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingSliderRef.current && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      isDraggingSliderRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Keyboard navigation & slider
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((p) => Math.max(0, p - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((p) => Math.min(100, p + 5));
    }
  };

  return (
    <div className="w-full space-y-10 selection:bg-[#D4FF3A] selection:text-[#0B0B0D]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#0B0B0D] px-5 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <Check className="h-4 w-4 text-[#D4FF3A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 flex items-start justify-between gap-3 text-rose-900 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-bold p-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Empty State / Upload Zone */}
      {queue.length === 0 ? (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all duration-300 flex flex-col items-center justify-center space-y-5 bg-white ${
              isDragging
                ? 'border-[#5846F6] bg-[#5846F6]/[0.03] scale-[1.01]'
                : 'border-[#E5E1D6] hover:border-[#5846F6] hover:bg-[#F4F2EC]/40'
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5846F6]/10 text-[#5846F6] shadow-xs">
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-lg sm:text-xl font-extrabold text-[#0B0B0D]">
                Drop your line art, sketches, or icons here
              </p>
              <p className="text-xs sm:text-sm text-[#4F4E55]">
                PNG, JPG, SVG, WebP, BMP up to 10 MB. Batch trace up to 20 files at once.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5846F6] hover:bg-[#4735E5] text-white px-6 py-3 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span>Browse Files</span>
            </button>
          </div>

          {/* Sample Sets */}
          <div className="rounded-2xl border border-[#E5E1D6] bg-[#F4F2EC]/70 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#4F4E55] font-semibold">
                Or try a built-in sample in one click:
              </span>
              <span className="text-xs font-mono text-emerald-600 font-medium hidden sm:inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zero download needed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={loadIconSampleSet}
                className="flex items-center justify-between rounded-xl border border-[#E5E1D6] bg-white px-4 py-3 text-left transition-all duration-300 hover:border-[#5846F6] hover:shadow-xs group"
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#0B0B0D] group-hover:text-[#5846F6] transition-colors">
                    6 Line Icons
                  </p>
                  <p className="text-[11px] text-[#4F4E55]">Camera, shield, compass, heart...</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#4F4E55] group-hover:text-[#5846F6] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                type="button"
                onClick={loadLogoSample}
                className="flex items-center justify-between rounded-xl border border-[#E5E1D6] bg-white px-4 py-3 text-left transition-all duration-300 hover:border-[#5846F6] hover:shadow-xs group"
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#0B0B0D] group-hover:text-[#5846F6] transition-colors">
                    Logo Mark
                  </p>
                  <p className="text-[11px] text-[#4F4E55]">Geometric monogram on grid</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#4F4E55] group-hover:text-[#5846F6] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                type="button"
                onClick={loadSketchSample}
                className="flex items-center justify-between rounded-xl border border-[#E5E1D6] bg-white px-4 py-3 text-left transition-all duration-300 hover:border-[#5846F6] hover:shadow-xs group"
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#0B0B0D] group-hover:text-[#5846F6] transition-colors">
                    Hand-Drawn Sketch
                  </p>
                  <p className="text-[11px] text-[#4F4E55]">Organic botanical sketch lines</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#4F4E55] group-hover:text-[#5846F6] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Workspace when images are queued */
        <div className="space-y-8">
          {/* Top Bar: Queue Thumbnails & Batch Actions */}
          <div className="rounded-2xl border border-[#E5E1D6] bg-white p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#5846F6] bg-[#5846F6]/10 px-2.5 py-1 rounded-full">
                  {queue.length} {queue.length === 1 ? 'Image' : 'Images'} Queued
                </span>
                <span className="text-xs text-[#4F4E55]">
                  Select an item to inspect or tune settings
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] px-3.5 py-2 text-xs font-semibold text-[#0B0B0D] transition-all"
                >
                  + Add More
                </button>
                {queue.length > 1 && (
                  <button
                    type="button"
                    onClick={handleTraceAllBatch}
                    disabled={isProcessingBatch}
                    className="rounded-xl bg-[#0B0B0D] hover:bg-[#5846F6] text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessingBatch ? 'Tracing Batch...' : 'Trace All with Current Settings'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-xs text-rose-600 hover:text-rose-800 p-2 font-medium"
                >
                  Clear Queue
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {queue.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`group relative shrink-0 cursor-pointer rounded-xl border p-2 flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-[#5846F6] bg-[#5846F6]/5 shadow-xs ring-1 ring-[#5846F6]'
                        : 'border-[#E5E1D6] bg-white hover:border-[#C9C7C1]'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-[#F4F2EC] flex items-center justify-center border border-black/5">
                      <img
                        src={item.originalUrl}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="w-28 truncate">
                      <p className="text-xs font-bold text-[#0B0B0D] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#4F4E55] font-mono">
                        {item.width}×{item.height}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueue((prev) => prev.filter((_, i) => i !== idx));
                        if (activeIndex >= queue.length - 1) {
                          setActiveIndex(Math.max(0, queue.length - 2));
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#4F4E55] hover:text-rose-600 p-1 transition-opacity"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Item Pipeline Progress */}
          {activeItem?.status === 'processing' && (
            <div className="rounded-2xl border border-[#5846F6]/20 bg-[#5846F6]/5 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#5846F6] uppercase tracking-wider">
                  Pipeline Step: {activeItem.stage.toUpperCase()}
                </span>
                <span className="text-[#4F4E55]">{activeItem.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white overflow-hidden border border-[#5846F6]/20">
                <div
                  className="h-full bg-[#5846F6] transition-all duration-300"
                  style={{ width: `${activeItem.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-[#4F4E55] text-center">
                <span className={activeItem.stage === 'analyzing' ? 'font-bold text-[#5846F6]' : ''}>1. Image Analysis</span>
                <span className={activeItem.stage === 'tracing' ? 'font-bold text-[#5846F6]' : ''}>2. Path Tracing</span>
                <span className={activeItem.stage === 'optimizing' ? 'font-bold text-[#5846F6]' : ''}>3. Curve Optimization</span>
                <span className={activeItem.stage === 'generating' ? 'font-bold text-[#5846F6]' : ''}>4. Output Generation</span>
              </div>
            </div>
          )}

          {/* Main Grid: Controls Left, Viewer Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls Panel (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-[#E5E1D6] bg-white p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E1D6] pb-4">
                <h3 className="font-bold text-base sm:text-lg text-[#0B0B0D] flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#5846F6]" />
                  <span>Trace &amp; Preprocessing Controls</span>
                </h3>
                <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#F4F2EC] text-[#4F4E55] font-semibold">
                  {traceOptions.preset}
                </span>
              </div>

              {/* 1. Presets Tabs */}
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#4F4E55] font-semibold">
                  1-Click Presets:
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
                  {(['icon', 'logo', 'sketch', 'signature'] as PresetType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                        traceOptions.preset === p
                          ? 'bg-white text-[#0B0B0D] shadow-xs'
                          : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Preprocessing Controls */}
              <div className="space-y-4 pt-3 border-t border-[#E5E1D6]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#4F4E55] font-semibold">
                    Canvas Preprocessing:
                  </span>
                  {activeItem?.preprocessedDataUrl && (
                    <span className="text-[10px] font-mono text-[#5846F6]">Live Bitmap Ready</span>
                  )}
                </div>

                {/* Threshold Slider + Auto toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B0B0D]">Threshold</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preOptions.autoThreshold}
                          onChange={(e) => {
                            setPreOptions((prev) => ({ ...prev, autoThreshold: e.target.checked }));
                            markAsCustom();
                          }}
                          className="rounded text-[#5846F6] focus:ring-[#5846F6]"
                        />
                        <span className="text-[11px] font-mono text-[#4F4E55]">Auto (Otsu)</span>
                      </label>
                      <span className="font-mono font-bold text-[#0B0B0D] w-8 text-right">
                        {preOptions.threshold}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    disabled={preOptions.autoThreshold}
                    value={preOptions.threshold}
                    onChange={(e) => {
                      setPreOptions((prev) => ({
                        ...prev,
                        threshold: Number(e.target.value),
                        autoThreshold: false,
                      }));
                      markAsCustom();
                    }}
                    className="w-full accent-[#5846F6] cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Toggles: Despeckle, Invert, Grayscale */}
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 rounded-xl border border-[#E5E1D6] p-2.5 cursor-pointer hover:bg-[#F4F2EC]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={preOptions.despeckle}
                      onChange={(e) => {
                        setPreOptions((prev) => ({ ...prev, despeckle: e.target.checked }));
                        markAsCustom();
                      }}
                      className="rounded text-[#5846F6] focus:ring-[#5846F6]"
                    />
                    <span className="text-xs font-medium text-[#0B0B0D]">Despeckle</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-[#E5E1D6] p-2.5 cursor-pointer hover:bg-[#F4F2EC]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={preOptions.invert}
                      onChange={(e) => {
                        setPreOptions((prev) => ({ ...prev, invert: e.target.checked }));
                        markAsCustom();
                      }}
                      className="rounded text-[#5846F6] focus:ring-[#5846F6]"
                    />
                    <span className="text-xs font-medium text-[#0B0B0D]">Invert</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-[#E5E1D6] p-2.5 cursor-pointer hover:bg-[#F4F2EC]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={preOptions.grayscale}
                      onChange={(e) => {
                        setPreOptions((prev) => ({ ...prev, grayscale: e.target.checked }));
                        markAsCustom();
                      }}
                      className="rounded text-[#5846F6] focus:ring-[#5846F6]"
                    />
                    <span className="text-xs font-medium text-[#0B0B0D]">Grayscale</span>
                  </label>
                </div>

                {/* Preprocessed Live Bitmap Thumbnail */}
                {activeItem?.preprocessedDataUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-[#E5E1D6] bg-[#F4F2EC]/50 p-2.5">
                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white border border-black/10">
                      <img
                        src={activeItem.preprocessedDataUrl}
                        alt="Preprocessed live preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] leading-tight text-[#4F4E55]">
                      <span className="font-bold text-[#0B0B0D]">Tracer View: </span>
                      Cleaned binarized bitmap fed directly to ImageTracer.
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Tracing Controls */}
              <div className="space-y-4 pt-3 border-t border-[#E5E1D6]">
                <span className="block font-mono text-xs uppercase tracking-wider text-[#4F4E55] font-semibold">
                  Vector Engine Tuning:
                </span>

                {/* Quality Mode */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B0B0D]">Quality Mode</span>
                    <span className="text-xs font-mono text-[#5846F6] capitalize">{traceOptions.quality}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
                    {(['fast', 'standard', 'precise'] as QualityMode[]).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setTraceOptions((prev) => ({ ...prev, quality: q }));
                          markAsCustom();
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                          traceOptions.quality === q
                            ? 'bg-white text-[#0B0B0D] shadow-xs'
                            : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Path Optimization Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B0B0D]">Path Optimization</span>
                    <span className="font-mono font-bold text-[#0B0B0D]">
                      {traceOptions.pathOptimization === 0.5
                        ? 'Balanced (0.5)'
                        : traceOptions.pathOptimization.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={traceOptions.pathOptimization}
                    onChange={(e) => {
                      setTraceOptions((prev) => ({
                        ...prev,
                        pathOptimization: Number(e.target.value),
                      }));
                      markAsCustom();
                    }}
                    className="w-full accent-[#5846F6] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#4F4E55]">
                    <span>Exact match</span>
                    <span>Cleanest paths</span>
                  </div>
                </div>

                {/* Color Mode */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B0B0D]">Color Mode</span>
                    <span className="font-mono text-xs text-[#5846F6] capitalize">{traceOptions.colorMode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
                    {(['mono', 'original', 'posterize'] as ColorMode[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTraceOptions((prev) => ({ ...prev, colorMode: c }));
                          markAsCustom();
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                          traceOptions.colorMode === c
                            ? 'bg-white text-[#0B0B0D] shadow-xs'
                            : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posterize Color Count slider (if posterize mode) */}
                {traceOptions.colorMode === 'posterize' && (
                  <div className="space-y-1.5 rounded-xl border border-[#E5E1D6] p-3 bg-[#F4F2EC]/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#0B0B0D]">Posterize Colors</span>
                      <span className="font-mono font-bold text-[#5846F6]">{traceOptions.posterizeColors}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={traceOptions.posterizeColors}
                      onChange={(e) => {
                        setTraceOptions((prev) => ({
                          ...prev,
                          posterizeColors: Number(e.target.value),
                        }));
                        markAsCustom();
                      }}
                      className="w-full accent-[#5846F6] cursor-pointer"
                    />
                  </div>
                )}

                {/* Stroke Color Picker (for Mono mode) */}
                {traceOptions.colorMode === 'mono' && (
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E1D6] p-3">
                    <span className="text-xs font-medium text-[#0B0B0D]">Ink Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={traceOptions.strokeColor}
                        onChange={(e) => {
                          setTraceOptions((prev) => ({ ...prev, strokeColor: e.target.value }));
                          markAsCustom();
                        }}
                        className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-[#4F4E55] font-semibold">
                        {traceOptions.strokeColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stroke Width Harmonisation */}
                <div className="rounded-xl border border-[#E5E1D6] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={traceOptions.harmonizeStroke}
                        onChange={(e) => {
                          setTraceOptions((prev) => ({ ...prev, harmonizeStroke: e.target.checked }));
                          markAsCustom();
                        }}
                        className="rounded text-[#5846F6] focus:ring-[#5846F6]"
                      />
                      <span className="text-xs font-medium text-[#0B0B0D]">Harmonize Stroke Width</span>
                    </label>
                    {traceOptions.harmonizeStroke && (
                      <span className="font-mono text-xs text-[#5846F6]">
                        {traceOptions.targetStrokeWidth} px
                      </span>
                    )}
                  </div>
                  {traceOptions.harmonizeStroke && (
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={traceOptions.targetStrokeWidth}
                      onChange={(e) => {
                        setTraceOptions((prev) => ({
                          ...prev,
                          targetStrokeWidth: Number(e.target.value),
                        }));
                        markAsCustom();
                      }}
                      className="w-full accent-[#5846F6] cursor-pointer"
                    />
                  )}
                </div>

                {/* Background selector */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#0B0B0D]">Preview &amp; PNG Background</span>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
                    {(['transparent', 'white', 'dark'] as BackgroundMode[]).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setTraceOptions((prev) => ({ ...prev, background: b }));
                          markAsCustom();
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                          traceOptions.background === b
                            ? 'bg-white text-[#0B0B0D] shadow-xs'
                            : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Viewer & Quality Results Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Preview Container */}
              <div className="rounded-3xl border border-[#E5E1D6] bg-white p-5 sm:p-7 shadow-sm space-y-5">
                {/* View Tabs & Zoom Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D6] pb-4">
                  <div className="flex items-center gap-1.5 bg-[#F4F2EC] p-1 rounded-xl">
                    {(['vector', 'original', 'overlay', 'diff'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                          activeTab === tab
                            ? 'bg-white text-[#0B0B0D] shadow-xs'
                            : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                      className="p-1.5 rounded-lg border border-[#E5E1D6] hover:bg-[#F4F2EC] text-[#4F4E55]"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-xs w-12 text-center text-[#0B0B0D]">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                      className="p-1.5 rounded-lg border border-[#E5E1D6] hover:bg-[#F4F2EC] text-[#4F4E55]"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 rounded-lg border border-[#E5E1D6] hover:bg-[#F4F2EC] text-[#4F4E55]"
                      aria-label="Fit to screen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Image Stage Viewport */}
                <div
                  className={`relative w-full min-h-[380px] sm:min-h-[460px] max-h-[480px] rounded-2xl overflow-hidden border border-[#E5E1D6] flex items-center justify-center p-4 sm:p-6 select-none ${
                    traceOptions.background === 'white'
                      ? 'bg-white'
                      : traceOptions.background === 'dark'
                      ? 'bg-[#0B0B0D]'
                      : 'bg-transparency-grid'
                  }`}
                >
                  {/* Canvas Render Area scaled by zoom */}
                  <div
                    className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {activeItem && (
                      <div
                        ref={sliderContainerRef}
                        className="relative select-none shadow-xs"
                        style={{
                          aspectRatio: `${activeItem.width} / ${activeItem.height}`,
                          maxWidth: '100%',
                          maxHeight: '430px',
                          width: activeItem.width >= activeItem.height ? '430px' : 'auto',
                          height: activeItem.height > activeItem.width ? '430px' : 'auto',
                        }}
                      >
                        {/* 1. Tab: Vector only (with Before/After Split Scrub Slider) */}
                        {activeTab === 'vector' && activeItem.svgOutput && (
                          <>
                            {/* Vector SVG (Bottom) */}
                            <div
                              className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block pointer-events-none"
                              dangerouslySetInnerHTML={{ __html: activeItem.svgOutput }}
                            />

                            {/* Original Image (Top, clipped by slider from left) */}
                            <div
                              className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                            >
                              <img
                                src={activeItem.originalUrl}
                                alt="Original comparison side"
                                className="w-full h-full block object-fill"
                              />
                            </div>

                            {/* Interactive Scrub Line & Handle */}
                            <div
                              tabIndex={0}
                              role="slider"
                              aria-label="Before and after comparison slider"
                              aria-valuenow={Math.round(sliderPosition)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              onKeyDown={handleKeyDown}
                              onMouseDown={handleSliderMouseDown}
                              onTouchStart={handleSliderTouchStart}
                              className="pointer-events-auto absolute inset-y-0 w-1 bg-[#5846F6] cursor-ew-resize shadow-md z-20 focus:outline-none focus:ring-2 focus:ring-[#5846F6]"
                              style={{ left: `${sliderPosition}%` }}
                            >
                              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#E5E1D6] shadow-lg text-[#5846F6] text-xs font-bold hover:scale-110 active:scale-95 transition-transform">
                                ⇄
                              </div>
                            </div>

                            {/* Floating Labels */}
                            <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[9px] uppercase font-bold tracking-wider shadow-xs">
                              Original
                            </div>
                            <div className="absolute top-2.5 right-2.5 pointer-events-none z-10 px-2 py-0.5 rounded bg-[#5846F6]/90 text-white font-mono text-[9px] uppercase font-bold tracking-wider shadow-xs">
                              Vector
                            </div>
                          </>
                        )}

                        {/* 2. Tab: Original only */}
                        {activeTab === 'original' && (
                          <img
                            src={activeItem.originalUrl}
                            alt="Original source"
                            className="w-full h-full block object-fill"
                          />
                        )}

                        {/* 3. Tab: Overlay (Vector outline over original with low opacity) */}
                        {activeTab === 'overlay' && (
                          <>
                            <img
                              src={activeItem.originalUrl}
                              alt="Original base"
                              className="absolute inset-0 w-full h-full block object-fill opacity-45"
                            />
                            {activeItem.svgOutput && (
                              <div
                                className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: activeItem.svgOutput }}
                              />
                            )}
                          </>
                        )}

                        {/* 4. Tab: Diff (Visual discrepancy inspection) */}
                        {activeTab === 'diff' && activeItem.preprocessedDataUrl && (
                          <>
                            <img
                              src={activeItem.preprocessedDataUrl}
                              alt="Preprocessed bitmap"
                              className="absolute inset-0 w-full h-full block object-fill mix-blend-multiply opacity-60"
                            />
                            {activeItem.svgOutput && (
                              <div
                                className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block mix-blend-difference pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: activeItem.svgOutput }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quality Readout Bar (Honest computed metrics) */}
                {activeItem?.metrics && (
                  <div className="rounded-2xl border border-[#E5E1D6] bg-[#F4F2EC]/60 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#4F4E55] font-semibold mb-2">
                      Computed Vector Quality Metrics
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-[#E5E1D6] bg-white p-2.5">
                        <span className="block font-mono text-[10px] uppercase text-[#4F4E55]">Pixel IoU</span>
                        <span className="font-bold text-sm sm:text-base text-[#0B0B0D]">
                          {activeItem.metrics.pixelIoU}%
                        </span>
                      </div>
                      <div className="rounded-xl border border-[#E5E1D6] bg-white p-2.5">
                        <span className="block font-mono text-[10px] uppercase text-[#4F4E55]">Path Count</span>
                        <span className="font-bold text-sm sm:text-base text-[#0B0B0D]">
                          {activeItem.metrics.pathCount}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[#E5E1D6] bg-white p-2.5">
                        <span className="block font-mono text-[10px] uppercase text-[#4F4E55]">Node Count</span>
                        <span className="font-bold text-sm sm:text-base text-[#0B0B0D]">
                          {activeItem.metrics.nodeCount}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[#E5E1D6] bg-white p-2.5">
                        <span className="block font-mono text-[10px] uppercase text-[#4F4E55]">Open Gaps</span>
                        <span className="font-bold text-sm sm:text-base text-[#0B0B0D]">
                          {activeItem.metrics.openGaps}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons Bar */}
                {activeItem?.svgOutput && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* 1. Download SVG */}
                      <button
                        type="button"
                        onClick={() => {
                          downloadSvgFile(activeItem.svgOutput!, activeItem.name);
                          trackDownloadSvg({
                            filename: activeItem.name,
                            bytes: activeItem.svgOutput!.length,
                          });
                          showToast('Downloaded clean SVG!');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5846F6] hover:bg-[#4735E5] text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download SVG</span>
                      </button>

                      {/* 2. Download PNG with scale picker */}
                      <div className="flex items-center rounded-xl border border-[#E5E1D6] bg-white p-1">
                        <button
                          type="button"
                          onClick={() => {
                            downloadPngFile(
                              activeItem.svgOutput!,
                              activeItem.name,
                              pngScale,
                              traceOptions.background,
                              activeItem.width,
                              activeItem.height
                            );
                            trackDownloadPng({
                              scale: pngScale,
                              background: traceOptions.background,
                            });
                            showToast(`Downloaded PNG at ${pngScale}x scale!`);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold text-[#0B0B0D] hover:text-[#5846F6] transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PNG ({pngScale}x)</span>
                        </button>
                        <div className="flex items-center gap-0.5 border-l border-[#E5E1D6] pl-1">
                          {([1, 2, 4] as const).map((sc) => (
                            <button
                              key={sc}
                              type="button"
                              onClick={() => setPngScale(sc)}
                              className={`rounded-md px-1.5 py-1 text-[10px] font-mono font-bold ${
                                pngScale === sc ? 'bg-[#5846F6] text-white' : 'text-[#4F4E55] hover:bg-[#F4F2EC]'
                              }`}
                            >
                              {sc}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Copy SVG Code */}
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copySvgToClipboard(activeItem.svgOutput!);
                          if (ok) {
                            trackCopySvg({ characters: activeItem.svgOutput!.length });
                            showToast('Copied SVG markup to clipboard!');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] text-[#0B0B0D] px-4 py-3 text-xs sm:text-sm font-bold transition-all"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy SVG Code</span>
                      </button>
                    </div>

                    {/* Batch ZIP Download button (if multiple items in queue) */}
                    {queue.length > 1 && (
                      <button
                        type="button"
                        onClick={async () => {
                          await downloadAllAsZip(queue, true, pngScale, traceOptions.background);
                          trackDownloadAllZip({
                            count: queue.length,
                            include_png: true,
                          });
                          showToast('Downloaded ZIP archive with all vectors!');
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-[#F4F2EC] hover:bg-[#E5E1D6]/80 text-[#0B0B0D] py-2.5 text-xs font-bold transition-all"
                      >
                        <FileArchive className="h-4 w-4 text-[#5846F6]" />
                        <span>Download All as ZIP (SVGs + {pngScale}x PNGs)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.svg,.bmp,image/png,image/jpeg,image/webp,image/svg+xml,image/bmp"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Privacy Badge */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#4F4E55] font-medium pt-2">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>100% private. Your files are processed in your browser and never uploaded.</span>
      </div>

      {/* Static Fallback for disabled JavaScript */}
      <noscript>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-sm">
          <strong>JavaScript is required:</strong> LineTrace processes and vectorizes line art directly
          inside your web browser using HTML5 Canvas and client-side curve fitting. Please enable
          JavaScript to convert sketches and line drawings to SVG.
        </div>
      </noscript>
    </div>
  );
};

export default LineTraceTool;
