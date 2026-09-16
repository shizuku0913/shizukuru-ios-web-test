# Shizukuru v10.8.52 — 350/350 Official Discovery Fix

## Changes
- Base: v10.8.51.
- Only two official reproduction recipes were locally re-optimized:
  - オレンジ
  - あたらしいしゃぼんだまいろ
- Production mixing engine unchanged.
- Official 350 HEX targets unchanged.
- The other 348 official recipes unchanged.

## Exact official recipe results
- Geometric ownership: 350/350
- Strict recognition: 349/350
- Strict + conditional rescue: 350/350
- Wrong recognition: 0
- Unrecognized after rescue: 0
- Mean RGB distance to official target: 0.607
- Maximum RGB distance: 6.083

## Practical recipe tolerance + tie-break
- ±10% / water practical set: 4330/4384 correct
- New tie-break wrong discoveries: 0
- Holdout set: 13110/13152 correct
- Holdout new tie-break wrong discoveries: 0

## Free-mix stress
- 50,000 random mixes: 0 unwanted tie-break fires
- 11456 ambiguous boundary mixes: 0 unwanted fires

## Tests
- 89/89 PASS.
