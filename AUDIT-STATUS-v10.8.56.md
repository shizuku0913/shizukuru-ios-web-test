# Shizukuru v10.8.56 — Render Transfer / Radial Hot-Path Pass

Base: v10.8.55.

## What profiling found
- The production color mixer is already small compared with per-frame paint rendering.
- The unfinished-paint renderer scans a 192×192 grid and shades active row spans.
- While a pointer/presence effect is active, radial distance had been calculated with `Math.hypot()` for every shaded cell.
- `putImageData()` had copied the full 192×192 ImageData to the offscreen canvas every unfinished frame.

## Changes
- Presence and touch-gloss effects now check squared distance first.
  - Cells outside their effect radius skip `sqrt/hypot` entirely.
  - Inside the radius, the original `smoothstep` formula and true distance are retained.
- ImageData upload now uses the exact rectangle `current paint bounds ∪ previous paint bounds`.
  - Previous-only pixels are included so disappearing/moving paint is cleared correctly.
  - Completion clears the last uploaded rectangle once, avoiding stale offscreen pixels.
- Pixel shading, physics arrays, 192×192 resolution, visual formulas, and scheduler FPS are unchanged.

## Synthetic radial benchmark
- Grid cells: 36864
- Old full-distance loop: 411.43 ms / 300 iterations
- Gated loop: 126.41 ms / 300 iterations
- Speedup in this isolated math loop: 3.25×
- Numerical output delta: 0.000000000000

This benchmark measures only radial math in Node, not Android Canvas transfer. Actual WebView improvement should be checked on-device.

## Color safety
- Geometric ownership: 350/350
- Strict recognition: 349/350
- Strict + rescue: 350/350
- Wrong after rescue: 0
- Unrecognized after rescue: 0

## Tests
- 99/99 PASS.
