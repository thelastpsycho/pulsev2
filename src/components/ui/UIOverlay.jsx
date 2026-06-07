// ============================================================================
// Overlay primitives — Modal, Drawer, Dropdown, Toast, Confirm
// All styling via Tailwind classes.
// ============================================================================

import React from 'react';

const { useState, useEffect, useRef } = React;

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, IconButton: () => null, TOKENS: { success: '#34c759', danger: '#ff3b30', accent: '#007aff' }, Button: () => null, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const IconO = getPulseUI().Icon;
const IconBtnO = getPulseUI().IconButton;
const TO = getPulseUI().TOKENS;
const ButtonO = getPulseUI().Button;
const cxO = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

// ---- Modal -----------------------------------------------------------------
function Modal({ children, onClose, title, width = 480, footer, padding = true, className }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className={cxO(
        "fixed inset-0 z-[200] grid place-items-center p-5",
        "bg-black/32 backdrop-blur-sm",
        "animate-gp-fade",
        className,
      )}
      style={{ animationDuration: "160ms" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl flex flex-col overflow-hidden max-h-[90vh] w-full"
        style={{
          width,
          maxWidth: "100%",
          boxShadow: "0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
          animation: "gp-scale 200ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-[22px] py-4 border-b border-black/[.06]">
            <div className="text-base font-semibold tracking-tighter">{title}</div>
            <IconBtnO icon="x" onClick={onClose} size={28}/>
          </div>
        )}
        <div className={cxO("overflow-y-auto flex-1", padding && "px-[22px] py-[18px]")}>
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-[22px] py-3 border-t border-black/[.06] bg-black/[.015]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Drawer (slides from right) -------------------------------------------
function Drawer({ children, onClose, title, width = 480, open, footer, className }) {
  useEffect(() => {
    if (open) {
      const h = (e) => { if (e.key === "Escape") onClose?.(); };
      document.addEventListener("keydown", h);
      return () => document.removeEventListener("keydown", h);
    }
  }, [open, onClose]);

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-[150] bg-black/32 backdrop-blur-sm animate-gp-fade" style={{ animationDuration: "200ms" }}/>}
      <div
        className={cxO(
          "fixed top-0 right-0 bottom-0 z-[160] bg-white flex flex-col",
          className,
        )}
        style={{
          width,
          maxWidth: "92vw",
          transform: open ? "translateX(0)" : "translateX(110%)",
          transition: "transform 280ms cubic-bezier(.2,.7,.2,1)",
          boxShadow: "-20px 0 50px rgba(0,0,0,0.15)",
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-[22px] py-4 border-b border-black/[.06]">
            <div className="text-base font-semibold tracking-tighter">{title}</div>
            <IconBtnO icon="x" onClick={onClose} size={28}/>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-[22px] py-3 border-t border-black/[.06]">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ---- Dropdown menu ---------------------------------------------------------
function Dropdown({ trigger, children, align = "right", width = 200, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div ref={ref} className={cxO("relative inline-block", className)}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div
          className={cxO(
            "absolute z-[60] p-1 rounded-xl",
            "bg-white/98 backdrop-blur-md border border-black/[.06]",
            alignClass,
          )}
          style={{
            top: "calc(100% + 4px)",
            width,
            boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
            animation: "gp-scale 140ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : React.Children.map(children, c => c && React.cloneElement(c, { onSelect: () => setOpen(false) }))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon, label, onClick, onSelect, danger, active, shortcut, className }) {
  const [h, setH] = useState(false);

  const getColorClass = () => {
    if (danger) return "text-danger";
    if (h) return "text-accent";
    return "text-text";
  };

  return (
    <button
      onClick={(e) => { onClick?.(e); onSelect?.(); }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={cxO(
        "flex items-center justify-between w-full py-1.5 px-2.5 border-none rounded-lg",
        "text-[13.5px] font-medium font-[inherit] text-left cursor-pointer",
        "transition-colors duration-100",
        h ? "bg-accent/10" : "bg-transparent",
        getColorClass(),
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {icon && <IconO name={icon} size={14}/>}
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        {shortcut && <kbd className="text-[10.5px] text-muted-light font-mono">{shortcut}</kbd>}
        {active && <IconO name="check" size={13}/>}
      </span>
    </button>
  );
}

function DropdownDivider() {
  return <div className="h-px bg-black/[.06] my-1 mx-1.5"/>;
}

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

  const meta = {
    success: { icon: "check-circle", color: TO.success },
    error: { icon: "x-circle", color: TO.danger },
    info: { icon: "info", color: TO.accent }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map(t => {
        const m = meta[t.kind] || meta.info;
        return (
          <div
            key={t.id}
            className={cxO(
              "flex items-center gap-2.5 px-4 py-3",
              "bg-white/98 backdrop-blur-xl border border-black/[.06] rounded-xl",
              "shadow-lg text-text pointer-events-auto min-w-60 max-w-80",
              "animate-gp-slide-in",
            )}
            style={{
              fontSize: 13.5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
              animationDuration: "280ms",
              animationTimingFunction: "cubic-bezier(.2,.7,.2,1)",
            }}
          >
            <IconO name={m.icon} size={18} color={m.color} strokeWidth={2}/>
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Confirm dialog --------------------------------------------------------
function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onClose, className }) {
  if (!open) return null;

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={420}
      className={className}
      footer={
        <>
          <ButtonO variant="ghost" onClick={onClose}>{cancelLabel}</ButtonO>
          <ButtonO variant={danger ? "danger-solid" : "primary"} onClick={() => { onConfirm?.(); onClose?.(); }}>{confirmLabel}</ButtonO>
        </>
      }
    >
      <div className="text-sm text-text-secondary leading-relaxed">{message}</div>
    </Modal>
  );
}

window.PulseOverlay = { Modal, Drawer, Dropdown, DropdownItem, DropdownDivider, ToastHost, ConfirmDialog };
