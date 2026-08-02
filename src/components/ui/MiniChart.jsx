// ============================================================================
// Compact inline chart for rendering small structured datasets (e.g. inside
// AI chat responses) without pulling in a full report-page chart component.
// ============================================================================

import { getPulseUI } from '../../lib/pulse-globals.js';

const { cx } = getPulseUI();

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6'];

export function MiniChart({ type = 'bar', title, data }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  if (type === 'line') {
    const Chart = typeof window !== 'undefined' ? window.InteractiveChart : null;
    if (Chart) {
      const series = [{ name: title || 'Trend', color: CHART_COLORS[0], data: data.map(d => ({ x: d.label, y: d.value })) }];
      return <Chart data={series} title={title} height={160} />;
    }
    // No InteractiveChart registered yet - fall back to a bar view rather than nothing.
  }

  return type === 'donut' ? <MiniDonut title={title} data={data} /> : <MiniBar title={title} data={data} />;
}

function MiniBar({ title, data }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className={cx('mt-1', title && 'pt-0.5')}>
      {title && <div className="text-[11.5px] font-semibold text-muted-light mb-1.5">{title}</div>}
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-[11.5px] text-muted truncate" title={d.label}>{d.label}</div>
            <div className="flex-1 h-4 bg-black/5 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${(d.value / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
            </div>
            <div className="w-8 shrink-0 text-[11.5px] text-muted-light text-right tabular-nums">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniDonut({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  // Precompute each slice's starting offset immutably (running total up to
  // but excluding the current slice) instead of mutating a counter in .map.
  const startFractions = data.reduce((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1].end : 0;
    acc.push({ start: prev, end: prev + d.value / total });
    return acc;
  }, []);

  return (
    <div className="mt-1 flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-20 h-20 shrink-0 -rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circumference;
          const offset = startFractions[i].start * circumference;
          return (
            <circle
              key={d.label}
              cx={50}
              cy={50}
              r={radius}
              fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
        })}
      </svg>
      <div className="flex-1 space-y-1 min-w-0">
        {title && <div className="text-[11.5px] font-semibold text-muted-light mb-1">{title}</div>}
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5 text-[11.5px]">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-muted truncate flex-1">{d.label}</span>
            <span className="text-muted-light tabular-nums shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
