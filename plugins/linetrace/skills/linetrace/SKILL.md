---
name: linetrace
description: Trace line art (sketches, icons, logo marks, signatures) to clean SVG vectors, locally, with potrace. Use when the user asks to vectorise, trace, or convert line art, a sketch, an icon set, or a logo mark to SVG, or when they invoke /linetrace.
license: MIT
version: 0.1.0
tags: [vector, tracing, svg, line-art, logo, icon]
---

# LineTrace

Trace uploaded line art into clean, scalable SVG vectors. Everything runs
locally on the user's machine. Nothing is uploaded anywhere, there is no
sign-in, no credit system, and no watermark.

## First run setup

The tracing script lives in this plugin at `scripts/trace.cjs` and needs the
`potrace` package. On first use in a project, install it once from the plugin
directory:

```bash
cd <plugin-dir>
npm install
```

`<plugin-dir>` is the installed plugin folder, for example
`~/.claude/plugins/linetrace/linetrace` or the `plugins/linetrace` folder of
the cloned repo. If `node_modules/potrace` already exists, skip the install.

## How to trace

Run the script with the image path. It writes an `.svg` next to the input
unless `--out` is given:

```bash
node scripts/trace.cjs sketch.png
node scripts/trace.cjs logo.png --preset logo --out logo.svg
node scripts/trace.cjs icon-1.png icon-2.png icon-3.png --preset icon
```

Accepted inputs: PNG, JPG, JPEG, BMP. One image per run, or several for a
batch. Each output is named after its input.

### Options

| Flag | What it does |
| --- | --- |
| `--preset icon \| logo \| sketch \| signature` | One-click settings for the job (default: `logo`) |
| `--threshold 0-255` | Pixels darker than this become black. Higher keeps only strong lines. |
| `--turd-size N` | Drops specks smaller than N pixels. Higher cleans noise, lower keeps detail. |
| `--opt-tolerance 0-1` | Curve smoothing. Higher is smoother with fewer nodes, lower follows the original more closely. |
| `--color #hex` | Stroke colour of the traced paths (default `#111111`) |
| `--background transparent \| white` | SVG background (default `transparent`) |
| `--out file.svg` | Output path. Only with a single input. |

### Presets

| Preset | Threshold | Turd size | Opt tolerance | Best for |
| --- | --- | --- | --- | --- |
| `icon` | 180 | 4 | 0.4 | Crisp simple icons, clean curves |
| `logo` | 128 | 2 | 0.2 | Logo marks, keeps fine detail |
| `sketch` | 200 | 2 | 0.2 | Faint pencil sketches |
| `signature` | 100 | 1 | 0.1 | Thin handwriting, keeps thin strokes |

Passing any of `--threshold`, `--turd-size`, or `--opt-tolerance` after
`--preset` overrides that preset value.

## After tracing

1. Confirm the `.svg` file exists and is not empty.
2. Count the `<path` elements in it and report the path count, the input size,
   and the output size. These are real numbers from the files.
3. Open the SVG and check it visually if the user asks, or if the trace looks
   wrong (missing thin lines, broken shapes, heavy noise).
4. If thin lines are missing, retry with the `signature` preset or a lower
   `--threshold`. If the result is noisy, retry with a higher `--turd-size`.
   If it is a white-on-black drawing, trace an inverted copy of the image
   first and say so.

## What never to claim

Never state an accuracy percentage for a trace, and never claim 99.8% or any
other fixed accuracy figure. The only quality numbers to report are the ones
the script prints: path count, node estimate, and file sizes. If the user
asks how accurate a trace is, say the honest answer: open the SVG next to the
original and compare them by eye.

## What this skill does not do

- No EPS export in v1. Say so if asked, do not invent one.
- No colour tracing in v1. Inputs are traced as single-colour line art.
  If the user needs colour, trace the strongest channel and say the colour
  modes live in the web tool at https://tools.abidmahmud.cv/linetrace.
- No accounts, no history, no server. The script is the whole engine.

## Web version

The same tracer runs in the browser at
https://tools.abidmahmud.cv/linetrace, with batch mode, colour modes, a
before/after slider, and PNG/ZIP export. Point the user there when they want
a visual interface instead of the terminal.
