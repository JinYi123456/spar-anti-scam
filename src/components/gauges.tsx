"use client";

import { useEffect, useRef, useState } from "react";

export function Dial({
  value,
  size = 170,
  label,
  sub,
  suffix = "",
}: {
  value: number;
  size?: number;
  label: string;
  sub?: string;
  suffix?: string;
}) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(value), 80);
    return () => clearTimeout(t);
  }, [value]);

  const angle = -90 + (Math.max(0, Math.min(100, anim)) / 100) * 180;
  const color = value >= 85 ? "#ff4d5e" : value >= 60 ? "#f5a524" : value >= 30 ? "#ffd58a" : "#34d399";
  const r = 42;
  const cx = 50;
  const cy = 50;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = ((-90 + i * 18) * Math.PI) / 180;
    const inner = 34;
    return {
      x1: cx + inner * Math.sin(a),
      y1: cy - inner * Math.cos(a),
      x2: cx + r * Math.sin(a),
      y2: cy - r * Math.cos(a),
      hot: i * 10 >= 60,
    };
  });

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 100 62" width={size} height={size * 0.62}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#1c2536" strokeWidth="7" strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(anim / 100) * Math.PI * r} ${Math.PI * r}`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.3,0.8,0.3,1), stroke 0.6s" }}
        />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.hot ? "#5b3040" : "#26324a"} strokeWidth="1.6" />
        ))}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "50px 50px", transition: "transform 1.1s cubic-bezier(0.3,0.8,0.3,1)" }}>
          <line x1={cx} y1={cy + 6} x2={cx} y2={cy - 34} stroke={color} strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="4" fill={color} />
        <text x={cx} y={cy + 12} textAnchor="middle" className="mono" fontSize="11" fill={color} fontWeight="700">
          {Math.round(anim)}
          {suffix}
        </text>
      </svg>
      <div className="text-[11px] tracking-[0.25em] uppercase text-muted mono">{label}</div>
      {sub ? <div className="text-xs text-muted mt-0.5">{sub}</div> : null}
    </div>
  );
}

const PRESSURE_META = [
  { key: "urgency", label: "Urgency", color: "#f5a524" },
  { key: "fear", label: "Fear", color: "#ff4d5e" },
  { key: "greed", label: "Greed", color: "#34d399" },
  { key: "obedience", label: "Obedience", color: "#22d3ee" },
] as const;

export function PressureBars({ pressure }: { pressure: { urgency: number; fear: number; greed: number; obedience: number } }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full">
      {PRESSURE_META.map(({ key, label, color }) => {
        const v = pressure[key];
        return (
          <div key={key}>
            <div className="flex justify-between text-[11px] mono text-muted mb-1">
              <span className="tracking-widest uppercase">{label}</span>
              <span style={{ color }}>{v}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#161e2e] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${v}%`, background: color, transition: "width 1s ease", boxShadow: `0 0 8px ${color}66` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Typewriter({ text, speed = 14, className = "", onDone }: { text: string; speed?: number; className?: string; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(1, Math.round(text.length / 140));
      if (i >= text.length) {
        setShown(text);
        clearInterval(id);
        doneRef.current?.();
      } else {
        setShown(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <span className={shown.length < text.length ? `caret ${className}` : className}>{shown}</span>;
}

export function Sparkline({ data, max = 100 }: { data: number[]; max?: number }) {
  if (data.length < 2) {
    return <div className="h-10 flex items-center text-[10px] mono text-muted tracking-widest">AWAITING TELEMETRY…</div>;
  }
  const w = 220;
  const h = 40;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`)
    .join(" ");
  const last = data[data.length - 1];
  const color = last >= 85 ? "#ff4d5e" : last >= 65 ? "#f5a524" : last >= 40 ? "#ffd58a" : "#34d399";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${color}55)` }} />
      <circle cx={w} cy={h - (last / max) * (h - 4) - 2} r="3" fill={color} />
    </svg>
  );
}
