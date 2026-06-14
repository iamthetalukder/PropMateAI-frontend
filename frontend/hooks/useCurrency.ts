"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "propmate_currency";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  TRY: "₺",
  INR: "₹",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  CHF: "Fr",
  CAD: "CA$",
  AUD: "A$",
  BDT: "৳",
  SAR: "﷼",
  JPY: "¥",
  HKD: "HK$",
};

const SUPPORTED_CODES = Object.keys(CURRENCY_SYMBOLS);

type Currency = keyof typeof CURRENCY_SYMBOLS;

type RatesMap = Record<string, number>;

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState<RatesMap | null>(null);

  const readCurrency = useCallback((): Currency => {
    if (typeof window === "undefined") return "USD";
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    return saved && SUPPORTED_CODES.includes(saved) ? saved : "USD";
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

      const rate = rates[currency];
      if (!rate) return "$" + usdAmount.toLocaleString();

      const converted = usdAmount * rate;
      const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";

      // JPY and similar non-decimal currencies look better without decimals
      const maximumFractionDigits = currency === "JPY" ? 0 : 0;

      return (
        symbol +
        converted.toLocaleString(undefined, { maximumFractionDigits })
      );
    },
    [currency, rates],
  );

  return { currency, formatAmount };
}
