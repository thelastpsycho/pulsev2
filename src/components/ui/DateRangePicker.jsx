import React, { useState, useEffect } from 'react'
// ============================================================================
// Date Range Picker Component
// ============================================================================

function DateRangePicker({ checkinDate, checkoutDate, onChange, disabled }) {
  const [checkin, setCheckin] = useState(checkinDate || "");
  const [checkout, setCheckout] = useState(checkoutDate || "");
  const [focusedCheckin, setFocusedCheckin] = useState(false);
  const [focusedCheckout, setFocusedCheckout] = useState(false);

  useEffect(() => {
    setCheckin(checkinDate || "");
    setCheckout(checkoutDate || "");
  }, [checkinDate, checkoutDate]);

  const handleCheckinChange = (value) => {
    setCheckin(value);
    if (value && checkout && new Date(value) > new Date(checkout)) {
      setCheckout("");
    }
    onChange({ checkin_date: value, checkout_date: value && checkout ? checkout : "" });
  };

  const handleCheckoutChange = (value) => {
    setCheckout(value);
    onChange({ checkin_date: checkin, checkout_date: value });
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 9,
    fontSize: 14,
    fontFamily: "inherit",
    transition: "border-color 100ms, box-shadow 100ms",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const focusedStyle = {
    borderColor: "#007aff",
    boxShadow: "0 0 0 3px rgba(0,122,255,0.15)",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1 }}>
        <input
          type="date"
          value={checkin}
          onChange={(e) => handleCheckinChange(e.target.value)}
          onFocus={() => setFocusedCheckin(true)}
          onBlur={() => setFocusedCheckin(false)}
          disabled={disabled}
          style={{
            ...inputStyle,
            ...(focusedCheckin ? focusedStyle : {}),
          }}
        />
      </div>
      <span style={{ color: "rgba(0,0,0,0.3)", fontSize: 14, fontWeight: "500"}}>→</span>
      <div style={{ flex: 1 }}>
        <input
          type="date"
          value={checkout}
          onChange={(e) => handleCheckoutChange(e.target.value)}
          onFocus={() => setFocusedCheckout(true)}
          onBlur={() => setFocusedCheckout(false)}
          disabled={disabled}
          min={checkin}
          style={{
            ...inputStyle,
            ...(focusedCheckout ? focusedStyle : {}),
          }}
        />
      </div>
    </div>
  );
}

window.DateRangePicker = DateRangePicker;