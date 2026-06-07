import { useState, useEffect } from 'react'
// ============================================================================
// Date Range Picker Component
// ============================================================================

function DateRangePicker({ checkinDate, checkoutDate, onChange, disabled }) {
  const [checkin, setCheckin] = useState(checkinDate || "");
  const [checkout, setCheckout] = useState(checkoutDate || "");
  const [focusedCheckin, setFocusedCheckin] = useState(false);
  const [focusedCheckout, setFocusedCheckout] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setCheckin(checkinDate || "");
      setCheckout(checkoutDate || "");
    });
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

  const getInputClasses = (focused) => `
    w-full px-3 py-2 border border-black/10 rounded-lg
    text-[14px] font-inherit
    transition-all duration-100
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${focused ? 'border-accent ring-4 ring-accent/15' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="date"
          value={checkin}
          onChange={(e) => handleCheckinChange(e.target.value)}
          onFocus={() => setFocusedCheckin(true)}
          onBlur={() => setFocusedCheckin(false)}
          disabled={disabled}
          className={getInputClasses(focusedCheckin)}
        />
      </div>
      <span className="text-black/30 text-[14px] font-medium">→</span>
      <div className="flex-1">
        <input
          type="date"
          value={checkout}
          onChange={(e) => handleCheckoutChange(e.target.value)}
          onFocus={() => setFocusedCheckout(true)}
          onBlur={() => setFocusedCheckout(false)}
          disabled={disabled}
          min={checkin}
          className={getInputClasses(focusedCheckout)}
        />
      </div>
    </div>
  );
}

window.DateRangePicker = DateRangePicker;