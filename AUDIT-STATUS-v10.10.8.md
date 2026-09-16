# Shizukuru v10.10.8 — Semantic Recipe / Encyclopedia Family Sync Fix

Base: v10.10.7.

## Fixes
- Secret-recipe presentation for the 15 semantic-color corrections is regenerated from the production optimized reproduction recipes instead of retaining the pre-v10.10.7 recipe table.
- Official encyclopedia family grouping now uses the current published/canonical official HEX before the historical discovery HEX stored in local discovery records.
- Existing users therefore see corrected colors move to their correct family without resetting discovery history.
- Example: パステルむらさき #C8B4E8 now groups under 紫系, not 白・黒・灰系.

## Scope
- No mixing-engine coefficient changes.
- No recognition-threshold changes.
- No official HEX changes from v10.10.7.
- Discovery history remains intact.
