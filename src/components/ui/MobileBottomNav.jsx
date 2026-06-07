// ============================================================================
// Mobile bottom navigation component
// Tab-based navigation for mobile layout
// ============================================================================

import React from 'react';

const { useState } = React;

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const Icon = getPulseUI().Icon;
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

function BottomNav({ items, active, onChange }) {
  return (
    <div className="flex justify-around items-center h-16 px-safe bg-white/95 backdrop-blur-xl border-t border-black/[.06]">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cx(
            "flex flex-col items-center justify-center w-full h-full transition-colors duration-150",
            active === item.id ? "text-accent" : "text-muted-light",
            "min-h-[44px]"
          )}
        >
          <Icon name={item.icon} size={24} />
          <span className="text-[11px] mt-1 font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

window.MobileBottomNav = BottomNav;
