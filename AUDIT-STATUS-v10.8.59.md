# Shizukuru v10.8.59 — Drawing Recovery Reopen Race Fix

Base: v10.8.58.

## Root cause found
v10.8.58 fixed the save-side Native -> Web ordering, but reopening still had a race:
- recovery was primarily loaded once at application startup;
- close did not make the newly saved record the next pending record;
- on open, `applyPendingDrawingRecovery()` was deferred by two animation frames;
- `syncWebBitmapToNative()` was separately scheduled after 30 ms.

Those two asynchronous paths could race. The native canvas could therefore be populated
before the latest recovery image had actually been applied.

## Fix
- `openDrawingMode()` is now asynchronous and reloads the latest IndexedDB recovery record on every explicit open.
- Recovery is fully applied to Web Canvas before the native drawing surface is activated.
- Web -> Native sync happens immediately after recovery application, not on an independent 30 ms timer.
- After a successful close-save, the saved record is reloaded into same-session pending state.
- `applyDrawingRecovery()` supports a forced refresh so a newer record can replace an earlier startup recovery.

## Verification
- Full automated suite: 108/108 PASS.
- Official discovery: 350/350.
- Wrong recognition: 0.
- Unrecognized: 0.
