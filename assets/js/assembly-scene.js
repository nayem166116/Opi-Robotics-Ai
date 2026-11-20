import * as THREE from '/assets/vendor/three/three.module.min.js';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from '/assets/vendor/three/addons/geometries/RoundedBoxGeometry.js';

const BG = 0x060708;
const AMBER = new THREE.Color(0xff8a3d);
const MODEL = '/assets/models/cobot.glb';
const HQ = /[?&]hq\b/.test(location.search);
const TEST = /[?&]asmtest\b/.test(location.search);

/* Studio light rig baked into an environment map: one big overhead softbox,
   two vertical strips and a low bounce card, the way product photographers light white plastic. */
function studioEnvironment(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x020202);
  const card = (w, h, v, x, y, z, tint = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(v), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  card(7, 7, 2.6, 0, 9, 0.5);
  card(1.4, 9, 5.0, -7, 2, 3);
  card(1.4, 9, 2.4, 7.5, 2, -2, 0xdfe8ff);
  card(5, 4, 1.2, 4, 3, 7, 0xfff1e2);
  card(14, 1.2, 0.35, 0, -2.5, -8);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.02).texture;
  pm.dispose();
  return tex;
}

function zoneTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2;
  const grd = g.createRadialGradient(m, m, m * 0.2, m, m, m * 0.9);
  grd.addColorStop(0, 'rgba(255,138,61,0)'); grd.addColorStop(1, 'rgba(255,138,61,0.05)');
  g.fillStyle = grd; g.beginPath(); g.arc(m, m, m * 0.9, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,150,80,1)'; g.lineWidth = 5;
  g.beginPath(); g.arc(m, m, m * 0.9, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.setLineDash([22, 16]);
  g.beginPath(); g.arc(m, m, m * 0.975, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// soft radial gradient used for the light curtain fade and the contact shadows
function gradientTexture(stops, vertical) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const grd = vertical ? g.createLinearGradient(0, S, 0, 0) : g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function mount({ root, labels, hint, KEYS, reduce, progress, activeAt, setActive, smooth, clamp }) {
  const canvas = root.querySelector('.assembly__canvas');
  const sticky = root.querySelector('.assembly__sticky');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 5.5, 11);
  let envTex = studioEnvironment(renderer);
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 40);

  /* ---------- materials ---------- */
  const M = {
    white: new THREE.MeshPhysicalMaterial({ color: 0xf2f2ef, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    off_white: new THREE.MeshPhysicalMaterial({ color: 0xd8dbdc, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.48, metalness: 0.15 }),
    light_blue: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x7fc4ff, emissiveIntensity: 0.6, roughness: 0.3 }),
    green: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x6dff9a, emissiveIntensity: 0.5, roughness: 0.3 }),
    alu: new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.34, metalness: 1 }),
    anod: new THREE.MeshStandardMaterial({ color: 0x2b2e32, roughness: 0.42, metalness: 0.75 }),
    powder: new THREE.MeshStandardMaterial({ color: 0x1f2124, roughness: 0.62, metalness: 0.2 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0e0f10, roughness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x0c1220, roughness: 0.02, metalness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6 }),
    led: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: AMBER, emissiveIntensity: 1.2 })
  };
  const shadowy = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  const mesh = (g, m) => shadowy(new THREE.Mesh(g, m));

  /* ---------- the cell ---------- */
  const cell = new THREE.Group(); scene.add(cell);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x0e0f10, roughness: 0.78, metalness: 0 }));
  floor.receiveShadow = true; scene.add(floor);

  // pedestal the arm is bolted to
  const PED_H = 0.58;
  const pedestal = new THREE.Group();
  const col = mesh(new RoundedBoxGeometry(0.3, PED_H - 0.03, 0.3, 4, 0.012), M.powder); col.position.y = (PED_H - 0.03) / 2;
  const plate = mesh(new RoundedBoxGeometry(0.36, 0.03, 0.36, 3, 0.006), M.alu); plate.position.y = PED_H - 0.015;
  const foot = mesh(new RoundedBoxGeometry(0.42, 0.02, 0.42, 3, 0.006), M.anod); foot.position.y = 0.01;
  pedestal.add(col, plate, foot);
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
    const b = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 6), M.alu); b.position.set(x, 0.027, z); pedestal.add(b);
  }
  cell.add(pedestal);
  const contactTex = gradientTexture([[0, 'rgba(0,0,0,0.85)'], [0.45, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
  const contact = (size, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set(x, 0.001, z); m.renderOrder = 0; return m;
  };
  cell.add(contact(0.9, 0, 0));

  // edge controller: finned aluminium enclosure on the floor
  const ctrl = new THREE.Group();
  const CW = 0.24, CH = 0.36, CD = 0.3;
  const body = mesh(new RoundedBoxGeometry(CW, CH, CD, 4, 0.014), M.anod); body.position.y = CH / 2;
  const face = mesh(new RoundedBoxGeometry(CW * 0.86, CH * 0.82, 0.01, 3, 0.004), M.glass); face.position.set(0, CH / 2 + 0.01, CD / 2);
  ctrl.add(body, face);
  for (let i = 0; i < 9; i++) {
    for (const s of [-1, 1]) {
      const fin = mesh(new THREE.BoxGeometry(0.018, CH * 0.88, 0.006), M.anod);
      fin.position.set(s * (CW / 2 + 0.008), CH / 2, -CD / 2 + 0.04 + i * 0.028); ctrl.add(fin);
    }
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(CW * 0.5, 0.006, 0.004), M.led); strip.position.set(0, CH * 0.86, CD / 2 + 0.017); ctrl.add(strip);
  for (let i = 0; i < 4; i++) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.014, 0.004), M.black); port.position.set(-0.06 + i * 0.04, CH * 0.2, CD / 2 + 0.017); ctrl.add(port);
  }
  ctrl.position.set(-0.62, 0, -0.18); ctrl.rotation.y = 0.5;
  cell.add(ctrl);
  cell.add(contact(0.7, ctrl.position.x, ctrl.position.z));

  // floor cable from controller to pedestal
  const cable = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.66, 0.05, -0.33), new THREE.Vector3(-0.6, 0.012, -0.5), new THREE.Vector3(-0.3, 0.012, -0.42),
    new THREE.Vector3(-0.1, 0.012, -0.26), new THREE.Vector3(0, 0.06, -0.15)]), 80, 0.011, 10), M.rubber);
  cell.add(cable);

  // safety zone: floor marking + light curtain
  const R = 0.95;
  const zoneMat = new THREE.MeshBasicMaterial({ map: zoneTexture(), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
  const zone = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.06, R * 2.06).rotateX(-Math.PI / 2), zoneMat);
  zone.position.y = 0.002; zone.renderOrder = 1; cell.add(zone);
  // light curtain: plain additive materials only, no custom shaders, so every GPU/driver draws it the same way
  const curtainMat = new THREE.MeshBasicMaterial({
    color: AMBER, map: gradientTexture([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']], true),
    transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false
  });
  const curtain = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, 1.5, 96, 1, true), curtainMat);
  curtain.position.y = 0.75; curtain.renderOrder = 2; cell.add(curtain);
  const scanMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
  const scan = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, 0.012, 96, 1, true), scanMat);
  scan.renderOrder = 3; cell.add(scan);
  const zoneAnchor = new THREE.Object3D(); zoneAnchor.position.set(R * 0.92, 0.02, R * 0.38); cell.add(zoneAnchor);

  /* ---------- the arm ---------- */
  const gltf = await new GLTFLoader().loadAsync(MODEL);
  const arm = gltf.scene;
  arm.position.y = PED_H;
  cell.add(arm);
  arm.updateMatrixWorld(true);

  const node = n => arm.getObjectByName(n);
  const parts = [];
  const byName = {};
  arm.children.slice().forEach(n => {
    n.traverse(c => {
      if (!c.isMesh) return;
      const key = (c.material && c.material.name) || 'white';
      c.material = (M[key] || M.white).clone();
      c.material.userData.base = c.material.color.clone();
      c.material.userData.env = 1;
      c.castShadow = c.receiveShadow = true;
    });
    byName[n.name] = n;
  });

  // wrist camera: the perception head
  const cam = new THREE.Group();
  const housing = mesh(new RoundedBoxGeometry(0.1, 0.03, 0.028, 4, 0.008), M.alu);
  const front = mesh(new RoundedBoxGeometry(0.092, 0.024, 0.004, 3, 0.002), M.glass); front.position.z = 0.0145;
  cam.add(housing, front);
  for (const x of [-0.032, 0.032]) {
    const l = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 32).rotateX(Math.PI / 2), M.lens); l.position.set(x, 0, 0.0165); cam.add(l);
  }
  const ir = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.003, 16).rotateX(Math.PI / 2), M.led); ir.position.set(0.012, 0, 0.0165); cam.add(ir);
  const hand = byName.hand || node('hand');
  if (hand) { hand.add(cam); cam.position.set(0, 0.062, 0.035); cam.rotation.set(-Math.PI / 2, 0, 0); }
  cam.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.userData.base = c.material.color.clone(); c.material.userData.env = 1; } });

  /* parts: each node is moved apart along the kinematic chain, CAD exploded-view style */
  const center = o => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  const chain = ['link1', 'link2', 'link3', 'link4', 'link5', 'link6', 'link7', 'hand'].map(n => byName[n]).filter(Boolean);
  const GAP = 0.085;
  const acc = new THREE.Vector3();
  let prevC = center(byName.link0 || arm);
  const KEY_OF = { link0: null, link1: null, link2: 'wear', link3: 'wear', link4: 'wear', link5: 'wear', link6: 'perception', link7: 'perception', hand: 'perception', left_finger: 'perception', right_finger: 'perception' };
  chain.forEach((n, i) => {
    const c = center(n);
    const d = c.clone().sub(prevC);
    if (d.lengthSq() < 1e-6) d.set(0, 1, 0);
    acc.addScaledVector(d.normalize(), GAP * (i < 2 ? 0.8 : 1));
    prevC = c;
    parts.push({ obj: n, key: KEY_OF[n.name], home: n.position.clone(), off: acc.clone(), order: i + 1 });
  });
  const handPart = parts.find(p => p.obj === hand);
  for (const [n, s] of [['left_finger', 1], ['right_finger', -1]]) {
    const f = byName[n]; if (!f || !handPart) continue;
    const side = new THREE.Vector3(0, s * 0.045, 0).applyQuaternion(f.quaternion);
    parts.push({ obj: f, key: 'perception', home: f.position.clone(), off: handPart.off.clone().add(side).addScaledVector(handPart.off.clone().normalize(), 0.03), order: chain.length + 1 });
  }
  if (byName.link0) parts.push({ obj: byName.link0, key: null, home: byName.link0.position.clone(), off: new THREE.Vector3(0, 0.02, 0), order: 0 });
  parts.push({ obj: cam, key: 'perception', home: cam.position.clone(), off: new THREE.Vector3(0, 0.07, 0), order: chain.length + 1, local: true });
  parts.push({ obj: ctrl, key: 'integration', home: ctrl.position.clone(), off: new THREE.Vector3(-0.28, 0.06, -0.08), order: 3 });
  const N = Math.max(...parts.map(p => p.order)) + 1;
  for (const p of parts) {
    p.x = 0; p.v = 0; p.dim = 1;
    p.tilt = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    p.q0 = p.obj.quaternion.clone();
    p.mats = []; p.obj.traverse(c => { if (c.isMesh && c.material.userData.base) p.mats.push(c.material); });
  }
  const camMats = new Set(); cam.traverse(c => c.isMesh && camMats.add(c.material));
  for (const p of parts) if (p.obj !== cam) p.mats = p.mats.filter(m => !camMats.has(m));

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xdfe6ec, 0x0b0c0d, 0.25));
  const key = new THREE.SpotLight(0xffffff, 36, 0, 0.45, 1, 2);
  key.position.set(1.1, 4.8, 1.6); key.target.position.set(0, 0.6, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.00012; key.shadow.normalBias = 0.012; key.shadow.radius = 6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 9;
  scene.add(key, key.target);
  const rimL = new THREE.SpotLight(0xcfdcff, 24, 0, 0.5, 1, 2); rimL.position.set(-2.6, 2.4, -2.4); rimL.target.position.set(0, 1, 0); scene.add(rimL, rimL.target);
  const rimR = new THREE.SpotLight(0xffe0c4, 14, 0, 0.5, 1, 2); rimR.position.set(2.8, 1.8, -2.2); rimR.target.position.set(0, 0.9, 0); scene.add(rimR, rimR.target);

  let W0 = 1, H0 = 1, mobile = false;

  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  function resize() {
    const r = sticky.getBoundingClientRect();
    W0 = Math.max(1, r.width); H0 = Math.max(1, r.height);
    mobile = W0 < 900;
    if (mobile) dpr = Math.min(dpr, 1.5);
    dpr = Math.min(dpr, Math.sqrt(3.2e6 / (W0 * H0)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(W0, H0, false);
    camera.aspect = W0 / H0;
    camera.fov = camera.aspect < 0.9 ? 34 : 24;
    if (mobile) camera.setViewOffset(W0, H0, 0, H0 * 0.08, W0, H0);
    else camera.setViewOffset(W0, H0, -W0 * 0.16, 0, W0, H0);
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(sticky);

  /* ---------- frame ---------- */
  const tmp = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), look = new THREE.Vector3(0, 0.95, 0), camPos = new THREE.Vector3();
  const focus = new THREE.Vector3(0, 0.95, 0);
  let cur = reduce ? 0.62 : progress(), running = false, visible = false, raf = 0, last = performance.now(), slow = 0, frames = 0, camInit = false;
  const t0 = performance.now();
  const anchors = {
    perception: () => cam.getWorldPosition(tmp).add(new THREE.Vector3(0, 0.06, 0)),
    wear: () => (byName.link4 || arm).getWorldPosition(tmp).add(new THREE.Vector3(0, 0.1, 0)),
    safety: () => zoneAnchor.getWorldPosition(tmp),
    integration: () => ctrl.getWorldPosition(tmp).add(new THREE.Vector3(0, CH + 0.08, 0))
  };
  const ZOOM = { perception: -0.45, wear: -0.2, safety: 0.35, integration: 0 };
  const robotC = new THREE.Vector3();
  const partFocus = {
    perception: () => hand ? hand.getWorldPosition(new THREE.Vector3()) : null,
    wear: () => byName.link3 ? center(byName.link3) : null,
    safety: () => new THREE.Vector3(0, 0.55, 0),
    integration: () => ctrl.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.25, 0))
  };

  function frame(now, forceP, fixedDt, skipRender) {
    raf = 0;
    now = now || performance.now();
    const dt = fixedDt || Math.min(0.05, (now - last) / 1000); last = now;
    const t = (performance.now() - t0) / 1000;
    const p = forceP != null ? forceP : reduce ? 0.62 : progress();
    cur += (p - cur) * (1 - Math.exp(-dt * 7));
    if (forceP != null) cur = forceP;
    if (Math.abs(p - cur) < 0.0004) cur = p;

    const act = reduce ? Math.max(0, [...root.querySelectorAll('.assembly__part')].findIndex(li => li.classList.contains('is-active'))) : activeAt(cur);
    if (!reduce) setActive(act);
    const ak = act >= 0 ? KEYS[act] : null;

    // explode and reassemble in sequence, base first then up the chain
    let eAll = 0;
    for (const q of parts) {
      const s = q.order / N;
      const goal = reduce ? 1 : smooth(0.04 + s * 0.12, 0.15 + s * 0.12, cur) * (1 - smooth(0.86 + (1 - s) * 0.05, 0.93 + (1 - s) * 0.05, cur));
      const lift = q.key && q.key === ak ? 1.22 : 1;
      const k = 90, c = 2 * Math.sqrt(k) * 0.72;
      q.v += (k * (goal * lift - q.x) - c * q.v) * dt; q.x += q.v * dt;
      if (reduce) { q.x = goal; q.v = 0; }
      q.obj.position.copy(q.home).addScaledVector(q.off, q.x);
      const sway = Math.sin(Math.PI * clamp(q.x)) * 0.07;
      tmpQ.setFromAxisAngle(q.tilt, sway);
      q.obj.quaternion.copy(q.q0).premultiply(tmpQ);
      if (!reduce && q.x > 0.5) q.obj.position.y += Math.sin(t * 0.8 + q.order) * 0.004 * q.x;
      eAll += clamp(goal);
      const dGoal = ak && q.key !== ak ? 0.42 : 1;
      q.dim += (dGoal - q.dim) * (1 - Math.exp(-dt * 6));
      for (const m of q.mats) { m.color.copy(m.userData.base).multiplyScalar(q.dim); m.envMapIntensity = 0.35 + 0.65 * q.dim; }
    }
    const e = eAll / parts.length;
    cable.visible = e < 0.04;

    const zoneOn = ak === 'safety' ? 1 : 0;
    zoneMat.opacity += ((0.14 + zoneOn * 0.6) * clamp(e * 1.4) - zoneMat.opacity) * (1 - Math.exp(-dt * 5));
    zoneMat.color.setScalar(1 + zoneOn * 0.25);
    curtainMat.opacity += (zoneOn * 0.22 - curtainMat.opacity) * (1 - Math.exp(-dt * 4));
    curtain.visible = curtainMat.opacity > 0.004;
    const sweep = (t * 0.18) % 1;
    scan.position.y = 0.02 + sweep * 1.2;
    scanMat.opacity = curtainMat.opacity * 2.2 * (1 - sweep);
    scan.visible = curtain.visible;
    M.led.emissiveIntensity = 1.2 + (ak === 'integration' || ak === 'perception' ? 1.6 + Math.sin(t * 4) * 0.4 : 0);

    // camera: slow orbit, frames the whole cell, leans towards the part being explained
    const fGoal = (ak && partFocus[ak]()) || new THREE.Vector3(0, 0.62 + e * 0.32, 0);
    const fMix = ak ? (ak === 'integration' ? 0.22 : 0.38) : 0;
    const base = new THREE.Vector3(-0.05, 0.72 + e * 0.3, 0);
    focus.lerp(base.clone().lerp(fGoal, fMix), 1 - Math.exp(-dt * 3));
    const narrow = camera.aspect < 0.9;
    const dist = (narrow ? 5.2 : 4.7) + e * (narrow ? 1.2 : 1.3) + (ak ? ZOOM[ak] : 0) + (!mobile && W0 < 1300 ? 0.5 : 0);
    const az = THREE.MathUtils.lerp(0.62, -0.42, smooth(0, 1, cur)) + (reduce ? 0 : Math.sin(t * 0.13) * 0.025);
    const el = THREE.MathUtils.lerp(0.1, 0.24, smooth(0.04, 0.55, cur));
    camPos.set(focus.x + dist * Math.cos(el) * Math.sin(az), focus.y + dist * Math.sin(el), focus.z + dist * Math.cos(el) * Math.cos(az));
    if (!camInit) { camera.position.copy(camPos); look.copy(focus); camInit = true; }
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 4));
    look.lerp(focus, 1 - Math.exp(-dt * 4));
    camera.lookAt(look);

    if (skipRender) return;
    renderer.render(scene, camera);
    watchdog(ak);

    robotC.set(0, 0.95, 0).project(camera);
    const midX = (robotC.x + 1) / 2 * W0;
    for (const k of KEYS) {
      const el2 = labels[k]; if (!el2) continue;
      anchors[k]().project(camera);
      const lw = (el2.offsetWidth || 90) + 16;
      const ax = (tmp.x + 1) / 2 * W0;
      const x = clamp(ax < midX - 10 ? ax - lw - 6 : ax + 22, 12, W0 - lw), y = clamp((1 - tmp.y) / 2 * H0, 16, H0 - 16);
      const o = e < 0.45 ? 0 : (e - 0.45) / 0.55 * (ak ? (ak === k ? 1 : 0.35) : 0.85);
      el2.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
      el2.style.opacity = o.toFixed(3);
      el2.classList.toggle('is-active', ak === k);
    }
    if (hint) hint.style.opacity = String(clamp(1 - cur * 14));

    // drop the expensive passes on hardware that can't hold ~30fps
    if (!HQ && ++frames > 20 && frames < 140) { slow += dt > 0.034 ? 1 : 0; if (slow > 40 && dpr > 1) { dpr = 1; resize(); } }

    if (running && !TEST) raf = requestAnimationFrame(frame);
  }
  /* If a driver ever hands back an empty frame, the arm (always white-ish and on screen) reads as background.
     It is sampled a few times after load and after every state change only (readPixels stalls the GPU),
     and three empty checks in a row drop to the lightest pipeline instead of leaving a black panel. */
  const gl = renderer.getContext(), px = new Uint8Array(4), probe = new THREE.Vector3();
  const probes = ['link1', 'link3', 'link5'].map(n => byName[n]).filter(Boolean);
  let since = 0, lastKey, empty = 0, degraded = false;
  function watchdog(ak) {
    if (ak !== lastKey) { lastKey = ak; since = 0; }
    since++;
    if (degraded || (since !== 12 && since !== 40 && since !== 90) || gl.isContextLost()) return;
    let seen = 0, lit = false;
    for (const o of probes) {
      o.getWorldPosition(probe).project(camera);
      if (Math.abs(probe.x) > 0.95 || Math.abs(probe.y) > 0.95 || probe.z > 1) continue;
      seen++;
      gl.readPixels(Math.round((probe.x + 1) / 2 * gl.drawingBufferWidth), Math.round((probe.y + 1) / 2 * gl.drawingBufferHeight), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      if (Math.max(px[0], px[1], px[2]) > 24) lit = true;
    }
    if (!seen || lit) { empty = 0; return; }
    if (++empty < 3) return;
    degraded = true;
    console.warn('[assembly] empty frame detected, switching to the safe render path');
    renderer.shadowMap.enabled = false;
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    dpr = 1; resize();
  }
  function setRunning(on) {
    running = on;
    if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; setRunning(visible && !document.hidden); }, { rootMargin: '100px 0px' }).observe(sticky);
  document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));
  if (reduce) root.addEventListener('click', () => { if (!raf) raf = requestAnimationFrame(frame); });
  // compile every program up front (curtain included) so no state change ever waits on a shader
  frame(0, cur, 1 / 60, true);
  curtain.visible = scan.visible = true;
  if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera).catch(() => renderer.compile(scene, camera));
  else renderer.compile(scene, camera);
  curtain.visible = scan.visible = false;
  // if the GPU drops the context (driver reset, memory pressure), rebuild what lived only on the GPU and resume
  canvas.addEventListener('webglcontextlost', ev => { ev.preventDefault(); cancelAnimationFrame(raf); raf = 0; }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    envTex.dispose(); envTex = studioEnvironment(renderer); scene.environment = envTex;
    resize(); last = performance.now(); frame();
    setRunning(visible && !document.hidden);
  }, false);
  root.classList.add('is-ready');
  if (TEST) window.__asm = { settle(p, n = 300) { for (let i = 0; i < n; i++) frame(0, p, 1 / 60, true); frame(0, p, 1 / 60, false); } };
  frame();
}
