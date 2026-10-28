"""Build the editable Fight Now cast, animation study, and web-ready GLB models.
Blender 5.1: blender -b --python blender/build_fighters.py -- --preview
Game coordinates deliberately use Y up. GLB export_yup=False preserves them.
"""
import bpy, json, math, os, sys
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parent
DATA = json.loads((BASE/'characters.json').read_text())
OUT = BASE.parent/'game/assets/models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)

def mat(name, color, metallic=0, rough=.48):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metallic;bs.inputs['Roughness'].default_value=rough
    return m
def rgb(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c)
def dark(c,n=.65):return tuple(x*n for x in c)
INK=mat('Warm charcoal',(.014,.018,.025),0,.5)
GOLD=mat('Brushed gold',(.85,.57,.12),.7,.22)
STEEL=mat('Tool steel',(.37,.45,.55),.82,.25)
WHITE=mat('Ivory fabric',(.92,.91,.85),0,.7)
REFLECT=mat('Reflective safety piping',(.72,.92,.11),.25,.25)

def finish(obj, material, parent):
    obj.data.materials.append(material);obj.parent=parent
    for poly in obj.data.polygons:poly.use_smooth=True
    return obj
def ball(name,loc,size,material,parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=(0,0,0))
    o=bpy.context.object;o.name=name;o.location=loc;o.scale=size;return finish(o,material,parent)
def box(name,loc,size,material,parent,bevel=1):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name
    o.location=loc;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Tailored rounded edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,material,parent)
def tube(name,a,b,r,material,parent,r2=None):
    a,b=Vector(a),Vector(b);v=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=14,radius1=r,radius2=r if r2 is None else r2,depth=v.length,location=(0,0,0))
    o=bpy.context.object;o.name=name;o.location=(a+b)/2;o.rotation_quaternion=Vector((0,0,1)).rotation_difference(v.normalized());o.rotation_mode='QUATERNION'
    # Assign quaternion after setting its mode (Euler values are intentionally unused).
    o.rotation_quaternion=Vector((0,0,1)).rotation_difference(v.normalized())
    return finish(o,material,parent)
def body(name,rings,material,parent):
    verts=[];faces=[];n=20
    for y,rx,rz in rings:
        for k in range(n):
            a=k*math.tau/n;verts.append((math.cos(a)*rx,y,math.sin(a)*rz))
    for j in range(len(rings)-1):
        for k in range(n):faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+k for k in range(n))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[tuple(reversed(f))for f in faces]);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,material,parent)
def node(name,parent):
    o=bpy.data.objects.new('part_'+name,None);bpy.context.collection.objects.link(o);o.parent=parent;o['part']=name;return o

def skeleton(c,p):
    s,w=c['h'],c['w'];v=lambda a,l:Vector((math.sin(math.radians(a))*l,-math.cos(math.radians(a))*l,0))
    lean=math.radians(p['lean']);neck=Vector((math.sin(lean)*50*s,math.cos(lean)*50*s,0));sh=neck*.9
    fsh=sh+Vector((2*w,-2,7*w));bsh=sh+Vector((-3*w,-1,-7*w))
    fe=fsh+v(p['fu'],27*s);fh=fe+v(p['ff'],26*s)
    be=bsh+v(p['bu'],27*s);bh=be+v(p['bf'],26*s)
    fhip=Vector((3*w,0,5*w));bhip=Vector((-3*w,0,-5*w))
    fk=fhip+v(p['ft'],35*s);ff=fk+v(p['fs'],36*s)
    bk=bhip+v(p['bt'],35*s);bf=bk+v(p['bs'],36*s)
    a=math.radians(p['lean']+p.get('head',0));head=neck+Vector((math.sin(a)*12.5*s*1.15,math.cos(a)*12.5*s*1.15,0))
    return dict(neck=neck,sh=sh,fsh=fsh,bsh=bsh,fe=fe,fh=fh,be=be,bh=bh,fhip=fhip,bhip=bhip,fk=fk,ff=ff,bk=bk,bf=bf,head=head)

def pose_model(c,parts,p,root,animate=False,frame=1):
    sk=skeleton(c,p);origin=Vector((0,0,0))
    pairs={'torso':(origin,sk['neck']),'frontUpperArm':(sk['fsh'],sk['fe']),'frontForearm':(sk['fe'],sk['fh']),
        'backUpperArm':(sk['bsh'],sk['be']),'backForearm':(sk['be'],sk['bh']),
        'frontThigh':(sk['fhip'],sk['fk']),'frontShin':(sk['fk'],sk['ff']),
        'backThigh':(sk['bhip'],sk['bk']),'backShin':(sk['bk'],sk['bf'])}
    for key,(a,b)in pairs.items():
        o=parts[key];o.location=a;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,1,0)).rotation_difference((b-a).normalized())
    for side,hand,foot in [('front','fh','ff'),('back','bh','bf')]:
        parts[side+'Hand'].location=sk[hand]
        parts[side+'Foot'].location=sk[foot]
    parts['head'].location=sk['head'];parts['head'].rotation_euler[2]=-math.radians(p['lean']+p.get('head',0))*.5
    root.location.y=-min(sk['ff'].y,sk['bf'].y)+5
    if animate:
        for o in parts.values():
            o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_quaternion' if o.rotation_mode=='QUATERNION' else 'rotation_euler',frame=frame)
        root.keyframe_insert('location',frame=frame)

def make(c):
    look=c['look'];s,w=c['h'],c['w'];female=c['sex']=='f';extra=look.get('extra',[])
    root=bpy.data.objects.new(c['id'],None);bpy.context.collection.objects.link(root)
    parts={key:node(key,root)for key in ['torso','head','frontUpperArm','frontForearm','backUpperArm','backForearm','frontThigh','frontShin','backThigh','backShin','frontHand','backHand','frontFoot','backFoot']}
    skin=mat(c['id']+' skin',rgb(look['skin']),0,.42);top=mat(c['id']+' jacket',rgb(look['top']),0,.62)
    pants=mat(c['id']+' trousers',rgb(look['pants']),0,.72);hair=mat(c['id']+' hair',rgb(look['hairC']),0,.8)
    shoe=mat(c['id']+' footwear',rgb(look['shoes']),0,.46);hands=mat(c['id']+' handwear',rgb(look['hands']),0,.7)
    trim=mat(c['id']+' seams',dark(rgb(look['top']),.5),0,.6)
    t=parts['torso'];waist=(8.5 if female else 11)*w;chest=(14 if female else 16)*w
    body('Fitted torso',[(0,waist,8*w),(12*s,waist*1.05,8*w),(30*s,chest,10*w),(43*s,chest*.95,9*w),(49*s,7*w,6*w)],skin if look.get('crop') else top,t)
    if look.get('crop'):body('Athletic top',[(25*s,chest*.85,10.3*w),(34*s,chest*1.01,10.4*w),(43*s,chest*.96,9.4*w),(49*s,7.3*w,6.5*w)],top,t)
    body('Tailored waist',[(0,waist*1.06,8.5*w),(-8*s,waist*1.03,8*w)],pants,t)
    box('Belt buckle',(2,0,8.7*w),(5,3,1.8),GOLD if 'belt' in extra else STEEL,t,.6)
    if look.get('sleeves',0)>0:
        for xx in [-7,7]:
            col=box('Folded collar',(xx*w,44*s,8*w),(7*w,8*s,2),trim,t,.8);col.rotation_euler[2]=(-.4 if xx<0 else .4)
        tube('Jacket zip',(0,5,9*w),(0,42*s,10*w),.55,STEEL,t)
        for yy in [12,22]:box('Chest pocket',(-8*w,yy*s,9*w),(8*w,5*s,1),trim,t,.7)
    if 'vest' in extra:
        for yy in [16,32]:box('Reflective jacket band',(0,yy*s,10.3*w),(chest*1.8,2,1),REFLECT,t,.3)
    if 'vestDark' in extra:
        for xx in [-8,8]:box('Dark vest panel',(xx*w,27*s,10*w),(9*w,30*s,1.4),INK,t,1)
    if 'paint' in extra:
        for j,col in enumerate(['#22d3ee','#ff2bd6','#facc15']):ball('Paint splatter',(-7+j*6,20+j*6,10.5*w),(3,3,1),mat(c['id']+' paint '+str(j),rgb(col)),t)
    if 'apron' in extra:
        apron=mat(c['id']+' apron',rgb(look.get('apron','#ffffff')),0,.83)
        body('Work apron',[(36*s,10*w,11*w),(0,12*w,10*w),(-25*s,13*w,8*w)],apron,t)
        box('Apron pocket',(0,4,11*w),(13*w,10,1),WHITE,t,.7)
    if 'chain' in extra or 'beltChain' in extra:
        for j in range(10):
            a=j/9*math.pi;ball('Chain link',(-10*w+20*w*j/9,(39 if 'chain'in extra else -4)-math.sin(a)*6,11*w),(1.6,1.6,.7),GOLD if 'chain'in extra else STEEL,t)
    if 'scarf' in extra:
        box('Woven scarf collar',(0,46*s,10*w),(22*w,6,4),GOLD,t,2)
        box('Football scarf tail',(-9*w,31*s,12*w),(6,27,3),GOLD,t,1)
        for yy in [23,31,39]:box('Scarf black bands',(-9*w,yy*s,13.6*w),(6.3,3,1),INK,t,.2)
    for side in ['front','back']:
        ua,fa=parts[side+'UpperArm'],parts[side+'Forearm']
        uppermat=top if look.get('sleeves',0)>=1 else skin;foremat=top if look.get('sleeves',0)>=2 else skin
        body('Upper arm',[(0,6.7*w,6*w),(6*s,7*w,6.5*w),(17*s,6*w,5.5*w),(27*s,4.6*w,4.4*w)],uppermat,ua)
        ball('Rounded shoulder',(0,2,0),(7.2*w,7.2*w,6.8*w),uppermat,ua)
        body('Forearm',[(0,4.8*w,4.5*w),(9*s,5.5*w,4.7*w),(21*s,3.7*w,3.8*w),(26*s,3.3*w,3.5*w)],foremat,fa)
        hand=parts[side+'Hand'];ball('Closed fist',(2*w,0,0),(6*w,5.3*w,4.8*w),hands,hand)
        for j in range(4):ball('Knuckle',(5*w,1.5-j*1.4,2.6*w),(2,1.4,2),hands,hand)
        ball('Thumb',(1,-3.6*w,3*w),(3*w,2.1*w,2.6*w),hands,hand)
        if look['hands']=='#f2f0ea':
            for yy in [20,22,24]:tube('Hand wrap seam',(-3.4*w,yy*s,3.7*w),(3.4*w,yy*s,3.7*w),.28,INK,fa)
        thigh,shin=parts[side+'Thigh'],parts[side+'Shin']
        body('Trouser thigh',[(0,7.3*w,7*w),(7*s,8*w,7*w),(23*s,6.2*w,5.8*w),(35*s,5.1*w,5*w)],pants,thigh)
        lower=skin if look.get('shorts') else pants
        body('Lower leg',[(0,5.2*w,5*w),(11*s,5.7*w,5*w),(29*s,3.8*w,3.7*w),(36*s,3.3*w,3.5*w)],lower,shin)
        if look.get('stripe'):
            stripe=mat(c['id']+side+' sports stripe',rgb(look['stripe']))
            tube('Trouser piping',(5*w,2,4*w),(5*w,33*s,4*w),.7,stripe,thigh)
        foot=parts[side+'Foot'];boot=skin if look.get('barefoot') else shoe
        ball('Boot',(5*w,-1,1),(11*s,5*w,5.3*w),boot,foot)
        if not look.get('barefoot'):
            box('Sole',(5*w,-4*w,1),(21*s,2.2,10*w),INK,foot,1)
            for xx in [1,4,7]:tube('Boot laces',(xx,2,4),(xx+1,2,-2),.4,WHITE,foot)
    h=parts['head'];ball('Neck',(0,-11*s,0),(4.8*w,9*s,5*w),skin,h)
    ball('Head',(0,1*s,0),(10.7*s,13*s,9.7*s),skin,h)
    ball('Jaw',(2,-6*s,1),(8.7*s,7*s,8*s),skin,h)
    ball('Nose',(8*s,1*s,7*s),(3.7*s,3.3*s,3*s),skin,h)
    ball('Ear',(-8*s,0,2),(3*s,4.1*s,3*s),skin,h)
    for ex in [-3,5]:
        ball('Eye white',(ex*s,3*s,9*s),(1.6*s,.8*s,.65),WHITE,h)
        ball('Iris',((ex+.6)*s,3*s,9.6*s),(.8*s,.8*s,.45),INK,h)
        brow=box('Brow',(ex*s,6*s,9*s),(5*s,1.4*s,1.2),hair,h,.4);brow.rotation_euler[2]=-.14
    tube('Mouth',(2,-6*s,8*s),(7*s,-5.5*s,8*s),.55,INK,h)
    hairtype=look['hair']
    if hairtype!='bald':
        ball('Hair crown',(-1,10*s,-1),(11*s,4*s if hairtype in ['buzz','undercut'] else 6*s,10*s),hair,h)
        if hairtype not in ['buzz','undercut']:ball('Hair back',(-7*s,2,-2),(5*s,9*s,8*s),hair,h)
        if hairtype in ['curly','short','slick']:
            for j in range(8):ball('Textured hair',(-7+j*2,13*s+math.sin(j)*1.2,5),(2.5,2.6,3),hair,h)
    if hairtype in ['braids','pony']:
        for j in range(3 if hairtype=='braids' else 1):
            for k in range(7):ball('Braided hair',(-11*s-k*.6,3*s-k*4*s,-3+j*4),(2.2 if hairtype=='braids' else 4,3,2.5),hair,h)
    if hairtype=='bun':ball('Hair bun',(-10*s,12*s,-2),(5*s,5*s,5*s),hair,h)
    if hairtype in ['beanie','cap']:
        ball('Hat',(0,10*s,0),(12*s,8*s,11*s),hair,h)
        box('Hat band',(0,7*s,9*s),(20*s,3*s,2),hair,h,.7)
        if hairtype=='cap':box('Backward cap brim',(-13*s,8*s,0),(10*s,2*s,15*s),hair,h,1)
    if hairtype=='hood':
        ball('Raised hood',(-5*s,2*s,-4*s),(12*s,16*s,11*s),top,h)
        ball('Face opening',(1,1,6*s),(8.5*s,11*s,5*s),skin,h)
    if look.get('beard'):
        beard=mat(c['id']+' beard',rgb(look.get('beardC',look['hairC'])),0,.8)
        if look['beard']=='mustache':box('Moustache',(5*s,-4*s,9*s),(8*s,2.4*s,2),beard,h,1)
        else:
            ball('Sculpted beard',(1,-8*s,3*s),(9*s,6.5*s,7*s),beard,h)
            tube('Moustache',(1,-3*s,9*s),(8*s,-3*s,9*s),1.3,beard,h)
    if 'glasses'in extra:
        for ex in [-3,5]:box('Sunglasses lens',(ex*s,3*s,10*s),(6*s,4*s,1.4),INK,h,.8)
    if 'mask'in extra:
        ball('Respirator',(5,-5*s,9*s),(7*s,5*s,5*s),STEEL,h)
        ball('Respirator filter',(9*s,-5*s,12*s),(3,3,2),INK,h)
    if 'earpiece'in extra:ball('Security earpiece',(-8*s,0,6*s),(2,3,2),INK,h)
    hand=parts['backHand'];prop=c.get('prop')
    if prop=='cane':
        tube('Wooden cane',(0,-3,0),(0,-53,0),1.8,mat(c['id']+' cane',(.16,.07,.025)),hand)
        ball('Gold cane handle',(0,0,0),(4,3,3),GOLD,hand)
    if prop=='wrench':
        box('Wrench handle',(0,-14,0),(4,32,3),STEEL,hand,.8)
        for xx in [-4,4]:box('Wrench jaw',(xx,-32,0),(4,10,4),STEEL,hand,1)
    if prop=='tray':ball('Steel serving tray',(0,-4,-1),(16,1.3,12),STEEL,hand)
    pose_model(c,parts,c['stance'],root)
    return root,parts

models=[]
for c in DATA['characters']:
    root,parts=make(c);models.append((c,root,parts))
    # Export a single articulated model. Only selected descendants enter the file.
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for o in root.children_recursive:o.select_set(True)
    loc=root.location.copy();root.location=(0,0,0)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(c['id']+'.glb')),export_format='GLB',use_selection=True,export_yup=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
    root.location=loc
    print('EXPORTED',c['id'],flush=True)

# Editable walk-cycle animation for the entire cast in the Blender source.
for ci,(c,root,parts)in enumerate(models):
    for frame in range(1,34,2):
        phase=(frame-1)/32*math.tau;p=dict(c['stance']);q=math.sin(phase)
        p['ft']+=q*22;p['bt']-=q*22;p['fs']+=min(0,q)*26;p['bs']+=min(0,-q)*26
        p['fu']-=q*8;p['bu']+=q*8
        pose_model(c,parts,p,root,True,frame)
        root.location.x=(ci%5-2)*105;root.location.y+=(2-ci//5)*210;root.location.z=0
        root.keyframe_insert('location',frame=frame)
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=32;scene.render.fps=30;scene.frame_set(1)
scene.world.color=(.025,.035,.055)
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1500;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
def area(name,pos,color,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,70,-100))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm studio key',(-250,400,350),(1,.78,.57),1700000,400)
area('Cold edge light',(300,250,-400),(.15,.55,1),1900000,300)
area('Soft front fill',(100,180,500),(.5,.65,1),700000,300)
bpy.ops.object.camera_add(location=(0,300,1000));camera=bpy.context.object
camera.rotation_euler=(0,0,0);camera.data.type='ORTHO';camera.data.ortho_scale=950;camera.data.clip_end=3000;scene.camera=camera
scene.render.filepath=str(BASE/'cast-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'fight-now-cast.blend'))
if '--preview'in sys.argv:bpy.ops.render.render(write_still=True)
print('BLENDER_BUILD_COMPLETE',flush=True)
