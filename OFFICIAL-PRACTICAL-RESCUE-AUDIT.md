# Shizukuru Practical Discovery Rescue Audit — v10.8.52

No production recognition thresholds are changed in this build.
Simulation keeps DeltaE/hue/chroma guards unchanged and adds only small RGB-radius slack after nearest-official selection.

| Slack | Correct | Success | None | Wrong | Rescued | New wrong |
|---:|---:|---:|---:|---:|---:|---:|
| +0.00 | 3583/4410 | 81.25% | 760 | 67 | 0 | 0 |
| +0.25 | 3650/4410 | 82.77% | 687 | 73 | 67 | 6 |
| +0.50 | 3711/4410 | 84.15% | 616 | 83 | 128 | 16 |
| +0.75 | 3776/4410 | 85.62% | 537 | 97 | 193 | 30 |
| +1.00 | 3821/4410 | 86.64% | 486 | 103 | 238 | 36 |
| +1.25 | 3872/4410 | 87.80% | 426 | 112 | 289 | 45 |
| +1.50 | 3927/4410 | 89.05% | 365 | 118 | 344 | 51 |
| +2.00 | 4006/4410 | 90.84% | 271 | 133 | 423 | 66 |

Best zero-new-wrong scenario: +0.00 RGB units → 81.25% (3583/4410), rescued 0.