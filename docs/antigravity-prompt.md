# LineTrace — Antigravity build prompt (standalone repo version)

This is the build spec for LineTrace. Run it in Antigravity with this repository open.

**Change from the original prompt (2026-11-20):** LineTrace is now its own public repo and its own Next.js app with its own Vercel deployment, not a page inside the tools.abidmahmud.cv app. The live home is https://tools.abidmahmud.cv/linetrace once deployed. Everything else below is unchanged from the original prompt.

---

Build a new free tool called LineTrace as a standalone Next.js app in this repository, with its own Vercel deployment. The live home will be https://tools.abidmahmud.cv/linetrace. Link back to the tools homepage (https://tools.abidmahmud.cv) from the header and footer, and use the same brand tokens as the other tools (WEBPTools, Logo File Kit, Image Resizer, Color Palette Extractor, SVG Optimizer).

Brand tokens: paper #F4F2EC, ink #0B0B0D, smoke #4F4E55, fog #C9C7C1, iris #5846F6, volt #D4FF3A. Headlines Inter Tight, body Inter. Light paper background, ink text, iris primary buttons, volt only as a small accent. No dark emerald theme, no copied branding from any other tool.

## What it does

LineTrace turns uploaded line art (hand-drawn sketches, icons, logo marks, signatures) into clean, scalable SVG vectors, entirely in the browser. No upload to a server, no sign-in, no credits, no watermark, no account of any kind. Files never leave the device; say so on the page.

## Tracing engine

Use ImageTracerJS (MIT-licensed, potrace-based, pure JavaScript, runs fully client-side). Bundle it with the app, do not load it from a third-party CDN at runtime. Map the UI controls to its options (ltres, qtres, pathomit, numberofcolors, colorquantization, scale, roundcoords). If ImageTracerJS cannot be bundled, use a potrace WASM build instead and say which one in the code comments. Never send image data to any server or API.

## Upload

Drag and drop plus click to browse. Accept PNG, JPG, SVG, WebP, BMP. Up to 20 images per batch, up to 10 MB each. Show a thumbnail grid of queued files with remove buttons. Include three built-in sample sets a visitor can try in one click: (1) six simple line icons, (2) one logo mark, (3) one hand-drawn sketch. Samples are drawn inline as SVG, not fetched from anywhere.

## Preprocessing (on canvas, before tracing)

Threshold slider (0-255, default auto), Despeckle toggle (removes isolated specks), Invert toggle (for white-on-black line art), and a Grayscale toggle. Show a small live preview of the preprocessed bitmap so the user can see what the tracer will see.

## Presets

Four one-click presets that set threshold, smoothing, and colour mode together: Icon (crisp, mono, high smoothing), Logo (mono, low smoothing, keeps fine detail), Sketch (higher threshold tolerance, medium smoothing), Signature (mono, low threshold, keeps thin strokes). Changing any control after picking a preset switches the preset label to Custom.

## Trace controls

- Quality Mode: Fast / Standard (default) / Precise. These map to tracer option sets, faster means coarser curves, Precise means tighter fit and more nodes.
- Path Optimization slider, 0 to 1, default 0.5 "Balanced". Left end is labelled "Exact match", right end "Cleanest paths". It trades fidelity for smoothness and fewer nodes.
- Colour mode: Mono (single ink colour), Original colours, Posterize with a 2-8 colour count.
- Stroke colour picker, default #111111. Stroke width harmonisation toggle with a target width in px, applied across all icons in the batch so a set looks consistent.
- Background for preview and PNG export: Transparent (default) / White / Dark.

## Processing and results

Show a live progress bar with the four stages: Image Analysis, Path Tracing, Curve Optimization, Output Generation. Keep it honest: these are the real pipeline steps, not a fake timer.

Result view per image, with tabs: Original, Vector, Overlay, Diff. Overlay draws the vector outline over the original at low opacity. Diff highlights where vector and original differ. Add a before/after drag slider on the main preview, plus zoom out / Fit / zoom in.

Quality readout per image, all computed for real: Pixel IoU (rasterise the traced SVG back to canvas at the original size and compare against the preprocessed bitmap), path count, node count, and open gaps found. Show the numbers plainly. Never display an invented accuracy percentage and never claim 99.8% or any other fixed accuracy figure.

## Outputs

- Download SVG (optimised: round coordinates, strip editor metadata, single path where possible).
- Download PNG (transparent background, 1x / 2x / 4x scale picker).
- Copy SVG to clipboard, with a "Copied" confirmation.
- Download All as ZIP for a batch (all SVGs, plus PNGs if chosen).
- No EPS export in v1. Do not add account, project saving, history, or settings pages. Do not add any sign-in.

## Page structure and copy

Hero: "LineTrace" headline, one line: "Turn line art into clean vectors. Free, in your browser, no sign-up." Upload zone directly under the hero. Then the controls, then results. Below the tool: a short "How it works" (Upload, Adjust, Download), three bullet benefits (free and unlimited, private by design, SVG + PNG + ZIP), and an FAQ (What is vector tracing? Will my files be uploaded? What makes a good source image? Why is my trace missing thin lines? Can I use the vectors commercially? Answer: yes, your own art, no watermark, no licence fee). All copy outcome-first, plain English, no em dashes, no invented statistics, no fake testimonials.

## SEO and analytics

Page title: "LineTrace: Free Line Art to Vector Converter (SVG, No Sign-Up)". Meta description under 160 characters, same promise. Canonical URL https://tools.abidmahmud.cv/linetrace. Open Graph title, description, and image. One H1 only. Add a link back to the tools homepage (https://tools.abidmahmud.cv) in the header and footer. Add GA4 with the site's real Measurement ID if it is already configured for the other tools, and mark these as Key Events: trace_complete, download_svg, download_png, download_all_zip, copy_svg.

## Quality bar

Responsive down to 360 px wide. Keyboard accessible: all controls reachable by Tab, visible focus states. Works with JavaScript disabled only as a static page explaining the tool; the tracer itself needs JavaScript, and the page must say so plainly instead of failing silently. Handle corrupt or non-image files with a clear error, not a crash. Test with: a 6-icon line set, a single-colour logo mark, a faint pencil sketch, a white-on-black drawing (invert), and a 20-image batch. Verify the downloaded SVG opens correctly in Illustrator and Figma, and that a transparent PNG really is transparent.

## What not to build

No BG Studio, no template maker, no pattern library in v1. No My Projects, no Settings page, no pricing page, no credits, no paywall, no sign-in, no server. If the SVG Optimizer tool exists, add a cross-link to it under the results ("Clean up your SVG further").

---

## After Antigravity builds it

- Test with a real logo sketch and a real icon set, not only the samples.
- Deploy to Vercel and point tools.abidmahmud.cv/linetrace at it (or keep the Vercel URL until the routing is set).
- Add the page to Search Console.
- Pinterest pins follow the usual pattern (10 pins, 1000x1500, Inter Tight Bold headlines, Inter labels, 2-3 colours, 3-second test). Board idea: "Line Art to Vector Tips".
- Remotion promo can reuse the 5-tool master prompt structure with a new LineTrace composition.
