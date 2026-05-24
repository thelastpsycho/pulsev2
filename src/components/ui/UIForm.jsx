import React, { useState, useEffect, useRef } from 'react'
// ============================================================================
// Form primitives — Input, Textarea, Select, MultiSelect, Field, Checkbox,
// Toggle, DatePicker (date input wrapper)
// ============================================================================

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, TOKENS: { textSecondary: '#6e6e73', danger: '#dc3a3a' } };
};

const IconF = getPulseUI().Icon;
const TF = getPulseUI().TOKENS;

// ---- Field wrapper (label + helper + error) -------------------------------
function Field({ label, hint, error, required, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: TF.textSecondary, marginBottom: 6, letterSpacing: "-0.005em" }}>
          {label}
          {required && <span style={{ color: TF.danger, marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div style={{ fontSize: 11.5, color: TF.mutedLight, marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11.5, color: TF.danger, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><IconF name="alert" size={11} color={TF.danger}/>{error}</div>}
    </div>
  );
}

// ---- Input -----------------------------------------------------------------
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 9, fontFamily: "inherit", fontSize: 14, color: TF.text,
  outline: "none", background: "#fff", letterSpacing: "-0.003em",
  boxSizing: "border-box", transition: "border-color 100ms, box-shadow 100ms",
};

function Input({ value, onChange, placeholder, type = "text", icon, suffix, disabled, error, style, autoFocus, onKeyDown, name }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {icon && (
        <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <IconF name={icon} size={15} color={focused ? TF.accent : TF.mutedLight}/>
        </div>
      )}
      <input
        type={type} value={value ?? ""} name={name}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} onKeyDown={onKeyDown}
        style={{
          ...inputStyle,
          paddingLeft: icon ? 34 : 12, paddingRight: suffix ? 32 : 12,
          borderColor: error ? TF.danger : (focused ? TF.accent : "rgba(0,0,0,0.10)"),
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(255,59,48,0.15)" : "rgba(0,122,255,0.15)"}` : "none",
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}/>
      {suffix && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>{suffix}</div>}
    </div>
  );
}

// ---- Textarea --------------------------------------------------------------
function Textarea({ value, onChange, placeholder, rows = 4, disabled, error, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value ?? ""} onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      placeholder={placeholder} rows={rows} disabled={disabled}
      style={{
        ...inputStyle, resize: "vertical", lineHeight: 1.55,
        borderColor: error ? TF.danger : (focused ? TF.accent : "rgba(0,0,0,0.10)"),
        boxShadow: focused ? `0 0 0 3px ${error ? "rgba(255,59,48,0.15)" : "rgba(0,122,255,0.15)"}` : "none",
        ...style,
      }}/>
  );
}

// ---- Select ----------------------------------------------------------------
function Select({ value, onChange, options, placeholder = "Select…", disabled, error, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value ?? ""} onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          ...inputStyle, appearance: "none", paddingRight: 32, cursor: disabled ? "not-allowed" : "pointer",
          borderColor: error ? TF.danger : (focused ? TF.accent : "rgba(0,0,0,0.10)"),
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(255,59,48,0.15)" : "rgba(0,122,255,0.15)"}` : "none",
          ...style,
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
      </div>
    </div>
  );
}

// ---- MultiSelect (chip-based, with searchable dropdown) -------------------
function MultiSelect({ value = [], onChange, options, placeholder = "Select…", style }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.filter(o => value.includes(o.value));
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => setOpen(o => !o)} style={{
        ...inputStyle, minHeight: 38, padding: "5px 32px 5px 8px", cursor: "pointer",
        display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center",
        borderColor: open ? TF.accent : "rgba(0,0,0,0.10)",
        boxShadow: open ? "0 0 0 3px rgba(0,122,255,0.15)" : "none",
      }}>
        {selected.length === 0 && <span style={{ color: TF.mutedLight, fontSize: 13.5, padding: "2px 4px" }}>{placeholder}</span>}
        {selected.map(o => (
          <span key={o.value} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 8px", background: "rgba(0,122,255,0.10)", color: TF.accent,
            borderRadius: 6, fontSize: 12, fontWeight: 500,
          }}>
            {o.label}
            <button onClick={(e) => { e.stopPropagation(); toggle(o.value); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "grid", placeItems: "center", color: "inherit" }}>
              <IconF name="x" size={11} strokeWidth={2}/>
            </button>
          </span>
        ))}
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
          <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
        </div>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", borderRadius: 10, padding: 4,
          boxShadow: "0 10px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
          maxHeight: 280, overflowY: "auto",
        }}>
          <div style={{ padding: 4, position: "sticky", top: 0, background: "#fff" }}>
            <Input value={q} onChange={setQ} icon="search" placeholder="Search…" style={{ padding: "6px 10px 6px 30px", fontSize: 13 }}/>
          </div>
          {filtered.length === 0 && <div style={{ padding: "16px 12px", textAlign: "center", color: TF.mutedLight, fontSize: 13 }}>No matches</div>}
          {filtered.map(o => (
            <div key={o.value} onClick={() => toggle(o.value)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              borderRadius: 6, cursor: "pointer", fontSize: 13.5,
              background: value.includes(o.value) ? "rgba(0,122,255,0.06)" : "transparent",
            }}
            onMouseEnter={(e) => { if (!value.includes(o.value)) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e) => { if (!value.includes(o.value)) e.currentTarget.style.background = "transparent"; }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                border: `1.5px solid ${value.includes(o.value) ? TF.accent : "rgba(0,0,0,0.20)"}`,
                background: value.includes(o.value) ? TF.accent : "transparent",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                {value.includes(o.value) && <IconF name="check" size={10} color="#fff" strokeWidth={3}/>}
              </div>
              <span style={{ color: TF.text, flex: 1 }}>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Checkbox --------------------------------------------------------------
function Checkbox({ checked, onChange, label, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange?.(e.target.checked)} disabled={disabled} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}/>
      <span style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1.5px solid ${checked ? TF.accent : "rgba(0,0,0,0.22)"}`,
        background: checked ? TF.accent : "transparent",
        display: "grid", placeItems: "center", transition: "all 100ms",
      }}>
        {checked && <IconF name="check" size={11} color="#fff" strokeWidth={3}/>}
      </span>
      {label && <span style={{ fontSize: 13.5, color: TF.text }}>{label}</span>}
    </label>
  );
}

// ---- Toggle ----------------------------------------------------------------
function Toggle({ checked, onChange, label, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <button type="button" onClick={() => !disabled && onChange?.(!checked)} disabled={disabled} style={{
        width: 38, height: 22, borderRadius: 22, border: "none",
        background: checked ? TF.success : "rgba(120,120,128,0.32)",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer", padding: 0,
        transition: "background 200ms", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2, width: 18, height: 18,
          background: "#fff", borderRadius: 18,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.04)",
          transition: "left 200ms cubic-bezier(.2,.7,.2,1)",
        }}/>
      </button>
      {label && <span style={{ fontSize: 13.5, color: TF.text }}>{label}</span>}
    </label>
  );
}

// ---- SearchableSelect (single select with search) ---------------------------
function SearchableSelect({ value, onChange, options, placeholder = "Select…", disabled, error, style }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => !disabled && setOpen(o => !o)} style={{
        ...inputStyle, minHeight: 38, padding: "9px 32px 9px 12px", cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderColor: error ? TF.danger : (open ? TF.accent : "rgba(0,0,0,0.10)"),
        boxShadow: open ? "0 0 0 3px rgba(0,122,255,0.15)" : "none",
        opacity: disabled ? 0.6 : 1,
      }}>
        <span style={{ color: selectedOption ? TF.text : TF.mutedLight, fontSize: 14 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
        </div>
      </div>
      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", borderRadius: 10, padding: 4,
          boxShadow: "0 10px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
          maxHeight: 280, overflowY: "auto",
        }}>
          <div style={{ padding: 4, position: "sticky", top: 0, background: "#fff" }}>
            <Input value={q} onChange={setQ} icon="search" placeholder="Search…" style={{ padding: "6px 10px 6px 30px", fontSize: 13 }}/>
          </div>
          {filtered.length === 0 && <div style={{ padding: "16px 12px", textAlign: "center", color: TF.mutedLight, fontSize: 13 }}>No matches</div>}
          {filtered.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              borderRadius: 6, cursor: "pointer", fontSize: 13.5,
              background: value === o.value ? "rgba(0,122,255,0.06)" : "transparent",
            }}
            onMouseEnter={(e) => { if (value !== o.value) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e) => { if (value !== o.value) e.currentTarget.style.background = "transparent"; }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                border: `1.5px solid ${value === o.value ? TF.accent : "rgba(0,0,0,0.20)"}`,
                background: value === o.value ? TF.accent : "transparent",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                {value === o.value && <IconF name="check" size={10} color="#fff" strokeWidth={3}/>}
              </div>
              <span style={{ color: TF.text, flex: 1 }}>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Segmented control -----------------------------------------------------
function Segmented({ value, onChange, options, style }) {
  return (
    <div style={{ display: "inline-flex", padding: 2, background: "rgba(118,118,128,0.12)", borderRadius: 9, gap: 0, ...style }}>
      {options.map(o => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        const active = value === v;
        return (
          <button key={v} onClick={() => onChange?.(v)} style={{
            padding: "5px 12px", border: "none",
            background: active ? "#fff" : "transparent",
            color: active ? TF.text : TF.muted,
            fontSize: 12.5, fontWeight: 500, fontFamily: "inherit",
            borderRadius: 7, cursor: "pointer",
            boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)" : "none",
            transition: "all 120ms",
          }}>{l}</button>
        );
      })}
    </div>
  );
}

window.PulseForm = { Field, Input, Textarea, Select, MultiSelect, SearchableSelect, Checkbox, Toggle, Segmented };
