import { useState, useEffect } from 'react';

// ============================================================================
// Range Date Picker Component with Calendar UI
// ============================================================================

function RangeDatePicker({
  defaultStartDate,
  defaultEndDate,
  onDateChange,
  disabled = false,
  placeholder = "Select date range"
}) {
  const [startDate, setStartDate] = useState(defaultStartDate || null);
  const [endDate, setEndDate] = useState(defaultEndDate || null);
  const [isOpen, setIsOpen] = useState(false);
  // Use UTC date for current month to avoid timezone issues
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [hoverDate, setHoverDate] = useState(null);

  useEffect(() => {
    setStartDate(defaultStartDate || null);
    setEndDate(defaultEndDate || null);
  }, [defaultStartDate, defaultEndDate]);

  const formatDate = (date) => {
    if (!date) return '';
    // Use UTC methods to avoid timezone issues
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const handleDateClick = (date) => {
    // Create UTC date to avoid timezone issues
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    if (!startDate || (startDate && endDate)) {
      // Start new range
      setStartDate(utcDate);
      setEndDate(null);
      setHoverDate(null);
      onDateChange(utcDate, null);
    } else if (startDate && !endDate) {
      // Complete range
      if (utcDate < startDate) {
        // Clicked before start date, make clicked date the new start
        setStartDate(utcDate);
        onDateChange(utcDate, null);
      } else {
        // Normal range completion
        setEndDate(utcDate);
        onDateChange(startDate, utcDate);
        setTimeout(() => setIsOpen(false), 200);
      }
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    onDateChange(null, null);
  };

  const isDateSelected = (date) => {
    if (!startDate) return false;
    // Use UTC timestamps for comparison
    const dateTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate ? endDate.getTime() : startTimestamp;

    if (!endDate) {
      return dateTimestamp === startTimestamp;
    }
    return dateTimestamp >= startTimestamp && dateTimestamp <= endTimestamp;
  };

  const isDateHovered = (date) => {
    if (!startDate || endDate || !hoverDate) return false;

    const dateTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const startTimestamp = startDate.getTime();
    const hoverTimestamp = hoverDate.getTime();

    if (hoverTimestamp < startTimestamp) {
      return dateTimestamp <= startTimestamp && dateTimestamp >= hoverTimestamp;
    } else {
      return dateTimestamp >= startTimestamp && dateTimestamp <= hoverTimestamp;
    }
  };

  const isStartDate = (date) => {
    if (!startDate) return false;
    const dateTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return dateTimestamp === startDate.getTime();
  };

  const isEndDate = (date) => {
    if (!endDate) return false;
    const dateTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return dateTimestamp === endDate.getTime();
  };

  const renderCalendar = () => {
    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const startDay = firstDay.getUTCDay();
    const totalDays = lastDay.getUTCDate();

    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const selected = isDateSelected(date);
      const hovered = isDateHovered(date);
      const start = isStartDate(date);
      const end = isEndDate(date);
      // Disable dates in the future (keep it simple - allow all dates for now)
      const isDateDisabled = false;

      days.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => {
            const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            setHoverDate(utcDate);
          }}
          disabled={isDateDisabled}
          className={`
            h-9 w-9 rounded-lg text-sm font-medium transition-all duration-150
            ${selected
              ? 'bg-accent text-white'
              : hovered
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-black/8 text-text'
            }
            ${start ? 'rounded-l-lg' : ''}
            ${end ? 'rounded-r-lg' : ''}
            ${isDateDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            ${!selected && !hovered ? 'hover:shadow-sm' : ''}
          `.trim().replace(/\s+/g, ' ')}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + delta, 1));
    setCurrentMonth(newMonth);
  };

  const formattedRange = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : startDate
      ? `${formatDate(startDate)} - ...`
      : placeholder;

  return (
    <div className="relative">
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formattedRange}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2.5 pr-10 border border-black/10 rounded-lg
            text-[14px] font-inherit bg-white
            transition-all duration-100 cursor-pointer
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-black/20'}
            ${isOpen ? 'border-accent ring-4 ring-accent/15' : ''}
          `.trim().replace(/\s+/g, ' ')}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        {(startDate || endDate) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-black/40 hover:text-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/8 p-4 min-w-[320px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 hover:bg-black/6 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-sm font-semibold text-text">
              {new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 hover:bg-black/6 rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="h-9 flex items-center justify-center text-[11px] font-semibold text-muted-light uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/6">
            <div className="text-xs text-muted-light">
              {startDate && endDate
                ? `${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} days`
                : 'Select date range'}
            </div>
            {startDate && endDate && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/8 rounded-lg transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

window.RangeDatePicker = RangeDatePicker;