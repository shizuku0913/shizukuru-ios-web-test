# Shizukuru v10.8.51 — Production Recipe Re-optimization

- Production engine unchanged: RYBPigmentTouchTestEngine.
- Official 350 HEX targets unchanged.
- Official reproduction recipes re-optimized against the actual production engine.

## Exact recipe baseline
- Geometric ownership: 350/350
- Strict recognition: 347/350
- Strict + conditional rescue: 348/350
- Wrong recognition: 0
- Mean RGB distance to target: 0.626
- Max RGB distance to target: 7.071

## Practical tolerance
- ±10%/water practical cases: 4324/4382 correct after recipe tie-break
- New tie-break wrongs: 0
- Holdout correct: 13096/13146
- Holdout new tie-break wrongs: 0

## Free-mix stress
- 50,000 random mixes: 0 unwanted tie-break fires
- Far random mixes: 0 unwanted fires
- Ambiguous boundary mixes (11452): 0 unwanted fires

## Tests
- 89/89 PASS.
