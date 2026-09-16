# Shizukuru v10.11.2 — Official Discovery Persistence Fix

## Root cause
A legacy `removeDuplicateOfficialRecipes()` cleanup deduplicated `discoveredColors` by normalized pigment recipe only. That contradicted the later v10.8.14 rule that recipe identity alone is insufficient because water/process can change the resulting visible color. When a newly discovered official color shared the same pigment-ratio identity as an already discovered color, the new record could be removed immediately while its "found" presentation still appeared. The same cleanup also ran at startup.

## Fix
- Preserve distinct official discoveries by official name, regardless of recipe identity.
- Keep same-name duplicate cleanup for corrupted/legacy data only.
- Persist and synchronously verify the newly earned official name in the primary discovery payload before presentation.
- Retry primary persistence once on failure.

## Unchanged
- Official 350 truth set
- Secret recipes
- Mixing engine
- Recognition thresholds / conditional rescue
- 16-language official-name translations
- Encyclopedia family classification
