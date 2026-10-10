"use client";
import dynamic from "next/dynamic";

// three.js is only downloaded for the walkthrough, and only in the browser.
const Walkthrough = dynamic(() => import("./walk/Walkthrough"), {
  ssr: false,
  loading: () => (
    <div className="walk walk-loading" role="status">
      <p>Preparing the exhibition…</p>
    </div>
  ),
});

export default function WalkthroughLoader({ data }) {
  return <Walkthrough data={data} />;
}
