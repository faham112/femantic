"use client";

export function DualLineChart({ current = [], previous = [], height = 220 }: { current?: number[]; previous?: number[]; height?: number }) {
  const a = current.length ? current : [4, 7, 4, 4.2, 4, 5.4, 3.4, 5.6, 4.8, 3.9, 4.3, 4.1, 4.3, 3.8];
  const b = previous.length ? previous : [6.4, 4.3, 4.4, 4.4, 3.9, 5.4, 3.8, 7.1, 5.1, 4.5, 4.3, 4.3, 5.3, 4.2];
  const max = Math.max(...a, ...b, 1);
  const w = 640;
  const h = height;
  const pad = 28;
  const step = (w - pad * 2) / Math.max(a.length - 1, 1);
  const toPts = (arr: number[]) => arr.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" ");
  const area = `${pad},${h - pad} ${toPts(a)} ${pad + (a.length - 1) * step},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad} x2={w - 8} y1={h - pad - g * (h - pad * 2)} y2={h - pad - g * (h - pad * 2)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#fillA)" opacity="0.35" />
      <polyline points={toPts(b)} fill="none" stroke="#f59a23" strokeWidth="2.2" />
      <polyline points={toPts(a)} fill="none" stroke="#1a4a73" strokeWidth="2.4" />
      <defs>
        <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MiniBars({ values, color = "#fff" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px] h-16 w-full">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color, opacity: 0.9 }} />
      ))}
    </div>
  );
}

export function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {segments.map((seg) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const offset = c * 0.25 - acc;
          acc += len;
          return <circle key={seg.label} cx="48" cy="48" r={r} fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={dash} strokeDashoffset={offset} />;
        })}
        <circle cx="48" cy="48" r="22" fill="white" />
      </svg>
      <ul className="text-xs space-y-1">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-800">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
