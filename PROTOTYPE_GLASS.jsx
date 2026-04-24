// Liquid Glass design system primitives for Path2Class

const GlassCard = ({ children, className = '', style = {}, onClick, radius = 24 }) => (
  <div
    onClick={onClick}
    className={`relative ${className}`}
    style={{
      borderRadius: radius,
      background: 'rgba(232, 223, 201, 0.18)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow: '0 20px 50px -12px rgba(30, 58, 95, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
      ...style,
    }}
  >
    {/* Specular top highlight */}
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: radius,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 2px), linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 30%)',
      }}
    />
    <div style={{ position: 'relative', borderRadius: radius }}>{children}</div>
  </div>
);

const GlassButton = ({ children, onClick, variant = 'glass', glow = false, className = '', style = {}, icon = null, disabled = false }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px 22px', borderRadius: 999, fontWeight: 600, fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    border: '1px solid rgba(255,255,255,0.28)',
    letterSpacing: '-0.01em',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(180deg, #9FD8E8 0%, #7BC4D9 100%)',
      color: '#0F2742',
      boxShadow: glow
        ? '0 10px 30px -8px rgba(123,196,217,0.7), 0 0 40px -4px rgba(168,227,245,0.55), inset 0 1px 0 rgba(255,255,255,0.55)'
        : '0 10px 30px -8px rgba(123,196,217,0.45), inset 0 1px 0 rgba(255,255,255,0.45)',
      border: '1px solid rgba(255,255,255,0.35)',
    },
    glass: {
      background: 'rgba(255,255,255,0.35)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      color: '#1E3A5F',
      boxShadow: '0 8px 24px -8px rgba(30,58,95,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
    },
    coral: {
      background: 'linear-gradient(180deg, #F28A7E 0%, #E86A5C 100%)',
      color: '#fff',
      boxShadow: '0 10px 30px -8px rgba(232,106,92,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`glass-btn ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
};

const GlassChip = ({ children, onClick, active = false, accent = 'navy', icon = null, style = {} }) => {
  const accents = {
    navy: { text: '#1E3A5F', border: 'rgba(255,255,255,0.28)', bg: 'rgba(255,255,255,0.35)', glow: 'none' },
    cyan: { text: '#0F2742', border: 'rgba(123,196,217,0.55)', bg: 'rgba(168,227,245,0.35)', glow: '0 0 24px rgba(123,196,217,0.5)' },
    amber: { text: '#6B4A10', border: 'rgba(245,185,70,0.65)', bg: 'rgba(245,185,70,0.28)', glow: '0 0 24px rgba(245,185,70,0.55)' },
    coral: { text: '#6B1A12', border: 'rgba(232,106,92,0.6)', bg: 'rgba(232,106,92,0.22)', glow: '0 0 20px rgba(232,106,92,0.45)' },
  };
  const a = accents[active ? accent : 'navy'];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 999,
        fontSize: 13, fontWeight: 600,
        background: a.bg,
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        color: a.text,
        border: `1px solid ${a.border}`,
        boxShadow: `${a.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        letterSpacing: '-0.005em',
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
};

const GlassIconButton = ({ children, onClick, size = 44, style = {}, ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: size, height: size, borderRadius: 999,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(18px) saturate(160%)',
      WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.32)',
      boxShadow: '0 8px 20px -8px rgba(30,58,95,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
      color: '#1E3A5F',
      cursor: 'pointer',
      transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      ...style,
    }}
  >
    {children}
  </button>
);

// Icons — simple stroke SVGs
const Icon = {
  Pin: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Globe: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>,
  Wheelchair: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="18" r="4"/><circle cx="14" cy="6" r="2"/><path d="M14 8v6h4l2 4M14 14H8"/></svg>,
  Search: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>,
  Chevron: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{transform:`rotate(${p.rot||0}deg)`}}><path d="m9 6 6 6-6 6"/></svg>,
  Sparkle: (p) => <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 14 10 21 12 14 14 12 21 10 14 3 12 10 10Z"/></svg>,
  Clock: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Camera: (p) => <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></svg>,
  Close: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 6 12 12M18 6 6 18"/></svg>,
  Switch: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3 21 7l-4 4M21 7H9M7 21 3 17l4-4M3 17h12"/></svg>,
  Help: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/></svg>,
  Alert: (p) => <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3ZM12 10v5M12 18v.01"/></svg>,
  Check: (p) => <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>,
  Send: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12 20 4l-6 16-3-7-7-1Z"/></svg>,
  Elevator: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M9 9l-2 2 2 2M15 9l2 2-2 2"/></svg>,
  Door: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M14 12h.01"/></svg>,
  ArrowUp: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4M5 11l7-7 7 7"/></svg>,
  Save: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>,
  Flag: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4h12l-2 4 2 4H4"/></svg>,
  Star: (p) => <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.9 6 6.6 1-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 10l6.6-1Z"/></svg>,
  QR: (p) => <svg width={p.size||100} height={p.size||100} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="10" y="10" width="24" height="24" rx="3"/>
    <rect x="18" y="18" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="66" y="10" width="24" height="24" rx="3"/>
    <rect x="74" y="18" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="10" y="66" width="24" height="24" rx="3"/>
    <rect x="18" y="74" width="8" height="8" rx="1" fill="currentColor"/>
    <path d="M44 14h6v10h-6zM58 14h4v6h-4zM44 28h10v4h-10zM66 44h-10v4h10zM42 44h6v6h-6zM52 50h8v8h-8zM66 58v8M78 44v6M86 50v10M70 70v8M82 70h8v4M46 66v6h6M58 80h10M74 86v-4M48 82h-4"/>
  </svg>,
};

Object.assign(window, { GlassCard, GlassButton, GlassChip, GlassIconButton, Icon });
