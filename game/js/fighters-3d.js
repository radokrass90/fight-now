import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Blender exports articulated parts in the game's Y-up coordinate system.
// The same skeleton drives both rendering and hit detection, at 60 updates/s.
const models = new Map(), instances = new Map();
let renderer, scene, camera, key, rim, available = false;
const axis = new THREE.Vector3(0, 1, 0), direction = new THREE.Vector3();
const start = performance.now();
const api = {
  enabled: store.get('render3d', true), available: false, models,
  toggle() { this.enabled = !this.enabled; store.set('render3d', this.enabled); },
  draw(ctx, fighters, arena, time) {
    if (!available || !this.enabled || fighters.some(f => !models.has(f.c.id))) return false;
    for (const instance of instances.values()) instance.root.visible = false;
    fighters.forEach((f, index) => {
      const id = f.c.id + ':' + (f.side || 0);
      let instance = instances.get(id);
      if (!instance) {
        const root = models.get(f.c.id).clone(true), parts = {}, materials = [];
        root.traverse(object => {
          // Blender appends .001 etc. to names when a scene contains a whole cast.
          const partName = object.name.replace(/[._]?\d+$/, '');
          if (object.userData.part) parts[object.userData.part] = object;
          else if (partName.startsWith('part_')) parts[partName.slice(5)] = object;
          if (object.isMesh) {
            object.material = object.material.clone();
            object.material.userData.originalColor = object.material.color.clone();
            materials.push(object.material);
          }
        });
        instance = { root, parts, materials }; instances.set(id, instance); scene.add(root);
      }
      const { root, parts, materials } = instance;
      root.visible = f.vis !== false;
      if (!root.visible) return;
      const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk), w = f.c.w, s = f.c.h;
      root.position.set(hip[0], H - hip[1], index * 2);
      root.scale.set(f.facing * (f.sc || 1), (f.sc || 1) * (f.squash || 1), f.sc || 1);
      root.rotation.set(0, 0, -(f.rot || 0) * D2R);
      function point(p, z = 0) { return new THREE.Vector3(p[0], -p[1], z); }
      function segment(name, a, b, z, length) {
        const part = parts[name]; if (!part) return;
        const from = point(a, z), to = point(b, z);
        part.position.copy(from); direction.copy(to).sub(from);
        part.quaternion.setFromUnitVectors(axis, direction.clone().normalize());
        part.scale.set(1, direction.length() / length, 1);
      }
      segment('torso', [0, 0], sk.neck, 0, 50 * s);
      segment('frontUpperArm', sk.fsh, sk.fe, 7 * w, 27 * s);
      segment('frontForearm', sk.fe, sk.fh, 7 * w, 26 * s);
      segment('backUpperArm', sk.bsh, sk.be, -7 * w, 27 * s);
      segment('backForearm', sk.be, sk.bh, -7 * w, 26 * s);
      segment('frontThigh', sk.fhip, sk.fk, 5 * w, 35 * s);
      segment('frontShin', sk.fk, sk.ffo, 5 * w, 36 * s);
      segment('backThigh', sk.bhip, sk.bk, -5 * w, 35 * s);
      segment('backShin', sk.bk, sk.bfo, -5 * w, 36 * s);
      for (const [side, hand, foot, z] of [['front', sk.fh, sk.ffo, 1], ['back', sk.bh, sk.bfo, -1]]) {
        parts[side + 'Hand'].position.copy(point(hand, z * 7 * w));
        parts[side + 'Hand'].rotation.z = -(f.pose[side === 'front' ? 'ff' : 'bf'] - 90) * D2R * .35;
        parts[side + 'Foot'].position.copy(point(foot, z * 5 * w));
        parts[side + 'Foot'].rotation.z = -f.pose[side === 'front' ? 'fs' : 'bs'] * D2R * .3;
      }
      parts.head.position.copy(point(sk.head));
      parts.head.rotation.z = -(f.pose.lean + (f.pose.head || 0)) * D2R * .5;
      parts.head.rotation.y = Math.sin(time * .012) * .035;
      for (const material of materials) {
        material.transparent = (f.alpha ?? 1) < 1;
        material.opacity = f.alpha ?? 1;
        material.color.copy(material.userData.originalColor);
        if (f.paint) material.color.offsetHSL(.3, .25, .05);
        if (f.strip) material.color.lerp(new THREE.Color('#dedee8'), .65);
        material.emissive.setRGB(f.flash > 0 ? .8 : 0, f.flash > 0 ? .65 : 0, f.flash > 0 ? .4 : 0);
      }
    });
    const warm = [2, 4, 6, 11, 13].includes(arena);
    key.color.set(warm ? '#ffdfb5' : '#e0ecff');
    rim.color.set(warm ? '#ff8b48' : '#48aaff');
    renderer.render(scene, camera);
    if (![6, 13].includes(arena)) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, GROUND, W, H - GROUND); ctx.clip();
      ctx.globalAlpha = .12; ctx.filter = 'blur(2px)';
      ctx.translate(0, GROUND * 2 + 3); ctx.scale(1, -1);
      ctx.drawImage(renderer.domElement, 0, 0, W, H); ctx.restore();
    }
    ctx.drawImage(renderer.domElement, 0, 0, W, H);
    return true;
  }
};
window.Fighters3D = api;
try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.domElement.id = 'fighters-webgl'; renderer.domElement.hidden = true;
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, .1, 2200);
  camera.position.set(W/2, H/2, 900); camera.lookAt(W/2, H/2, 0);
  scene.add(new THREE.HemisphereLight('#d7e8ff', '#352f32', 1.5));
  key = new THREE.DirectionalLight('#ffe3c8', 2.2); key.position.set(100, 380, 250); scene.add(key);
  rim = new THREE.DirectionalLight('#48aaff', 1.8); rim.position.set(800, 220, -200); scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffffff', .6); fill.position.set(500, 160, 400); scene.add(fill);
  const loader = new GLTFLoader();
  await Promise.all(CHARS.map(async c => {
    const gltf = await loader.loadAsync('assets/models/' + c.id + '.glb');
    models.set(c.id, gltf.scene);
  }));
  available = true; api.available = true;
  document.documentElement.dataset.renderer = 'blender-3d';
} catch (error) {
  console.warn('3D renderer unavailable; using painted sprites.', error);
  document.documentElement.dataset.renderer = 'painted-2d';
} finally {
  window.resolveFighters3D?.();
}
