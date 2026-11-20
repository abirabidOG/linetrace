# LineTrace plugin for Claude Code

Trace line art to clean SVG vectors without leaving the terminal. Free,
local, no sign-up, nothing uploaded.

## Install

In Claude Code:

```text
/plugin marketplace add abirabidOG/linetrace
/plugin install linetrace@linetrace
```

First run only: the skill installs its tracing engine once, from the plugin
folder:

```bash
cd <plugin-dir>
npm install
```

## Use

```text
/linetrace sketch.png
/linetrace logo.png --preset logo --out logo.svg
```

Or ask Claude in plain words: "trace this sketch to SVG". Presets: `icon`,
`logo`, `sketch`, `signature`. Batch tracing takes several images at once.

## How it works

The plugin ships a skill (`skills/linetrace/SKILL.md`), a slash command
(`/linetrace`), and a small Node script (`scripts/trace.cjs`) built on
potrace (MIT). Tracing runs entirely on your machine. The script prints real
numbers only: path count and file sizes. It never claims an accuracy
percentage.

## What it does not do (v1)

- No EPS export, no colour tracing. Both live in the web tool.
- No accounts, no history, no server.

## Web version

The same tracer with a visual interface, batch mode, colour modes, a
before/after slider, and PNG/ZIP export:
https://tools.abidmahmud.cv/linetrace

## Licence

MIT. By Abid Mahmud, https://www.abidmahmud.cv
