# Shizukuru v10.8.58 — Drawing Recovery Native Sync Fix

Base: v10.8.57.

## Bug
On Android, the native drawing surface is authoritative while Drawing mode is open.
`closeDrawingMode()` previously deactivated the native surface before guaranteeing that
the latest native bitmap had been mirrored to the Web canvas. Recovery then saved the
older Web canvas, so close -> reopen could appear to lose the drawing.

## Fix
- `closeDrawingMode()` now starts Native -> Web bitmap capture before native deactivation.
- The UI still closes immediately.
- Recovery save waits for that captured bitmap to reach the Web canvas.
- visibility-hidden and pagehide recovery also mirror native bitmap before saving.
- Startup behavior remains Atelier-first; recovered artwork is applied only when Drawing is explicitly opened.

## Unchanged
- Drawing appearance and brush behavior
- Native drawing engine
- 350 official colors and recipes
- Mixing engine and recognition thresholds

## Verification
- Full automated suite: 105/105 PASS.
- Geometric ownership: 350/350
- Strict + rescue recognition: 350/350
- Wrong recognition: 0
- Unrecognized: 0
