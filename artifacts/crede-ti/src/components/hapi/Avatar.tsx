const PALETTE = ['#1e3a8a','var(--text-secondary)','var(--text-secondary)','var(--text-secondary)','#9a3412','#0e7490','#0f766e','#1d4ed8','var(--text-secondary)','#b45309'];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  photoUrl?: string | null;
}

export function Avatar({ name, size = 'md', className = '', photoUrl }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  const bg = hashColor(name);
  const sizeClass = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${className}`}
      style={{ background: photoUrl ? 'var(--surface-3)' : bg }}
    >
      {photoUrl
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}
