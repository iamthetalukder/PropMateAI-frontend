"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "propmate_currency";
const SUPPORTED = ["USD", "EUR", "GBP", "BDT", "CAD", "AUD"] as const;
type Currency = (typeof SUPPORTED)[number];

interface RatesMap {
  EUR: number;
  GBP: number;
  BDT: number;
  CAD: number;
  AUD: number;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState<RatesMap | null>(null);

  const readCurrency = useCallback((): Currency => {
    if (typeof window === "undefined") return "USD";
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    return saved && SUPPORTED.includes(saved) ? saved : "USD";
  }, []);

  useEffect(() => {
    setCurrency(readCurrency());

    const onCurrencyChange = () => {
      setCurrency(readCurrency());
    };

    window.addEventListener("currencyChange", onCurrencyChange);
    return () => window.removeEventListener("currencyChange", onCurrencyChange);
  }, [readCurrency]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(backendUrl + "/api/currency/rates", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates);
        }
      } catch (err) {
        console.error("useCurrency: failed to fetch rates", err);
      }
    };

    fetchRates();
  }, []);

  const formatAmount = useCallback(
    (usdAmount: number): string => {
      if (currency === "USD" || !rates) {
        return "$" + usdAmount.toLocaleString();
      }

      const symbols: Record<string, string> = {
        EUR: "€",
        GBP: "£",
        BDT: "৳",
        CAD: "CA$",
        AUD: "A$",
      };

      const rate = rates[currency as keyof RatesMap];
      if (!rate) return "$" + usdAmount.toLocaleString();

      const converted = usdAmount * rate;
      const symbol = symbols[currency] || currency + " ";
      return symbol + converted.toLocaleString(undefined, { maximumFractionDigits: 0 });
    },
    [currency, rates],
  );

  return { currency, formatAmount };
}
