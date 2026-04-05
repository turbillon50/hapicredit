type P = { size?: number; color?: string; className?: string };

export function IconHome({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4v-5.5a1 1 0 00-1-1h-2a1 1 0 00-1 1V21H5a1 1 0 01-1-1v-9.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8.5c-.8-.7-1.8-.7-2.3-.2s-.7 1.5.3 2.5L12 13l2-2.2c1-1 .8-2 .3-2.5s-1.5-.5-2.3.2z" fill={color} opacity="0.9"/>
    </svg>
  );
}

export function IconSolicitar({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
      <line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="11" x2="13" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15.5" cy="16.5" r="3.5" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <line x1="15.5" y1="15" x2="15.5" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="16.5" x2="17" y2="16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMiCredito({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.8"/>
      <line x1="2" y1="9.5" x2="22" y2="9.5" stroke={color} strokeWidth="1.8"/>
      <rect x="5" y="13" width="6" height="2.5" rx="1" fill={color} opacity="0.3"/>
      <path d="M17 14c-.5-.5-1.2-.5-1.5-.1s-.4 1 .2 1.6l1.3 1.3 1.3-1.3c.6-.6.5-1.2.2-1.6s-1-.4-1.5.1z" fill={color} opacity="0.9"/>
    </svg>
  );
}

export function IconPerfil({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="4.5" r="1.2" fill={color} opacity="0.5"/>
    </svg>
  );
}

export function IconAdmin({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconFormulario({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M8 7h8M8 10.5h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="8" y="14" width="3" height="3" rx="0.8" stroke={color} strokeWidth="1.3"/>
      <path d="M9 15.5l.7.7 1.5-1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="13" y="14" width="3" height="3" rx="0.8" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
}

export function IconReloj({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.2" fill={color}/>
    </svg>
  );
}

export function IconDesembolso({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>$</text>
      <path d="M12 2a10 10 0 014 .8" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}

export function IconPagos({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.5"/>
      <text x="12" y="14" textAnchor="middle" fontSize="5" fontWeight="700" fill={color}>$</text>
      <line x1="7" y1="12" x2="8.5" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="15.5" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function IconEquipo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M2 18c0-2.8 3.1-5 7-5s7 2.2 7 5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="17" cy="8" r="2.2" stroke={color} strokeWidth="1.4"/>
      <path d="M18 13.5c1.8.6 3 2 3 3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export function IconEscudo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconCrecimiento({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 18L9 13l3 3 8-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 8h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}

export function IconCelular({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" stroke={color} strokeWidth="1.8"/>
      <line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 8c-.6-.5-1.3-.5-1.7-.1s-.5 1.1.2 1.8L12 11l1.5-1.3c.7-.7.5-1.4.2-1.8s-1.1-.4-1.7.1z" fill={color} opacity="0.7"/>
    </svg>
  );
}

export function IconTelefono({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 4h4l2 5-2.5 1.5A11 11 0 0013.5 15.5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconUbicacion({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export function IconCorazon({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="6" r="2.5" fill={color} opacity="0.8"/>
      <path d="M12 21c0 0-8-5.5-8-10.5C4 7.5 5.8 6 8 6c1.5 0 2.8.8 4 2.2C13.2 6.8 14.5 6 16 6c2.2 0 4 1.5 4 4.5C20 15.5 12 21 12 21z" fill={color}/>
    </svg>
  );
}

export function IconFlecha({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconFlechaAbajo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconAtras({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
