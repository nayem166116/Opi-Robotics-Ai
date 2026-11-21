import * as THREE from '/assets/vendor/three/three.module.min.js';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from '/assets/vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { studioEnvironment, gradientTexture } from '/assets/js/assembly-scene.js';

const BG = 0x060708;
const AMBER = new THREE.Color(0xff8a3d);
const MODEL = '/assets/models/cobot.glb';
const TEST = /[?&]worktest\b/.test(location.search);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* cell layout, metres */
const PED_H = 0.58, BELT_Y = 0.74, BOX = 0.05, BELT_W = 0.3;
const Z_FAR = -4.8, Z_NEAR = 0.45, SPACING = 0.3, BELT_V = 0.28;
const IN_X = 0.56, OUT_X = -0.54;
const PICK = V(IN_X, BELT_Y + BOX / 2, 0.22), PLACE = V(OUT_X, BELT_Y + BOX / 2 + 0.004, 0.28);
const R_SLOW = 1.95, R_STOP = 1.5;
const TCP = 0.095, OPEN = 0.036, CLOSED = BOX / 2 + 0.0008;
const WALK_FROM = V(0.02, 0, -4.6), WALK_TO = V(0.02, 0, -1.42);

function ringTexture(r, color, dashed, fill) {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2, rr = m * 0.96;
  const grd = g.createRadialGradient(m, m, rr * 0.55, m, m, rr);
  grd.addColorStop(0, `rgba(${color},0)`); grd.addColorStop(1, `rgba(${color},${fill})`);
  g.fillStyle = grd; g.beginPath(); g.arc(m, m, rr, 0, Math.PI * 2); g.fill();
  g.strokeStyle = `rgba(${color},1)`; g.lineWidth = 7 * (1.55 / r);
  if (dashed) g.setLineDash([30, 22]);
  g.beginPath(); g.arc(m, m, rr, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function beltTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#17181a'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#26282b'; g.fillRect(0, 0, 64, 9);
  g.fillStyle = '#0e0f10'; g.fillRect(0, 9, 64, 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

/* small dense linear solve for the 6x6 damped least-squares step */
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}

export async function mount({ root, labels, reduce, progress, stateAt, setActive, clamp }) {
  const canvas = root.querySelector('.assembly__canvas');
  const sticky = root.querySelector('.assembly__sticky');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 5.6, 10);
  let envTex = studioEnvironment(renderer);
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 40);

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
    carton: new THREE.MeshStandardMaterial({ color: 0xa47a4e, roughness: 0.86 }),
    tape: new THREE.MeshStandardMaterial({ color: 0xc8a676, roughness: 0.45 }),
    workwear: new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.82 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0x3a4352, roughness: 0.8 }),
    vest: new THREE.MeshStandardMaterial({ color: 0xff7a1f, roughness: 0.6, emissive: 0x3a1500 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xb9b3aa, roughness: 0.6 }),
    hat: new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.32, clearcoat: 0.6 }),
    boot: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 })
  };
  const shadowy = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  const mesh = (g, m) => shadowy(new THREE.Mesh(g, m));

  const cell = new THREE.Group(); scene.add(cell);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x0e0f10, roughness: 0.78 }));
  floor.receiveShadow = true; scene.add(floor);

  const contactTex = gradientTexture([[0, 'rgba(0,0,0,0.85)'], [0.45, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
  const contact = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set(x, 0.001, z); return m;
  };

  /* pedestal */
  const pedestal = new THREE.Group();
  const col = mesh(new RoundedBoxGeometry(0.3, PED_H - 0.03, 0.3, 4, 0.012), M.powder); col.position.y = (PED_H - 0.03) / 2;
  const plate = mesh(new RoundedBoxGeometry(0.36, 0.03, 0.36, 3, 0.006), M.alu); plate.position.y = PED_H - 0.015;
  const foot = mesh(new RoundedBoxGeometry(0.42, 0.02, 0.42, 3, 0.006), M.anod); foot.position.y = 0.01;
  pedestal.add(col, plate, foot);
  cell.add(pedestal, contact(0.9, 0.9, 0, 0));

  /* conveyors: aluminium-extrusion frame, rubber belt, guide rails */
  const belts = [];
  function conveyor(x) {
    const g = new THREE.Group(), L = Z_NEAR - Z_FAR, zc = (Z_NEAR + Z_FAR) / 2;
    const tex = beltTexture(); tex.repeat.set(1, L / 0.045);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(BELT_W, L).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
    top.position.set(0, BELT_Y + 0.0005, zc); top.receiveShadow = true; g.add(top);
    const bed = mesh(new THREE.BoxGeometry(BELT_W, 0.05, L), M.rubber); bed.position.set(0, BELT_Y - 0.025, zc); g.add(bed);
    for (const s of [-1, 1]) {
      const rail = mesh(new RoundedBoxGeometry(0.035, 0.085, L, 2, 0.004), M.alu); rail.position.set(s * (BELT_W / 2 + 0.018), BELT_Y - 0.022, zc); g.add(rail);
      const guide = mesh(new THREE.BoxGeometry(0.008, 0.022, L), M.anod); guide.position.set(s * (BELT_W / 2 - 0.004), BELT_Y + 0.02, zc); g.add(guide);
    }
    const drum = mesh(new THREE.CylinderGeometry(0.03, 0.03, BELT_W + 0.07, 32).rotateZ(Math.PI / 2), M.alu); drum.position.set(0, BELT_Y - 0.03, Z_NEAR); g.add(drum);
    for (let z = Z_NEAR - 0.18; z > Z_FAR; z -= 1.05) {
      for (const s of [-1, 1]) {
        const leg = mesh(new THREE.BoxGeometry(0.04, BELT_Y - 0.06, 0.04), M.anod); leg.position.set(s * (BELT_W / 2 - 0.01), (BELT_Y - 0.06) / 2, z); g.add(leg);
        const pad = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.016, 20), M.rubber); pad.position.set(s * (BELT_W / 2 - 0.01), 0.008, z); g.add(pad);
      }
      const brace = mesh(new THREE.BoxGeometry(BELT_W, 0.035, 0.035), M.anod); brace.position.set(0, 0.2, z); g.add(brace);
    }
    g.position.x = x; cell.add(g);
    cell.add(contact(BELT_W + 0.3, L + 0.3, x, zc));
    belts.push(tex);
    return g;
  }
  const infeed = conveyor(IN_X), outfeed = conveyor(OUT_X);
  // end stop and photo-eye on the infeed
  const stop = mesh(new THREE.BoxGeometry(BELT_W + 0.02, 0.03, 0.014), M.alu); stop.position.set(0, BELT_Y + 0.016, PICK.z + BOX / 2 + 0.008); infeed.add(stop);
  const eye = mesh(new RoundedBoxGeometry(0.03, 0.04, 0.03, 2, 0.004), M.black); eye.position.set(BELT_W / 2 + 0.03, BELT_Y + 0.04, PICK.z); infeed.add(eye);
  const eyeLed = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.006), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: AMBER, emissiveIntensity: 1.5 }));
  eyeLed.position.set(BELT_W / 2 + 0.014, BELT_Y + 0.05, PICK.z); infeed.add(eyeLed);

  /* stack light: green running, amber reduced speed, red hold */
  const tower = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.12, 16), M.alu); pole.position.y = 0.56; tower.add(pole);
  const base = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 24), M.anod); base.position.y = 0.01; tower.add(base);
  const lamp = c => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 0.05, roughness: 0.25 });
  const lamps = [lamp(0x3dff7a), lamp(0xffa21f), lamp(0xff3b2e)];
  lamps.forEach((m, i) => { const s = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.055, 24), m); s.position.y = 1.15 + i * 0.058; tower.add(s); });
  const capT = mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.02, 24), M.black); capT.position.y = 1.15 + 3 * 0.058 - 0.018; tower.add(capT);
  tower.position.set(-0.98, 0, -0.62); cell.add(tower);

  /* safety zones on the floor */
  const zoneMesh = (r, color, dashed, fill) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.08, r * 2.08).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: ringTexture(r, color, dashed, fill), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    m.position.y = 0.002; m.renderOrder = 1; cell.add(m); return m;
  };
  const zoneSlow = zoneMesh(R_SLOW, '255,150,70', true, 0.06), zoneStop = zoneMesh(R_STOP, '255,82,60', false, 0.1);
  zoneStop.position.y = 0.003;

  /* the arm, re-linked into its kinematic chain so each joint turns about its own axis */
  const gltf = await new GLTFLoader().loadAsync(MODEL);
  const arm = gltf.scene; arm.position.y = PED_H; cell.add(arm);
  const by = {}; arm.children.slice().forEach(n => {
    by[n.name] = n;
    n.traverse(c => { if (!c.isMesh) return; const k = (c.material && c.material.name) || 'white'; c.material = M[k] || M.white; c.castShadow = c.receiveShadow = true; });
  });
  arm.updateMatrixWorld(true);
  const chain = ['link0', 'link1', 'link2', 'link3', 'link4', 'link5', 'link6', 'link7', 'hand'].map(n => by[n]);
  for (let i = 1; i < chain.length; i++) chain[i - 1].attach(chain[i]);
  const hand = by.hand, fingers = [by.left_finger, by.right_finger].filter(Boolean);
  fingers.forEach(f => hand.attach(f));
  const joints = chain.slice(1, 8), qBase = joints.map(j => j.quaternion.clone());
  const fing = fingers.map(f => { const p = f.position.clone(), a = V(p.x, p.y, 0); const w = a.length(); a.normalize(); return { f, a, base: p.sub(a.clone().multiplyScalar(w)) }; });
  const rz = new THREE.Quaternion(), Z = V(0, 0, 1);
  const setQ = q => { for (let i = 0; i < 7; i++) joints[i].quaternion.copy(qBase[i]).multiply(rz.setFromAxisAngle(Z, q[i])); arm.updateMatrixWorld(true); };
  const setGrip = w => { for (const g of fing) g.f.position.copy(g.base).addScaledVector(g.a, w); };
  const tcp = (out = V()) => hand.localToWorld(out.set(0, 0, TCP));
  const toolZ = (out = V()) => out.set(0, 0, 1).transformDirection(hand.matrixWorld);

  // damped least squares on position + "tool pointing down", warm-started per waypoint
  function ik(target, q0) {
    const q = q0.slice(), down = V(0, -1, 0), p = V(), z = V(), c = V();
    const err = () => { tcp(p); toolZ(z); c.crossVectors(z, down); return [target.x - p.x, target.y - p.y, target.z - p.z, c.x * 0.4, c.y * 0.4, c.z * 0.4]; };
    for (let it = 0; it < 160; it++) {
      setQ(q); const e = err();
      if (Math.hypot(...e) < 2e-5) break;
      const J = [[], [], [], [], [], []];
      for (let j = 0; j < 7; j++) {
        q[j] += 1e-4; setQ(q); const e2 = err(); q[j] -= 1e-4;
        for (let r = 0; r < 6; r++) J[r][j] = (e[r] - e2[r]) / 1e-4;
      }
      const A = J.map(r => J.map(s => r.reduce((a, v, k) => a + v * s[k], 0)));
      for (let r = 0; r < 6; r++) A[r][r] += 0.0025;
      const y = solve(A, e);
      for (let j = 0; j < 7; j++) q[j] += clamp(J.reduce((a, r, k) => a + r[j] * y[k], 0), -0.15, 0.15);
      q[0] = clamp(q[0], -2.85, 2.85);
    }
    return q;
  }
  const z7 = [0, 0, 0, 0, 0, 0, 0];
  const Q = {};
  Q.A = ik(PICK.clone().add(V(0, 0.16, 0)), [-0.37, ...z7.slice(1)]);
  Q.B = ik(PICK, Q.A);
  Q.L = ik(PICK.clone().add(V(0, 0.07, 0)), Q.B);
  Q.C = ik(PLACE.clone().add(V(0, 0.16, 0)), [-2.6, ...z7.slice(1)]);
  Q.D = ik(PLACE, Q.C);
  setQ(Q.A); setGrip(OPEN);

  /* cartons */
  const cartonGeo = new RoundedBoxGeometry(BOX, BOX, BOX, 2, 0.003), tapeGeo = new THREE.BoxGeometry(BOX * 0.32, 0.0015, BOX + 0.0006);
  const pool = [];
  const carton = () => { const g = pool.pop() || (() => { const o = new THREE.Group(); o.add(mesh(cartonGeo, M.carton)); const t = mesh(tapeGeo, M.tape); t.position.y = BOX / 2; o.add(t); return o; })(); g.visible = true; g.rotation.set(0, 0, 0); cell.add(g); return g; };
  const recycle = g => { g.visible = false; cell.remove(g); pool.push(g); };
  const queue = [], outs = [];
  for (let z = PICK.z; z > Z_FAR + 0.2; z -= SPACING) { const c = carton(); c.position.set(IN_X, PICK.y, z); queue.push(c); }
  let held = null, slipping = null, falling = null;

  /* person */
  const person = new THREE.Group(), P = {};
  {
    const cap = (r, l, m) => mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m);
    const pivot = (x, y, z, parent) => { const o = new THREE.Group(); o.position.set(x, y, z); parent.add(o); return o; };
    const body = pivot(0, 0, 0, person); P.body = body;
    const pelvis = cap(0.115, 0.08, M.workwear); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 1, 0.75); pelvis.position.y = 0.96; body.add(pelvis);
    const torso = cap(0.15, 0.34, M.shirt); torso.scale.set(1, 1, 0.62); torso.position.y = 1.26; body.add(torso);
    const vest = cap(0.157, 0.26, M.vest); vest.scale.set(1, 1, 0.66); vest.position.y = 1.23; body.add(vest);
    const neck = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), M.skin); neck.position.y = 1.52; body.add(neck);
    const head = mesh(new THREE.SphereGeometry(0.098, 24, 18), M.skin); head.scale.set(0.92, 1.05, 1); head.position.y = 1.63; body.add(head);
    const hat = mesh(new THREE.SphereGeometry(0.112, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.hat); hat.position.y = 1.665; body.add(hat);
    const brim = mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.008, 24), M.hat); brim.position.set(0, 1.668, 0.02); brim.scale.set(1, 1, 1.08); body.add(brim);
    P.legs = [-1, 1].map(s => {
      const hip = pivot(s * 0.085, 0.94, 0, body);
      const thigh = cap(0.064, 0.32, M.workwear); thigh.position.y = -0.2; hip.add(thigh);
      const knee = pivot(0, -0.43, 0, hip);
      const shin = cap(0.052, 0.34, M.workwear); shin.position.y = -0.2; knee.add(shin);
      const boot = mesh(new RoundedBoxGeometry(0.1, 0.07, 0.25, 2, 0.02), M.boot); boot.position.set(0, -0.44, 0.04); knee.add(boot);
      return { hip, knee };
    });
    P.arms = [-1, 1].map(s => {
      const sh = pivot(s * 0.2, 1.42, 0, body);
      const up = cap(0.046, 0.24, M.shirt); up.position.y = -0.16; sh.add(up);
      const el = pivot(0, -0.31, 0, sh);
      const fo = cap(0.04, 0.22, M.shirt); fo.position.y = -0.14; el.add(fo);
      const hd = mesh(new THREE.SphereGeometry(0.045, 14, 10), M.skin); hd.position.y = -0.3; el.add(hd);
      return { sh, el };
    });
    const shade = contact(0.6, 0.6, 0, 0); person.add(shade);
  }
  person.visible = false; scene.add(person);
  let pMode = 'off', pWait = 0, pPhase = 0, pAmp = 0, pHeld = false;
  person.position.copy(WALK_FROM);
  function walkPose(dt, moving) {
    pAmp += ((moving ? 1 : 0) - pAmp) * (1 - Math.exp(-dt * 6));
    const s = Math.sin(pPhase), c = Math.cos(pPhase);
    P.legs[0].hip.rotation.x = s * 0.42 * pAmp; P.legs[1].hip.rotation.x = -s * 0.42 * pAmp;
    P.legs[0].knee.rotation.x = Math.max(0, c) * 0.62 * pAmp + 0.03; P.legs[1].knee.rotation.x = Math.max(0, -c) * 0.62 * pAmp + 0.03;
    P.arms[0].sh.rotation.x = -s * 0.32 * pAmp; P.arms[1].sh.rotation.x = s * 0.32 * pAmp;
    P.arms.forEach(a => { a.el.rotation.x = -0.18 - 0.12 * pAmp; a.sh.rotation.z = 0; });
    P.arms[0].sh.rotation.z = -0.05; P.arms[1].sh.rotation.z = 0.05;
    P.body.position.y = -Math.abs(Math.cos(pPhase)) * 0.022 * pAmp;
  }
  const tmpV = V();
  function stepPerson(dt, active) {
    if (pMode === 'off') { if (!active) return; pMode = 'in'; person.position.copy(WALK_FROM); person.visible = true; }
    if (!active && pMode !== 'out') pMode = 'out';
    const goal = pMode === 'out' ? WALK_FROM : WALK_TO;
    let moving = false;
    if (pMode === 'stand') { pWait += dt; if (pWait > 3.4) pMode = 'out'; }
    else {
      tmpV.subVectors(goal, person.position); tmpV.y = 0;
      const d = tmpV.length(), step = Math.min(d, 0.62 * dt);
      const yaw = Math.atan2(tmpV.x, tmpV.z);
      let dy = ((yaw - person.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      person.rotation.y += dy * (1 - Math.exp(-dt * 5));
      if (Math.abs(dy) < 1.2 && d > 1e-3) { person.position.addScaledVector(tmpV.normalize(), step); pPhase += step / 0.7 * Math.PI; moving = true; }
      else if (d > 1e-3) moving = true;
      if (d < 0.01) {
        if (pMode === 'in') { pMode = 'stand'; pWait = 0; }
        else { pMode = 'off'; person.visible = false; pHeld = false; }
      }
    }
    walkPose(dt, moving && pMode !== 'stand');
  }

  /* robot cycle */
  const seg = (a, b, d, o = {}) => ({ a, b, d, ...o });
  const tail = [
    seg('B', 'A', 0.55, { on: 'attach' }), seg('A', 'C', 1.6), seg('C', 'D', 0.55),
    seg('D', 'D', 0.25, { on: 'detach', f0: CLOSED, f1: OPEN }), seg('D', 'C', 0.45), seg('C', 'A', 1.5)
  ];
  const NORMAL = [seg('A', 'B', 0.7), seg('B', 'B', 0.3, { f0: OPEN, f1: CLOSED }), ...tail];
  const RETRY = [seg('A', 'B', 0.7), seg('B', 'B', 0.3, { f0: OPEN, f1: CLOSED }),
    seg('B', 'L', 0.45, { on: 'slip', fail: true, f0: CLOSED, f1: CLOSED }), seg('L', 'L', 0.4, { fail: true, f0: CLOSED, f1: OPEN }),
    seg('L', 'B', 0.6, { fail: true, replan: true }), seg('B', 'B', 0.3, { f0: OPEN, f1: CLOSED }), ...tail];
  let cyc = NORMAL, ci = 0, cu = 0, lastRetry = false, missOn = 0, logT = -1, simT = 0;
  const ease = u => u * u * u * (u * (u * 6 - 15) + 10);
  const qNow = new Array(7).fill(0);
  let state = 0;
  function enter(s) {
    if (s.on === 'attach') { held = queue.shift(); hand.attach(held); }
    if (s.on === 'slip') { slipping = queue[0]; hand.attach(slipping); }
    if (s.on === 'detach' && held) {
      cell.attach(held); held.rotation.set(0, held.rotation.y, 0); held.position.y = PLACE.y - 0.004; outs.push(held); held = null;
      if (cyc === RETRY) logT = simT;
    }
  }
  function stepRobot(dt) {
    let rem = dt;
    while (rem > 0) {
      if (ci === 0 && cu === 0 && !(queue[0] && Math.abs(queue[0].position.z - PICK.z) < 1e-3 && !falling)) break;
      const s = cyc[ci], left = s.d - cu;
      if (rem < left) { cu += rem; rem = 0; break; }
      rem -= left; ci++; cu = 0;
      if (ci >= cyc.length) {
        ci = 0; missOn = 0;
        lastRetry = cyc === RETRY;
        cyc = state === 2 && !lastRetry ? RETRY : NORMAL;
      }
      enter(cyc[ci]);
    }
    const s = cyc[ci], u = s.d ? cu / s.d : 0, e = ease(u);
    for (let j = 0; j < 7; j++) qNow[j] = Q[s.a][j] + (Q[s.b][j] - Q[s.a][j]) * e;
    setQ(qNow);
    setGrip(s.f0 != null ? s.f0 + (s.f1 - s.f0) * e : held ? CLOSED : OPEN);
    if (slipping && s.on === 'slip' && u > 0.32) { cell.attach(slipping); slipping.rotation.set(0, slipping.rotation.y, 0); falling = slipping; falling.vy = 0; slipping = null; missOn = 1; }
    return s;
  }
  function stepCartons(dt) {
    const d = BELT_V * dt;
    belts[0].offset.y += d / 0.045; belts[1].offset.y -= d / 0.045;
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i]; if (c === slipping || c === falling) continue;
      const limit = i === 0 ? PICK.z : queue[i - 1].position.z - SPACING;
      c.position.z = Math.min(limit, c.position.z + d);
    }
    const last = queue[queue.length - 1];
    if (!last || last.position.z > Z_FAR + 0.2 + SPACING) { const c = carton(); c.position.set(IN_X, PICK.y, Z_FAR + 0.2); queue.push(c); }
    for (let i = outs.length - 1; i >= 0; i--) { outs[i].position.z -= d; if (outs[i].position.z < Z_FAR + 0.15) recycle(outs.splice(i, 1)[0]); }
    if (falling) {
      falling.vy -= 9.8 * dt; falling.position.y += falling.vy * dt;
      if (falling.position.y <= PICK.y) { falling.position.y = PICK.y; falling = null; }
    }
  }

  /* trail of the tool tip, drawn as a camera-facing ribbon */
  const TN = 180, trail = [], tCol = [];
  const tGeo = new THREE.BufferGeometry();
  const tPos = new Float32Array(TN * 2 * 3), tClr = new Float32Array(TN * 2 * 3), idx = [];
  for (let i = 0; i < TN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  tGeo.setIndex(idx);
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
  tGeo.setAttribute('color', new THREE.BufferAttribute(tClr, 3).setUsage(THREE.DynamicDrawUsage));
  const ribbon = new THREE.Mesh(tGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
  ribbon.frustumCulled = false; ribbon.renderOrder = 4; cell.add(ribbon);
  const OK = new THREE.Color(0x9fd0ff), BAD = new THREE.Color(0xff8a3d);
  const tp = V(), side = V(), tang = V(), view = V();
  function stepTrail(s, w) {
    tcp(tp);
    const lastP = trail[trail.length - 1];
    if (!lastP || lastP.distanceToSquared(tp) > 4e-6) {
      trail.push(tp.clone()); tCol.push(s.fail ? BAD : OK);
      if (trail.length > TN) { trail.shift(); tCol.shift(); }
    }
    const n = trail.length;
    for (let i = 0; i < TN; i++) {
      const k = Math.min(i, n - 1), p = trail[Math.max(0, k)];
      if (!p) { tPos.fill(0); break; }
      tang.subVectors(trail[Math.min(n - 1, k + 1)], trail[Math.max(0, k - 1)]);
      view.subVectors(camera.position, p);
      side.crossVectors(tang, view).normalize().multiplyScalar(0.0035);
      if (!isFinite(side.x)) side.set(0, 0, 0);
      tPos.set([p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z], i * 6);
      const a = i < n ? Math.pow(k / Math.max(1, n - 1), 1.6) * w : 0, c = tCol[k] || OK;
      tClr.set([c.r * a, c.g * a, c.b * a, c.r * a, c.g * a, c.b * a], i * 6);
    }
    tGeo.attributes.position.needsUpdate = true; tGeo.attributes.color.needsUpdate = true;
    ribbon.visible = w > 0.003;
  }

  /* lights */
  scene.add(new THREE.HemisphereLight(0xdfe6ec, 0x0b0c0d, 0.25));
  const key = new THREE.SpotLight(0xffffff, 40, 0, 0.52, 1, 2);
  key.position.set(1.1, 4.8, 1.6); key.target.position.set(0, 0.6, -0.1);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.00012; key.shadow.normalBias = 0.012;
  key.shadow.camera.near = 1; key.shadow.camera.far = 10;
  scene.add(key, key.target);
  const rimL = new THREE.SpotLight(0xcfdcff, 24, 0, 0.55, 1, 2); rimL.position.set(-2.6, 2.4, -2.4); rimL.target.position.set(0, 1, 0); scene.add(rimL, rimL.target);
  const rimR = new THREE.SpotLight(0xffe0c4, 16, 0, 0.55, 1, 2); rimR.position.set(2.8, 1.8, -2.2); rimR.target.position.set(0.5, 0.9, 0); scene.add(rimR, rimR.target);

  /* camera: fixed, like the Home section */
  let W0 = 1, H0 = 1, mobile = false, dpr = Math.min(devicePixelRatio || 1, 1.5);
  function resize() {
    const r = sticky.getBoundingClientRect();
    W0 = Math.max(1, r.width); H0 = Math.max(1, r.height); mobile = W0 < 900;
    dpr = Math.min(dpr, Math.sqrt(3.2e6 / (W0 * H0)));
    renderer.setPixelRatio(dpr); renderer.setSize(W0, H0, false);
    camera.aspect = W0 / H0;
    camera.fov = camera.aspect < 0.9 ? 34 : 24;
    if (mobile) camera.setViewOffset(W0, H0, 0, H0 * 0.16, W0, H0);
    else camera.setViewOffset(W0, H0, -W0 * 0.17, 0, W0, H0);
    camera.updateProjectionMatrix();
    const narrow = camera.aspect < 0.9;
    const dist = narrow ? clamp(3.1 / camera.aspect, 5.2, 7.5) : 4.8 + (W0 < 1300 ? 0.5 : 0);
    const focus = V(0.02, 0.95, -0.45), az = 0.14, el = 0.2;
    camera.position.set(focus.x + dist * Math.cos(el) * Math.sin(az), focus.y + dist * Math.sin(el), focus.z + dist * Math.cos(el) * Math.cos(az));
    camera.lookAt(focus);
  }
  resize();
  new ResizeObserver(resize).observe(sticky);

  /* frame */
  const sw = [1, 0, 0], ap = V();
  let speed = 1, running = false, visible = false, raf = 0, last = performance.now(), personLabel = '';
  const anchors = {
    infeed: () => ap.set(IN_X, BELT_Y + 0.06, -1.0),
    outfeed: () => ap.set(OUT_X, BELT_Y + 0.06, -1.0),
    person: () => person.getWorldPosition(ap).add(V(0, 1.86, 0)),
    miss: () => ap.copy(PICK).add(V(0, 0.09, 0)),
    log: () => ap.copy(PLACE).add(V(0, 0.1, 0))
  };
  const setLamp = i => lamps.forEach((m, k) => { m.emissiveIntensity += ((k === i ? 2.6 : 0.05) - m.emissiveIntensity) * 0.25; });

  function frame(now, fixedDt, skipRender) {
    raf = 0;
    now = now || performance.now();
    const dt = fixedDt || Math.min(0.05, (now - last) / 1000); last = now;
    state = stateAt(progress());
    setActive(state);
    for (let i = 0; i < 3; i++) sw[i] += ((i === state ? 1 : 0) - sw[i]) * (1 - Math.exp(-dt * 4));

    stepPerson(dt, state === 1);
    let target = 1;
    if (person.visible) {
      const d = Math.hypot(person.position.x, person.position.z);
      target = d < R_STOP ? 0 : d < R_SLOW ? 0.3 : 1;
      if (target === 0) pHeld = true;
    }
    speed += (target - speed) * (1 - Math.exp(-dt * (target < speed ? 7 : 2.5)));
    if (speed < 0.004 && target === 0) speed = 0;
    const sdt = dt * speed; simT += sdt;
    const s = stepRobot(sdt);
    stepCartons(sdt);
    stepTrail(s, sw[2]);

    const z1 = sw[1];
    zoneSlow.material.opacity = z1 * (target < 1 ? 0.95 : 0.45);
    zoneStop.material.opacity = z1 * (target === 0 ? 0.6 + Math.sin(now / 180) * 0.25 : 0.28);
    zoneSlow.visible = zoneStop.visible = z1 > 0.003;
    setLamp(target === 0 ? 2 : target < 1 ? 1 : 0);
    personLabel = target === 0 ? 'Supervised hold' : target < 1 ? (pHeld && pMode === 'out' ? 'Resuming' : 'Reduced speed') : (pHeld ? 'Resuming' : '');

    if (skipRender) return;
    renderer.render(scene, camera);

    const show = {
      infeed: sw[0] * 0.85, outfeed: sw[0] * 0.85,
      person: person.visible && personLabel ? sw[1] : 0,
      miss: missOn ? sw[2] : 0,
      log: logT >= 0 && simT - logT < 2.6 ? sw[2] : 0
    };
    for (const k in labels) {
      const el = labels[k];
      if (k === 'person' && personLabel && el.textContent !== personLabel) el.textContent = personLabel;
      anchors[k]().project(camera);
      const lw = el.offsetWidth || 90;
      const ax = (ap.x + 1) / 2 * W0, ay = (1 - ap.y) / 2 * H0;
      const x = clamp(ax - lw / 2, 12, W0 - lw - 12), y = clamp(ay, 16, H0 - 16);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-100%)`;
      el.style.opacity = show[k].toFixed(3);
      el.classList.toggle('is-active', k === 'miss' || (k === 'person' && target === 0));
    }
    if (running && !TEST && !reduce) raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    running = on;
    if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  // reduced motion: no loop; play the chosen behaviour forward off-screen and show one still frame
  function still() {
    const n = state === 1 ? 320 : 480;
    for (let i = 0; i < n; i++) frame(0, 1 / 60, true);
    frame(0, 1 / 60, false);
  }
  if (reduce) root.addEventListener('work:state', () => { state = stateAt(0); still(); });
  else {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; setRunning(visible && !document.hidden); }, { rootMargin: '100px 0px' }).observe(sticky);
    document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));
  }
  frame(0, 1 / 60, true);
  if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera).catch(() => renderer.compile(scene, camera));
  canvas.addEventListener('webglcontextlost', ev => { ev.preventDefault(); cancelAnimationFrame(raf); raf = 0; }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    envTex.dispose(); envTex = studioEnvironment(renderer); scene.environment = envTex;
    resize(); last = performance.now(); frame();
    setRunning(visible && !document.hidden);
  }, false);
  root.classList.add('is-ready');
  if (TEST) window.__work = { run(sec, dt = 1 / 60) { for (let t = 0; t < sec; t += dt) frame(0, dt, true); frame(0, dt, false); }, Q, speed: () => speed };
  if (reduce) still(); else frame();
}
