// ============================================================================
// Interactive Chart Component with Period Comparison
// ============================================================================

import { useState, useRef } from 'react';
import type { ChartSeries, PeriodComparison } from '@/types';

// Safe access to window components
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    TOKENS: {
      accent: "#007aff",
      text: "#1d1d1f",
      textSecondary: "#3a3a3c",
      muted: "#6e6e73",
      mutedLight: "#86868b",
      border: "rgba(0,0,0,0.08)",
      borderStrong: "rgba(0,0,0,0.12)",
      surface: "#ffffff",
      bg: "#f5f5f7",
      bgSoft: "#fafafa",
      success: "#34c759",
      warning: "#ff9500",
      danger: "#ff3b30",
      urgent: "#ff3b30",
      high: "#ff9500",
      medium: "#ffb800",
      low: "#34c759",
      purple: "#8e5cf2",
      gold: "#b8860b",
    },
    cx: (...xs: any[]) => xs.filter(Boolean).join(' '),
  };
};

const Icon = getPulseUI().Icon;
const TOKENS = getPulseUI().TOKENS;
const cx = getPulseUI().cx;

interface InteractiveChartProps {
  data: ChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  showComparison?: boolean;
  comparisonData?: PeriodComparison;
  onExport?: () => void;
  className?: string;
}

/**
 * Interactive Chart Component
 */
export function InteractiveChart({
  data,
  title,
  subtitle,
  height = 200,
  showComparison = false,
  comparisonData,
  onExport,
  className,
}: InteractiveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ series: string; index: number } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(data.map(s => s.name)));
  const svgRef = useRef<SVGSVGElement>(null);

  const toggleSeries = (seriesName: string) => {
    const newVisible = new Set(visibleSeries);
    if (newVisible.has(seriesName)) {
      newVisible.delete(seriesName);
    } else {
      newVisible.add(seriesName);
    }
    setVisibleSeries(newVisible);
  };

  const visibleData = data.filter(series => visibleSeries.has(series.name));

  // Calculate dimensions
  const width = 640;
  const padL = 24;
  const padR = 12;
  const padT = showComparison ? 40 : 14;
  const padB = 26;

  const allPoints = visibleData.flatMap(s => s.data);
  const maxY = Math.max(1, ...allPoints.map(p => p.y));
  const stepX = (width - padL - padR) / Math.max(1, allPoints.length - 1);

  const toY = (value: number) => padT + (1 - value / maxY) * (height - padT - padB);
  const toX = (index: number) => padL + index * stepX;

  // Build path for a series
  const buildPath = (series: ChartSeries) => {
    return series.data.reduce((acc, point, i) => {
      return acc + (i === 0 ? `M${toX(i)},${toY(point.y)}` : ` L${toX(i)},${toY(point.y)}`);
    }, '');
  };

  // Build area for a series
  const buildArea = (series: ChartSeries) => {
    return `${buildPath(series)} L${toX(series.data.length - 1)},${height - padB} L${padL},${height - padB} Z`;
  };

  // Export chart as PNG
  const exportChart = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Download
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      onExport?.();
    };

    img.src = url;
  };

  return (
    <div className={cx('bg-white rounded-xl border border-black/6 overflow-hidden', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-[22px] pt-4 pb-3 border-b border-black/5 flex items-center justify-between">
          <div>
            {title && <div className="text-[14.5px] font-semibold tracking-tightish">{title}</div>}
            {subtitle && <div className="text-[12.5px] text-muted-light mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={exportChart}
            className="p-2 rounded-lg hover:bg-black/4 transition-colors"
            title="Export as PNG"
          >
            <Icon name="download" size={16} color={TOKENS.mutedLight} />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="px-[22px] pt-3 pb-2 flex items-center gap-3 flex-wrap">
        {data.map(series => {
          const isVisible = visibleSeries.has(series.name);
          const isActive = hoveredPoint?.series === series.name;

          return (
            <button
              key={series.name}
              onClick={() => toggleSeries(series.name)}
              className={cx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-100',
                isVisible ? 'opacity-100' : 'opacity-40',
                isActive && 'bg-black/4'
              )}
            >
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: series.color }}
              />
              <span>{series.name}</span>
            </button>
          );
        })}

        {/* Period comparison toggle */}
        {comparisonData && (
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-light">Compare</label>
            <button
              onClick={() => {/* Toggle comparison - would update parent state */}}
              className={cx(
                'px-2 py-1 rounded-md text-xs font-medium transition-all duration-100',
                showComparison ? 'bg-accent/10 text-accent' : 'bg-black/4 text-muted-light'
              )}
            >
              {showComparison ? 'On' : 'Off'}
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-[22px] pt-2 pb-[22px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full block"
          style={{ height: `${height}px` }}
        >
          <defs>
            {visibleData.map(series => (
              <linearGradient
                key={`grad-${series.name}`}
                id={`grad-${series.name.replace(/\s+/g, '-')}`}
                x1={0}
                x2={0}
                y1={0}
                y2={1}
              >
                <stop offset="0%" stopColor={series.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={padL}
              x2={width - padR}
              y1={padT + p * (height - padT - padB)}
              y2={padT + p * (height - padT - padB)}
              stroke="rgba(0,0,0,0.05)"
            />
          ))}

          {/* Comparison data (previous period) */}
          {showComparison && comparisonData?.previous && (
            <g opacity={0.4}>
              <path
                d={buildArea({
                  name: 'previous',
                  data: comparisonData.previous,
                  color: TOKENS.mutedLight,
                })}
                fill="url(#grad-comparison)"
              />
              <path
                d={buildPath({
                  name: 'previous',
                  data: comparisonData.previous,
                  color: TOKENS.mutedLight,
                })}
                fill="none"
                stroke={TOKENS.mutedLight}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* Main data series */}
          {visibleData.map(series => (
            <g key={series.name}>
              <path
                d={buildArea(series)}
                fill={`url(#grad-${series.name.replace(/\s+/g, '-')})`}
              />
              <path
                d={buildPath(series)}
                fill="none"
                stroke={series.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover indicators */}
          {hoveredPoint && visibleData.map(series => {
            const point = series.data[hoveredPoint.index];
            if (!point) return null;

            return (
              <g key={`hover-${series.name}`}>
                {/* Vertical line */}
                {hoveredPoint.series === series.name && (
                  <line
                    x1={toX(hoveredPoint.index)}
                    y1={padT}
                    x2={toX(hoveredPoint.index)}
                    y2={height - padB}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                )}

                {/* Point */}
                <circle
                  cx={toX(hoveredPoint.index)}
                  cy={toY(point.y)}
                  r={hoveredPoint.series === series.name ? 6 : 4}
                  fill={series.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              </g>
            );
          })}

          {/* Comparison tooltip */}
          {hoveredPoint && showComparison && comparisonData && (
            <g transform={`translate(${toX(hoveredPoint.index) + 10}, ${padT + 20})`}>
              <rect
                x={0}
                y={0}
                width={120}
                height={50}
                fill="white"
                stroke="rgba(0,0,0,0.1)"
                rx={4}
              />
              <text x={8} y={16} fontSize={11} fill={TOKENS.mutedLight}>
                Current
              </text>
              <text x={8} y={30} fontSize={12} fontWeight="500" fill={TOKENS.text}>
                {visibleData[0]?.data[hoveredPoint.index]?.y || 0}
              </text>
              <text x={8} y={44} fontSize={10} fill={comparisonData.change_percent && comparisonData.change_percent > 0 ? TOKENS.success : TOKENS.danger}>
                {comparisonData.change_percent ? `${comparisonData.change_percent > 0 ? '+' : ''}${comparisonData.change_percent.toFixed(1)}%` : ''}
              </text>
            </g>
          )}

          {/* Invisible overlay for hover detection */}
          {allPoints.length > 0 && (
            <rect
              x={padL}
              y={padT}
              width={width - padL - padR}
              height={height - padT - padB}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const index = Math.round((x - padL) / stepX);
                if (index >= 0 && index < allPoints.length) {
                  // Find which series is closest
                  const y = e.clientY - rect.top;
                  let closestSeries = visibleData[0]?.name;
                  let minDist = Infinity;

                  visibleData.forEach(series => {
                    const point = series.data[index];
                    if (point) {
                      const pointY = toY(point.y);
                      const dist = Math.abs(y - pointY);
                      if (dist < minDist) {
                        minDist = dist;
                        closestSeries = series.name;
                      }
                    }
                  });

                  setHoveredPoint({ series: closestSeries!, index });
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )}

          {/* X-axis labels */}
          {visibleData[0]?.data.map((point, i) => {
            // Show every 2nd label to avoid crowding
            if (i % 2 !== 0) return null;

            const label = typeof point.x === 'string' ? point.x : new Date(point.x).getDate();
            return (
              <text
                key={i}
                x={toX(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="10.5"
                fill={TOKENS.mutedLight}
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Period Comparison Toggle Component
 */
export function PeriodComparisonToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cx(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-100',
            value === option.value
              ? 'bg-accent text-white'
              : 'bg-black/4 text-muted-light hover:bg-black/8'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Export for window global
if (typeof window !== 'undefined') {
  (window as any).InteractiveChart = InteractiveChart;
  (window as any).PeriodComparisonToggle = PeriodComparisonToggle;
}