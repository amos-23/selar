"use client";
import { useState } from "react";

// Image with a quiet fallback so a missing file never leaves a broken-image icon or blank panel.
export default function SafeImage({ src, alt, className = "", ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`img-fallback ${className}`} role="img" aria-label={alt}>Image unavailable</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(true)} {...rest} />;
}
