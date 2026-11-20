# LineTrace

**Turn line art into clean vectors. Free, in your browser, no sign-up.**

LineTrace traces uploaded line art (hand-drawn sketches, icons, logo marks, signatures) into clean, scalable SVG vectors, entirely in the browser. No upload to a server, no sign-in, no credits, no watermark. Files never leave the device.

- Live tool (once deployed): https://tools.abidmahmud.cv/linetrace
- Part of Abid Mahmud's free tools: https://tools.abidmahmud.cv
- By Abid Mahmud, Brand Identity Designer: https://www.abidmahmud.cv

## What it does

- Upload PNG, JPG, SVG, WebP, BMP, up to 20 images per batch, up to 10 MB each
- Presets: Icon, Logo, Sketch, Signature
- Threshold, despeckle, invert, and grayscale preprocessing, with a live preview
- Colour modes: Mono, Original colours, Posterize (2-8 colours)
- Stroke width harmonisation across a set
- Honest quality readout: real computed Pixel IoU, path count, node count, open gaps. No invented accuracy percentage.
- Before/after drag slider, Original / Vector / Overlay / Diff tabs
- Outputs: optimised SVG, transparent PNG at 1x/2x/4x, Copy SVG, Download All as ZIP

## Claude Code plugin

LineTrace also ships as a public Claude Code plugin, in `plugins/linetrace/`.
Install it with:

```text
/plugin marketplace add abirabidOG/linetrace
/plugin install linetrace@linetrace
```

Then trace from the terminal with `/linetrace sketch.png`. The plugin bundles
a skill, a slash command, and a local Node tracing script (potrace, MIT).
Nothing is uploaded. The marketplace catalog is
`.claude-plugin/marketplace.json` at the repo root.

## Status

Scaffold only. The app itself is built by running the Antigravity prompt in `docs/antigravity-prompt.md`. That prompt is the build spec: it covers the tracing engine (ImageTracerJS, MIT, bundled client-side), controls, results, outputs, page copy, SEO, analytics events, and the quality bar.

## Tech

- Next.js (App Router), React, TypeScript
- ImageTracerJS (potrace-based, MIT), bundled, fully client-side
- JSZip for Download All
- Brand tokens: paper #F4F2EC, ink #0B0B0D, iris #5846F6, volt #D4FF3A, Inter Tight headlines, Inter body

## Develop

```bash
npm install
npm run dev
```

## Why it exists

The reference tool, Linework AI, forces sign-in, gives 3 free traces, then charges. LineTrace is the free, private alternative: unlimited, no account, nothing uploaded.

## License

MIT. See `LICENSE`.
