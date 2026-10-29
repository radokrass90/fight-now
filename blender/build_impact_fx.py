"""Render a small transparent 3D impact animation for the painted game."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parent
OUT=BASE.parent/'game/assets/effects'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=8
scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='Standard'
scene.world.color=(0,0,0)
def emission(name,color,power):
 m=bpy.data.materials.new(name);m.use_nodes=True
 n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');e=n.new('ShaderNodeEmission');e.inputs['Color'].default_value=(*color,1);e.inputs['Strength'].default_value=power;m.node_tree.links.new(e.outputs[0],out.inputs[0]);return m
hot=emission('White-hot core',(1,.85,.42),3)
gold=emission('Amber shock rim',(1,.31,.035),2)
white=emission('Spark tips',(1,.95,.75),4)
bpy.ops.object.camera_add(location=(0,-1.8,8));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=5.6;scene.camera=camera
objects=[]
for i in range(2):
 bpy.ops.mesh.primitive_torus_add(major_radius=1,minor_radius=.025 if i else .055,major_segments=72,minor_segments=8)
 o=bpy.context.object;o.name='Shock ring '+str(i);o.data.materials.append(gold if i else hot);objects.append(o)
rng=random.Random(37)
shards=[]
for i in range(18):
 a=i/18*math.tau+rng.uniform(-.1,.1);length=rng.uniform(.26,.65)
 bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.055,radius2=.004,depth=length)
 o=bpy.context.object;o.name='Beveled radial spark '+str(i);o.data.materials.append(white if i%3==0 else gold)
 direction=Vector((math.cos(a),math.sin(a),rng.uniform(-.15,.15)));o.rotation_euler=direction.to_track_quat('Z','Y').to_euler();shards.append((o,a,length))
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.25);core=bpy.context.object;core.name='Impact core';core.data.materials.append(hot)
for frame in range(1,13):
 t=(frame-1)/11
 for i,o in enumerate(objects):
  radius=.12+t*(1.8 if i else 1.45);o.scale=(radius,radius, max(.12,1-t));o.keyframe_insert(data_path='scale',frame=frame)
 for i,(o,a,length) in enumerate(shards):
  radius=.2+t*(1.5+(i%3)*.15);o.location=(math.cos(a)*radius,math.sin(a)*radius,0)
  s=max(.015,(1-t)**.6);o.scale=(s,s,(.4+math.sin(t*math.pi)*1.3)*s)
  o.keyframe_insert(data_path='location',frame=frame);o.keyframe_insert(data_path='scale',frame=frame)
 core.scale=(max(.01,1-t*3),)*3;core.keyframe_insert(data_path='scale',frame=frame)
scene.frame_start=1;scene.frame_end=12
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'impact-effects.blend'))
for frame in range(1,13):
 scene.frame_set(frame);scene.render.filepath=str(OUT/f'impact-{frame:02d}.png');bpy.ops.render.render(write_still=True)
print('Rendered 12 transparent Blender impact frames')
