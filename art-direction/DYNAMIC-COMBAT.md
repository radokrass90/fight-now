# Dynamic combat — 31 October 2026

This release uses the approved 30-pose painted fighters and 100 illustrated weapons. No replacement character art, new generated raster frames or Blender models were introduced.

## Play

Each of the 15 fighters has two named, authored strings with different intermediate and ending strikes:

- Punch → Punch → Heavy punch → Heavy kick (solo keyboard: J J I O).
- Kick → Punch → Heavy kick (K J O).
- Equipped weapon: Punch → Heavy punch → Heavy punch (J I I), with a route for each of the 10 weapon families.

Follow-ups require a confirmed hit and a fresh input. The three-slot ordered buffer survives hitstop and accommodates fast taps; it expires and cannot queue a whole sequence indefinitely. Blocking or missing never grants a cancel. A finishing strike ends the route; dropping a string leaves enough recovery for defense. Crouching, throws, jumping, specials and supers retain their controls. Double-tap a horizontal direction for a short dash with a cooldown.

Training displays the fighter's route, input progress, hit count and damage. Portrait phones also show a native-sized coach between the arena and touch controls. The move list contains the two character routes and the equipped weapon sequence. English and German are supported.

## Motion

`game/js/combat-motion.js` samples simulation frames so pause and hitstop freeze all presentation. Foot-anchored body lean, weight transfer, anticipation, recoil, landing compression and speed-sensitive gait supplement the painted poses. A bounded local mesh supplies fast arm in-betweens without a double-body crossfade. Its grid explicitly includes the grip point, and overlapping clips avoid mesh seams. Steady poses retain a single sprite draw.

Weapon and fighter use the same body transform and hand deformation. Blunt swings, rising blows and thrusts have different arcs; heavy families have longer preparation than light blades. A painted fist is restored above the grip. Optional trails respect reduced-motion settings. All 405 visible hand centers were visually calibrated (27 poses × 15 fighters) from atlas crops; see `dynamic-hand-anchors.json`.

Authored strikes sweep the actual loaded-to-extended limb path during their active window, instead of checking only the final fingertip. This fixes uppercuts tunneling above a reacting opponent without a large universal hit radius. Character and weapon finishers receive a stronger existing impact effect.

## Verification

`tools/verify-reforged.py` runs 15 checks, including:

- 60 real character strings (15 fighters × 2 strings × 2 facings).
- 300 equipped strings (15 fighters × 10 families × 2 facings).
- Rapid four-button queue, guard rejection, dash and paused motion.
- Existing corner-pressure escape checks, hitstop buffers, 15 seeded complete CPU matches and 30 complete cinematic finishers.
- Actual painted/mesh/weapon rendering, 100 weapon decodes, all 450 fighter poses, mobile input and DE/EN interfaces.

Browser QA used actual keyboard input in Chrome and a 390 × 844 phone viewport. This is viewport emulation, not a physical iOS/Android device test. The desktop four-hit string connected for 144 damage without modifying runtime state. No user purchases, balances, ownership or database schema were changed.

Review artifacts: `review/dynamic-combat/` and `review/verification.json`.
