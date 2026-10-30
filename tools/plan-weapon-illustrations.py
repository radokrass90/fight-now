from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
catalog=json.loads((root/'game/assets/weapons/catalog.json').read_text())
designs={
'bat':[
'Honey-brown ash-wood baseball bat, broad rounded barrel, tapered neck, black athletic tape grip, tarnished steel collar and one small orange cloth detail; distinct wood grain and street scuffs.',
'Dented brushed-aluminium baseball bat with an asymmetric reinforced barrel, knurled dark blue rubber grip, steel butt cap and a pair of subtle blue transit stripes.',
'Heavy hexagonal concrete-composite club with rounded corners, inset rebar end core, bolted steel collar and yellow hazard-marked fabric handle; believable dense worn concrete texture.',
'Weathered dark oak dockworkers club with a teardrop barrel, three broad riveted brass reinforcing bands, tar-darkened hand grip and blue marine cord.',
'High-end translucent amber polycarbonate bat over a black ribbed structural core, narrow cyan light channel embedded in barrel, charcoal grip and machined metal butt. No external glow.',
'Matte black steel bat with an angular hexagonal barrel, carbon-fibre neck, ventilated recessed grooves, crimson stitching on leather handle and a blunt faceted end cap.',
'Dense reddish ironwood octagonal bat with deep carved grain, satin stainless-steel end cap, restrained botanical engraving and braided black leather grip.',
'Segmented titanium power bat with a fluted spiral barrel, cold silver surfaces, cobalt steel collars and a sculpted dark rubber handle; substantial realistic volume.',
'Championship walnut bat with a gracefully sculpted striking barrel, two polished brass bands, royal-blue stitched leather grip and precision turned end cap. No lettering.',
'Regal obsidian-composite club with a broad angular striking head, restrained gold geometric inlays, paired bronze end weights and black crocodile-textured leather grip.'
],
'staff':[
'Long slender bamboo combat staff, three natural nodes, scuffed pale fibres, tightly woven tan grip at the left quarter, dark iron end caps.',
'Rosewood monk staff, nearly uniform thickness end to end, shallow hand-carved spiral texture, old iron ferrules and burgundy cloth wrap at left quarter.',
'Repurposed dark steel rail-guard staff with a narrow squared cross-section, rounded safety end caps, riveted reinforcement plates and yellow-black fabric grip at left quarter.',
'Four-section telescopic carbon-fibre staff with convincing woven carbon texture, brushed-steel locking collars and ergonomic black left-quarter grip.',
'Hammered copper tubular staff with oxidized recesses, polished warm highlights, black rubber ring grip at left quarter and large machined copper end plugs.',
'Carved dark jade-and-bronze staff with smooth long cylindrical sections, shallow geometric relief, aged bronze ferrules and green silk grip at left quarter.',
'Double-helix twisted titanium staff with two narrow intertwined rods, solid straight left-quarter grip, blue-grey satin finish and heavy faceted end caps.',
'Ceramic-coated midnight-blue long staff with silver segment bands, restrained pearl-iridescent panels, charcoal leather grip and polished silver tips.',
'Armoured segmented gunmetal staff, substantial steel cuffs, hard-rubber left-quarter grip, deeply machined straight grooves with tiny amber inserts.',
'Dark mahogany dragon staff with a bronze sculpted dragon-head terminal at the right end, rough black cord grip at left quarter and a simple bronze left butt cap.'
],
'hammer':[
'Compact carpenters mallet with a thick rectangular honey-oak head at right, slightly chamfered striking faces, long dark wooden handle to left with textured black grip.',
'Riveting hammer with a forged steel rectangular head, one round striking face and one tapered rounded peen, scarred ash handle to left and brass ferrule.',
'Blacksmith forge hammer with a broad square blackened iron head, bright worn edges, brass inset collar and brown leather wrapped long left handle.',
'Industrial demolition sledgehammer, heavy rectangular steel head with faceted corners, orange composite shaft to left and black ribbed safety grip.',
'Copper-faced workshop hammer with a short thick cylindrical double head, dark gunmetal central block and crimson leather-wrapped handle to the left.',
'Precision steelhead hammer with an angular solid steel head, milled silver grooves, exposed dark fastening collar and a teal-black ergonomic left grip.',
'Thunder sledge with a wide polygonal silver head, cobalt reinforcement plates, thin recessed blue accents and a long ribbed charcoal handle to left.',
'Titan industrial hammer with a deep squared titanium head, substantial visible bolts, sand-blasted faces and heavy brown leather grip on left shaft.',
'Colossus two-faced maul, massive dark forged head with stepped geometric ends, bronze structural ribs and reinforced black long handle to left.',
'Vulcan masterwork maul with a sculpted black-and-bronze broad head, hammered bronze face plates, controlled amber inlays and ornate but usable long dark left grip.'
],
'axe':[
'Rugged camp hatchet with one broad brushed-steel blade at right, gently curved pale hickory haft extending left, dark leather hand wrap and simple steel butt.',
'Rescue axe with a bright scarred orange metal head at right, one wedge blade and a short blunt rear lug, long graphite composite handle extending left.',
'Scrapyard axe with an asymmetric wide steel cutting head, visible welded reinforcing plates, pitted metal, wooden handle to left wrapped in dirty blue shop cloth.',
'Copperhead axe with a crescent steel blade seated in a warm hammered-copper socket, ebony left handle and coarse brown leather grip.',
'Frost axe with a pale satin-steel crescent blade, blue-grey ceramic side plates, silver ferrule and blue-white woven grip on long dark left handle.',
'Crimson workshop axe with a substantial black iron head, broad curved edge, burgundy lacquered panels and black stitched leather left handle.',
'Berserker battle axe with a broad deeply curved steel blade at right, rugged forged socket, carved dark oak left haft and restrained bronze ring fittings.',
'Tempest axe with an elegant swept titanium crescent at right, clean aerodynamic cut-outs in head, dark carbon left handle and cobalt fittings.',
'Phoenix ceremonial combat axe with a sculpted feather-like bronze socket surrounding a polished steel blade, black ash left haft and amber leather grip.',
'Leviathan masterwork axe with a huge blue-black crescent head, silver geometric bevels, subtle scale relief, heavy bronze socket and reinforced black left grip.'
],
'sword':[
'Wooden practice sword with a broad flat maple blade pointing right, rounded blunt tip, simple round dark guard and wrapped brown grip at left.',
'Ronin katana with one gently curved satin-steel blade pointing right, tiny authentic-looking layered temper line, black oval guard and dark red cord-wrapped hilt at left. No scabbard.',
'Urban saber with a slightly curved broad steel blade pointing right, deep fuller, brass knuckle guard and polished walnut left hilt. No scabbard.',
'Straight silver longsword with a broad central fuller, fine bevels, a modest silver crossguard and ribbed charcoal leather left handle.',
'Obsidian short sword with an angular blackened-steel straight blade, exposed bright bevel, a small bronze crossguard and textured black left hilt.',
'Dawn sword with a broad warm satin-steel blade, a single gold-coloured inlaid groove, brass swept guard and cream leather left grip.',
'Shadow tactical sword with a dark straight slab-like blade, sculpted negative-space spine, grey edge highlights, minimalist steel guard and black carbon-fibre left hilt.',
'Eclipse blade with a long deeply curved dark steel profile pointing right, silver crescent-shaped guard, subtle purple-blue oil finish and silver-bound left grip.',
'Sovereign masterwork sword with a substantial polished steel blade, ornate bronze crossguard and pommel, restrained royal-blue enamel panels and black leather left hilt.',
'Celestial sword with a refined faceted silver blade pointing right, beautiful shallow star-pattern engraving, gold filigree crossguard and pearl-grey wrapped left hilt. No magical aura.'
],
'tonfa':[
'One solid matte-black patrol tonfa, horizontal long baton end to right, short perpendicular side handle pointing UP near the left third, textured rubber side grip and rounded ends.',
'One street tonfa carved from worn dark oak, horizontal shaft to right, shorter upward side handle near left third, steel end caps and old tan cord on the side grip.',
'One guardian tonfa with heavy gunmetal main shaft to right, bronze end cap, upward side handle near left third wrapped in dark green leather.',
'One tactical composite tonfa with an angular matte-grey horizontal shaft, recessed hex fasteners, raised black upward side grip near left third and small burnt-orange trim.',
'One cobalt tonfa with a blue ceramic-coated steel main shaft to right, finely machined silver collars and a black upward side handle near left third.',
'One enforcer tonfa with thick forged dark-steel shaft, broad fluted right end, aged brass joint socket and brown leather upward side grip near left third.',
'One spectre carbon-fibre tonfa, tapered faceted main shaft to right, subtle violet metallic joint and tightly sculpted grey upward side grip near left third.',
'One aegis tonfa with a substantial titanium main shaft, repeated protective silver ribs, cool blue inset panels and a perpendicular charcoal side handle near left third.',
'One paladin masterwork tonfa with black steel horizontal shaft, warm brushed-gold reinforcement rings and refined dark blue leather upward side handle near left third.',
'One citadel masterwork tonfa with a powerful square-section dark gunmetal body, bronze armoured right end and sculpted ergonomic upward side handle near left third.'
],
'chain':[
'A complete short weighted combat chain, simple black leather hand loop at far LEFT, thick round iron links draped in a shallow horizontal S curve, solid small steel terminal weight at RIGHT.',
'A complete garage chain weapon, ribbed rubber handle at far LEFT, heavy square-section workshop chain draped horizontally and a scuffed dark steel block weight at RIGHT.',
'A complete dockside anchor chain, coarse blue rope hand loop at far LEFT, thick oxidized iron oval links, warm brass link connectors and an anchor-shaped blunt terminal at RIGHT.',
'A complete switchback chain weapon with a black cord handle at far LEFT, alternating elongated and short steel links in a restrained horizontal curve, a faceted grey terminal at RIGHT.',
'A complete spark chain weapon with orange leather left handle, tarnished copper and steel alternating links, and a compact brass cylindrical terminal at RIGHT; no electrical sparks.',
'A complete blacksteel combat chain, padded dark left hand loop, broad flattened black iron links with bright bevels and an angular steel terminal at RIGHT.',
'A complete cyclone chain weapon, blue wrapped hand grip at far LEFT, twisted helical silver links connected into a horizontal S curve and a rounded fluted terminal weight at RIGHT.',
'A complete warden chain weapon, heavy brown leather hand loop at far LEFT, robust paired gunmetal links and a substantial bronze cage-like terminal weight at RIGHT.',
'A complete thunderbolt chain weapon with a black carbon-fibre left hand grip, elongated titanium links, cobalt connectors and a sculpted silver double-cone terminal at RIGHT.',
'A complete ouroboros masterwork chain weapon, black leather left hand loop, beautifully forged bronze scale-pattern links and a sculpted dark snake-head terminal at RIGHT.'
],
'spear':[
'Scout spear with a slim long ash shaft extending left, narrow leaf-shaped steel point at RIGHT, black woven grip near left quarter and a simple steel left butt cap.',
'Outrider spear with long dark wood shaft, broad steel leaf point at RIGHT, weathered brass socket, burgundy cloth left-quarter grip and iron butt cap.',
'A single trident spear with long slim black steel shaft to left, THREE distinct forward-facing prongs at RIGHT, brushed silver spearhead, blue fabric left-quarter grip.',
'Railguard spear with long carbon shaft, sturdy angular steel point at RIGHT, riveted industrial socket and yellow-black left-quarter grip.',
'Sunbeam spear with long warm bronze-banded wood shaft, a polished gilded steel leaf point at RIGHT and cream leather left-quarter grip.',
'Raven spear with long dark gunmetal shaft, a narrow swept blackened-steel point at RIGHT, silver bevels, feather-like socket relief and black left-quarter grip.',
'Comet spear with long titanium shaft, deeply fluted slim steel point at RIGHT, cobalt socket details and ergonomic graphite left-quarter grip.',
'Valkyrie spear with a long dark wood shaft, a graceful silver leaf point at RIGHT with small swept side fins, ornate bronze socket and blue leather left-quarter grip.',
'Gungnir masterwork spear with long reinforced ebony shaft, a substantial geometric steel point at RIGHT, restrained gold inlays and black-brown braided left-quarter grip.',
'Starlance masterwork spear with long pearl-grey composite shaft, a refined long faceted silver point at RIGHT, shallow constellation engraving and blue-grey leather left-quarter grip.'
],
'knuckles':[
'A single solid brass knuckle duster with FOUR clearly open finger holes in one horizontal row, a thick curved palm bar below, real scuffs and warm worn brass bevels.',
'Soft orange polyurethane practice finger guard, four fully rounded padded loops and a black rubber palm brace; nonfunctional protective foam sports prop, no metal or sharp edges.',
'A single streetwise knuckle duster with FOUR finger holes, dented gunmetal body, wide smooth striking rail and narrow orange grip inlay on the bottom palm bar.',
'A single chrome knuckle duster with FOUR open finger holes, highly dimensional satin-chrome body, individually beveled apertures and black rubber palm pad.',
'A single ruby knuckle duster with FOUR open finger holes, substantial warm bronze body, small deep-red enamel panels and black textured palm support.',
'A single onyx knuckle duster with FOUR open finger holes, faceted matte-black titanium body, bright steel edge bevels and dark violet leather palm pad.',
'A single meteor knuckle duster with FOUR open finger holes, beautifully mottled grey metal, sculpted broad striking rail and cobalt recessed groove in the palm bar.',
'A single gladiator knuckle duster with FOUR open finger holes, substantial forged bronze body, shallow laurel relief on striking bow and deep brown leather palm support.',
'A single diamond masterwork knuckle duster with FOUR open finger holes, precisely faceted silver body, deep polished bevels and pale blue inset accents, no loose jewels.',
'A single imperator masterwork knuckle duster with FOUR open finger holes, dark steel body, thick gold geometric overlays, a regal sculpted striking bow and black leather palm support.'
],
'blade':[
'One compact blunt-tip steel training knife, short broad satin-steel blade pointing RIGHT, small safety guard, grey rubber handle at LEFT and visible metal pommel. No sheath.',
'One utility training blade with a thick short straight metal blade pointing RIGHT, generous rounded tip, an orange-and-black contoured handle at LEFT and screwed grip panels.',
'One serrated-spine training knife with a short broad steel blade pointing RIGHT, blunt rounded front edge, a scalloped decorative spine, dark wood left grip and brass pins.',
'One falcon training blade with a swept broad short steel profile pointing RIGHT, rounded safe tip, silver curved guard and teal-black sculpted handle at LEFT.',
'One scorpion training blade with a heavy short blackened-steel blade pointing RIGHT, softly rounded nose, bronze hooked guard and dark crimson left grip.',
'One nightfall training knife with a broad short matte-black blade pointing RIGHT, silver beveled edge, tiny guard and ribbed charcoal left handle with subtle violet trim.',
'One mirage masterwork training knife with a short satin-steel blade pointing RIGHT, a shallow fuller, bronze guard and beautifully layered green-black left grip panels.',
'One ghost training blade with a thick short pale ceramic-coated steel profile pointing RIGHT, soft rounded tip, clean silver guard and white-grey carbon-fibre left grip.',
'One nemesis masterwork training knife with a broad short dark damascus-pattern steel blade pointing RIGHT, bronze stepped guard and sculpted black leather left handle.',
'One infinity masterwork training knife with a thick short polished silver blade pointing RIGHT, restrained flowing geometric engraving, dark-gold guard and intricate but practical charcoal left grip.'
]}
shapes={'bat':'One complete baseball-bat/club silhouette, slim handle at left and broad striking barrel at right.','staff':'One complete long slender STAFF POLE, nearly uniform thickness, NOT a bat; grip at left quarter.','hammer':'One hammer only, handle extends to left, substantial head at right.','axe':'One axe only, long handle extends to left, curved axe head at right.','sword':'One sword only, hilt and grip at left, blade points to right. No sheath.','tonfa':'One tonfa only, main shaft horizontal to right, short perpendicular side grip points UP near left third. Not a pair.','chain':'One complete connected chain weapon only, hand grip at far left and terminal weight at right, entire connected chain visible.','spear':'One spear only, long shaft left-to-right, point at right.','knuckles':'One complete four-hole knuckle duster only, horizontal presentation, no person or hand.','blade':'One short training knife only, handle at left, short blade points right. No sheath.'}
style='''Use case: stylized-concept / premium game inventory prop. Create ONE spectacular high-detail realistic 3D-rendered weapon asset for the urban fighting game FIGHT NOW. Style reference is the material/render quality only; invent the requested weapon, do not copy a bat when another weapon type is requested. Convincing solid volume, tactile worn materials, expertly beveled geometry, fine surface detail, premium PBR game-art look, NOT a flat icon, vector drawing or simple primitive. Side ORTHOGRAPHIC product view with just enough top surface visible to show thickness; the long axis is perfectly HORIZONTAL. Entire single item visible, centered, at least 10 percent empty transparent margin beyond all extremities. Soft warm studio key from upper left, restrained cool rim from upper right, elegant highlights and readable midtones. GENUINELY TRANSPARENT background. No floor, no cast shadow outside the object, no person or hand, no room or scenery, no fog, no aura, no particles, no text, logo, watermark, frame, price or UI. Landscape high-resolution image ideally1536x1024 or larger. Exactly ONE requested complete weapon.'''
safe_practice_prompt='Create one high-quality realistic 3D product illustration of a NONFUNCTIONAL SOFT FOAM TRAINING ACCESSORY for a game inventory. It is a protective orange polyurethane finger guard: four rounded padded circular finger loops connected in one row, a rounded black rubber palm brace underneath, subtle stitched soft fabric insets and believable foam compression. Every exposed edge is thick, smooth, soft and rounded. Absolutely no metal, spikes, blades, sharp edges, person, hands, injuries or action. Center the whole single item, front view, wide horizontal composition with generous empty margins on all sides. Detailed tactile foam and rubber surface, warm upper-left studio light, cool soft rim, consistent premium game asset style. Isolate the object on a genuine transparent alpha background, including full transparency through all four finger holes and below the palm brace. No backdrop, floor, smoke, glow cloud, cast shadow, text, logos, symbols or UI. One object only, at least 1536 by 1024 pixels.'
entries=[]
for w in catalog['weapons']:
 i=int(w['id'].split('-')[-1])-1
 entries.append({'id':w['id'],'name':w['name'],'family':w['family'],'tier':w['tier'],'design':designs[w['family']][i],'prompt':style+'\nITEM: '+w['name']['en']+'.\nSHAPE: '+shapes[w['family']]+'\nUNIQUE DESIGN: '+designs[w['family']][i]})
next(e for e in entries if e['id']=='knuckles-02')['prompt']=safe_practice_prompt
assert len(entries)==100
(root/'art-direction/weapon-illustrations.json').write_text(json.dumps({'version':1,'generator':'built-in image_gen','entries':entries},ensure_ascii=False,indent=2)+'\n')
print('100 individually art-directed image prompts prepared.')
