# Illustrated armory

All 100 catalog IDs have an individually generated bitmap source made with built-in imagegen. No SVG is active in the illustrated collection. One model uses a soft foam practice accessory after the original image request was rejected. The actual accepted prompt is recorded.

- Sources: `game/assets/weapons/illustrated/sources/`
- Per-asset prompts and generation receipts: `game/assets/weapons/illustrated/receipts/`
- Complete prompt set: `art-direction/weapon-illustrations.json`
- Combined receipts: `art-direction/weapon-generation-ledger.json`
- Packed art, alpha bounds, grip anchors and SHA-256 checksums: `game/assets/weapons/illustrated/manifest.json`
- Individually measured fighter hand anchors: `art-direction/weapon-hand-anchors.json`

The normalizer crops and resamples the original alpha artwork into a 600×320 shop thumbnail, a 1200×640 detail image and a 384×192 combat prop. It never redraws or recolors the illustration. Transparent padding is preserved.

The combat renderer rotates each prop around its measured grip, restores the painted fist above that grip, mirrors with the fighter, hides props in knockdowns and scripted finishers, and limits resident prop images to eight. Chains hang downward outside attacking poses.

The catalog migration preserves IDs, prices, stats, upgrade rules and all existing ownership. The server migration changes weapon art metadata only.

Run `node tools/build-weapon-images.cjs --audit` and `python3 tools/verify-reforged.py` with the project's Node dependencies. `tools/check-weapon-poses.cjs` creates actual-renderer pose sheets; its `--fighters` option checks the fifteen fighters. Review images are in `review/weapon-art/`.
