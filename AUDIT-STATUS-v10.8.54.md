# Shizukuru v10.8.54 — Production Diagnostics Cleanup

Base: v10.8.53, retained as the rollback/reference baseline.

## Removed from production HTML
- KMPigmentReferenceModel
- MixingReferenceBench
- RYBEngineValidationSuite
- RYBEngineSelfTest compatibility wrapper
- window.ShizukuMixingEngine development/debug facade
- window.ShizukuruOfficialDiscoveryDiagnostics
- KM/validation-only manifest metadata

The KM comparison model and validation source are retained under `test/reference-models-v10854.js` for offline regression/reference work.

## Production behavior intentionally unchanged
- RYBPigmentTouchTestEngine unchanged.
- Mixing coefficients unchanged.
- 350 official HEX targets unchanged.
- 350 reproduction recipes unchanged.
- Official recognition thresholds unchanged.

## Verification
- Geometric ownership: 350/350
- Strict recognition: 349/350
- Strict + conditional rescue: 350/350
- Wrong after rescue: 0
- Unrecognized after rescue: 0
- Full automated suite: 92/92 PASS.

## Production HTML size
- v10.8.53: 4,651,739 bytes
- v10.8.54: 4,626,544 bytes
- Removed from production HTML: 25,195 bytes (~24.6 KiB)
