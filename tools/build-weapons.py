from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
families=[
('bat','Bat','Schläger',['Backstreet','Metro','Concrete','Dockside','Neon','Blackout','Ironwood','Storm','Champion','Night King'],['Hinterhof','Metro','Beton','Hafen','Neon','Blackout','Eisenholz','Sturm','Champion','Nachtkönig']),
('staff','Staff','Stab',['Bamboo','Monk','Railway','Carbon','Copper','Jade','Vortex','Aurora','Sentinel','Dragon'],['Bambus','Mönch','Bahn','Carbon','Kupfer','Jade','Wirbel','Aurora','Wächter','Drache']),
('hammer','Hammer','Hammer',['Workshop','Rivet','Forge','Demolition','Ember','Steelhead','Thunder','Titan','Colossus','Vulcan'],['Werkstatt','Niete','Schmiede','Abriss','Glut','Stahlkopf','Donner','Titan','Koloss','Vulkan']),
('axe','Axe','Axt',['Camp','Rescue','Scrapyard','Copperhead','Frost','Crimson','Berserker','Tempest','Phoenix','Leviathan'],['Lager','Rettung','Schrottplatz','Kupferkopf','Frost','Purpur','Berserker','Sturmwind','Phönix','Leviathan']),
('sword','Sword','Schwert',['Practice','Ronin','Saber','Silverline','Obsidian','Dawn','Shadow','Eclipse','Sovereign','Celestial'],['Training','Ronin','Säbel','Silberlinie','Obsidian','Morgenrot','Schatten','Finsternis','Herrscher','Himmelslicht']),
('tonfa','Tonfa','Tonfa',['Patrol','Alley','Guardian','Tactical','Cobalt','Enforcer','Spectre','Aegis','Paladin','Citadel'],['Patrouille','Gasse','Beschützer','Taktik','Kobalt','Vollstrecker','Phantom','Ägide','Paladin','Zitadelle']),
('chain','Chain','Kette',['Link','Garage','Anchor','Switchback','Spark','Blacksteel','Cyclone','Warden','Thunderbolt','Ouroboros'],['Glied','Garage','Anker','Kehre','Funke','Schwarzstahl','Zyklon','Aufseher','Donnerkeil','Ouroboros']),
('spear','Spear','Speer',['Scout','Outrider','Trident','Railguard','Sunbeam','Raven','Comet','Valkyrie','Gungnir','Starlance'],['Späher','Vorhut','Dreizack','Gleiswache','Sonnenstrahl','Rabe','Komet','Walküre','Gungnir','Sternenlanze']),
('knuckles','Knuckles','Schlagring',['Brass','Brawler','Streetwise','Chrome','Ruby','Onyx','Meteor','Gladiator','Diamond','Imperator'],['Messing','Raufbold','Straße','Chrom','Rubin','Onyx','Meteor','Gladiator','Diamant','Imperator']),
('blade','Training blade','Trainingsklinge',['Trainer','Utility','Serrated','Falcon','Scorpion','Nightfall','Mirage','Ghost','Nemesis','Infinity'],['Übung','Werkzeug','Sägezahn','Falke','Skorpion','Nachtfall','Fata Morgana','Geist','Nemesis','Unendlichkeit'])]
colors=['#d5b282','#71a9bc','#acb5c5','#73c5bd','#d69a65','#a49be0','#e0ac56','#7bb9ee','#e493a7','#f8d778']
weapons=[]
for fi,(family,en,de,names,denames)in enumerate(families):
 for i,(name,dname)in enumerate(zip(names,denames)):
  id=f'{family}-{i+1:02d}';tier=i//2+1;color=colors[i]
  reach={'bat':6,'staff':12,'hammer':3,'axe':5,'sword':9,'tonfa':4,'chain':10,'spear':14,'knuckles':1,'blade':3}[family]+tier
  w=dict(id=id,family=family,name={'en':name+' '+en,'de':dname+' '+de},familyName={'en':en,'de':de},tier=tier,price=120+i*90+fi*15,damage=round(.015+tier*.009+(fi%3)*.003,3),reach=reach,meter=round(.01+(fi%4)*.005,3),length={'bat':53,'staff':77,'hammer':43,'axe':48,'sword':62,'tonfa':43,'chain':68,'spear':83,'knuckles':22,'blade':31}[family]+i,icon='assets/weapons/'+id+'.svg')
  weapons.append(w)
  # The grip is at x=48,y=48. The combat renderer uses the same SVG as the shop.
  grip='<rect x="43" y="43" width="20" height="10" rx="3" fill="#302f3b" stroke="#a6b1b9"/>'
  shaft=f'<path d="M54 48H112" stroke="url(#metal)" stroke-width="{7+i%3}" stroke-linecap="round"/>'
  shape={'bat':f'<path d="M61 48L106 39Q126 37 126 48Q126 59 106 57L61 51Z" fill="url(#metal)" stroke="#dde8ee"/>',
  'staff':shaft+'<path d="M64 43v10m9-10v10m9-10v10" stroke="#303d50" stroke-width="3"/>',
  'hammer':shaft+f'<rect x="98" y="{27-i%3}" width="24" height="{42+i%3*2}" rx="4" fill="url(#metal)" stroke="#dce7ee"/>',
  'axe':shaft+f'<path d="M100 48L97 22Q123 24 130 45Q119 64 98 67Z" fill="url(#metal)" stroke="#dce7ee"/>',
  'sword':'<path d="M62 44L117 41L134 48L117 53L62 52Z" fill="url(#metal)" stroke="#edf7ff"/><path d="M63 36V60" stroke="#d8ad56" stroke-width="5"/>',
  'tonfa':shaft+'<path d="M77 48V25" stroke="url(#metal)" stroke-width="10" stroke-linecap="round"/>',
  'chain':''.join(f'<ellipse cx="{61+j*9}" cy="{48+(j%2)*2}" rx="8" ry="5" fill="none" stroke="{color}" stroke-width="3"/>'for j in range(7))+f'<circle cx="123" cy="49" r="{8+i%3}" fill="url(#metal)"/>',
  'spear':shaft+'<path d="M106 39L137 48L106 57L112 48Z" fill="url(#metal)" stroke="#f2f7ff"/>',
  'knuckles':'<rect x="45" y="29" width="46" height="32" rx="9" fill="url(#metal)" stroke="#dce7ee"/>'+''.join(f'<circle cx="{53+j*10}" cy="41" r="4" fill="#17202d"/>'for j in range(4)),
  'blade':'<path d="M62 44L116 35L106 49L62 53Z" fill="url(#metal)" stroke="#edf7ff"/><path d="M63 39V57" stroke="#b4bec9" stroke-width="4"/>'}[family]
  ornament=''.join(f'<path d="M{72+j*9} 45l3 6" stroke="{color}" stroke-width="2"/>'for j in range(i%5+1))
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="144" height="96" viewBox="0 0 144 96"><defs><linearGradient id="metal" x2="0" y2="1"><stop stop-color="#f2f5f7"/><stop offset=".4" stop-color="{color}"/><stop offset="1" stop-color="#344553"/></linearGradient></defs>{shaft if family not in ["bat","sword","blade","knuckles","chain"] else ""}{shape}{grip}{ornament}<circle cx="49" cy="48" r="2" fill="{color}"/></svg>'
  (root/'game/assets/weapons'/f'{id}.svg').write_text(svg)
assert len(weapons)==100 and len({w['id']for w in weapons})==100
catalog=dict(version=1,weapons=weapons,upgrades=[dict(id='power',name={'en':'Power','de':'Kraft'},maxLevel=5,baseCost=100,step=.025),dict(id='guard',name={'en':'Guard','de':'Schutz'},maxLevel=5,baseCost=100,step=.02),dict(id='focus',name={'en':'Focus','de':'Fokus'},maxLevel=5,baseCost=100,step=.04)])
(root/'game/assets/weapons/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(root/'game/js/weapon-data.js').write_text("'use strict';\nconst WEAPON_CATALOG = "+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
print('100 distinct purchasable weapon designs, DE/EN catalog and 3 character upgrade tracks generated.')
