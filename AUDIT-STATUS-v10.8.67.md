# Shizukuru v10.8.67 — Release Render Cleanup

Base: v10.8.66 (stable candidate).

## What was found
The old Deep Profiler itself had already been disabled in production, but some render-observability
plumbing was still running every frame:
- extra `performance.now()` calls around base/overlay rendering;
- frozen diagnostic objects for active-cell, pipeline and frame snapshots;
- writes to a diagnostic `window.__activeRenderStats` value;
- a large declarative render manifest that gameplay never reads.

These did not change visuals, but they were leftover release overhead.

## Changes
- Removed base/overlay diagnostic timing from the live render pipeline.
- Kept `RenderProfilerLifecycle` as a compatibility shell, but its per-frame methods are allocation-free no-ops.
- Removed per-frame diagnostic payload construction.
- Reduced the unused render architecture manifest to its version marker only.
- Kept `PerformanceGovernor.recordFrame()` and frame-continuation logic untouched.

## Intentionally unchanged
- Mixing/paint physics
- Drawing and eraser
- Android native drawing recovery
- Research-color state fix
- Official color recognition and recipes
- Visual render order

## Verification
- Automated suite: 119/119 PASS.
- Official discovery: 350/350.
- Wrong recognition: 0.
- Unrecognized: 0.
