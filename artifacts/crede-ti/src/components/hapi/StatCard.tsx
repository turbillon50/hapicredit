import { useEffect, useState } from 'react';
import { IconFlechaArriba, IconFlechaAbajo } from '@/components/hapi/HapiIcons';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  prefix?: string;
  subLabel?: string;
  delta?: number;
  deltaLabel?: string;
  className?: string;
}

function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = Math.ceil(duration / 16);
    const inc = target / steps;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      start += inc;
      if (frame >= steps) { setVal(target); clearInterval(id); return; }
      setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

export function StatCard({ icon, iconBg, iconColor, label, value, prefix = '', subLabel, delta, deltaLabel, className = '' }: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const counted = useCountUp(isNumeric ? (value as number) : 0);
  const display = isNumeric ? counted : value;

  const positive = delta !== undefined && delta >= 0;

  return (
    <div className={`card flex flex-col ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
          style={{ background: iconBg ?? 'rgba(37,99,235,0.1)', color: iconColor ?? 'var(--accent)' }}
        >
          {icon}
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {positive ? <IconFlechaArriba size={12} /> : <IconFlechaAbajo size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-[22px] font-bold text-gray-900 tracking-tight leading-none fade-up">
        {prefix}{typeof display === 'number' ? display.toLocaleString('es-MX') : display}
      </div>
      <div className="text-xs font-medium text-gray-500 mt-1.5 leading-tight">{label}</div>
      {(subLabel || deltaLabel) && (
        <div className="text-[11px] text-gray-400 mt-0.5">{subLabel ?? deltaLabel}</div>
      )}
    </div>
  );
}
