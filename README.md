# FIGHT NOW — Street Combat

[**Play in your browser**](https://radokrass90.github.io/fight-now/)

A German street-fighting arcade game with 15 characters, 15 cinematic arenas,
original Suno battle tracks, two-player keyboard play, training and arcade modes.

## Blender edition

The fighters are articulated, stylized 3D models built in **Blender 5.1** and
exported as GLB. Their shoulders, elbows, hips, knees, hands and heads follow
the same interpolated skeleton that drives combat and hit detection. Walking,
blocks, punches, kicks, jumps, throws and finishers no longer rely on swapping
between ten still images. Combat remains on a 2D plane with painted arena art.

The renderer includes arena-aware lighting, wet-surface reflections, motion
trails, impact camera movement and separate player health-bar colors. Painted
character portraits are retained. The pause menu can switch between 3D fighters
and the earlier painted-sprite style; 2D is also the fallback without WebGL.

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

Serve the project over HTTP (ES modules and GLB loading require a web server):

```sh
python3 -m http.server 8770
# Open http://localhost:8770/game/
```

## Editable Blender source

- `blender/fight-now-cast.blend`: complete 15-character cast and walk-cycle study.
- `blender/build_fighters.py`: reproducible procedural modeling/export pipeline.
- `blender/characters.json`: character appearances, stances and pose definitions.
- `game/assets/models/*.glb`: individual web-ready articulated fighters.

Rebuild from the project root:

```sh
blender -b --python blender/build_fighters.py -- --preview
```

Models intentionally use Y up in both Blender and the runtime; the exporter
preserves those coordinates. The runtime uses vendored Three.js 0.180.0,
including its MIT license in `game/vendor/three/LICENSE`.

## Asset credits and scope

The character portraits and arena illustrations were generated for this project;
the battle recordings were generated in the owner's Suno account. The Blender
cast is a new stylized interpretation of those characters. Included music and
art are project assets; this repository does not grant a separate blanket license
to redistribute them. Third-party Three.js retains its own MIT license.

This is a browser arcade game with 3D fighters and illustrated backgrounds,
not a fully navigable 3D world. The earlier raw generations, large ZIP archives,
temporary files and local account/browser data are excluded from the repository.
