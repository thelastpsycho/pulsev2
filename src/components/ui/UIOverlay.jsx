import React, { useState, useEffect, useRef } from 'react'
// ============================================================================
// Overlay primitives — Modal, Drawer, Dropdown, Toast, Confirm
// ============================================================================

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, IconButton: () => null, TOKENS: {}, Button: () => null };
};

const IconO = getPulseUI().Icon;
const IconBtnO = getPulseUI().IconButton;
const TO = getPulseUI().TOKENS;
const ButtonO = getPulseUI().Button;

// ---- Modal -----------------------------------------------------------------
function Modal({ children, onClose, title, width = 480, footer, padding = true }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center",
      background: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)", padding: 20,
      animation: "gp-fade 160ms ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width, maxWidth: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        background: "#fff", borderRadius: 16,
        boxShadow: "0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
        animation: "gp-scale 200ms cubic-bezier(.2,.7,.2,1)",
      }}>
        {title && (
          <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
            <IconBtnO icon="x" onClick={onClose} size={28}/>
          </div>
        )}
        <div style={{ padding: padding ? "18px 22px" : 0, overflowY: "auto", flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: "12px 22px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "flex-end", gap: 8, background: "rgba(0,0,0,0.015)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Drawer (slides from right) -------------------------------------------
function Drawer({ children, onClose, title, width = 480, open, footer }) {
  useEffect(() => {
    if (open) {
      const h = (e) => { if (e.key === "Escape") onClose?.(); };
      document.addEventListener("keydown", h);
      return () => document.removeEventListener("keydown", h);
    }
  }, [open, onClose]);
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", animation: "gp-fade 200ms ease" }}/>}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width, maxWidth: "92vw", zIndex: 160,
        background: "#fff",
        boxShadow: "-20px 0 50px rgba(0,0,0,0.15)",
        transform: open ? "translateX(0)" : "translateX(110%)",
        transition: "transform 280ms cubic-bezier(.2,.7,.2,1)",
        display: "flex", flexDirection: "column",
      }}>
        {title && (
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
            <IconBtnO icon="x" onClick={onClose} size={28}/>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>{children}</div>
        {footer && (
          <div style={{ padding: "12px 22px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>
        )}
      </div>
    </>
  );
}

// ---- Dropdown menu ---------------------------------------------------------
function Dropdown({ trigger, children, align = "right", width = 200 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", [align]: 0, zIndex: 60, width,
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)",
          borderRadius: 10, padding: 4,
          boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
          animation: "gp-scale 140ms ease",
        }}>
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : React.Children.map(children, c => c && React.cloneElement(c, { onSelect: () => setOpen(false) }))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, onSelect, danger, active, shortcut }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={(e) => { onClick?.(e); onSelect?.(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", padding: "7px 10px", border: "none",
        background: h ? "rgba(0,122,255,0.10)" : "transparent",
        color: danger ? TO.danger : (h ? TO.accent : TO.text),
        fontSize: 13.5, fontFamily: "inherit", borderRadius: 6, cursor: "pointer", textAlign: "left",
        fontWeight: 500,
      }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <IconO name={icon} size={14}/>}
        {label}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {shortcut && <kbd style={{ fontSize: 10.5, color: TO.mutedLight, fontFamily: "ui-monospace, monospace" }}>{shortcut}</kbd>}
        {active && <IconO name="check" size={13}/>}
      </span>
    </button>
  );
}

function DropdownDivider() { return <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 6px" }}/>; }

// ---- Toast / Notify --------------------------------------------------------
const _toastListeners = new Set();
function emitToast(t) { _toastListeners.forEach(fn => fn(t)); }
window.toast = {
  success: (msg) => emitToast({ id: Date.now() + Math.random(), kind: "success", message: msg }),
  error: (msg)   => emitToast({ id: Date.now() + Math.random(), kind: "error", message: msg }),
  info: (msg)    => emitToast({ id: Date.now() + Math.random(), kind: "info", message: msg }),
};

function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = (t) => {
      setItems(arr => [...arr, t]);
      setTimeout(() => setItems(arr => arr.filter(x => x.id !== t.id)), 3800);
    };
    _toastListeners.add(fn);
    return () => _toastListeners.delete(fn);
  }, []);
  const meta = { success: { icon: "check-circle", color: TO.success }, error: { icon: "x-circle", color: TO.danger }, info: { icon: "info", color: TO.accent } };
  return (
    <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {items.map(t => {
        const m = meta[t.kind] || meta.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 12px 14px",
            background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            fontSize: 13.5, color: TO.text, pointerEvents: "auto", minWidth: 240, maxWidth: 380,
            animation: "gp-slide-in 280ms cubic-bezier(.2,.7,.2,1)",
          }}>
            <IconO name={m.icon} size={18} color={m.color} strokeWidth={2}/>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Confirm dialog --------------------------------------------------------
function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <Modal title={title} onClose={onClose} width={420} footer={
      <>
        <ButtonO variant="ghost" onClick={onClose}>{cancelLabel}</ButtonO>
        <ButtonO variant={danger ? "danger-solid" : "primary"} onClick={() => { onConfirm?.(); onClose?.(); }}>{confirmLabel}</ButtonO>
      </>
    }>
      <div style={{ fontSize: 14, color: TO.textSecondary, lineHeight: 1.55 }}>{message}</div>
    </Modal>
  );
}

window.PulseOverlay = { Modal, Drawer, Dropdown, DropdownItem, DropdownDivider, ToastHost, ConfirmDialog };
