# OFFICIAL RECIPE TIE-BREAK AUDIT — v10.8.47

Production color classification is unchanged in this audit build.

## Candidate rule

When v10.8.42 strict + conditional RGB rescue still returns null:

1. Consider only the 4 nearest official RGB centers.
2. Compare the current normalized pigment ratios plus water amount with those four official reproduction recipes.
3. Rescue only when the best recipe distance is <= 0.08, the second-best recipe is at least 1.15x farther, and the RGB center is within 30 units.
4. Existing successful/wrong RGB classifications are never overridden.

## Practical ±10% audit

- Cases: 4736
- v10.8.42 correct: 3916 (82.69%)
- v10.8.42 wrong: 36
- v10.8.42 misses: 784
- Candidate correct: 4691 (99.05%)
- Candidate wrong: 36
- Candidate misses: 9
- Correct rescues added: 775
- New wrong discoveries: 0

## Holdout audit

Holdout uses ingredient perturbations of ±2.5%, ±5%, ±7.5% and water perturbations of ±0.0125, ±0.025, ±0.0375.

- Cases: 14208
- v10.8.42 correct: 13501 (95.02%)
- v10.8.42 wrong: 30
- v10.8.42 misses: 677
- Candidate correct: 14166 (99.70%)
- Candidate wrong: 30
- Candidate misses: 12
- Correct rescues added: 665
- New wrong discoveries: 0

## Interpretation

This is strong evidence that recipe composition can serve as a safe tie-breaker for recipe-near mixtures. It is not yet proof against arbitrary free-play mixtures, so this build intentionally does not change production discovery behavior.
