#!/usr/bin/env node
/**
 * LineTrace CLI — trace line art to clean SVG, locally.
 *
 * Usage:
 *   node scripts/trace.cjs <image...> [--preset icon|logo|sketch|signature]
 *     [--threshold 0-255] [--turd-size N] [--opt-tolerance 0-1]
 *     [--color #hex] [--background transparent|white] [--out file.svg]
 *
 * Engine: potrace (MIT), runs fully offline. Nothing is uploaded.
 * --out works with a single input only; batches name outputs after inputs.
 */
const fs = require("fs");
const path = require("path");
const potrace = require("potrace");

const PRESETS = {
  icon: { threshold: 180, turdSize: 4, optTolerance: 0.4 },
  logo: { threshold: 128, turdSize: 2, optTolerance: 0.2 },
  sketch: { threshold: 200, turdSize: 2, optTolerance: 0.2 },
  signature: { threshold: 100, turdSize: 1, optTolerance: 0.1 },
};

function parseArgs(argv) {
  const inputs = [];
  const opts = { preset: "logo", color: "#111111", background: "transparent" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--preset") opts.preset = argv[++i];
    else if (a === "--threshold") opts.threshold = Number(argv[++i]);
    else if (a === "--turd-size") opts.turdSize = Number(argv[++i]);
    else if (a === "--opt-tolerance") opts.optTolerance = Number(argv[++i]);
    else if (a === "--color") opts.color = argv[++i];
    else if (a === "--background") opts.background = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (a.startsWith("--")) {
      console.error(`Unknown option: ${a}`);
      process.exit(2);
    } else inputs.push(a);
  }
  return { inputs, opts };
}

function traceOne(input, outPath, opts) {
  return new Promise((resolve, reject) => {
    const params = {
      threshold: opts.threshold,
      turdSize: opts.turdSize,
      optTolerance: opts.optTolerance,
      color: opts.color,
      background: opts.background,
      optCurve: true,
    };
    potrace.trace(input, params, (err, svg) => {
      if (err) return reject(err);
      fs.writeFileSync(outPath, svg);
      const paths = (svg.match(/<path/g) || []).length;
      resolve({ outPath, paths, bytes: Buffer.byteLength(svg) });
    });
  });
}

async function main() {
  const { inputs, opts } = parseArgs(process.argv.slice(2));
  if (inputs.length === 0) {
    console.error(
      "Usage: node scripts/trace.cjs <image...> [--preset icon|logo|sketch|signature] [--out file.svg]"
    );
    process.exit(2);
  }
  if (!PRESETS[opts.preset]) {
    console.error(`Unknown preset: ${opts.preset}. Use icon, logo, sketch, or signature.`);
    process.exit(2);
  }
  if (opts.out && inputs.length > 1) {
    console.error("--out works with a single input only.");
    process.exit(2);
  }
  const base = PRESETS[opts.preset];
  const merged = {
    threshold: opts.threshold ?? base.threshold,
    turdSize: opts.turdSize ?? base.turdSize,
    optTolerance: opts.optTolerance ?? base.optTolerance,
    color: opts.color,
    background: opts.background,
  };
  for (const input of inputs) {
    if (!fs.existsSync(input)) {
      console.error(`Not found: ${input}`);
      process.exit(1);
    }
    const outPath =
      opts.out || path.join(path.dirname(input), `${path.parse(input).name}.svg`);
    try {
      const r = await traceOne(input, outPath, merged);
      console.log(
        `${path.basename(input)} -> ${r.outPath} (${r.paths} paths, ${r.bytes} bytes)`
      );
    } catch (err) {
      console.error(`Failed to trace ${input}: ${err.message}`);
      process.exit(1);
    }
  }
}

main();
