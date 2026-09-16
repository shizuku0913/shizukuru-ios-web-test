# Shizukuru v10.10.7 — Official color semantic correction

Base: v10.10.6 device-language-settings.

## Production changes
15 official colors whose names and visual targets were semantically mismatched were corrected. Mixing engine and recognition algorithm are unchanged. Only the affected official targets and their reproduction recipes were updated.

Final targets:
- ちゃいろ #9A6432
- つちいろ #806044
- からしいろ #BBA21C
- ひまわりいろ #F6C515
- モスピンク #B78483
- ラベンダーいろ #B69BE8
- ラベンダーグレー #A9A2B8
- グレイッシュベージュ #B8AD9E
- アプリコットクリーム #F3BEAE
- モーブグレー #95818F
- アンティークゴールド #B08D57
- グレイッシュテラコッタ #A86F62
- オリーブグレー #85866F
- ディーププラム #672B62
- パステルむらさき #C8B4E8

Two round-2 semantic candidates were moved slightly to production-engine reachable colors: からしいろ #C49A24 -> #BBA21C and アプリコットクリーム #F6C6A5 -> #F3BEAE. Both retain the intended semantic family while restoring exact/robust ownership.

## Verification
- Official names: 350 unique
- Geometric ownership: 350/350
- Strict recognition: 349/350
- Strict + conditional rescue: 350/350
- Wrong recognition: 0
- Unrecognized after rescue: 0
- Mean RGB target distance: 0.600
- Max RGB target distance: 6.083
- Automated suite: 133/133 PASS
- Free-mix stress: 50,000 random mixes, 0 unwanted tie-break fires
- Adversarial near-boundary stress: 11,339 probes, 0 unwanted tie-break fires

Characterization baselines for practical ±10% recipe perturbation and waterless reachability were refreshed because the official truth set intentionally changed.
