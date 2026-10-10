// Decorative interlocking gears (aria-hidden). Slow rotation is disabled under prefers-reduced-motion in CSS.
function gearPath(cx, cy, r, teeth, depth) {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const o = r + depth, inn = r;
    [[a, inn], [a + step * 0.18, o], [a + step * 0.5 - step * 0.18, o], [a + step * 0.5, inn]].forEach(([ang, rad]) =>
      pts.push(`${(cx + Math.cos(ang) * rad).toFixed(1)},${(cy + Math.sin(ang) * rad).toFixed(1)}`)
    );
  }
  return `M${pts.join("L")}Z`;
}

const GEARS = [
  { cx: 150, cy: 150, r: 92, teeth: 14, depth: 16, hole: 28, dur: 60, dir: 1 },
  { cx: 318, cy: 90, r: 52, teeth: 8, depth: 14, hole: 16, dur: 34, dir: -1 },
  { cx: 262, cy: 250, r: 62, teeth: 10, depth: 14, hole: 20, dur: 41, dir: -1 },
];

export default function Gears({ className = "" }) {
  return (
    <svg className={`gears ${className}`} viewBox="0 0 400 340" aria-hidden="true" focusable="false">
      {GEARS.map((g, i) => (
        <g key={i} className="gear" style={{ animationDuration: `${g.dur}s`, animationDirection: g.dir === 1 ? "normal" : "reverse" }}>
          <path d={`${gearPath(g.cx, g.cy, g.r, g.teeth, g.depth)} M${g.cx + g.hole},${g.cy} A${g.hole},${g.hole} 0 1,0 ${g.cx - g.hole},${g.cy} A${g.hole},${g.hole} 0 1,0 ${g.cx + g.hole},${g.cy}Z`} fillRule="evenodd" />
        </g>
      ))}
    </svg>
  );
}
