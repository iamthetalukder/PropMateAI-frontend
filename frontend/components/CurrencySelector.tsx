"use client";

import { useEffect, useState } from "react";

const CURRENCIES = ["USD", "EUR", "GBP", "BDT", "CAD", "AUD"] as const;
type Currency = (typeof CURRENCIES)[number];

const STORAGE_KEY = "propmate_currency";

export default function CurrencySelector() {
  const [selected, setSelected] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (saved && CURRENCIES.includes(saved)) {
      setSelected(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Currency;
    setSelected(value);
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event("currencyChange"));
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      style={{
        background: "#1A2D4A",
        color: "#FFFFFF",
        border: "1px solid #2A3D5A",
        borderRadius: "8px",
        padding: "6px 10px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
