# Shizukuru Mixing Lab iOS — v10.11.13 RC2 code13

Base: Android v10.11.13-RC2-code12-child-lock-sync-fix.

## Included
- Current Web Core from the latest lock-sync Android build.
- SwiftUI + WKWebView iOS shell.
- Latest native→Web child-lock state synchronization preserved.
- Save to Photos and native share sheet.
- allow-listed nullnode.studio external-link bridge.
- Web drawing fallback for first iPhone 15 smoke testing.

## Important lock difference on iPhone
Android can enter Lock Task / screen pinning. A normal consumer iOS app cannot programmatically block the Home gesture. This build keeps Shizukuru's child-lock state synchronized between Swift and the Web UI, but full OS-level confinement on iPhone requires Apple's Guided Access. The app must not claim that it blocks the iPhone Home gesture.

## Build on Mac
1. Install Xcode.
2. Install XcodeGen (`brew install xcodegen`).
3. Open Terminal in this `ios` directory and run `xcodegen generate`.
4. Open `ShizukuruMixingLab.xcodeproj`.
5. Choose your Apple Development Team under Signing & Capabilities.
6. Connect the iPhone 15 and Run.

## First iPhone 15 smoke test
1. Launch and open the atelier.
2. Mix two colors.
3. Draw continuously for 30–60 seconds.
4. Press Child lock: UI must change on the first attempt.
5. Hold 2.4 seconds: UI must unlock on the first attempt.
6. Save to Photos and open the share sheet.
7. Test sound, language switching, background/foreground restore.
8. Check Dynamic Island, Safe Area, and bottom Home-indicator overlap.

## Deferred to Phase 2
- Native iOS drawing surface equivalent to Android NativeDrawingView.
- Apple support purchase.
- App icon / TestFlight / App Store packaging polish.
