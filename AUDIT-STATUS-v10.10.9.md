# Shizukuru v10.10.9 — Derived color semantic correction

Base: v10.10.8 semantic-sync-fix + final visual audit.

## Important scope finding
The 11 colors found by the final visual audit are CANONICAL research/derived colors, not members of OFFICIAL_ENCYCLOPEDIA_NAMES (350). Therefore this pass corrects their semantic targets without changing the official 350 truth set, official secret recipes, or official recognition thresholds.

## Corrected derived targets
- あおみのつちいろ #349B5A → #756A5C
- だいだいみのつちいろ #4AA036 → #94613B
- きいろみのからしいろ #CC6B4F → #C4AD28
- むらさきみのからしいろ #CC5655 → #9A7955
- みどりみのモスピンク #36885A → #A77F79
- ピンクみのモスピンク #616364 → #C98B9B
- ピンクみのラベンダーいろ #4D48C8 → #C29BDF
- パステルちゃいろ #C4C871 → #C9A982
- パステルつちいろ #93CF9A → #BCA58E
- パステルからしいろ #E3ADA4 → #D9C66F
- パステルモスピンク #A7AFAB → #D9B5BD

## Semantic rules applied
- “〜みのX” keeps the perceptual identity of X and moves only toward the modifier.
- “パステルX” keeps X's hue family while increasing lightness and reducing saturation.
- Parent/derived relationships take priority over maximizing numerical separation from unrelated novelty colors.

## Collision audit against the official 350 (CIEDE2000)
Nearest official-color distances after correction:
- あおみのつちいろ 6.79
- だいだいみのつちいろ 3.09
- きいろみのからしいろ 3.13
- むらさきみのからしいろ 4.45
- みどりみのモスピンク 4.66
- ピンクみのモスピンク 7.39
- ピンクみのラベンダーいろ 4.10
- パステルちゃいろ 1.41 (nearest: わらびもちいろ)
- パステルつちいろ 5.40
- パステルからしいろ 5.02
- パステルモスピンク 4.86

パステルちゃいろ is intentionally kept semantically brown despite proximity to わらびもちいろ; moving it away enough to optimize ΔE would make the name/appearance relationship worse. These 11 are not official-350 recognition targets, so this proximity does not alter 350/350 ownership.

## Verification
- Automated suite: 135/135 PASS.
- Official 350 list itself: unchanged by this pass.
- Official recipes: unchanged by this pass.
- Official recognition thresholds: unchanged by this pass.
- Android Gradle build could not be executed in the isolated environment because Gradle distribution download requires network access. No Gradle/Kotlin/Java source was changed.
