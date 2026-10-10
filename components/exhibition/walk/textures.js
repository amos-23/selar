// Canvas drawing for the walkthrough's panels and signs. Brand palette from the Selar guidelines.
export const THEMES = {
  deep:   { wall: "#2d0025", wallLight: "#3d0733", card: "#ffe4fb", cardFg: "#2d0025", accent: "#5a0b4d", hi: "#ffd61f", glow: "#ffe4fb", base: "#ffd61f" },
  purple: { wall: "#5a0b4d", wallLight: "#6c1a5e", card: "#ffe4fb", cardFg: "#2d0025", accent: "#5a0b4d", hi: "#ffd61f", glow: "#ffe4fb", base: "#ffd61f" },
  blush:  { wall: "#ffe4fb", wallLight: "#fff0fc", card: "#ffffff", cardFg: "#2d0025", accent: "#5a0b4d", hi: "#ffd61f", glow: "#ffd61f", base: "#5a0b4d" },
  grey:   { wall: "#f1f0f2", wallLight: "#ffffff", card: "#ffffff", cardFg: "#2d0025", accent: "#5a0b4d", hi: "#ffd61f", glow: "#ffd61f", base: "#5a0b4d" },
  yellow: { wall: "#ffd61f", wallLight: "#ffe366", card: "#2d0025", cardFg: "#ffe4fb", accent: "#ffd61f", hi: "#ffd61f", glow: "#ffffff", base: "#2d0025" },
};
const DISPLAY = 'Parkinsans, Inter, system-ui, "Segoe UI", sans-serif';
const BODY = '"Google Sans Flex", Inter, system-ui, "Segoe UI", sans-serif';

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// Shrinks the font until the text fits `maxLines`; returns { lines, size }.
function fit(ctx, text, family, weight, startSize, minSize, maxW, maxLines) {
  let size = startSize;
  for (;;) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines || size <= minSize) {
      const cut = lines.length > maxLines, out = lines.slice(0, maxLines);
      if (cut && out.length) out[out.length - 1] = out[out.length - 1].replace(/[\s,.;:]*$/, "") + "…";
      return { lines: out, size };
    }
    size -= 2;
  }
}

function drawLines(ctx, lines, x, y, lh) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return y + lines.length * lh;
}

function chip(ctx, text, x, y, color, fg) {
  ctx.font = `700 20px ${BODY}`;
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, 34, 17); ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = "middle"; ctx.fillText(text, x + 12, y + 18); ctx.textBaseline = "alphabetic";
}

export function initialsOf(name) {
  return String(name ?? "").replace(/™/g, "").split(/\s+/).filter((w) => w && !/^(the|of|and|by)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";
}

// Draws a creator photo (or initials) clipped to a circle with a ring.
export function drawAvatar(ctx, img, cx, cy, r, name, T) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  if (img && img.naturalWidth) {
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = T.accent; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = T.card; ctx.font = `700 ${Math.round(r * 0.78)}px ${DISPLAY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(initialsOf(name), cx, cy + 2); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = T.accent; ctx.stroke();
  ctx.lineWidth = 1;
}

export function drawPanel(canvas, item, themeKey, photoImg = null) {
  const T = THEMES[themeKey] ?? THEMES.deep;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, s = W / 768;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const w = 768, h = 540, pad = 40, inner = w - pad * 2;
  ctx.clearRect(0, 0, w, h);
  ctx.textBaseline = "alphabetic";

  if (item.kind === "header") {
    ctx.fillStyle = "#2d0025"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = T.hi; ctx.fillRect(0, 0, 14, h);
    ctx.font = `700 22px ${BODY}`; ctx.fillStyle = T.hi; ctx.fillText((item.kicker || "Hall of Fame").toUpperCase(), pad + 8, 70);
    const t = fit(ctx, item.title, DISPLAY, 600, 76, 40, inner - 8, 3);
    ctx.fillStyle = "#ffe4fb"; const y = drawLines(ctx, t.lines, pad + 8, 150, t.size * 1.1);
    if (item.intro) { const b = fit(ctx, item.intro, BODY, 400, 28, 20, inner - 8, 4); ctx.font = `400 ${b.size}px ${BODY}`; ctx.fillStyle = "rgba(255,228,251,.85)"; drawLines(ctx, b.lines, pad + 8, Math.max(y + 24, 330), b.size * 1.35); }
    return;
  }

  ctx.fillStyle = T.card; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = T.accent; ctx.fillRect(0, 0, w, 14);

  if (item.kind === "text") {
    let y = 64;
    if (item.heading) {
      ctx.font = `600 34px ${DISPLAY}`; ctx.fillStyle = T.accent; ctx.fillText(item.heading, pad, y + 6); y += 44;
      if (item.byline) { ctx.font = `500 24px ${BODY}`; ctx.fillStyle = T.cardFg; ctx.fillText(item.byline, pad, y); y += 36; }
    }
    const f = item.lead
      ? fit(ctx, item.text, DISPLAY, 600, 44, 26, inner, 9)
      : fit(ctx, item.text, BODY, 400, 34, 20, inner, 12);
    ctx.font = `${item.lead ? 600 : 400} ${f.size}px ${item.lead ? DISPLAY : BODY}`;
    ctx.fillStyle = item.lead ? T.accent : T.cardFg;
    drawLines(ctx, f.lines, pad, y + (item.lead ? 20 : 10) + f.size * 0.8, f.size * 1.32);
    if (item.status) chip(ctx, item.status.toUpperCase(), pad, h - 64, "#ffd61f", "#2d0025");
    return;
  }

  if (item.kind === "media") {
    ctx.fillStyle = "#2d0025"; ctx.fillRect(0, 0, w, h);
    ctx.font = `600 34px ${DISPLAY}`; ctx.fillStyle = "#ffe4fb"; const f = fit(ctx, item.title || "Photograph", DISPLAY, 600, 34, 22, inner, 2); drawLines(ctx, f.lines, pad, h - 90, 40);
    return;
  }

  // exhibit
  const hasAvatar = item.kind === "exhibit";
  const R = 74, ax = w - pad - R, ay = 62 + R;
  if (hasAvatar) drawAvatar(ctx, photoImg, ax, ay, R, item.creator || item.title, T);
  const topW = hasAvatar ? inner - (R * 2 + 24) : inner;
  ctx.font = `700 20px ${BODY}`; ctx.fillStyle = T.accent;
  const kick = fit(ctx, (item.category || "").toUpperCase(), BODY, 700, 20, 14, topW, 1);
  ctx.font = `700 ${kick.size}px ${BODY}`; ctx.fillText(kick.lines[0] ?? "", pad, 62);
  let y = 100;
  if (item.figure) {
    const f = fit(ctx, item.figure.value, DISPLAY, 700, 108, 48, topW, 1);
    ctx.font = `700 ${f.size}px ${DISPLAY}`; ctx.fillStyle = T.accent; ctx.fillText(f.lines[0], pad, y + f.size * 0.82);
    y += f.size * 0.82 + 52; // clear the descenders of the big number
    if (item.figure.label) { const l = fit(ctx, item.figure.label, BODY, 500, 26, 16, topW, 1); ctx.font = `500 ${l.size}px ${BODY}`; ctx.fillStyle = T.cardFg; ctx.fillText(l.lines[0], pad, y); }
    y += 36;
  }
  const titleText = item.yearCard ? item.creator : item.title;
  const titleW = y < ay + R + 8 ? topW : inner;
  const t = fit(ctx, titleText, DISPLAY, 600, item.figure ? 44 : 64, 26, titleW, item.figure ? 2 : 3);
  ctx.font = `600 ${t.size}px ${DISPLAY}`; ctx.fillStyle = T.cardFg;
  y = drawLines(ctx, t.lines, pad, y + t.size * 0.9, t.size * 1.12);
  if (!item.yearCard && item.creator && item.creator !== item.title) {
    ctx.font = `500 26px ${BODY}`; ctx.globalAlpha = 0.85; ctx.fillText(item.creator, pad, y + 14); ctx.globalAlpha = 1; y += 40;
  }
  if (!item.yearCard) {
    const a = fit(ctx, item.achievement, BODY, 400, 25, 18, inner, Math.max(2, Math.floor((h - y - 44) / 32)));
    ctx.font = `400 ${a.size}px ${BODY}`; ctx.globalAlpha = 0.92; drawLines(ctx, a.lines, pad, Math.max(y + 24, 380), a.size * 1.3); ctx.globalAlpha = 1;
  }
  if (item.status) chip(ctx, item.status.toUpperCase(), pad, 8, "#ffd61f", "#2d0025");
  ctx.font = `600 18px ${BODY}`; ctx.fillStyle = T.accent; ctx.fillText("Select to open  →", pad, h - 22);
}

export function drawLobbyPanel(canvas, item, statement) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width / 960;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const w = 960, h = 667;
  const title = item.kind === "lobby-title";
  ctx.fillStyle = title ? "#5a0b4d" : "#ffe4fb"; ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = "alphabetic";
  if (title) {
    ctx.font = `700 24px ${BODY}`; ctx.fillStyle = "#ffd61f"; ctx.fillText("SELAR AT 10 · VIRTUAL EXHIBITION", 56, 90);
    const f = fit(ctx, statement.title, DISPLAY, 600, 118, 60, w - 112, 3);
    ctx.fillStyle = "#ffffff"; drawLines(ctx, f.lines, 56, 200, f.size * 1.06);
  } else {
    const f = fit(ctx, statement.intro, DISPLAY, 600, 54, 30, w - 112, 7);
    ctx.font = `600 ${f.size}px ${DISPLAY}`; ctx.fillStyle = "#5a0b4d"; drawLines(ctx, f.lines, 56, 120, f.size * 1.25);
    ctx.font = `600 26px ${BODY}`; ctx.fillStyle = "#2d0025"; ctx.fillText("Walk on, and step up to anything that catches your eye.", 56, h - 70);
  }
}

export function drawClosing(canvas, text) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width / 1280;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const w = 1280, h = 520;
  ctx.fillStyle = "#2d0025"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffd61f"; ctx.fillRect(0, h - 14, w, 14);
  const f = fit(ctx, text, DISPLAY, 600, 96, 48, w - 140, 4);
  ctx.fillStyle = "#ffe4fb"; ctx.textBaseline = "alphabetic";
  const total = f.lines.length * f.size * 1.12; drawLines(ctx, f.lines, 70, (h - total) / 2 + f.size * 0.85, f.size * 1.12);
}

export function drawSign(canvas, number, title, themeKey) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width / 1024;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const w = 1024, h = 256;
  const T = THEMES[themeKey] ?? THEMES.deep;
  ctx.fillStyle = "#2d0025"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = T.hi; ctx.fillRect(0, h - 10, w, 10);
  ctx.textBaseline = "middle";
  let x = 56;
  if (number) { ctx.fillStyle = "#ffd61f"; ctx.beginPath(); ctx.arc(x + 44, h / 2 - 4, 44, 0, Math.PI * 2); ctx.fill(); ctx.font = `700 46px ${DISPLAY}`; ctx.fillStyle = "#2d0025"; ctx.textAlign = "center"; ctx.fillText(String(number), x + 44, h / 2 - 2); ctx.textAlign = "left"; x += 120; }
  const f = fit(ctx, title, DISPLAY, 600, 70, 36, w - x - 50, 2);
  ctx.fillStyle = "#ffe4fb"; ctx.textBaseline = "alphabetic";
  const total = f.lines.length * f.size * 1.08; drawLines(ctx, f.lines, x, (h - 10 - total) / 2 + f.size * 0.85, f.size * 1.08);
}

export function glowTexture() {
  const c = makeCanvas(256, 256), ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return c;
}

export function floorTexture() {
  const c = makeCanvas(256, 256), ctx = c.getContext("2d");
  ctx.fillStyle = "#2a0422"; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#33092b"; ctx.fillRect(0, 0, 128, 128); ctx.fillRect(128, 128, 128, 128);
  ctx.strokeStyle = "rgba(255,228,251,.07)"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 254, 254);
  return c;
}
