"""Original Blender dressing for the Reforged review: animated vent + metal title.
The 2.5D game ships transparent rendered WebP atlases; GLB is supplied as editable
geometry interchange in addition to the two-scene .blend source.
"""
import bpy, math
from mathutils import Vector
from pathlib import Path
BASE=Path(__file__).resolve().parent
OUT=BASE.parent/'game/assets/reforged-3d';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.name='Neon ventilation - 12 frames'
def setup(s,w,h):
 s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=w;s.render.resolution_y=h;s.render.resolution_percentage=100;s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.view_settings.view_transform='AgX';s.world.color=(.045,.065,.1)
setup(scene,384,384)
def material(name,color,metal=0,rough=.5,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
steel=material('Blue gunmetal',(.055,.085,.12),.85,.32)
rim=material('Brushed stainless edge',(.25,.33,.41),.85,.22)
black=material('Vent interior',(.009,.015,.024),.2,.8)
cyan=material('Cyan neon tube',(.015,.65,1),.25,.25,4)
amber=material('Amber status light',(1,.24,.025),.3,.3,3)
def finish(o,name,m,bevel=.025):
 o.name=name;o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Machined edge bevel','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def box(name,loc,scale,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m)
def torus(name,loc,r,minor,m):
 bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=12,major_radius=r,minor_radius=minor,location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=name;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def camera(loc,target,scale):
 bpy.ops.object.camera_add(location=loc);o=bpy.context.object;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o.data.type='ORTHO';o.data.ortho_scale=scale;bpy.context.scene.camera=o;return o
def light(name,loc,target,color,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
box('Wall mount plate',(0,.13,.9),(1.85,.16,1.85),steel)
box('Dark turbine recess',(0,.025,.9),(1.61,.09,1.61),black)
torus('Heavy housing',(0,-.06,.9),.76,.08,rim)
torus('Inner light guide',(0,-.14,.9),.69,.018,cyan)
rotor=bpy.data.objects.new('Rotor animation pivot',None);scene.collection.objects.link(rotor);rotor.location=(0,-.08,.9)
for i in range(7):
 a=i*math.tau/7
 points=[]
 for radius,da,y in [(.14,-.12,-.01),(.64,.07,.015),(.67,.36,.055),(.22,.45,.025)]:points.append((math.sin(a+da)*radius,y,math.cos(a+da)*radius))
 mesh=bpy.data.meshes.new('Swept turbine blade');mesh.from_pydata(points,[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new('Blade '+str(i),mesh);scene.collection.objects.link(o);o.parent=rotor;finish(o,'Swept blade '+str(i),rim,.012);o.modifiers.new('Blade thickness','SOLIDIFY').thickness=.025
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.15,location=(0,-.16,.9));finish(bpy.context.object,'Turbine central cap',steel,0)
for x in [-.78,.78]:
 for z in [.12,1.68]:
  bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.045,depth=.04,location=(x,-.08,z),rotation=(math.pi/2,0,0));finish(bpy.context.object,'Mounting bolt',rim,.007)
for x in [-.53,-.265,0,.265,.53]:box('Protective grille',(x,-.23,.9),(.012,.018,1.32),steel)
box('Status LED',(0.68,-.12,.19),(.1,.02,.035),amber)
box('Lower service latch',(-.46,-.13,.1),(.34,.035,.05),rim)
cam=camera((1.9,-6,2.5),(0,0,.9),2.5)
light('Warm street lamp',(-3,-4,5),(0,0,.9),(1,.57,.25),550,4)
light('Cool club rim',(3,1,4),(0,0,.9),(.08,.45,1),700,3)
scene.frame_start=1;scene.frame_end=12
for frame in range(1,13):
 rotor.rotation_euler.y=(frame-1)/12*math.tau/7;rotor.keyframe_insert(data_path='rotation_euler',frame=frame)
scene.frame_set(1)
# Geometry export is an interchange deliverable; lightweight bakes are used at runtime.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'vent.glb'),use_selection=True,export_format='GLB',export_animations=True)
for frame in range(1,13):
 scene.frame_set(frame);scene.render.filepath=str(OUT/f'vent-{frame:02d}.png');bpy.ops.render.render(write_still=True)
# Separate scene for an original extruded brand title, using the same OFL font as UI.
logo=bpy.data.scenes.new('Reforged metal title');bpy.context.window.scene=logo;logo.world=bpy.data.worlds.new('Title world');setup(logo,2048,640)
font=bpy.data.fonts.load(str(BASE.parent/'game/assets/fonts/RussoOne-Regular.ttf'))
def text(name,z,m,size=1):
 curve=bpy.data.curves.new(name,'FONT');curve.body='FIGHT NOW';curve.font=font;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=size;curve.extrude=.13;curve.bevel_depth=.018;curve.bevel_resolution=4;curve.resolution_u=16
 o=bpy.data.objects.new(name,curve);logo.collection.objects.link(o);o.location=(0,0,z);o.rotation_euler.z=-.023;o.data.materials.append(m);return o
front=material('Warm anodized title',(1,.49,.055),.72,.27)
text('Cyan extruded title back',-.17,cyan,1.025)
title=text('Amber metal title front',0,front)
bpy.context.view_layer.update();width=title.dimensions.x
logo_cam=camera((0,-1,14),(0,0,0),width*1.15)
logo_cam.rotation_euler=(math.atan(1/14),0,0)
light('Warm title softbox',(-width*.3,-width*.25,width*.7),(0,0,0),(1,.74,.42),650,4)
light('Blue edge softbox',(width*.4,width*.2,width*.4),(0,0,0),(.08,.55,1),450,3)
logo.render.filepath=str(OUT/'logo.png');bpy.ops.render.render(write_still=True)
bpy.context.window.scene=scene;scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'reforged-atmosphere.blend'))
print('Reforged Blender source, vent GLB, 12 animation frames and metal logo rendered.')
