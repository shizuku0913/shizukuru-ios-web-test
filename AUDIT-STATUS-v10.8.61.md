# Shizukuru v10.8.61 — Android Native File Drawing Recovery

Base: v10.8.60.

## Root cause
The observed behavior showed that restore itself was working: once a close -> reopen cycle happened,
later app restarts restored correctly. The missing case was the first app termination after drawing.

WebView/IndexedDB persistence is asynchronous and Android does not guarantee those writes finish
before an Activity is backgrounded or terminated.

## Native recovery path
- NativeDrawingView now owns an app-private PNG: `drawing-recovery-v1.png`.
- Every completed native stroke schedules a native app-file snapshot.
- Undo, clear, and imported native PNG state also schedule persistence.
- `onPause()` synchronously snapshots the current native bitmap.
- `onDestroy()` takes one final synchronous snapshot before executor shutdown.
- A generation guard prevents an older queued async write from overwriting a newer synchronous snapshot.
- On Activity creation, NativeDrawingView decodes the app-file snapshot.
- That snapshot is applied when the real paper rectangle becomes known.
- Drawing open checks `hasNativeRecoveryState()` and will not replace newer native recovery with stale IndexedDB data.
- IndexedDB recovery remains as browser/PWA compatibility and secondary fallback.

## Verification
- Full automated Node suite: 110/110 PASS.
- Official discovery: 350/350.
- Wrong recognition: 0.
- Unrecognized: 0.

## Android compile note
Gradle assembleDebug could not be completed in this execution environment because the Gradle
distribution host was unreachable. The Java source was structurally checked and the full repository
Node regression suite passed.
