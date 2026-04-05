interface SkeletonProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: string;
}

export function Skeleton({ className = '', height = 16, width, rounded = '8px' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, width, borderRadius: rounded }}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton height={40} width={40} rounded="10px" />
        <div className="flex-1">
          <Skeleton height={14} className="mb-2 w-1/2" />
          <Skeleton height={11} className="w-1/3" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} className={`mb-2 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={2} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="hero-gradient rounded-2xl p-6 mb-4 mx-4">
      <Skeleton height={12} width={80} className="mb-3 opacity-30" />
      <Skeleton height={40} width={180} className="mb-2 opacity-40" />
      <Skeleton height={10} width={140} className="opacity-30" />
    </div>
  );
}
