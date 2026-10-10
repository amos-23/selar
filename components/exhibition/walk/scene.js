import * as THREE from "three";
import { DIMS, archZs, standPoint, roomIndexAt } from "./layout.js";
import { THEMES, makeCanvas, drawPanel, drawLobbyPanel, drawClosing, drawSign, glowTexture, floorTexture } from "./textures.js";

const D = DIMS;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const shortestAngle = (from, to) => { let d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function gearGeometry(r, teeth, depth, hole, thickness) {
  const pts = [], step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [[a, r], [a + step * 0.18, r + depth], [a + step * 0.5 - step * 0.18, r + depth], [a + step * 0.5, r]].forEach(([ang, rad]) => pts.push(new THREE.Vector2(Math.cos(ang) * rad, Math.sin(ang) * rad)));
  }
  const shape = new THREE.Shape(pts);
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); shape.holes.push(h);
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
}

async function loadFonts() {
  if (!document.fonts?.load) return;
  const t = new Promise((r) => setTimeout(r, 1200));
  await Promise.race([Promise.all([document.fonts.load('600 40px Parkinsans'), document.fonts.load('700 40px Parkinsans'), document.fonts.load('400 24px "Google Sans Flex"'), document.fonts.load('500 24px "Google Sans Flex"')]).catch(() => {}), t]);
}

export async function createWalk({ canvas, layout, statement, reducedMotion = false, lowPower = false, onRoom = () => {}, onSelect = () => {}, onLost = () => {} }) {
  await loadFonts();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: "high-performance" });
  renderer.setClearColor(0x2d0025);
  const maxPR = lowPower ? 1.5 : 2;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2d0025, 20, 50);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 90);
  camera.rotation.order = "YXZ";

  // three.js lights are physical: ambient light is divided by pi in the diffuse BRDF, so ~pi gives "full" wall colour.
  scene.add(new THREE.AmbientLight(0xffffff, 2.75));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a2a44, 0.7));

  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const basic = (color, extra = {}) => track(new THREE.MeshBasicMaterial({ color, ...extra }));
  const lambert = (color) => track(new THREE.MeshLambertMaterial({ color }));
  const addBox = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat); m.position.set(x, y, z); scene.add(m); return m; };
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const canvasTex = (c) => { const t = track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; };
  const TW = lowPower ? 512 : 768; // panel texture width
  const TH = Math.round((TW * 540) / 768);

  const length = layout.zFront - layout.zEnd;
  const midZ = (layout.zFront + layout.zEnd) / 2;
  const innerX = D.wallX + 0.05;

  // ----- floor, ceiling, end walls, light strips
  const ftex = canvasTex(floorTexture()); ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping; ftex.repeat.set(innerX * 2 / 2.4, length / 2.4);
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(innerX * 2, length)), track(new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.32, metalness: 0.12 })));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, midZ); scene.add(floor);
  const ceil = new THREE.Mesh(track(new THREE.PlaneGeometry(innerX * 2, length)), basic(0x1b0016));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, D.height, midZ); scene.add(ceil);
  const stripMat = basic(0xfff3fb);
  for (let z = layout.zFront - 2; z > layout.zEnd + 1; z -= 4.2) { addBox(0.22, 0.05, 2.6, stripMat, -1.7, D.height - 0.03, z); addBox(0.22, 0.05, 2.6, stripMat, 1.7, D.height - 0.03, z); }
  addBox(innerX * 2 + 0.6, D.height, 0.2, lambert(new THREE.Color(THEMES.deep.wall)), 0, D.height / 2, layout.zFront + 0.1);
  const lastTheme = THEMES[layout.rooms.at(-1).theme] ?? THEMES.deep;
  addBox(innerX * 2 + 0.6, D.height, 0.2, lambert(new THREE.Color(lastTheme.wall)), 0, D.height / 2, layout.zEnd - 0.1);

  // chevrons on the floor point the way forward
  const chev = makeCanvas(128, 128), cx = chev.getContext("2d");
  cx.strokeStyle = "rgba(255,214,31,.9)"; cx.lineWidth = 16; cx.lineCap = "round"; cx.lineJoin = "round"; cx.beginPath(); cx.moveTo(24, 92); cx.lineTo(64, 40); cx.lineTo(104, 92); cx.stroke();
  const chevMat = basic(0xffffff, { map: canvasTex(chev), transparent: true, opacity: 0.35, depthWrite: false });
  const chevGeo = track(new THREE.PlaneGeometry(0.9, 0.9));
  for (let z = layout.zFront - 6; z > layout.zEnd + 4; z -= 5) { const c = new THREE.Mesh(chevGeo, chevMat); c.rotation.x = -Math.PI / 2; c.position.set(0, 0.012, z); scene.add(c); }

  // ----- rooms: walls, baseboards, arches, signs
  const pickables = [];
  const panels = new Map();
  const glowTex = canvasTex(glowTexture());
  const frameDark = basic(0xffd61f), framePurple = basic(0x5a0b4d);

  for (const room of layout.rooms) {
    const T = THEMES[room.theme] ?? THEMES.deep;
    const len = room.zStart - room.zEnd, cz = (room.zStart + room.zEnd) / 2;
    const wallMat = lambert(new THREE.Color(T.wall));
    for (const sx of [-1, 1]) {
      addBox(0.2, D.height, len, wallMat, sx * (innerX + 0.1), D.height / 2, cz);
      addBox(0.12, 0.16, len, basic(new THREE.Color(T.base)), sx * (innerX - 0.04), 0.08, cz);
    }
    if (room.archZ !== null) {
      const z = room.archZ, fin = innerX - D.archOpening / 2;
      const finMat = lambert(new THREE.Color(0x2d0025)), edge = basic(0xffd61f);
      for (const sx of [-1, 1]) {
        addBox(fin, D.height, D.archDepth, finMat, sx * (D.archOpening / 2 + fin / 2), D.height / 2, z);
        addBox(0.07, D.archY, D.archDepth + 0.02, edge, sx * (D.archOpening / 2), D.archY / 2, z);
      }
      addBox(D.archOpening + 0.14, D.height - D.archY, D.archDepth, finMat, 0, (D.archY + D.height) / 2, z);
      addBox(D.archOpening + 0.14, 0.07, D.archDepth + 0.02, edge, 0, D.archY, z);
      const sc = makeCanvas(TW * 1.33, TW * 0.333); drawSign(sc, room.number, room.title, room.theme);
      const signMat = basic(0xffffff, { map: canvasTex(sc) });
      const sg = track(new THREE.PlaneGeometry(D.archOpening, D.archOpening / 4));
      const sf = new THREE.Mesh(sg, signMat); sf.position.set(0, (D.archY + D.height) / 2, z + D.archDepth / 2 + 0.012); scene.add(sf);
      const sb = new THREE.Mesh(sg, signMat); sb.rotation.y = Math.PI; sb.position.set(0, (D.archY + D.height) / 2, z - D.archDepth / 2 - 0.012); scene.add(sb);
    }

    const darkRoom = room.theme === "deep" || room.theme === "purple";
    const place = (item, kind) => {
      const isWide = item.w > D.panelW + 0.01;
      const w = item.w, h = item.h;
      const y = isWide ? h / 2 + 0.85 : D.panelY;
      const c = makeCanvas(isWide ? Math.round(TW * (item.side === "end" ? 1.67 : 1.25)) : TW, isWide ? Math.round(TW * (item.side === "end" ? 0.68 : 0.87)) : TH);
      if (item.kind === "lobby-title" || item.kind === "lobby-intro") drawLobbyPanel(c, item, statement);
      else if (item.kind === "closing") drawClosing(c, item.text);
      else drawPanel(c, kind === "header" ? { ...item, kind: "header" } : item, room.theme);
      const mat = basic(0xffffff, { map: canvasTex(c) });
      const mesh = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), mat);
      mesh.position.set(item.x, y, item.z); mesh.rotation.y = item.rotY;
      mesh.userData = { id: item.id, kind: item.kind ?? kind, panel: item, y };
      scene.add(mesh); pickables.push(mesh); panels.set(item.id, mesh);
      // frame behind the panel
      const frame = new THREE.Mesh(track(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.06)), item.side === "end" ? frameDark : darkRoom ? frameDark : framePurple);
      frame.position.set(item.x, y, item.z); frame.rotation.y = item.rotY;
      const toward = item.side === "left" ? -1 : item.side === "right" ? 1 : 0;
      frame.position.x += toward * 0.04; if (item.side === "end") frame.position.z -= 0.04;
      scene.add(frame);
      // soft wash of light on the wall around it
      if (item.side !== "end") {
        const glow = new THREE.Mesh(track(new THREE.PlaneGeometry(w * 2.1, h * 2.3)), basic(new THREE.Color(T.glow), { map: glowTex, transparent: true, opacity: darkRoom ? 0.3 : 0.45, depthWrite: false, blending: darkRoom ? THREE.AdditiveBlending : THREE.NormalBlending }));
        glow.position.set(item.x + toward * 0.03, y, item.z); glow.rotation.y = item.rotY; scene.add(glow);
      }
      if (item.kind === "media" && item.src) {
        new THREE.TextureLoader().setCrossOrigin("anonymous").load(item.src, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso; track(tex);
          const ia = tex.image.width / tex.image.height, pa = w / h;
          if (ia > pa) { tex.repeat.set(pa / ia, 1); tex.offset.set((1 - pa / ia) / 2, 0); } else { tex.repeat.set(1, ia / pa); tex.offset.set(0, (1 - ia / pa) / 2); }
          mat.map = tex; mat.needsUpdate = true; dirty = true;
        });
      }
    };
    for (const h of room.headers) place({ ...h, kind: "header" }, "header");
    for (const it of room.items) place(it, it.kind);
  }

  // ----- lobby gear reliefs (decorative)
  const gearMats = [track(new THREE.MeshLambertMaterial({ color: 0xffd61f })), track(new THREE.MeshLambertMaterial({ color: 0xffe4fb })), track(new THREE.MeshLambertMaterial({ color: 0x8a2a78 }))];
  const gears = [];
  for (const sx of [-1, 1]) {
    const specs = [{ r: 1.25, t: 16, z: -9.0, y: 2.2, mat: 0, dir: 1 }, { r: 0.72, t: 9, z: -11.35, y: 3.0, mat: 1, dir: -1 }, { r: 0.55, t: 7, z: -7.1, y: 3.35, mat: 2, dir: -1 }];
    for (const g of specs) {
      const geo = track(gearGeometry(g.r, g.t, 0.2, g.r * 0.28, 0.16));
      const mesh = new THREE.Mesh(geo, gearMats[g.mat]);
      const pivot = new THREE.Group(); pivot.position.set(sx * (innerX - 0.04), g.y, g.z); pivot.rotation.y = sx === -1 ? Math.PI / 2 : -Math.PI / 2;
      pivot.add(mesh); scene.add(pivot);
      gears.push({ mesh, speed: (0.5 / g.r) * g.dir * (sx === -1 ? 1 : -1) });
    }
  }

  // ----- camera state and input
  const st = { x: layout.rooms[0].camera.x, z: layout.rooms[0].camera.z, yaw: 0, pitch: 0 };
  let glide = null, dirty = true, disposed = false, lastRoom = -1, hovered = null, kbEnabled = true;
  let vf = 0, vs = 0, inset = { right: 0, bottom: 0 };
  const keys = Object.create(null), hold = Object.create(null);
  const archs = archZs(layout);
  let viewW = 1, viewH = 1;

  function applyCamera() { camera.position.set(st.x, D.eye, st.z); camera.rotation.set(st.pitch, st.yaw, 0); }
  function fovFor(aspect) { const h = (80 * Math.PI) / 180; return clamp((2 * Math.atan(Math.tan(h / 2) / Math.max(aspect, 0.3)) * 180) / Math.PI, 58, 100); }
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; viewW = w; viewH = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPR));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = fovFor(w / h);
    camera.updateProjectionMatrix(); applyInset(); dirty = true;
  }
  function applyInset() {
    if (inset.right || inset.bottom) camera.setViewOffset(viewW, viewH, inset.right / 2, inset.bottom / 2, viewW, viewH); else camera.clearViewOffset();
    dirty = true;
  }

  function startGlide(to, { instant = false, fast = false } = {}) {
    const target = { x: to.x, z: to.z, yaw: st.yaw + shortestAngle(st.yaw, to.yaw ?? 0), pitch: to.pitch ?? 0 };
    if (instant || reducedMotion) { Object.assign(st, target); glide = null; clampPosition(); applyCamera(); dirty = true; return Promise.resolve(); }
    const dist = Math.hypot(target.x - st.x, target.z - st.z);
    const dur = clamp(dist * (fast ? 0.12 : 0.2) + 0.45, 0.6, 2.6) * 1000;
    return new Promise((resolve) => { glide = { from: { ...st }, to: target, t0: performance.now(), dur, resolve }; dirty = true; });
  }
  function cancelGlide() { if (glide) { glide.resolve(); glide = null; } }

  function clampPosition() {
    st.x = clamp(st.x, -(D.wallX - 0.7), D.wallX - 0.7);
    st.z = clamp(st.z, layout.zEnd + 0.9, layout.zFront - 0.9);
    for (const az of archs) if (Math.abs(st.z - az) < D.archDepth / 2 + 0.35) st.x = clamp(st.x, -(D.archOpening / 2 - 0.3), D.archOpening / 2 - 0.3);
  }

  let last = performance.now(), raf = 0;
  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    let moved = false;

    const f = (keys.w || keys.arrowup || hold.fwd ? 1 : 0) - (keys.s || keys.arrowdown || hold.back ? 1 : 0);
    const s = (keys.d || hold.right ? 1 : 0) - (keys.a || hold.left ? 1 : 0);
    const turn = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0);
    if (glide && (f || s || turn)) cancelGlide(); // walking takes over from a glide

    if (glide) {
      const t = clamp((now - glide.t0) / glide.dur, 0, 1), e = easeInOut(t);
      st.x = glide.from.x + (glide.to.x - glide.from.x) * e;
      st.z = glide.from.z + (glide.to.z - glide.from.z) * e;
      st.yaw = glide.from.yaw + (glide.to.yaw - glide.from.yaw) * e;
      st.pitch = glide.from.pitch + (glide.to.pitch - glide.from.pitch) * e;
      moved = true;
      if (t >= 1) { const r = glide.resolve; glide = null; r(); }
    } else {
      const speed = keys.shift ? 5.6 : 3.1;
      vf += (f * speed - vf) * Math.min(1, dt * 7);
      vs += (s * speed - vs) * Math.min(1, dt * 7);
      if (turn) { st.yaw -= turn * 1.7 * dt; moved = true; }
      if (Math.abs(vf) > 0.01 || Math.abs(vs) > 0.01) {
        st.x += (-Math.sin(st.yaw) * vf + Math.cos(st.yaw) * vs) * dt;
        st.z += (-Math.cos(st.yaw) * vf - Math.sin(st.yaw) * vs) * dt;
        moved = true; userMoved();
      } else { vf = vs = 0; }
    }
    if (moved) { clampPosition(); applyCamera(); dirty = true; }

    const idx = roomIndexAt(layout, st.z);
    if (idx !== lastRoom) { lastRoom = idx; onRoom(idx); }

    let spin = false;
    if (!reducedMotion && st.z > layout.rooms[1].zStart - 8) { for (const g of gears) g.mesh.rotation.z += g.speed * dt; spin = true; }
    if (dirty || spin) { renderer.render(scene, camera); dirty = false; }
  }
  let movedCb = () => {};
  function userMoved() { movedCb(); }

  // ----- pointer: drag to look, tap to select, hover highlight
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object : null;
  }
  const isSelectable = (m) => m && m.userData.kind !== "header";
  let down = null;
  const onDown = (e) => { if (e.button > 0) return; canvas.setPointerCapture?.(e.pointerId); down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, lx: e.clientX, ly: e.clientY, id: e.pointerId }; };
  const onMove = (e) => {
    if (down && down.id === e.pointerId) {
      const dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY; down.moved += Math.abs(dx) + Math.abs(dy);
      if (down.moved > 6) { cancelGlide(); st.yaw -= dx * 0.0042; st.pitch = clamp(st.pitch - dy * 0.0032, -0.7, 0.7); applyCamera(); dirty = true; canvas.style.cursor = "grabbing"; }
    } else if (e.pointerType === "mouse") {
      const m = pick(e.clientX, e.clientY), h = isSelectable(m) ? m : null;
      if (h !== hovered) { if (hovered) hovered.scale.setScalar(1); hovered = h; if (h) h.scale.setScalar(1.03); canvas.style.cursor = h ? "pointer" : "grab"; dirty = true; }
    }
  };
  const onUp = (e) => {
    if (!down || down.id !== e.pointerId) return;
    const tap = down.moved <= 6 && performance.now() - down.t < 450; down = null; canvas.style.cursor = hovered ? "pointer" : "grab";
    if (tap) { const m = pick(e.clientX, e.clientY); if (m) onSelect({ id: m.userData.id, kind: m.userData.kind }); }
  };
  const onWheel = (e) => { e.preventDefault(); cancelGlide(); vf = clamp(vf - e.deltaY * 0.012, -7, 7); };
  const onKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (!kbEnabled || /^(input|textarea|select)$/i.test(e.target?.tagName ?? "")) return;
    if (k.startsWith("arrow") && (e.target === document.body || e.target === canvas)) e.preventDefault();
    keys[k] = true;
  };
  const onKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
  const onBlur = () => { for (const k in keys) keys[k] = false; for (const k in hold) hold[k] = false; };
  const onLostCtx = (e) => { e.preventDefault(); onLost(); };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false }); canvas.addEventListener("webglcontextlost", onLostCtx);
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onBlur);
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  canvas.style.cursor = "grab"; canvas.style.touchAction = "none";

  resize(); applyCamera();
  raf = requestAnimationFrame(frame);

  const stand = (p) => standPoint(p, viewW / viewH, camera.fov);
  const api = {
    scene, camera, state: st, panels,
    roomIndex: () => roomIndexAt(layout, st.z),
    goToRoom(i, opts) { const r = layout.rooms[i]; return startGlide({ x: r.camera.x, z: r.camera.z, yaw: 0, pitch: 0 }, opts); },
    focus(id, opts = {}) {
      const mesh = panels.get(id); if (!mesh) return Promise.resolve();
      const p = mesh.userData.panel, s = stand(p);
      const pitch = clamp(Math.atan((mesh.userData.y - D.eye) / s.dist), -0.1, 0.25);
      return startGlide({ x: s.x, z: s.z, yaw: s.yaw, pitch }, opts);
    },
    stepBack(opts) { return startGlide({ x: 0, z: st.z, yaw: 0, pitch: 0 }, opts); },
    setInset(next) { inset = { right: next.right || 0, bottom: next.bottom || 0 }; applyInset(); },
    hold(dir, on) { hold[dir] = on; if (on) cancelGlide(); },
    setKeyboard(on) { kbEnabled = on; if (!on) for (const k in keys) keys[k] = false; },
    onUserMove(fn) { movedCb = fn; },
    lookAt(yaw) { st.yaw = yaw; applyCamera(); dirty = true; },
    resize,
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel); canvas.removeEventListener("webglcontextlost", onLostCtx);
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur);
      disposables.forEach((o) => o.dispose?.()); renderer.dispose(); renderer.forceContextLoss?.();
    },
  };
  return api;
}
