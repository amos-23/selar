"use client";
import { useRef, useState } from "react";
import SafeImage from "./SafeImage";
import StatusBadge from "./StatusBadge";

function VideoItem({ item }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="img-fallback">This video could not be loaded. {item.src ? <a href={item.src}>Open it directly</a> : null}</p>;
  return (
    // Never autoplays; preload none keeps the page light until the visitor presses play.
    <video controls preload="none" poster={item.poster} onError={() => setFailed(true)}>
      <source src={item.src} />
      {item.captions ? <track kind="captions" src={item.captions} srcLang="en" label="English" default /> : null}
    </video>
  );
}

export default function MediaGallery({ items, preview }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [current, setCurrent] = useState(null);

  function openItem(item, el) {
    trigger.current = el;
    setCurrent(item);
    setTimeout(() => dialog.current?.showModal(), 0);
  }
  function close() { dialog.current?.close(); }

  if (items.length === 0) {
    return <p className="empty">No media has been published yet. Add approved items to <code>content/exhibition/media.js</code>.</p>;
  }
  return (
    <>
      <ul className="media-grid">
        {items.map((m) => (
          <li key={m.id} className="media-item">
            {m.type === "video" ? <VideoItem item={m} /> : (
              <button type="button" className="media-open" onClick={(e) => openItem(m, e.currentTarget)} aria-label={`Enlarge: ${m.title || m.alt}`}>
                <SafeImage src={m.src} alt={m.alt} />
              </button>
            )}
            <div className="media-cap">
              {m.title ? <h3>{m.title}</h3> : null}
              {m.caption ? <p>{m.caption}</p> : null}
              <StatusBadge status={m.publicationStatus} preview={preview} />
            </div>
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="lightbox" aria-label={current?.title || current?.alt || "Image"} onClose={() => { setCurrent(null); trigger.current?.focus(); }} onClick={(e) => e.target === dialog.current && close()}>
        {current ? (
          <figure>
            <SafeImage src={current.src} alt={current.alt} />
            {current.caption ? <figcaption>{current.caption}</figcaption> : null}
          </figure>
        ) : null}
        <button type="button" className="btn sm lightbox-close" onClick={close}>Close</button>
      </dialog>
    </>
  );
}
