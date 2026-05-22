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

export function IconFlechaArriba({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconFlechaDerecha({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconFlechaIzquierda({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconNomina({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M7 8h4M7 12h10M7 16h6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="8" r="1.5" fill={color}/>
    </svg>
  );
}

export function IconMas({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
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

export function IconPanel({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8"/>
      <rect x="13" y="3" width="8" height="4" rx="1.5" stroke={color} strokeWidth="1.8"/>
      <rect x="13" y="9" width="8" height="12" rx="2" stroke={color} strokeWidth="1.8"/>
      <rect x="3" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="7" cy="7" r="1.5" fill={color} opacity="0.4"/>
    </svg>
  );
}

export function IconBandeja({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 13h4l2 3h6l2-3h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M8 9h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function IconCartera({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="15" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M3 9h18" stroke={color} strokeWidth="1.8"/>
      <line x1="7" y1="13" x2="11" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="16" x2="9" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="14.5" r="2" stroke={color} strokeWidth="1.3"/>
      <text x="17" y="16.2" textAnchor="middle" fontSize="4" fontWeight="700" fill={color}>$</text>
    </svg>
  );
}

export function IconAlerta({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L2 20h20L12 3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="12" y1="10" x2="12" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1" fill={color}/>
    </svg>
  );
}

export function IconGrupo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="7" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M2 18c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.4"/>
      <path d="M17 13c2.2.3 4 1.8 4 3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M8 3.5c-.4-.3-.8-.3-1.1-.1s-.3.7.1 1.1l1 .9 1-.9c.4-.4.3-.9.1-1.1s-.7-.2-1.1.1z" fill={color} opacity="0.6"/>
    </svg>
  );
}

export function IconArbol({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="4" r="2.5" stroke={color} strokeWidth="1.6"/>
      <line x1="12" y1="6.5" x2="12" y2="10" stroke={color} strokeWidth="1.6"/>
      <line x1="6" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="6" y1="10" x2="6" y2="13" stroke={color} strokeWidth="1.6"/>
      <line x1="12" y1="10" x2="12" y2="13" stroke={color} strokeWidth="1.6"/>
      <line x1="18" y1="10" x2="18" y2="13" stroke={color} strokeWidth="1.6"/>
      <circle cx="6" cy="15" r="2" stroke={color} strokeWidth="1.4"/>
      <circle cx="12" cy="15" r="2" stroke={color} strokeWidth="1.4"/>
      <circle cx="18" cy="15" r="2" stroke={color} strokeWidth="1.4"/>
      <line x1="6" y1="17" x2="6" y2="19" stroke={color} strokeWidth="1.2"/>
      <circle cx="4.5" cy="20.5" r="1.2" fill={color} opacity="0.3"/>
      <circle cx="7.5" cy="20.5" r="1.2" fill={color} opacity="0.3"/>
      <circle cx="12" cy="20" r="1.2" fill={color} opacity="0.3"/>
    </svg>
  );
}

export function IconCheck({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconValidar({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconFinanzas({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 18L9 13l3 3 8-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 8h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}

export function IconCaja({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" stroke={color} strokeWidth="1.8"/>
      <line x1="2" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.8"/>
      <line x1="15" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8"/>
      <rect x="9" y="10" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5"/>
      <text x="12" y="13.5" textAnchor="middle" fontSize="4" fontWeight="700" fill={color}>$</text>
    </svg>
  );
}

export function IconMedalla({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="9" r="6" stroke={color} strokeWidth="1.8"/>
      <path d="M8.5 14l-2 8 5.5-3 5.5 3-2-8" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 6l1 2h2l-1.5 1.5.5 2L12 10.5 10 11.5l.5-2L9 8h2l1-2z" fill={color} opacity="0.4"/>
    </svg>
  );
}

export function IconOjo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="1" fill={color}/>
    </svg>
  );
}

export function IconCerrar({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMoneda({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>$</text>
    </svg>
  );
}

export function IconDocumento({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="8" y1="16.5" x2="13" y2="16.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCalendario({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="13" r="1" fill={color} opacity="0.5"/>
      <circle cx="12" cy="13" r="1" fill={color} opacity="0.5"/>
      <circle cx="16" cy="13" r="1" fill={color} opacity="0.5"/>
    </svg>
  );
}

export function IconPersona({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 21v-2a5 5 0 0116 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconID({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2.5" stroke={color} strokeWidth="1.8"/>
      <circle cx="8" cy="10" r="2.5" stroke={color} strokeWidth="1.4"/>
      <path d="M4 17c0-1.7 1.8-3 4-3s4 1.3 4 3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="14" y1="9" x2="20" y2="9" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="14" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function IconLoader({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" opacity="0.2"/>
      <path d="M12 3a9 9 0 019 9" stroke={color} strokeWidth="2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

export function IconImagen({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="8.5" cy="8.5" r="2" stroke={color} strokeWidth="1.3"/>
      <path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconTarjeta({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M2 10h20" stroke={color} strokeWidth="1.8"/>
      <path d="M6 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMaletin({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="7" width="20" height="13" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth="1.8"/>
      <path d="M12 12v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCamara({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8"/>
    </svg>
  );
}

export function IconBorrar({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCarpeta({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconInfo({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCandado({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1.5" fill={color}/>
    </svg>
  );
}

export function IconCompartir({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke={color} strokeWidth="1.8"/>
    </svg>
  );
}

export function IconTienda({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 9l1-4h16l1 4M3 9v12h18V9M3 9h18" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 21V14h6v7" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconSubir({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconPersonaMas({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M2 21v-2a6 6 0 0112 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19 8v6M16 11h6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconAjustes({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconWhatsapp({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill={color}/>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export function IconBuscar({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8"/>
      <path d="M16 16l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconGrafica({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke={color} strokeWidth="1.8"/>
      <path d="M12 2v10l7.07 4.08" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconDobleCheck({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12l5 5L17 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 12l5 5L22 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconPuntos({ size = 24, color = "currentColor", className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5" r="1.5" fill={color}/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
      <circle cx="12" cy="19" r="1.5" fill={color}/>
    </svg>
  );
}
