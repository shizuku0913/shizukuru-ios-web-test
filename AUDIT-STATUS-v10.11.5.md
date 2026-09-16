# v10.11.5 provisional target attempt-counter fix

## Root cause
When 「作ってみる」 was chosen for an unnamed provisional color, text such as `1回近づいた`
was copied into `atelierTargetColor.name`. The sample then treated that text as a fixed color name,
so later updates to `attempts` could not change the label.

A second near-color path (`nearExisting` merge) also incremented the research entry without
synchronizing the active target sample.

## Fix
- Unnamed provisional targets keep `name` empty.
- The target sample derives `N回近づいた` from the live `attempts` value each render.
- Both `my-near` and provisional-merge paths synchronize the active sample counter.
- The target-placed status uses the same live label.

## Scope
No changes to official 350 colors, recognition thresholds, recipes, localization dictionaries,
gift range, or persistence format.

## Regression
Full Node regression suite: 147/147 PASS, failures 0.
