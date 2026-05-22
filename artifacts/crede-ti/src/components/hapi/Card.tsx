interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({ children, className = '', onClick, pressable, padding = 'md' }: CardProps) {
  return (
    <div
      className={`card ${paddingClass[padding]} ${pressable || onClick ? 'pressable' : ''} ${className}`}
      onClick={onClick}
      style={{ padding: undefined }}
    >
      {children}
    </div>
  );
}

export function HeroCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`hero-gradient rounded-2xl p-5 text-white ${className}`}>
      {children}
    </div>
  );
}
