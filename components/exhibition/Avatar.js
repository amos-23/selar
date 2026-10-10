"use client";
import { useState } from "react";

const initials = (name) => String(name ?? "").replace(/™/g, "").split(/\s+/).filter((w) => w && !/^(the|of|and|by)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

// A creator's photo, always cropped to a circle. Falls back to initials when there is no photo or it fails to load.
export default function Avatar({ src, name, size = 64, className = "" }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (!src || failed) return <span className={`avatar avatar-initials ${className}`} style={style} role="img" aria-label={name}>{initials(name)}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`avatar ${className}`} style={style} src={src} alt={name ? `${name}` : ""} width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
