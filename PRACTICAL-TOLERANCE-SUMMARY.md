# v10.8.39 Practical tolerance summary

This audit narrows the previous ±20% stress test to a more realistic perturbation band:

- each recipe ingredient: -10% / +10%, one ingredient at a time
- water level: -0.05 / +0.05
- production mixing and official-color recognition are unchanged

Results:

- Official colors: 350
- Perturbations: 4,736
- Intended color retained: 3,712 / 4,736 = 78.38%
- Perfect across this band: 59 / 350 colors
- At least one boundary crossing: 291 / 350 colors
- Failed perturbations: 1,024
  - no formal discovery (`null`): 988 (96.48% of failures)
  - misrecognized as another official color: 36 (3.52% of failures)

Interpretation: the dominant usability risk is still a missed discovery rather than a wrong-color discovery. This build is audit-only; it does not widen recognition radii or change the mixing engine.
