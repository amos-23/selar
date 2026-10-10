"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Returns to the previous page in the visitor's journey when there is one, otherwise to `fallback`.
// Escape does the same, matching the behaviour of dismissible overlays.
export default function BackButton({ fallback, label = "Close", escape = true, className = "btn ghost" }) {
  const router = useRouter();

  function back() {
    if ((window.__exNav || 0) > 0) router.back();
    else router.push(fallback);
  }

  useEffect(() => {
    if (!escape) return;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector("dialog[open]")) return;
      back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return <button type="button" className={className} onClick={back}>{label}</button>;
}
