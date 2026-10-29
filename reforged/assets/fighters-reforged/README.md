# Reforged fighter asset contract

The raw, genuinely transparent generated artwork stays in `sources/`. The build
only separates connected figures, copies their original alpha, resamples with
one scale per source strip, aligns anchors and packs atlases. It never redraws,
duplicates a missing pose, recolors a fighter or edits a raw source PNG.

Run with Node.js and `sharp`, `pngjs`, `@napi-rs/canvas` available:

```sh
node tools/build-reforged-fighters.cjs --only murat
node tools/build-reforged-fighters.cjs
node tools/build-reforged-fighters.cjs --complete
node tools/build-reforged-fighters.cjs --audit
```

`--only` accepts comma-separated roster IDs. Builds with only a base source are
reported as partial. The strict complete/audit modes require all fifteen full
sets, no unresolved error-level QC items, unchanged source/config hashes, 450
distinct normalized frames, correct atlas dimensions and preserved alpha.
Visual semantics still require inspection: an automatic shape/count audit cannot
prove that a generated uppercut is actually an uppercut.

## Inputs

- `sources/{id}-base.png`: ten poses in two rows of five.
- `sources/{id}-extra.png`: twenty poses in four rows of five.
- Optional `sources/{id}-corrections.png`: four corrected poses in one row by
  default. `source-layout.json` can supply `correctionRows` and a row-major
  `correctionFrames` array of destination indices. For example `[17,21,22,23]`
  means jab recovery, uppercut, kick chamber, kick recovery.
- `source-layout.json` stores explicit known visual QC issues and review state.

Connected components determine figure bounds; adapted row grouping determines
order. Fixed equal-cell crops are not used. Missing, merged or surplus large
figures stop the build with an error instead of silently producing bad frames.
Small attached details and original low-alpha edge pixels are preserved.

## Outputs

Every normalized frame is **512 × 512**, with **pivot (220,464)**. The visible
bottom edge meets **y=464**. Standing/walking/punching frames use a waist-band
anchor; supported kicks/knees use the planted foot; airborne/falling/lying poses
use their horizontal center. A crouch or lying pose keeps its original relative
height: it is never independently enlarged to match a standing fighter.

Each source strip uses one shared scale, calibrated against standing reference
poses to a common nominal 354 px standing height. Separate generated strips may
have different source resolutions; their scale factors differ accordingly.
The transform and source bounds are recorded per frame.

Per character:

- `spritesheet.webp`: **2560 × 1024**, indices 0–9.
- `extra-20.webp`: **2560 × 2048**, indices 10–29.
- `spritesheet-mobile.webp`: **1280 × 512**.
- `extra-20-mobile.webp`: **1280 × 1024**.
- `portrait.webp`: **256 × 256**, transparent upper-body crop of the idle pose.
- `frames/00-idle.png` through `frames/29-rise.png`: full-size normalized QA
  frames. These need not be downloaded by the game.
- `contact-sheet.png`: dark-background preview with baseline guides and labels.
- `manifest.json`: per-character metadata.

The aggregate `manifest.json` always includes all fifteen roster entries.
`game/js/reforged-fighter-data.js` exposes the same object as
`REFORGED_FIGHTER_DATA`. Entries have game-relative `base`, `extra`, `mobileBase`,
`mobileExtra`, `portrait` paths plus `status`, `frameCount`, `frames`, `sources`,
`scales` and `qc`. Unavailable entries have null paths and status `pending`.

Each frame has `index`, `name`, `sheet: 'base' | 'extra'`, `x`, `y`, `w`, `h`,
`pivot`, `baseline`, `bounds`, `source`, `sourceBounds`, `componentBounds`,
`anchorSource` and `scale`. Coordinates address the full-size atlas; mobile
atlases use exactly half those coordinates and dimensions.

Index order is compatible with `CharacterArt.frameFor`: 0 idle, 1 block,
2 crouch, 3 jump, 4 light punch, 5 heavy punch, 6 light kick, 7 heavy kick,
8 hit, 9 victory; 10–15 walk cycle; 16 jab load, 17 jab return, 18 cross load,
19 cross return, 20 hook, 21 uppercut, 22 kick chamber, 23 kick return,
24 knee, 25 low block, 26 body hit, 27 fall, 28 ground, 29 rise.
