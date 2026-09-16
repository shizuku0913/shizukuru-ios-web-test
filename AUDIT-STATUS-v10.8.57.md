# Shizukuru v10.8.57 — Local Physics Hot-Path Optimization

Base: v10.8.56.

## Changes
### PaintTransportLifecycle
- Hoisted brush-segment constants out of the per-cell loop:
  - radius squared
  - back-distance base
  - sideways-distance base
  - carried-mass factor
- Rectangle cells outside the circular brush radius are rejected using squared distance before square root work.
- Row base/index arithmetic is reused instead of repeated `idx()` calls.
- Physics coefficients and equations are unchanged.

### PaintViscosityLifecycle
- The viscosity `smooth` coefficient is calculated once per brush segment instead of once per active cell.
- The stringing `bridgeFactor` is calculated once per segment.
- Forward/backward string-neighbor indices are calculated once and reused for mass and RGB.
- Direct neighbor indices (`i±1`, `i±GRID`) replace equivalent repeated `idx()` calculations.
- Update order is unchanged.

## Synthetic local-physics benchmark
- Iterations: 350
- Old transport + viscosity: 234.24 ms
- Optimized: 205.97 ms
- Speedup in isolated Node benchmark: 1.14×
- Maximum array output delta: 0

The benchmark uses the same formulas on a representative 192×192 paint field. Android WebView performance should still be judged on-device.

## Color safety
- Geometric ownership: 350/350
- Strict recognition: 349/350
- Strict + rescue: 350/350
- Wrong after rescue: 0
- Unrecognized after rescue: 0

## Tests
- 102/102 PASS.
