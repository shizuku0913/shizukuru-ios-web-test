# Shizukuru v10.8.60 — Native-direct Drawing Recovery

Base: v10.8.59.

## Root cause
Android's NativeDrawingView keeps its bitmap when Drawing mode is closed.
However, reopening could overwrite that still-valid native bitmap with the Web canvas.
If Web recovery was missing, stale, or late, a blank Web canvas destroyed the visible native picture.

## Fix
- Android recovery now persists `getNativePngDataUrl()` directly in IndexedDB.
- The authoritative Native PNG is restored directly with `loadNativePng()`.
- Web Canvas Blob persistence remains as the browser/PWA fallback.
- If no valid recovery record exists, opening Drawing mode no longer overwrites the existing Native bitmap with a blank Web canvas.
- Closing Drawing saves while the Native surface is still active, then hides it.
- visibility-hidden and pagehide use the same direct-native save path.

## Verification
- Full automated suite: 106/106 PASS.
- Official discovery: 350/350.
- Wrong recognition: 0.
- Unrecognized: 0.
