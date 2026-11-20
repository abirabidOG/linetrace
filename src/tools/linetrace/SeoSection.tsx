import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function SeoSection() {
  return (
    <section className="mt-20 border-t border-[#E5E1D6] bg-[#F4F2EC] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Main H1 & Introduction */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E1D6] text-xs font-mono font-medium text-[#5846F6] mb-4 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#5846F6]" />
            100% In-Browser Line Art Vectorization
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0D]">
            Free Line Art to Vector Converter
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4F4E55] leading-relaxed">
            Turn hand-drawn sketches, line icons, logo marks, and signatures into clean, scalable SVG vectors directly in your browser. No file uploads, no account, and zero watermarks.
          </p>
        </div>

        {/* Section 1: How It Works */}
        <div className="mb-16 rounded-3xl border border-[#E5E1D6] bg-white p-8 sm:p-12 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0D] mb-4">
            How LineTrace works in three simple steps
          </h2>
          <p className="text-sm sm:text-base text-[#4F4E55] leading-relaxed mb-8">
            LineTrace uses an in-browser vectorization engine based on potrace curve fitting. It processes image pixels on an HTML5 Canvas, generates smooth bezier splines, and exports clean SVG markup that opens natively in Figma, Adobe Illustrator, and web browsers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#E5E1D6]">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5846F6]/10 text-[#5846F6] font-mono font-bold text-sm">
                01
              </div>
              <p className="font-bold text-[#0B0B0D] text-base">Upload Line Art</p>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Drop your sketches, signatures, black-and-white icons, or logo drawings. Handles PNG, JPG, WebP, SVG, and BMP up to 10 MB.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5846F6]/10 text-[#5846F6] font-mono font-bold text-sm">
                02
              </div>
              <p className="font-bold text-[#0B0B0D] text-base">Adjust &amp; Preview</p>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Pick a one-click preset (Icon, Logo, Sketch, Signature) or fine-tune threshold, despeckle, and curve smoothing with instant live diffs.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5846F6]/10 text-[#5846F6] font-mono font-bold text-sm">
                03
              </div>
              <p className="font-bold text-[#0B0B0D] text-base">Download Clean Vectors</p>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Export crisp SVG files, generate transparent PNGs at 1x/2x/4x, copy SVG code in one click, or download all files as a ZIP archive.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Three Core Benefits */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0D]">
              Why designers and founders choose LineTrace
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#4F4E55]">
              Built to replace restrictive cloud services that demand subscriptions, tokens, or sign-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5846F6]/10 text-[#5846F6] mb-5">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B0B0D] mb-2">Free &amp; Unlimited</h3>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Trace as many drawings, logos, and icons as you need. No artificial limits, no credits system, no paywall, and no sign-in required.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B0B0D] mb-2">100% Private by Design</h3>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Your proprietary sketches, client logo ideas, and personal signatures are processed purely in your browser. Nothing is ever sent to a server.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4FF3A]/40 text-[#0B0B0D] mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B0B0D] mb-2">SVG + PNG + ZIP</h3>
              <p className="text-xs sm:text-sm text-[#4F4E55] leading-relaxed">
                Get production-ready SVG code with rounded coordinates, transparent PNG rasterizations at 1x, 2x, or 4x, and batch ZIP archiving.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Sibling Tools Promotion Grid */}
        <div className="mb-16 border-t border-[#E5E1D6] pt-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[#5846F6] font-semibold">
                Complete Tool Suite
              </p>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0B0D]">
                More Free Image &amp; Design Tools
              </h3>
            </div>
            <a
              href="https://tools.abidmahmud.cv"
              className="text-xs sm:text-sm font-semibold text-[#5846F6] hover:underline inline-flex items-center gap-1"
            >
              All Tools <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="https://tools.abidmahmud.cv/svg-optimizer"
              className="rounded-2xl border border-[#E5E1D6] bg-white p-5 hover:border-[#5846F6] transition-all hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[10px] uppercase text-[#5846F6] font-bold">
                  Vector Precision
                </span>
                <h4 className="font-bold text-[#0B0B0D] text-base group-hover:text-[#5846F6] transition-colors mt-1">
                  SVG Optimizer &amp; Cleaner
                </h4>
                <p className="text-xs text-[#4F4E55] mt-1.5 leading-relaxed">
                  Clean up your SVG further. Remove hidden code, shrink file size, and keep the exact same look.
                </p>
              </div>
              <span className="text-xs font-bold text-[#5846F6] inline-flex items-center gap-1 mt-4">
                Launch Optimizer &rarr;
              </span>
            </a>

            <a
              href="https://tools.abidmahmud.cv/webptools"
              className="rounded-2xl border border-[#E5E1D6] bg-white p-5 hover:border-[#5846F6] transition-all hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[10px] uppercase text-[#1F8C7F] font-bold">
                  Compression
                </span>
                <h4 className="font-bold text-[#0B0B0D] text-base group-hover:text-[#5846F6] transition-colors mt-1">
                  WEBPTools
                </h4>
                <p className="text-xs text-[#4F4E55] mt-1.5 leading-relaxed">
                  Need lighter images too? Convert JPG, PNG, and SVG to WebP in seconds with zero uploads.
                </p>
              </div>
              <span className="text-xs font-bold text-[#1F8C7F] inline-flex items-center gap-1 mt-4">
                Try WEBPTools &rarr;
              </span>
            </a>

            <a
              href="https://tools.abidmahmud.cv/logo-kit"
              className="rounded-2xl border border-[#E5E1D6] bg-white p-5 hover:border-[#5846F6] transition-all hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[10px] uppercase text-amber-700 font-bold">
                  Branding
                </span>
                <h4 className="font-bold text-[#0B0B0D] text-base group-hover:text-[#5846F6] transition-colors mt-1">
                  Logo File Kit
                </h4>
                <p className="text-xs text-[#4F4E55] mt-1.5 leading-relaxed">
                  Need the right logo files too? Export your logo into 9 essential sizes for website, social, and print.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 mt-4">
                Try Logo Kit &rarr;
              </span>
            </a>

            <a
              href="https://tools.abidmahmud.cv/palette-extractor"
              className="rounded-2xl border border-[#E5E1D6] bg-white p-5 hover:border-[#5846F6] transition-all hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[10px] uppercase text-indigo-700 font-bold">
                  Color Theory
                </span>
                <h4 className="font-bold text-[#0B0B0D] text-base group-hover:text-[#5846F6] transition-colors mt-1">
                  Color Palette Extractor
                </h4>
                <p className="text-xs text-[#4F4E55] mt-1.5 leading-relaxed">
                  Need colors from your logo too? Extract dominant palettes and copy HEX codes for Canva and Figma.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1 mt-4">
                Try Palette Extractor &rarr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
