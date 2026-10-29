# Fight Now — Reforged review build

User objective: rebuild the game into an attractive, interesting, playable web fighting game; replace all 15 fighters with newly generated appearances and corresponding new motion art; enrich visuals with Blender; present a complete review build. Work stays separate from the published game until review.

## Art direction

Premium painted 2.5D urban fighting game. Anatomically convincing adult fighters with expressive faces, deliberate clothing design, tactile worn materials, warm amber key and cool cyan rim illumination. Strong silhouettes, restrained highlights, consistent side-view perspective. Avoid cartoon block geometry, flat photo cutouts, mismatched anatomy, or changing costumes between poses.

Keep 15 identities and fighting styles, but redesign appearances. Each fighter receives an original ten-pose sheet, a matching twenty-pose movement/attack/reaction sheet, a portrait, normalized alpha atlases and mobile variants. All art must be generated specifically for this build. Physics/hit timing remain simulation-owned; sprite pose selection follows the real move segments.

Blender contributes authored environment depth, atmospheric foreground and reactive 3D-derived impact art. DE/EN, all 15 arenas and six music tracks remain available. Browser QA must include desktop and phone-size gameplay, restart/pause, asset failure behavior and absence of runtime errors.

## Team ownership

- root: art generation, sprite normalization/renderer, Blender, integration, review and completion audit.
- combat_design: fight.js, simulation improvements, combat tests.
- web_experience: DOM menus/UI, main/index/mobile UI, localization, touch layout.

## Definition of review-ready

All 15 redesigned fighters active, new movement art and matching portraits integrated; no old fighter visible in the active build; combat changes and menus fully functional; Blender improvements visible; DE/EN complete; all mode/asset/mobile/combat checks pass; actual browser gameplay visually inspected. Finish with a playable review link and screenshot evidence, plus an asset/skill provenance ledger. Do not mark the goal complete while any requirement is missing.
