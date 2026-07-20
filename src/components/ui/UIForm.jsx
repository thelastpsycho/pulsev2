// ============================================================================
// Form primitives — Input, Textarea, Select, MultiSelect, Field, Checkbox,
// Toggle, DatePicker (date input wrapper)
// All styling via Tailwind classes.
// ============================================================================

import React from 'react';

const { useState, useEffect, useRef } = React;

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, TOKENS: { textSecondary: '#6e6e73', danger: '#dc3a3a', accent: '#007aff', mutedLight: '#86868b' }, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const IconF = getPulseUI().Icon;
const TF = getPulseUI().TOKENS;
const cxF = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

// ---- Field wrapper (label + helper + error) -------------------------------
function Field({ label, hint, error, required, children, className }) {
  return (
    <div className={cxF("mb-3.5", className)}>
      {label && (
        <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 tracking-body">
          {label}
          {required && <span className="text-danger ml-[3px]">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="text-[11.5px] text-muted-light mt-[5px]">{hint}</div>}
      {error && <div className="text-[11.5px] text-danger mt-[5px] flex items-center gap-1"><IconF name="alert" size={11} color={TF.danger}/>{error}</div>}
    </div>
  );
}

// Shared input base classes
const INPUT_BASE = "w-full py-[9px] px-3 rounded-[9px] font-[inherit] text-sm text-text bg-white outline-none box-border transition-[border-color,box-shadow] duration-100 tracking-body";

function borderClasses({ focused, error }) {
  if (error) return focused ? "border border-danger shadow-[0_0_0_3px_rgba(255,59,48,0.15)]" : "border border-danger";
  return focused ? "border border-accent shadow-[0_0_0_3px_rgba(0,122,255,0.15)]" : "border border-black/10";
}

// ---- Input -----------------------------------------------------------------
function Input({ value, onChange, placeholder, type = "text", icon, suffix, disabled, error, className, autoFocus, onKeyDown, name, inputRef }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none">
          <IconF name={icon} size={15} color={focused ? TF.accent : TF.mutedLight}/>
        </div>
      )}
      <input
        ref={inputRef}
        type={type} value={value ?? ""} name={name}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} onKeyDown={onKeyDown}
        className={cxF(
          INPUT_BASE,
          borderClasses({ focused, error }),
          icon ? "pl-[34px]" : "pl-3",
          suffix ? "pr-8" : "pr-3",
          disabled && "opacity-60",
          className,
        )}/>
      {suffix && <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

// ---- Textarea --------------------------------------------------------------
function Textarea({ value, onChange, placeholder, rows = 4, disabled, error, className }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value ?? ""} onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      placeholder={placeholder} rows={rows} disabled={disabled}
      className={cxF(
        INPUT_BASE,
        borderClasses({ focused, error }),
        "resize-y leading-[1.55]",
        className,
      )}/>
  );
}

// ---- Select ----------------------------------------------------------------
function Select({ value, onChange, options, placeholder = "Select…", disabled, error, className }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        value={value ?? ""} onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        disabled={disabled}
        className={cxF(
          INPUT_BASE,
          borderClasses({ focused, error }),
          "appearance-none pr-8",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
      </div>
    </div>
  );
}

// ---- MultiSelect (chip-based, with searchable dropdown) -------------------
function MultiSelect({ value = [], onChange, options, placeholder = "Select…", className }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.filter(o => value.includes(o.value));
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  const toggleOption = (v) => {
    toggle(v);
    setQ("");
  };

  const close = () => {
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} className={cxF("relative", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cxF(
          INPUT_BASE,
          "min-h-[38px] py-[5px] pl-2 pr-8 cursor-text",
          "flex flex-wrap gap-1 items-center",
          borderClasses({ focused: focused || open, error: false }),
        )}>
        {selected.map(o => (
          <span key={o.value} className="inline-flex items-center gap-[5px] py-0.5 px-2 bg-accent/10 text-accent rounded-md text-xs font-medium">
            {o.label}
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={e => { e.stopPropagation(); toggle(o.value); }}
              className="bg-none border-none p-0 cursor-pointer grid place-items-center text-current">
              <IconF name="x" size={11} strokeWidth={2}/>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === "Escape") {
              close();
              inputRef.current?.blur();
            }
            if (e.key === "Backspace" && q === "" && selected.length > 0) {
              toggle(selected[selected.length - 1].value);
            }
          }}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent border-none outline-none py-0.5 px-1 text-sm text-text font-[inherit] tracking-body placeholder:text-muted-light"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => e.preventDefault()}
          onClick={e => {
            e.stopPropagation();
            if (open) {
              close();
              inputRef.current?.blur();
            } else {
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer grid place-items-center"
        >
          <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
        </button>
      </div>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-[10px] p-1 shadow-popover max-h-[380px] overflow-y-auto">
          {filtered.length > 0 && (
            <div
              onMouseDown={e => {
                e.preventDefault();
                const allSelected = filtered.every(o => value.includes(o.value));
                if (allSelected) {
                  onChange(value.filter(v => !filtered.some(o => o.value === v)));
                } else {
                  onChange([...value, ...filtered.filter(o => !value.includes(o.value)).map(o => o.value)]);
                }
                setQ("");
              }}
              className="flex items-center gap-2 py-2 px-2.5 rounded-md cursor-pointer text-[13px] font-semibold text-accent hover:bg-accent/6 mb-1">
              <div className="w-4 h-4 rounded grid place-items-center shrink-0 border-[1.5px] border-accent bg-transparent">
                {filtered.every(o => value.includes(o.value)) && <IconF name="check" size={10} color="#007aff" strokeWidth={3}/>}
              </div>
              <span>{filtered.every(o => value.includes(o.value)) ? 'Deselect all' : 'Select all'}</span>
            </div>
          )}
          {filtered.length === 0 && <div className="py-4 px-3 text-center text-muted-light text-[13px]">No matches</div>}
          {filtered.map(o => {
            const isSel = value.includes(o.value);
            return (
              <div
                key={o.value}
                onMouseDown={e => { e.preventDefault(); toggleOption(o.value); }}
                className={cxF(
                  "flex items-center gap-2 py-2 px-2.5 rounded-md cursor-pointer text-[13.5px]",
                  isSel ? "bg-accent/6" : "bg-transparent hover:bg-black/3",
                )}>
                <div className={cxF(
                  "w-4 h-4 rounded grid place-items-center shrink-0",
                  isSel ? "border-[1.5px] border-accent bg-accent" : "border-[1.5px] border-black/20 bg-transparent",
                )}>
                  {isSel && <IconF name="check" size={10} color="#fff" strokeWidth={3}/>}
                </div>
                <span className="text-text flex-1">{o.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- SearchableSelect (single select with search) -----------------------
function SearchableSelect({ value, onChange, options, placeholder = "Select…", disabled, error, className }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const inputValue = open ? q : (selectedOption?.label ?? "");

  const close = () => {
    setOpen(false);
    setQ("");
  };

  const selectOption = (optionValue) => {
    onChange(optionValue);
    close();
    inputRef.current?.blur();
  };

  return (
    <div ref={ref} className={cxF("relative", className)}>
      <div className={cxF(
        INPUT_BASE,
        "min-h-[38px] py-0 px-0 pr-8",
        "flex items-center",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-text",
        borderClasses({ focused: focused || open, error }),
      )}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setQ(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { if (!disabled) { setFocused(true); setOpen(true); } }}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === "Escape") {
              close();
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent border-none outline-none py-[9px] pl-3 pr-0 text-sm text-text font-[inherit] tracking-body placeholder:text-muted-light disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            if (disabled) return;
            if (open) {
              close();
              inputRef.current?.blur();
            } else {
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0 border-none bg-transparent cursor-pointer disabled:cursor-not-allowed grid place-items-center"
        >
          <IconF name="chevron-down" size={14} color={TF.mutedLight}/>
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-[10px] p-1 shadow-popover max-h-[380px] overflow-y-auto">
          {filtered.length === 0 && <div className="py-4 px-3 text-center text-muted-light text-[13px]">No matches</div>}
          {filtered.map(o => {
            const isSelected = value === o.value;
            return (
              <div
                key={o.value}
                onMouseDown={e => { e.preventDefault(); selectOption(o.value); }}
                className={cxF(
                  "flex items-center gap-2 py-2 px-2.5 rounded-md cursor-pointer text-[13.5px]",
                  isSelected ? "bg-accent/6" : "bg-transparent hover:bg-black/3",
                )}>
                <div className={cxF(
                  "w-4 h-4 rounded grid place-items-center shrink-0",
                  isSelected ? "border-[1.5px] border-accent bg-accent" : "border-[1.5px] border-black/20 bg-transparent",
                )}>
                  {isSelected && <IconF name="check" size={10} color="#fff" strokeWidth={3}/>}
                </div>
                <span className="text-text flex-1">{o.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Checkbox --------------------------------------------------------------
function Checkbox({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cxF(
      "inline-flex items-center gap-2",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      className,
    )}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange?.(e.target.checked)} disabled={disabled} className="absolute opacity-0 w-0 h-0"/>
      <span className={cxF(
        "w-4 h-4 rounded grid place-items-center transition-all duration-100",
        checked ? "border-[1.5px] border-accent bg-accent" : "border-[1.5px] border-black/22 bg-transparent",
      )}>
        {checked && <IconF name="check" size={11} color="#fff" strokeWidth={3}/>}
      </span>
      {label && <span className="text-[13.5px] text-text">{label}</span>}
    </label>
  );
}

// ---- Toggle ----------------------------------------------------------------
function Toggle({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cxF(
      "inline-flex items-center gap-2.5",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      className,
    )}>
      <button type="button" onClick={() => !disabled && onChange?.(!checked)} disabled={disabled} className={cxF(
        "w-[38px] h-[22px] rounded-[22px] border-none relative p-0 transition-colors duration-200 shrink-0",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-success" : "bg-[rgba(120,120,128,0.32)]",
      )}>
        <div className={cxF(
          "absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full",
          "shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.04)]",
          "transition-[left] duration-200 ease-[cubic-bezier(.2,.7,.2,1)]",
          checked ? "left-[18px]" : "left-0.5",
        )}/>
      </button>
      {label && <span className="text-[13.5px] text-text">{label}</span>}
    </label>
  );
}

// ---- Segmented control -----------------------------------------------------
function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cxF(
      "inline-flex p-0.5 rounded-[9px] gap-0",
      "bg-[rgba(118,118,128,0.12)]",
      className,
    )}>
      {options.map(o => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        const active = value === v;
        return (
          <button key={v} onClick={() => onChange?.(v)} className={cxF(
            "py-[5px] px-3 border-none rounded-[7px] text-[12.5px] font-medium font-[inherit] cursor-pointer transition-all duration-120",
            active
              ? "bg-white text-text shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]"
              : "bg-transparent text-muted",
          )}>{l}</button>
        );
      })}
    </div>
  );
}

window.PulseForm = { Field, Input, Textarea, Select, MultiSelect, SearchableSelect, Checkbox, Toggle, Segmented };
