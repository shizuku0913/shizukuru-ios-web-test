# Shizukuru v10.11.3 — Gift Range 300–500

Base: v10.11.2.

## Change
- Gift threshold random range changed from 300–600 to 300–500 completed colors.
- Existing gift progress is migrated instead of reset when the configured range changes.
- A and pending state are preserved.
- Existing B is clamped into the new configured range.
- If A is already beyond the new maximum, the next completed color can trigger the pending gift cycle naturally.

## Unchanged
- Official 350 colors and semantic names
- Mixing engine and official discovery thresholds
- Encyclopedia classification and official discovery persistence fix
- Gift contents and order
- Drawing, language, purchase/support behavior

## Verification
- Full Node automated suite: 140/140 PASS.
- Added regression coverage for 300–500 range and non-resetting range migration.
