import { IconBandeja } from '@/components/hapi/HapiIcons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400 text-3xl">
        {icon ?? <IconBandeja size={30} />}
      </div>
      <h3 className="text-[15px] font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
