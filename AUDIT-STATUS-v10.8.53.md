# Shizukuru v10.8.53 — Cleanup / Performance Pass

- Base: v10.8.52 (350/350 official discovery).
- Mixing coefficients unchanged.
- 350 official recipes unchanged.
- Official recognition thresholds unchanged.

## Cleanup
- Removed unused `RYBPigmentStrengthExperiment` comparison object.
- Full `RYBEngineValidationSuite` no longer runs on every app launch; it remains available on demand through diagnostics.
- Added bounded cache for source RGB→RYB conversion.
- Added bounded cache for source hue calculation.

## Safety
- Full automated suite: 93/93 PASS.
- Official baseline discovery: 350/350 retained.
- Cache size is bounded to 64 entries and clears itself to avoid unbounded memory growth.

## Static size
- index.html: 4651916 → 4651739 bytes (-177 bytes).
