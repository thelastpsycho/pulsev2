// ============================================================================
// UI primitives — Icon, Button, Pill, Avatar, Card, KBD, Skeleton
// Apple-minimal aesthetic: light neutrals, system blue accent, subtle shadows
// All styling via Tailwind classes.
// ============================================================================

// ---- Design tokens (kept for JS lookup: SVG fills, chart colors, etc.) -----
const TOKENS = {
  accent: "#007aff",
  text: "#1d1d1f",
  textSecondary: "#3a3a3c",
  muted: "#6e6e73",
  mutedLight: "#86868b",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.12)",
  surface: "#ffffff",
  bg: "#f5f5f7",
  bgSoft: "#fafafa",
  success: "#34c759",
  warning: "#ff9500",
  danger: "#ff3b30",
  urgent: "#ff3b30",
  high: "#ff9500",
  medium: "#ffb800",
  low: "#34c759",
  purple: "#8e5cf2",
  gold: "#b8860b",
};

// Tiny classnames helper
const cx = (...xs) => xs.filter(Boolean).join(" ");

// ---- Icons (SF-style, 1.6 stroke, rounded) ---------------------------------
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, className }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    className,
  };
  switch (name) {
    case "pulse":          return <svg {...props}><path d="M3 12h3l2-6 4 12 2-6h7"/></svg>;
    case "dashboard":      return <svg {...props}><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>;
    case "inbox":          return <svg {...props}><path d="M3 13l2.5-7A2 2 0 0 1 7.4 4.7h9.2a2 2 0 0 1 1.9 1.3L21 13"/><path d="M3 13h5l1 2h6l1-2h5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/></svg>;
    case "bell":           return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case "search":         return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "plus":           return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "filter":         return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case "sort":           return <svg {...props}><path d="M3 6h13M3 12h9M3 18h5M17 4v16M17 20l3-3M17 20l-3-3"/></svg>;
    case "check":          return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case "check-circle":   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>;
    case "x":              return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "x-circle":       return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>;
    case "chevron-down":   return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case "chevron-up":     return <svg {...props}><path d="m6 15 6-6 6 6"/></svg>;
    case "chevron-left":   return <svg {...props}><path d="m15 18-6-6 6-6"/></svg>;
    case "chevron-right":  return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case "arrow-up":       return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case "arrow-down":     return <svg {...props}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case "arrow-right":    return <svg {...props}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case "arrow-left":     return <svg {...props}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
    case "phone":          return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>;
    case "message":        return <svg {...props}><path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12z"/></svg>;
    case "mail":           return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "user":           return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "users":          return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M3 21a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="3"/><path d="M21 19a5 5 0 0 0-6-5"/></svg>;
    case "key":            return <svg {...props}><circle cx="8" cy="15" r="4"/><path d="m21 4-10 10M16 9l3 3"/></svg>;
    case "clock":          return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "star":           return <svg {...props}><path d="m12 3 2.7 5.5L21 9.3l-4.5 4.4 1 6.3L12 17l-5.5 3 1-6.3L3 9.3l6.3-.8L12 3z"/></svg>;
    case "alert":          return <svg {...props}><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
    case "info":           return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>;
    case "tag":            return <svg {...props}><path d="M20.6 13.4 13 21l-9-9V4h8l9 9z"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></svg>;
    case "gift":           return <svg {...props}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M7.5 8a2.5 2.5 0 1 1 2.5-2.5c0 1.4-2.5 2.5-2.5 2.5zM16.5 8a2.5 2.5 0 1 0-2.5-2.5c0 1.4 2.5 2.5 2.5 2.5z"/></svg>;
    case "more":           return <svg {...props}><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>;
    case "more-vertical":  return <svg {...props}><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>;
    case "logout":         return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case "settings":       return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case "edit":           return <svg {...props}><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "trash":          return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
    case "send":           return <svg {...props}><path d="m22 2-11 11M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case "calendar":       return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "building":       return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21V12h6v9M9 7h2M13 7h2M9 11h2M13 11h2"/></svg>;
    case "tags":           return <svg {...props}><path d="M20.6 13.4 13 21l-9-9V4h8l9 9z"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></svg>;
    case "shield":         return <svg {...props}><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "smartphone":    return <svg {...props}><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5"/><path d="M12 18h.01" strokeWidth="2"/></svg>;
    case "report":         return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h6M8 16h4"/></svg>;
    case "chart-bar":      return <svg {...props}><path d="M7 17v-6M12 17V7M17 17v-9M3 21h18"/></svg>;
    case "chart-line":     return <svg {...props}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case "chart-pie":      return <svg {...props}><path d="M12 2v10l9-2a9 9 0 1 1-9-8z"/><path d="M21 10A9 9 0 0 0 12 1v9h9z"/></svg>;
    case "book":           return <svg {...props}><path d="M3 5a2 2 0 0 1 2-2h14v18H5a2 2 0 0 1-2-2V5z"/><path d="M3 19a2 2 0 0 1 2-2h14"/></svg>;
    case "external":       return <svg {...props}><path d="M14 3h7v7M10 14 21 3M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></svg>;
    case "download":       return <svg {...props}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>;
    case "upload":         return <svg {...props}><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>;
    case "file":           return <svg {...props}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/></svg>;
    case "image":          return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m21 15-5-5-9 9"/></svg>;
    case "paperclip":      return <svg {...props}><path d="M21 12 12 21a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/></svg>;
    case "globe":          return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "home":           return <svg {...props}><path d="m3 11 9-8 9 8M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9"/></svg>;
    case "moon":           return <svg {...props}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>;
    case "sun":            return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case "refresh":        return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>;
    case "eye":            return <svg {...props}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eye-off":        return <svg {...props}><path d="M9.9 4.24A10.5 10.5 0 0 1 12 4c6 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 12s4 8 10 8a10.5 10.5 0 0 0 4.39-.91M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>;
    case "kanban":         return <svg {...props}><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="11" y="3" width="6" height="12" rx="1"/><rect x="19" y="3" width="2" height="9" rx="1"/></svg>;
    case "list":           return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case "grid":           return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "menu":           return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case "crown":          return <svg {...props}><path d="m3 8 4 4 5-7 5 7 4-4-2 12H5z"/></svg>;
    default:               return null;
  }
}

// ---- Avatar ----------------------------------------------------------------
// Dynamic per-name hue rendered via inline styles
function Avatar({ name, size = 32, className }) {
  const initials = (name || "?").replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Sheikh|Sir)\s+/i, "")
    .split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  const hue = [...(name || "x")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const fontPx = Math.round(size * 0.38);
  return (
    <div
      className={cx(
        "rounded-full shrink-0 grid place-items-center font-semibold tracking-tightish",
        className,
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: `hsl(${hue}, 32%, 88%)`,
        color: `hsl(${hue}, 40%, 30%)`,
        fontSize: `${fontPx}px`
      }}
    >{initials}</div>
  );
}

// ---- Pill / Badge ----------------------------------------------------------
function Pill({ children, color = "#1d1d1f", bg, dot = false, className }) {
  const bgColor = bg || color + "1a";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap leading-tight tracking-body",
        "text-[11.5px]",
        dot ? "gap-1.5 py-[3px] pl-[7px] pr-[9px]" : "gap-1 py-[2.5px] px-2",
        className,
      )}
      style={{ color, backgroundColor: bgColor }}
    >
      {dot && <span style={{ backgroundColor: color }} className="w-1.5 h-1.5 rounded-full"/>}
      {children}
    </span>
  );
}

const PRIORITY = {
  urgent: { label: "Urgent", color: TOKENS.urgent },
  high:   { label: "High",   color: TOKENS.high },
  medium: { label: "Medium", color: TOKENS.medium },
  low:    { label: "Low",    color: TOKENS.low },
};
const STATUS = {
  open:   { label: "Open",   color: TOKENS.accent },
  closed: { label: "Closed", color: TOKENS.success },
};

function PriorityPill({ value }) { const m = PRIORITY[value] || PRIORITY.medium; return <Pill color={m.color} dot>{m.label}</Pill>; }
function StatusPill({ value })   { const m = STATUS[value] || STATUS.open; return <Pill color={m.color}>{m.label}</Pill>; }

// ---- Button ----------------------------------------------------------------
function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, disabled, loading, type = "button", title, className, fullWidth }) {
  const sizes = {
    xs: { cls: "py-1 px-2 text-xs gap-[5px] rounded-md", icon: 13 },
    sm: { cls: "py-[5px] px-2.5 text-[12.5px] gap-[5px] rounded-[7px]", icon: 14 },
    md: { cls: "py-[7px] px-[13px] text-[13.5px] gap-1.5 rounded-lg", icon: 15 },
    lg: { cls: "py-2.5 px-[18px] text-[15px] gap-2 rounded-[10px]", icon: 17 },
  }[size];
  const variants = {
    primary:        "bg-accent text-white border-none hover:bg-accent-hover",
    secondary:      "bg-[#f2f2f5] text-text border border-black/4 hover:bg-[#e7e7eb]",
    ghost:          "bg-transparent text-text border-none hover:bg-black/5",
    outline:        "bg-white text-text border border-black/10 hover:bg-bg-soft",
    danger:         "bg-danger/10 text-danger border-none hover:bg-danger/18",
    "danger-solid": "bg-danger text-white border-none hover:bg-danger-hover",
    success:        "bg-success text-white border-none hover:bg-success-hover",
  }[variant];
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading} title={title}
      className={cx(
        "inline-flex items-center justify-center font-medium tracking-body",
        "transition-colors duration-120 font-[inherit] leading-tight",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        loading && "cursor-not-allowed",
        fullWidth ? "w-full" : "w-auto",
        sizes.cls,
        variants,
        className,
      )}>
      {loading ? <Spinner size={sizes.icon}/> : icon && <Icon name={icon} size={sizes.icon}/>}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={sizes.icon}/>}
    </button>
  );
}

// ---- Icon button -----------------------------------------------------------
function IconButton({ icon, onClick, title, size = 32, active, className, disabled }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={cx(
        "rounded-lg border-none grid place-items-center transition-colors duration-120",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active
          ? "bg-accent/10 text-accent hover:bg-accent/10"
          : "bg-transparent text-text hover:bg-black/5",
        `w-[${size}px] h-[${size}px]`,
        !disabled && "cursor-pointer",
        className,
      )}>
      <Icon name={icon} size={size * 0.5}/>
    </button>
  );
}

// ---- Card ------------------------------------------------------------------
function Card({ children, className, padding, hover, onClick }) {
  const padCls = padding != null
    ? (typeof padding === "number" ? `p-[${padding}px]` : `p-${padding}`)
    : "";
  return (
    <div onClick={onClick}
      className={cx(
        "bg-white rounded-xl border border-black/6 overflow-hidden",
        "transition-shadow duration-200",
        hover && "hover:shadow-card-hover",
        onClick ? "cursor-pointer" : "cursor-default",
        padCls,
        className,
      )}>{children}</div>
  );
}

function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cx(
      "pt-4 pb-3.5 px-[22px] border-b border-black/5",
      "flex items-center justify-between gap-3",
      className,
    )}>
      <div>
        <div className="text-[14.5px] font-semibold tracking-tightish">{title}</div>
        {subtitle && <div className="text-[12.5px] text-muted-light mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ---- Skeleton --------------------------------------------------------------
function Skeleton({ width = "100%", height = 14, radius = 6, className }) {
  const w = typeof width === "number" ? `w-[${width}px]` : "w-full";
  const h = typeof height === "number" ? `h-[${height}px]` : `h-[${height}]`;
  const r = `rounded-[${radius}px]`;
  return <div className={cx(
    w, h, r,
    "bg-linear-to-r from-[#f0f0f3] via-[#e7e7eb] to-[#f0f0f3] bg-size-[200%_100%]",
    "animate-shimmer",
    className,
  )}/>;
}

// ---- Spinner ---------------------------------------------------------------
function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-gp-spin">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="14 60" opacity="0.9"/>
    </svg>
  );
}

// ---- Empty state -----------------------------------------------------------
function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-[14px] bg-bg inline-grid place-items-center mb-3.5">
        <Icon name={icon} size={26} color={TOKENS.mutedLight}/>
      </div>
      <div className="text-[15px] font-semibold text-text mb-1">{title}</div>
      {description && <div className={cx("text-[13.5px] text-muted max-w-[320px] mx-auto", action && "mb-[18px]")}>{description}</div>}
      {action && <div className="mt-[18px]">{action}</div>}
    </div>
  );
}

// ---- KBD -------------------------------------------------------------------
function Kbd({ children }) {
  return <kbd className={cx(
    "inline-flex items-center justify-center px-1.5 py-px",
    "bg-[#f2f2f5] rounded-[5px] border border-black/8 shadow-kbd",
    "text-[11px] font-mono text-muted min-w-[18px]",
  )}>{children}</kbd>;
}

// Also attach to window for legacy code
window.PulseUI = {
  TOKENS, Icon, Avatar, Pill, PriorityPill, StatusPill, PRIORITY, STATUS,
  Button, IconButton, Card, CardHeader, Skeleton, Spinner, EmptyState, Kbd,
  cx,
};

// ES module exports for modern imports
export { TOKENS, Icon, Avatar, Pill, PriorityPill, StatusPill, PRIORITY, STATUS, Button, IconButton, Card, CardHeader, Skeleton, Spinner, EmptyState, Kbd, cx };
