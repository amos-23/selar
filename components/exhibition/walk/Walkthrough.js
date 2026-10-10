"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ShareControls from "../ShareControls";
import Timeline from "../Timeline";
import Avatar from "../Avatar";
import { buildLayout, exhibitOrder } from "./layout";

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Walkthrough({ data }) {
  const router = useRouter();
  const layout = useMemo(() => buildLayout(data.rooms), [data.rooms]);
  const order = useMemo(() => exhibitOrder(layout), [layout]);
  const mediaById = useMemo(() => Object.fromEntries(layout.rooms.flatMap((r) => r.items).filter((i) => i.kind === "media").map((m) => [m.id, m])), [layout]);

  const canvasRef = useRef(null);
  const ctl = useRef(null);
  const selectedRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | unsupported
  const [entered, setEntered] = useState(false);
  const [roomIdx, setRoomIdx] = useState(0);
  const [selected, setSelected] = useState(null); // { type: "exhibit"|"media", id }
  const [drawer, setDrawer] = useState(null); // null | "rooms" | "timeline"
  const [query, setQuery] = useState("");
  const [announce, setAnnounce] = useState("");
  const [touch, setTouch] = useState(false);
  const panelRef = useRef(null);
  selectedRef.current = selected;

  const clearHash = () => { try { if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch {} };

  const open = useCallback((type, id) => {
    setSelected({ type, id }); setEntered(true); setDrawer(null);
    ctl.current?.focus(id);
    try { window.history.replaceState(null, "", `#${id}`); } catch {}
  }, []);

  const close = useCallback(() => {
    if (!selectedRef.current) return;
    setSelected(null); clearHash(); ctl.current?.stepBack();
  }, []);

  // ----- boot the scene
  useEffect(() => {
    let dead = false, walk = null;
    const canvas = canvasRef.current;
    const gl = (() => { try { const c = document.createElement("canvas"); return c.getContext("webgl2") || c.getContext("webgl"); } catch { return null; } })();
    if (!gl) { setStatus("unsupported"); return; }
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    setTouch(!!coarse);
    (async () => {
      try {
        const { createWalk } = await import("./scene");
        walk = await createWalk({
          canvas, layout, statement: data.statement,
          reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
          lowPower: !!coarse || (navigator.deviceMemory && navigator.deviceMemory <= 4),
          onRoom: (i) => { setRoomIdx(i); setAnnounce(i === 0 ? "You are in the entrance." : `You are in ${layout.rooms[i].number ? `room ${layout.rooms[i].number}, ` : ""}${layout.rooms[i].title}.`); },
          onSelect: ({ id, kind }) => { if (kind === "exhibit") open("exhibit", id); else if (kind === "media") open("media", id); else { ctl.current?.focus(id); } },
          onLost: () => setStatus("unsupported"),
        });
        if (dead) { walk.dispose(); return; }
        ctl.current = walk;
        walk.onUserMove(() => { if (selectedRef.current) { setSelected(null); clearHash(); } });
        if (location.search.includes("debug")) window.__walk = walk;
        setStatus("ready");
        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (hash && (data.exhibits[hash] || mediaById[hash])) { setEntered(true); setSelected({ type: data.exhibits[hash] ? "exhibit" : "media", id: hash }); walk.focus(hash, { instant: true }); }
      } catch (e) { console.error(e); if (!dead) setStatus("unsupported"); }
    })();
    return () => { dead = true; ctl.current = null; walk?.dispose(); };
  }, [layout, data, open, mediaById]);

  // unsupported devices get the text version automatically
  useEffect(() => {
    if (status !== "unsupported") return;
    const t = setTimeout(() => router.replace("/exhibition/gallery"), 3500);
    return () => clearTimeout(t);
  }, [status, router]);

  // keep the picture clear of the open panel
  useEffect(() => {
    const c = ctl.current; if (!c || status !== "ready") return;
    const w = window.innerWidth, h = window.innerHeight;
    if (!selected) c.setInset({ right: 0, bottom: 0 });
    else if (w >= 860) c.setInset({ right: Math.min(460, w * 0.38), bottom: 0 });
    else c.setInset({ right: 0, bottom: h * 0.4 });
  }, [selected, status]);

  // keyboard: Escape closes; typing in drawers never walks
  useEffect(() => { ctl.current?.setKeyboard(!drawer); }, [drawer, status]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (drawer) setDrawer(null); else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, close]);
  useEffect(() => { if (selected) { setAnnounce(`Opened ${selected.type === "exhibit" ? data.exhibits[selected.id]?.title : mediaById[selected.id]?.title || "photograph"}.`); panelRef.current?.focus({ preventScroll: true }); } }, [selected, data.exhibits, mediaById]);

  const enter = () => { setEntered(true); ctl.current?.goToRoom(1); };
  const goRoom = (i) => { setDrawer(null); setSelected(null); clearHash(); setEntered(true); ctl.current?.goToRoom(i); };
  const hold = (dir) => ({
    onPointerDown: (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); ctl.current?.hold(dir, true); },
    onPointerUp: () => ctl.current?.hold(dir, false), onPointerCancel: () => ctl.current?.hold(dir, false), onPointerLeave: () => ctl.current?.hold(dir, false),
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ctl.current?.hold(dir, true); } },
    onKeyUp: (e) => { if (e.key === "Enter" || e.key === " ") ctl.current?.hold(dir, false); },
    onBlur: () => ctl.current?.hold(dir, false),
  });

  const ex = selected?.type === "exhibit" ? data.exhibits[selected.id] : null;
  const media = selected?.type === "media" ? mediaById[selected.id] : null;
  const pos = order.indexOf(selected?.id);
  const room = layout.rooms[roomIdx];
  const lastRoom = layout.rooms.length - 1;

  const results = useMemo(() => {
    const q = norm(query.trim()); if (!q) return null;
    return Object.values(data.exhibits).filter((e) => norm(`${e.title} ${e.creator} ${e.category}`).includes(q));
  }, [query, data.exhibits]);

  return (
    <div className="walk" data-room={room?.key}>
      <canvas ref={canvasRef} aria-label="Interactive 3D exhibition. Use the controls, or the text version, to explore." role="img" />
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      <noscript><p className="walk-msg">The 3D exhibition needs JavaScript. <a href="/exhibition/gallery">Browse the text version</a>.</p></noscript>

      {status === "loading" ? <div className="walk-loading" role="status"><p>Preparing the exhibition…</p></div> : null}
      {status === "unsupported" ? (
        <div className="walk-card" role="alert">
          <h1>This device can’t show the 3D exhibition</h1>
          <p>Taking you to the text version of the exhibition…</p>
          <Link href="/exhibition/gallery" className="btn primary">Open the text version now</Link>
        </div>
      ) : null}

      {status === "ready" && !entered ? (
        <div className="walk-card entrance rise">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/selar-logo-white.png" alt="Selar" width="150" height="77" className="walk-logo" />
          <p className="ex-eyebrow">Selar at 10 · Virtual exhibition</p>
          <h1>The Gears of Creativity</h1>
          <p className="walk-lede">{data.statement.intro}</p>
          <div className="ex-actions">
            <button type="button" className="btn primary" onClick={enter}>Enter Exhibition</button>
            <Link href="/exhibition/about" className="btn ghost">Read the statement</Link>
          </div>
          <p className="walk-tip">{touch ? "Drag to look around. Hold ▲ to walk." : "Drag to look around. W A S D or ↑ ↓ to walk. Click an exhibit to step up to it."}</p>
        </div>
      ) : null}

      {status === "ready" && entered ? (
        <>
          <div className="hud-top">
            <button type="button" className="hud-btn hud-logo" onClick={() => goRoom(0)} aria-label="Back to the entrance">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/selar-logo-white.png" alt="" width="70" height="36" />
              <span>at 10</span>
            </button>
            <p className="hud-room" aria-hidden="true">{room?.number ? `Room ${room.number} · ` : ""}{room?.title}</p>
            <div className="hud-actions">
              <button type="button" className="hud-btn" onClick={() => setDrawer(drawer === "rooms" ? null : "rooms")} aria-expanded={drawer === "rooms"}>Rooms</button>
              <button type="button" className="hud-btn" onClick={() => setDrawer(drawer === "timeline" ? null : "timeline")} aria-expanded={drawer === "timeline"}>Timeline</button>
              <Link href="/exhibition/gallery" className="hud-btn hud-text">Text version</Link>
            </div>
          </div>
          {data.preview ? <p className="hud-preview">Team preview</p> : null}

          <div className={`hud-bottom ${selected ? "with-panel" : ""}`}>
            <button type="button" className="hud-btn" onClick={() => goRoom(Math.max(0, roomIdx - 1))} disabled={roomIdx === 0}>◀ <span>Previous room</span></button>
            <div className="hud-walk" role="group" aria-label="Walk">
              <button type="button" className="hud-btn round" aria-label="Walk backward (hold)" {...hold("back")}>▼</button>
              <button type="button" className="hud-btn round big" aria-label="Walk forward (hold)" {...hold("fwd")}>▲</button>
            </div>
            <button type="button" className="hud-btn" onClick={() => goRoom(Math.min(lastRoom, roomIdx + 1))} disabled={roomIdx === lastRoom}><span>Next room</span> ▶</button>
          </div>
          {roomIdx === 0 ? <p className="hud-hint">{touch ? "Drag to look · hold ▲ to walk · tap an exhibit" : "Drag to look · W A S D or ↑ ↓ to walk · click an exhibit · Esc steps back"}</p> : null}

          {roomIdx === lastRoom ? (
            <div className="walk-end">
              <button type="button" className="btn primary" onClick={() => goRoom(0)}>Return to the entrance</button>
              <a href="https://selar.com" rel="noopener" className="btn ghost">Visit Selar</a>
              <ShareControls title="Selar at 10 | The Gears of Creativity" text={data.statement.closingLine} path="/exhibition" />
            </div>
          ) : null}
        </>
      ) : null}

      {(ex || media) ? (
        <aside className="walk-panel" role="dialog" aria-label={ex ? ex.title : media.title || "Photograph"} ref={panelRef} tabIndex={-1}>
          <button type="button" className="btn ghost sm walk-close" onClick={close}>Close</button>
          {ex ? (
            <>
              <Avatar src={ex.photo} name={ex.creator || ex.title} size={92} className="walk-avatar" />
              <p className="ex-eyebrow">{ex.category}</p>
              {ex.figure ? <p className="walk-figure"><strong>{ex.figure.value}</strong><span>{ex.figure.label}</span></p> : <p className="walk-figure"><strong>{ex.leaderOf ?? ex.award ?? ex.year ?? "★"}</strong></p>}
              <h2>{ex.title}</h2>
              {ex.creator && ex.creator !== ex.title ? <p className="walk-creator">{ex.creator}</p> : null}
              <p className="walk-ach">{ex.achievement}</p>
              {ex.description ? <p>{ex.description}</p> : null}
              {ex.when ? <p className="walk-when">{ex.when}</p> : null}
              {ex.runnerUps?.length ? (
                <div className="walk-runners"><h3>Runners-up</h3>
                  <ol>{ex.runnerUps.map((r) => <li key={r.place}><span className="rank">{r.placeLabel}</span><Avatar src={r.photo} name={r.name} size={34} /><span className="who">{r.name}<small>{r.date}</small></span><span className="val">{r.figure}</span></li>)}</ol>
                </div>
              ) : null}
              {ex.pastHolders?.length ? (
                <div className="walk-runners"><h3>Past holders</h3>
                  <ol>{ex.pastHolders.map((r, i) => <li key={i}><Avatar src={r.photo} name={r.name} size={34} /><span className="who">{r.name}</span><span className="val">{r.stat}</span></li>)}</ol>
                </div>
              ) : null}
              {ex.storeUrl && /^https:\/\//.test(ex.storeUrl) ? <p><a href={ex.storeUrl} target="_blank" rel="noopener noreferrer" className="btn ghost sm">Visit {ex.creator}’s store ↗</a></p> : null}
              {ex.images.map((m, i) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={m.src} alt={m.alt ?? ""} loading="lazy" className="walk-img" />))}
              {data.preview ? (
                <div className="internal"><h3>Team notes (preview only)</h3><dl><dt>Publication</dt><dd>{ex.statusLabel}</dd><dt>Verification</dt><dd>{ex.verified ? "Verified against supplied source" : "Needs verification"}</dd><dt>Source</dt><dd>{ex.sourceNote}</dd></dl></div>
              ) : null}
              {ex.related.length ? (
                <div className="walk-related"><h3>Related</h3><ul>{ex.related.map((r) => <li key={r.slug}><button type="button" className="link" onClick={() => open("exhibit", r.slug)}>{r.title}</button></li>)}</ul></div>
              ) : null}
              <div className="walk-nav">
                <button type="button" className="btn ghost sm" disabled={pos <= 0} onClick={() => open("exhibit", order[pos - 1])}>← Previous</button>
                <button type="button" className="btn ghost sm" disabled={pos < 0 || pos >= order.length - 1} onClick={() => open("exhibit", order[pos + 1])}>Next →</button>
              </div>
              <ShareControls title={`${ex.title} | Selar at 10`} text={ex.achievement} path={`/exhibition/exhibits/${ex.slug}`} />
            </>
          ) : (
            <>
              <h2>{media.title || "Photograph"}</h2>
              {media.type === "video"
                ? <video controls preload="none" poster={media.poster ?? undefined} src={media.src} className="walk-img" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={media.src} alt={media.alt} className="walk-img" />}
              {media.caption ? <p>{media.caption}</p> : null}
            </>
          )}
        </aside>
      ) : null}

      {drawer === "rooms" ? (
        <aside className="walk-drawer" role="dialog" aria-label="Rooms and exhibits">
          <div className="walk-drawer-head"><h2>Rooms</h2><button type="button" className="btn ghost sm" onClick={() => setDrawer(null)}>Close</button></div>
          <label className="search"><span>Find a creator or product</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus placeholder="e.g. Coach Dino" autoComplete="off" /></label>
          {results ? (
            <ul className="walk-list" aria-label="Search results">
              {results.length === 0 ? <li className="muted-line">No exhibits match.</li> : results.map((e) => <li key={e.slug}><button type="button" className="link" onClick={() => open("exhibit", e.slug)}>{e.title}{e.creator && e.creator !== e.title ? ` · ${e.creator}` : ""}</button></li>)}
            </ul>
          ) : (
            <ol className="walk-list rooms">
              {layout.rooms.map((r, i) => (
                <li key={r.key}>
                  <button type="button" className="walk-room-btn" onClick={() => goRoom(i)} aria-current={i === roomIdx ? "true" : undefined}>{r.number ? <b>{r.number}</b> : <b>→</b>}<span>{r.title}</span></button>
                </li>
              ))}
            </ol>
          )}
        </aside>
      ) : null}

      {drawer === "timeline" ? (
        <aside className="walk-drawer wide theme-grey" role="dialog" aria-label="Timeline">
          <div className="walk-drawer-head"><h2>The Timeline</h2><button type="button" className="btn ghost sm" onClick={() => setDrawer(null)}>Close</button></div>
          <p className="muted-line">Only dates recorded in the exhibition’s source material appear here.</p>
          <Timeline entries={data.timeline} preview={data.preview} onOpen={(slug) => open("exhibit", slug)} />
        </aside>
      ) : null}
    </div>
  );
}
