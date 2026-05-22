export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  neutral: 'badge-neutral',
  orange:  'badge-orange',
};

export function Badge({ variant, children, size = 'md', className = '' }: BadgeProps) {
  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1',
  }[size];

  return (
    <span className={`inline-flex items-center font-semibold rounded-full leading-none ${variantClass[variant]} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
}

export function urgencyBadge(days: number): { variant: BadgeVariant; label: string } {
  if (days > 30) return { variant: 'danger', label: 'CRÍTICO' };
  if (days > 7)  return { variant: 'orange', label: 'ALTO' };
  if (days > 0)  return { variant: 'warning', label: 'MEDIO' };
  return { variant: 'success', label: 'AL DÍA' };
}

export function statusBadge(status: string): { variant: BadgeVariant; label: string } {
  switch (status) {
    case 'current':   return { variant: 'success', label: 'Al corriente' };
    case 'overdue':   return { variant: 'warning', label: 'En atraso' };
    case 'defaulted': return { variant: 'danger',  label: 'Vencido' };
    case 'inactive':  return { variant: 'neutral', label: 'Inactivo' };
    default:          return { variant: 'neutral', label: status };
  }
}
