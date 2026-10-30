# Fight Now — Reforged

## Persistent armory and progression

The game now uses the **fightersgame** database in the production Supabase PostgreSQL server. Every player receives a private wallet and permanent inventory; name/password profiles allow recovery across devices. There are 100 weapon designs in 10 categories, per-fighter loadouts, and five power/guard/focus upgrade levels. Win or complete CPU/arcade matches to earn coins, then use ARMORY / ARSENAL. Equipment stays available for subsequent matches.

[Play on the production host](https://fightersgame.159.195.207.175.sslip.io/?lang=de) or use the GitHub Pages review link below. Prices and wallet transactions are server-controlled; database credentials stay on prod. See `server/fightersgame/README.md` for deployment, economy rules and validation.


A painted 2.5D web fighting game: 15 redesigned fighters, 450 newly generated pose frames, 15 arenas and six original battle tracks. German and English menus, biographies, move lists, announcements and touch labels.

## Review build

- Play: https://radokrass90.github.io/fight-now/reforged/?lang=de
- English: https://radokrass90.github.io/fight-now/reforged/?lang=en
- Art and motion: https://radokrass90.github.io/fight-now/reforged/reforged-gallery.html?lang=en
- The earlier published game remains at https://radokrass90.github.io/fight-now/game/

This branch contains the complete source project. The main branch hosts the optimized review game under `reforged/`; that deployment excludes raw generation sheets and rebuildable PNG previews.

## Run locally

Serve `game/` with a static HTTP server, for example `python3 -m http.server 8781 --directory game`. Open `http://localhost:8781/?lang=en`. No build service or external font connection is required. Landscape is recommended on phones; portrait also retains the whole playfield and separate touch controls.

Modes: arcade (seven distinct opponents), versus computer, two players, and training. Desktop menus accept keyboard navigation; fighting supports keyboard, gamepads and touch. Pause provides moves, restart, sound/music and effect intensity. Reduced-motion preferences suppress camera shake and impact zoom.

## What's new

All fifteen appearances and their 30-pose atlases are newly generated for this edition. Walking shuffles, punch windup/recovery, uppercuts, kick preparation/recovery, knees, low guards, hit reactions and falling/getting up follow simulation timing. Shared per-strip scale and anchored support feet avoid independent frame-size pumping. Only the selected pair's atlases stay resident: 60 MiB desktop, 15 MiB mobile, plus portraits, arena and effects.

Combat adds a short input buffer, confirmed-hit cancel chains, perfect guard/counter opportunities, bounded juggles, difficulty-dependent CPU reaction and training combo/damage telemetry. All fifteen scripted finishers have finite tested trajectories in either direction.

Blender-authored street props, rotating industrial ventilation units, impact bursts, floor reflections and depth layers enrich the arenas. 3D art is baked into transparent atlases to keep gameplay lightweight; fighters use painted frame animation rather than skeletal 3D models. The new editable project is `blender/reforged-atmosphere.blend` with its generator and GLB export.

Detailed high-resolution Murat/Nadine portraits serve the title. Other portraits and all combat frames share the new fighter source sheets. Failed fighter/arena downloads return to arena selection with a retry message; a partial character set cannot start a match.

## Art and source provenance

`art-direction/REFORGED.md` and `fighter-designs.json` define the roster and visual direction. `generated-art-ledger.json` records the built-in image generator's source/prompt/reference for each source sheet and menu portraits. Raw transparent sheets are in `game/assets/fighters-reforged/sources/`. Their packing contract is documented in that asset directory's README.

Five game-development skills and supporting scripts were obtained from the official OpenAI plugins repository at revision `0722921d5542fc593105c27bd52630babd8b8c2a`. Copies are in `vendor/game-studio/`; exact provenance is in `art-direction/skill-provenance.json`. Two collaborating agents worked on combat and web UI; root integrated art, Blender and final QA.

Local Russo One/Rubik font files include their OFL licenses. Original arena art, Suno tracks and fighter identities are retained from the existing game.

## Verify and rebuild

Verification dependencies: Node.js with `sharp`, `pngjs` and `@napi-rs/canvas`; Python 3 for the combined runner. Set `GAME_NODE`/`NODE_PATH` if needed.

```sh
python3 tools/verify-reforged.py
node tools/build-reforged-fighters.cjs --complete
node tools/build-menu-heroes.cjs
blender --background --python blender/build_reforged_atmosphere.py
node tools/build-reforged-atmosphere.cjs
```

`review/verification.json` records twelve passing checks: strict all-roster audit, 900 desktop/mobile art draws, seeded combat/finishers, all menu modes, failed download/retry behavior, DE/EN, multi-touch ownership/cancellation, impact effects, 15 prop layouts, timeline sampling and six music files. `review/art-visual-qc.md` documents visual inspection of all 450 poses. `review/final/` contains actual browser screenshots and observations at 1200×665, 390×844 and 844×390. No game-origin console errors were observed. Physical iOS/Android hardware has not been tested.

The prior Bulgarian game is preserved locally in `Fight now/backups/fight-now-bg-2026-10-29.tar.gz`, separately from this review deployment.
