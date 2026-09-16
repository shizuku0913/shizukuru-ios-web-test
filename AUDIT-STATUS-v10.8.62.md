# Shizukuru v10.8.62 — Drawing Eraser Palette

Base: v10.8.61, retained as the stable rollback/reference build.

## Added
- A dedicated seventh Drawing-mode palette button: Eraser.
- The swatch is visually white but uses an eraser icon so it is not presented as another paint color.
- Existing five atelier palette slots and the encyclopedia-added `+` slot are unchanged.

## Erasing behavior
### Android Native
- The JavaScript brush bridge now carries an explicit `eraser` boolean.
- NativeDrawingView uses `PorterDuff.Mode.CLEAR` for the eraser.
- The eraser removes bitmap alpha instead of painting `#FFFFFF`.
- Wet-paint halo is disabled while erasing.
- Undo and the v10.8.61 native-file recovery path continue to operate on the resulting bitmap.

### Browser / Web fallback
- The eraser stroke is captured as a mask.
- Commit uses Canvas `destination-out`, so the underlying `#FFFEFA` paper surface is revealed naturally.
- It does not paint white over the paper texture.

## State / recovery
- Eraser selection is included in Drawing recovery records.
- Choosing any normal palette or encyclopedia-added color exits eraser mode.
- Brush size remains shared with paint brushes, so the existing brush-size controls also size the eraser.

## Unchanged
- Mixing engine
- Official color recognition
- 350 official recipes
- Drawing native-file persistence introduced in v10.8.61

## Verification
- Automated suite: 114/114 PASS.
- Official discovery: 350/350.
- Wrong recognition: 0.
- Unrecognized: 0.

## Android compile note
The execution environment cannot fetch the Gradle distribution, so Android `assembleDebug`
cannot be completed here. The Java bridge signatures and imports are statically checked and the
repository regression suite passes.
