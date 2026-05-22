import { useEffect, useState } from 'react';

type BarVariant = 'accent' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  variant?: BarVariant;
  height?: number;
  label?: string;
  showPercent?: boolean;
  animate?: boolean;
  className?: string;
}

const colorMap: Record<BarVariant, string> = {
  accent:  'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
};

export function ProgressBar({
  value,
  variant = 'accent',
  height = 8,
  label,
  showPercent,
  animate = true,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [width, setWidth] = useState(animate ? 0 : clamped);

  useEffect(() => {
    if (!animate) { setWidth(clamped); return; }
    const t = setTimeout(() => setWidth(clamped), 80);
    return () => clearTimeout(t);
  }, [clamped, animate]);

  const color = colorMap[variant];

  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label    && <span className="text-xs text-gray-500">{label}</span>}
          {showPercent && (
            <span className="text-xs font-semibold" style={{ color }}>{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            transition: animate ? 'width 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
