"use client";
import { useRef, useState } from "react";

export default function ShareControls({ title, text, path, className = "" }) {
  const [msg, setMsg] = useState("");
  const [manual, setManual] = useState("");
  const input = useRef(null);

  async function share() {
    const url = new URL(path || window.location.pathname, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setManual(url); // last resort: show the link for manual copying
      setTimeout(() => input.current?.select(), 0);
    }
  }

  return (
    <div className={`share ${className}`}>
      <button type="button" className="btn ghost" onClick={share}>Share</button>
      <span role="status" aria-live="polite" className="share-msg">{msg}</span>
      {manual ? (
        <label className="share-manual">Copy this link
          <input ref={input} readOnly value={manual} onFocus={(e) => e.target.select()} />
        </label>
      ) : null}
    </div>
  );
}
