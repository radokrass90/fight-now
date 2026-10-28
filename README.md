# FIGHT NOW — Street Combat

[**Play in your browser**](https://radokrass90.github.io/fight-now/)

A German street-fighting arcade game with 15 characters, 15 cinematic arenas,
original Suno battle tracks, two-player keyboard play, training and arcade modes.

## Painted fighters — 30 poses each

The approved hand-painted fighters are the active game renderer. Each of the
15 characters retains the original ten sprites and has twenty additional poses:
a six-frame combat shuffle, punch preparation/recovery, hook, uppercut, kick
chamber/recovery, knee, low guard, body-hit reaction, fall, grounded and get-up.
There are 300 new poses and 450 sprite frames in total.

Move segments select the preparation, strike and recovery frames using the same
frame boundaries as the combat simulation. Reverse walking reverses the shuffle
cycle. A shared supporting-foot baseline keeps crouches and kicks on the floor;
knockdown art is horizontal instead of rotating an upright reaction twice.

[Browse all poses and animation sequences](https://radokrass90.github.io/fight-now/game/animation-gallery.html).

Art: `game/assets/characters-hd/<id>/spritesheet.webp` (original ten) and
`extra-20.webp` (new twenty). Pose metadata is in `game/js/extra-pose-data.js`.
Generation prompts and correction briefs are in `tools/extra-pose-prompts.json`.
The local source folder also retains transparent source sheets and individual
PNG frames. `tools/build-extra-poses.cjs` packs their silhouettes into atlases;
`tools/check-painted-animation.cjs --complete` checks counts and animation timing.

## Controls

| Action | Solo / training |
| --- | --- |
| Move / jump / crouch | WASD or arrow keys |
| Light / heavy punch | J / I |
| Light / heavy kick | K / O |
| Block | L or left Shift |
| Special | U or Space |
| Super | Down + Special with full energy |
| Pause | Escape or P |

The Controls screen lists the separate keyboard layouts for two players.
Touch controls appear on phones; use landscape orientation. Music can be
disabled separately in the pause menu. A browser may require a key or tap to
start sound. The six MP3 files are served with the game and loop as full tracks.

## Run locally

Serve the project over HTTP:

```sh
python3 -m http.server 8770
# Open http://localhost:8770/game/
```

## Archived Blender experiment

- `blender/fight-now-cast.blend`: complete 15-character cast and walk-cycle study.
- `blender/build_fighters.py`: reproducible procedural modeling/export pipeline.
- `blender/characters.json`: character appearances, stances and pose definitions.
- `game/assets/models/*.glb`: individual web-ready articulated fighters.

Rebuild from the project root:

```sh
blender -b --python blender/build_fighters.py -- --preview
```

Models intentionally use Y up in both Blender and the runtime; the exporter
preserves those coordinates. The archived experiment uses vendored Three.js 0.180.0,
including its MIT license in `game/vendor/three/LICENSE`.

## Asset credits and scope

The character portraits and arena illustrations were generated for this project;
the battle recordings were generated in the owner's Suno account. The Blender
cast is a new stylized interpretation of those characters. Included music and
art are project assets; this repository does not grant a separate blanket license
to redistribute them. Third-party Three.js retains its own MIT license.

This is a browser arcade game with painted fighters and illustrated backgrounds,
not a fully navigable 3D world. The earlier raw generations, large ZIP archives,
temporary files and local account/browser data are excluded from the repository.
