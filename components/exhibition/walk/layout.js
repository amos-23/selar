// Pure geometry for the walkthrough: where every room, arch and exhibit panel sits. No three.js here, so it is unit-tested.
// Coordinates are metres. The visitor starts near z = +1.5 facing -z and walks down a long hall of rooms.
export const DIMS = {
  hallW: 9.2, wallX: 4.45, height: 4.4, eye: 1.65,
  slot: 3.7, panelW: 2.4, panelH: 1.69, panelY: 1.95,
  archOpening: 4.4, archDepth: 0.5, archY: 3.3,
  roomPadStart: 2.6, roomPadEnd: 2.2,
  lobbyBack: 4.5, firstArchZ: -13, closingLength: 13,
};

const wideSize = { w: 3.6, h: 2.5 };

// room input: { key, title, theme, number?, kind?: "normal"|"closing", sections: [{ key, title?, intro?, items: [...] }] }
// item input: { kind: "exhibit"|"text"|"media", id, ... } (kept opaque; layout only adds placement).
export function buildLayout(roomsInput) {
  const D = DIMS;
  const rooms = [];
  const lobby = {
    key: "lobby", index: 0, title: "The Entrance", theme: "deep", number: null,
    zStart: D.lobbyBack, zEnd: D.firstArchZ, archZ: null, camera: { x: 0, z: 1.5 },
    items: [
      { kind: "lobby-title", id: "lobby-title", side: "left", x: -D.wallX, z: -3.2, rotY: Math.PI / 2, ...wideSize },
      { kind: "lobby-intro", id: "lobby-intro", side: "right", x: D.wallX, z: -3.2, rotY: -Math.PI / 2, ...wideSize },
    ],
    headers: [],
  };
  rooms.push(lobby);

  let cursor = D.firstArchZ;
  for (const r of roomsInput) {
    const archZ = cursor;
    const items = [], headers = [];
    let length;
    if (r.kind === "closing") {
      length = D.closingLength;
      const zEnd = archZ - length;
      items.push({ ...r.sections[0].items[0], side: "end", x: 0, z: zEnd + 0.06, rotY: 0, w: 6.4, h: 2.6 });
    } else {
      let nextL = 0, nextR = 0;
      const zAt = (k) => archZ - D.roomPadStart - D.slot * (k + 0.5);
      for (const sec of r.sections) {
        if (sec.title) {
          const slot = Math.max(nextL, nextR);
          headers.push({ id: `header-${sec.key}`, title: sec.title, intro: sec.intro ?? "", kicker: sec.kicker ?? "", side: "left", x: -D.wallX, z: zAt(slot), rotY: Math.PI / 2, w: D.panelW, h: D.panelH });
          nextL = slot + 1; nextR = slot;
        }
        for (const it of sec.items) {
          const left = nextL <= nextR;
          const slot = left ? nextL : nextR;
          if (left) nextL++; else nextR++;
          items.push({ ...it, side: left ? "left" : "right", x: left ? -D.wallX : D.wallX, z: zAt(slot), rotY: left ? Math.PI / 2 : -Math.PI / 2, w: D.panelW, h: D.panelH });
        }
      }
      length = D.roomPadStart + D.slot * Math.max(nextL, nextR) + D.roomPadEnd;
    }
    rooms.push({
      key: r.key, index: rooms.length, title: r.title, theme: r.theme, number: r.number ?? null,
      zStart: archZ, zEnd: archZ - length, archZ, camera: { x: 0, z: archZ - 2.2 }, items, headers,
    });
    cursor = archZ - length;
  }
  return { rooms, zFront: D.lobbyBack, zEnd: cursor, dims: D };
}

export function roomIndexAt(layout, z) {
  for (const r of layout.rooms) if (z <= r.zStart && z > r.zEnd) return r.index;
  return z > layout.rooms[0].zStart ? 0 : layout.rooms.length - 1;
}

export const archZs = (layout) => layout.rooms.filter((r) => r.archZ !== null).map((r) => r.archZ);

// Where the camera stands to look at a panel, and which way it faces. yaw 0 looks toward -z.
export function standPoint(panel, aspect = 1.6, fovDeg = 62) {
  const t = Math.tan((fovDeg * Math.PI) / 360);
  const dist = Math.min(3.6, Math.max(2.4, panel.w / (t * Math.max(aspect, 0.4) * 1.0)));
  if (panel.side === "end") return { x: 0, z: panel.z + Math.min(7, Math.max(4, dist + 2)), yaw: 0, dist };
  const left = panel.side === "left";
  return { x: left ? -DIMS.wallX + dist : DIMS.wallX - dist, z: panel.z, yaw: left ? Math.PI / 2 : -Math.PI / 2, dist };
}

// Every exhibit in walking order (used for previous / next).
export const exhibitOrder = (layout) => layout.rooms.flatMap((r) => r.items.filter((i) => i.kind === "exhibit")).sort((a, b) => b.z - a.z || 0).map((i) => i.id);
