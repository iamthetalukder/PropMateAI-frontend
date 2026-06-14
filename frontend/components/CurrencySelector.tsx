"use client";

import { useEffect, useState } from "react";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const STORAGE_KEY = "propmate_currency";
const VALID_CODES = CURRENCIES.map((c) => c.code);

export default function CurrencySelector() {
  const [selected, setSelected] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && VALID_CODES.includes(saved)) {
      setSelected(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CurrencyCode;
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
        <option key={c.code} value={c.code}>
          {c.symbol + " " + c.code + " — " + c.name}
        </option>
      ))}
    </select>
  );
}
