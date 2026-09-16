# Shizukuru Conditional Official-Color Rescue Audit — v10.8.41

**Production recognition is unchanged in this build.**

Candidate rescue rule:
- Current strict result must be null.
- Existing DeltaE / hue / chroma safeguards must all pass.
- Nearest official color must be at least **2.0× closer** than the second-nearest official color.
- RGB distance may extend only **+1.25** beyond the current adaptive radius (still capped by DISCOVER_DISTANCE + slack).

Baseline: 3583/4410 (81.25%), none 760, wrong 67.
Candidate: 3731/4410 (84.60%), none 611, wrong 68.
Rescued: 148; new wrong discoveries: 1.

This rule is a candidate for production only after this audit passes alongside all existing regression tests.