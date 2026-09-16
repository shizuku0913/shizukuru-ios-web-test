# Shizukuru v10.8.50 — Production Engine Audit Alignment

## What changed

- `test/production-mixing-utils.js` now loads the same production engine used by the app: `RYBPigmentTouchTestEngine`.
- Pigment strength, 0.52 hue-spread dulling, CMY bridge, complement undertones, and multi-pigment neutralization are included in every official-color audit.
- Older v10.8.47/v10.8.48 tie-break reports are historical only and are not treated as current-engine guarantees.
- No production mixing parameters or official color HEX values were changed in this build.

## Current 350-color baseline before recipe re-optimization

- Intended official center is geometrically nearest: 258/350
- Strict recognition returns intended color: 141/350
- Strict wrong recognition: 7
- Strict + conditional rescue returns intended color: 161/350
- Wrong after strict + conditional rescue: 9
- Unrecognized after strict + conditional rescue: 180
- Mean recipe → official-center RGB distance: 10.40
- Maximum recipe → official-center RGB distance: 88.96

## Largest recipe shifts

1. くろ — generated #5D5044, target distance 88.96, nearest official: もぐらいろ
2. ペールジェイド — generated #93BCB5, target distance 73.50, nearest official: つゆぞらいろ
3. アクアミント — generated #85A7AF, target distance 68.51, nearest official: あまぞらいろ
4. あたらしいゆきだるまいろ — generated #D5D3DF, target distance 63.16, nearest official: ランドリーいろ
5. みどり — generated #40A070, target distance 59.89, nearest official: わかくさ
6. どらやきいろ — generated #A49F43, target distance 53.27, nearest official: なっとういろ
7. もえぎ — generated #769577, target distance 50.54, nearest official: やもりいろ
8. くじゃくいろ — generated #206196, target distance 42.73, nearest official: ディーププラム
9. なみのいろ — generated #3D668F, target distance 42.17, nearest official: すみれちゃ
10. つちいろ — generated #4B9363, target distance 41.55, nearest official: じょうろいろ
11. オリーブグレー — generated #475782, target distance 40.36, nearest official: ブルーベリーいろ
12. オリーブいろ — generated #5E8E51, target distance 40.24, nearest official: かえるいろ
13. かえるいろ — generated #65926D, target distance 38.60, nearest official: じょうろいろ
14. パステルラベンダーいろ — generated #A4A4BA, target distance 38.13, nearest official: つゆぞらいろ
15. ブルーベリーいろ — generated #4C4D59, target distance 33.20, nearest official: かざんばいいろ
16. ふでばこいろ — generated #465C90, target distance 32.31, nearest official: すみれちゃ
17. ずんだいろ — generated #769F65, target distance 32.05, nearest official: やもりいろ
18. こいみどり — generated #394A3F, target distance 31.84, nearest official: くらいきいろ
19. モスピンク — generated #518773, target distance 31.46, nearest official: じょうろいろ
20. きゅうりいろ — generated #6D9A5D, target distance 31.38, nearest official: やもりいろ

## Next step

Re-optimize all 350 official recipes against the frozen production mixing engine, then rerun ownership, practical ±10% tolerance, recipe tie-break, free-mix stress, and waterless audits.

## Test status

88/88 tests pass with the production-engine audit baseline.