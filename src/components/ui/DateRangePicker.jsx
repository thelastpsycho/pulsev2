import { useState, useEffect } from 'react'
// ============================================================================
// Enhanced Date Range Picker Component
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
    // If checkout is before new checkin, clear it
    if (value && checkout && new Date(value) > new Date(checkout)) {
      setCheckout("");
      onChange({ checkin_date: value, checkout_date: "" });
    } else {
      onChange({ checkin_date: value, checkout_date: checkout });
    }
  };

  const handleCheckoutChange = (value) => {
    setCheckout(value);
    onChange({ checkin_date: checkin, checkout_date: value });
  };

  const clearDates = () => {
    setCheckin("");
    setCheckout("");
    onChange({ checkin_date: "", checkout_date: "" });
  };

  const hasDates = checkin || checkout;
  const formattedRange = checkin && checkout
    ? `${formatDate(checkin)} → ${formatDate(checkout)}`
    : checkin
      ? `${formatDate(checkin)} → ...`
      : checkout
        ? `... → ${formatDate(checkout)}`
        : "";

  const getInputClasses = (focused) => `
    w-full px-3 py-2.5 border border-black/10 rounded-lg
    text-[14px] font-inherit
    transition-all duration-100
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${focused ? 'border-accent ring-4 ring-accent/15' : 'hover:border-black/20'}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="space-y-2">
      {/* Date range display */}
      {hasDates && (
        <div className="flex items-center justify-between px-3 py-2 bg-black/4 rounded-lg border border-black/8">
          <span className="text-[13px] text-text font-medium">{formattedRange}</span>
          <button
            type="button"
            onClick={clearDates}
            disabled={disabled}
            className="text-[11.5px] text-muted hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      )}

      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11.5px] text-muted-light font-semibold uppercase tracking-wide">
            Check-in
          </label>
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
        <div className="space-y-1">
          <label className="text-[11.5px] text-muted-light font-semibold uppercase tracking-wide">
            Check-out
          </label>
          <input
            type="date"
            value={checkout}
            onChange={(e) => handleCheckoutChange(e.target.value)}
            onFocus={() => setFocusedCheckout(true)}
            onBlur={() => setFocusedCheckout(false)}
            disabled={disabled}
            min={checkin || undefined}
            className={getInputClasses(focusedCheckout)}
          />
        </div>
      </div>

      {/* Validation message */}
      {checkin && checkout && new Date(checkin) > new Date(checkout) && (
        <div className="text-[11.5px] text-error bg-error/6 px-2 py-1 rounded">
          Check-out must be after check-in
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

window.DateRangePicker = DateRangePicker;