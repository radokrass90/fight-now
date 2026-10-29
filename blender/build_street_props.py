"""Build and render four reusable street set-dressing models for Fight Now."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parent
OUT=BASE.parent/'game/assets/props-3d'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.08,.10,.15)
scene.view_settings.view_transform='AgX'
def mat(name,color,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=38;noise.inputs['Detail'].default_value=3
 ramp=m.node_tree.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.22;ramp.color_ramp.elements[0].color=(*(v*.55 for v in color),1);ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(*color,1)
 bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.035
 m.node_tree.links.new(noise.outputs['Fac'],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs[0],p.inputs['Base Color']);m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
 return m
steel=mat('Worn blue steel',(.075,.14,.20),.7,.38)
rust=mat('Rust orange',(.28,.085,.025),.5,.68)
rubber=mat('Tire rubber',(.018,.022,.028),.05,.83)
wood=mat('Weathered timber',(.26,.13,.065),0,.75)
metal=mat('Galvanized steel',(.32,.40,.45),.8,.32)
yellow=mat('Safety amber',(.95,.46,.025),.15,.42)
black=mat('Painted charcoal',(.025,.035,.045),.3,.5)
def finish(o,name,m):
 o.name=name;o.data.materials.append(m)
 bevel=o.modifiers.new('Rounded worn edges','BEVEL');bevel.width=.025;bevel.segments=3
 o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o
def box(name,loc,scale,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m)
def cylinder(name,loc,radius,depth,m):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc);return finish(bpy.context.object,name,m)
def torus(name,loc,major,minor,m):
 bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,major_radius=major,minor_radius=minor,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
models=[]
def begin(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);models.append(c);return c
def collect(c,before):
 for o in list(scene.objects):
  if o not in before:
   for old in list(o.users_collection):old.objects.unlink(o)
   c.objects.link(o)
c=begin('01 Industrial drums');before=set(scene.objects)
for x,y,z in [(-.45,.12,0),(.5,.40,0)]:
 cylinder('Steel drum',(x,y,z+.58),.39,1.16,steel if x<0 else rust)
 for h in [.1,.36,.86,1.1]:torus('Raised barrel seam',(x,y,z+h),.39,.018,metal)
 cylinder('Inset lid',(x,y,z+1.17),.35,.018,black)
 cylinder('Bung cap',(x+.15,y,z+1.19),.045,.025,metal)
 box('Scuffed warning label',(x,y-.39,.66),(.24,.018,.25),yellow)
collect(c,before)
c=begin('02 Garage tires');before=set(scene.objects)
for level in range(3):
 z=.16+level*.26;torus('Stacked tire',(0,.15,z),.43,.14,rubber)
 for j in range(36):
  a=j*math.tau/36;o=box('Tread block',(.54*math.cos(a),.15+.54*math.sin(a),z),(.055,.055,.17),black);o.rotation_euler.z=a+.3
cylinder('Wheel rim',(0,.15,.72),.27,.07,metal)
for j in range(5):
 a=j*math.tau/5;box('Rim spoke',(.15*math.cos(a),.15+.15*math.sin(a),.76),(.07,.07,.018),black)
collect(c,before)
c=begin('03 Timber crates');before=set(scene.objects)
for x,y,z,s in [(-.35,.1,.46,.9),(.48,.4,.35,.65)]:
 box('Crate core',(x,y,z),(s,s,s),wood)
 for k in range(5):
  box('Front plank',(x-s*.4+k*s*.2,y-s*.51,z),(s*.18,.035,s*.95),wood)
 for h in [-s*.34,s*.34]:
  box('Metal binding',(x,y-s*.54,z+h),(s*1.02,.035,.06),metal)
 o=box('Diagonal brace',(x,y-s*.56,z),(s*1.15,.035,.08),wood);o.rotation_euler.y=-.72
collect(c,before)
c=begin('04 Street barrier');before=set(scene.objects)
for x in [-.78,.78]:
 box('Rubber foot',(x,.12,.06),(.5,.65,.12),rubber)
 cylinder('Barrier upright',(x,.12,.6),.045,1.08,metal)
box('Safety panel',(0,.12,.86),(1.9,.12,.42),yellow)
for j in range(7):
 o=box('Black safety stripe',(-.80+j*.27,.049,.86),(.12,.018,.42),black);o.rotation_euler.y=-.27
collect(c,before)
# A transparent shadow catcher anchors every rendered object to the street.
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.name='Transparent contact shadow';plane.is_shadow_catcher=True
plane.data.materials.append(mat('Shadow receiver',(.25,.25,.25),0,1))
bpy.ops.object.camera_add(location=(3,-8,3.2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,.15,.62))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.1;scene.camera=cam
def light(name,loc,color,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
light('Warm street key',(-3,-4,5),(1,.65,.34),550,4)
light('Cool neon rim',(3,2,4),(.25,.54,1),750,3)
light('Soft front fill',(0,-4,2),(.63,.75,1),100,3)
for c in models:c.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'street-props.blend'))
for i,c in enumerate(models):
 c.hide_render=False;scene.render.filepath=str(OUT/f'prop-{i+1:02d}.png');bpy.ops.render.render(write_still=True);c.hide_render=True
models[0].hide_render=False
for c in models[1:]:c.hide_viewport=True
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'street-props.blend'))
print('Rendered four transparent street prop collections')
