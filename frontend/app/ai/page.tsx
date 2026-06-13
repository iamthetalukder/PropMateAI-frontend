"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

// ── Types ─────────────────────────────────────────────────────────────────────

type Property = {
  _id: string;
  title: string;
  location: string;
  city?: string;
  country?: string;
  price: number;
  currency?: string;
  status: "occupied" | "vacant";
};

type RentSuggestion = {
  suggestedRent: number;
  currency: string;
  marketRange: { low: number; high: number };
  confidence: "low" | "medium" | "high";
  reasoning: string;
  tips: string[];
};

type VacancyPrediction = {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  daysUntilPotentialVacancy: number | null;
  prediction: string;
  keyFactors: string[];
  recommendations: string[];
};

type PropertyDescription = {
  tagline: string;
  description: string;
  highlights: string[];
  targetAudience: string;
};

type PortfolioInsights = {
  portfolioScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  nextBestAction: string;
  incomeOptimization: string;
};

type ForecastMonth = {
  month: string;
  predictedOccupancyRate: number;
  confidence: "low" | "medium" | "high";
  notes: string;
};

type OccupancyForecast = {
  forecast: ForecastMonth[];
  overallTrend: "improving" | "stable" | "declining";
  trendReason: string;
  criticalPeriod: string | null;
  actionPlan: string[];
};

// ── Helper components ─────────────────────────────────────────────────────────

const ConfidenceBadge = ({ level }: { level: "low" | "medium" | "high" }) => {
  const colors = {
    low: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-xs font-semibold " + colors[level]
      }
    >
      {level} confidence
    </span>
  );
};

const RiskBadge = ({
  level,
}: {
  level: "low" | "medium" | "high" | "critical";
}) => {
  const colors = {
    low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <span
      className={
        "rounded-full px-3 py-1 text-sm font-bold uppercase " + colors[level]
      }
    >
      {level} risk
    </span>
  );
};

const TrendBadge = ({
  trend,
}: {
  trend: "improving" | "stable" | "declining";
}) => {
  const cfg = {
    improving: {
      color: "text-green-500",
      icon: "↑",
      label: "Improving",
    },
    stable: { color: "text-blue-500", icon: "→", label: "Stable" },
    declining: {
      color: "text-red-500",
      icon: "↓",
      label: "Declining",
    },
  };
  const c = cfg[trend];
  return (
    <span className={"font-bold " + c.color}>
      {c.icon} {c.label}
    </span>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const color =
    score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center">
      <div
        className={
          "text-5xl font-bold " + color
        }
      >
        {score}
      </div>
      <div className="text-xs text-zinc-500 mt-1">/ 100</div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);

  // Per-feature loading states
  const [loadingRent, setLoadingRent] = useState(false);
  const [loadingVacancy, setLoadingVacancy] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // AI results
  const [rentResult, setRentResult] = useState<RentSuggestion | null>(null);
  const [vacancyResult, setVacancyResult] = useState<VacancyPrediction | null>(
    null,
  );
  const [descResult, setDescResult] = useState<PropertyDescription | null>(
    null,
  );
  const [portfolioResult, setPortfolioResult] =
    useState<PortfolioInsights | null>(null);
  const [forecastResult, setForecastResult] = useState<OccupancyForecast | null>(
    null,
  );

  // Error messages
  const [rentError, setRentError] = useState("");
  const [vacancyError, setVacancyError] = useState("");
  const [descError, setDescError] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [forecastError, setForecastError] = useState("");

  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch all properties for the property selector
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(apiUrl + "/api/properties", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProperties(list);
        if (list.length > 0) setSelectedPropertyId(list[0]._id);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [router, apiUrl]);

  // Generic AI call helper
  const callAI = async <T,>(
    endpoint: string,
    body: object,
    setResult: (r: T) => void,
    setErr: (e: string) => void,
    setBusy: (b: boolean) => void,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setErr("");
    setResult(null as T);
    try {
      const res = await fetch(apiUrl + endpoint, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI request failed");
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRentSuggestion = () =>
    callAI<RentSuggestion>(
      "/api/ai/rent-suggestion",
      { propertyId: selectedPropertyId },
      setRentResult,
      setRentError,
      setLoadingRent,
    );

  const handleVacancyPrediction = () =>
    callAI<VacancyPrediction>(
      "/api/ai/vacancy-prediction",
      { propertyId: selectedPropertyId },
      setVacancyResult,
      setVacancyError,
      setLoadingVacancy,
    );

  const handleGenerateDescription = () =>
    callAI<PropertyDescription>(
      "/api/ai/generate-description",
      { propertyId: selectedPropertyId },
      setDescResult,
      setDescError,
      setLoadingDesc,
    );

  const handlePortfolioInsights = () =>
    callAI<PortfolioInsights>(
      "/api/ai/portfolio-insights",
      {},
      setPortfolioResult,
      setPortfolioError,
      setLoadingPortfolio,
    );

  const handleOccupancyForecast = () =>
    callAI<OccupancyForecast>(
      "/api/ai/occupancy-forecast",
      {},
      setForecastResult,
      setForecastError,
      setLoadingForecast,
    );

  const copyDescription = () => {
    if (!descResult) return;
    const text = `${descResult.tagline}\n\n${descResult.description}\n\nHighlights:\n${descResult.highlights.map((h) => "• " + h).join("\n")}\n\nIdeal for: ${descResult.targetAudience}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedProperty = properties.find((p) => p._id === selectedPropertyId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-lg font-semibold">Loading AI features...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Logo theme="dark" size="md" />
            <h1 className="mt-1 text-3xl font-bold">AI Features</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Powered by GPT-4o-mini — intelligent insights for your portfolio
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Dashboard
          </button>
        </div>

        {/* Property selector — used by the 3 property-specific features */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold">Select a Property</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Choose a property for Rent Suggestion, Vacancy Prediction, and
            Description Generator. Portfolio Insights and Occupancy Forecast
            analyze your whole portfolio automatically.
          </p>
          {properties.length === 0 ? (
            <p className="text-yellow-600 dark:text-yellow-400">
              No properties found. Add properties on the dashboard first.
            </p>
          ) : (
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setRentResult(null);
                setVacancyResult(null);
                setDescResult(null);
              }}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-purple-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:w-96"
            >
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} — {p.city || p.location} ({p.status})
                </option>
              ))}
            </select>
          )}
          {selectedProperty && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Selected: <span className="font-semibold">{selectedProperty.title}</span> ·{" "}
              {(selectedProperty.currency || "USD") + " " + selectedProperty.price.toLocaleString()} ·{" "}
              <span
                className={
                  selectedProperty.status === "occupied"
                    ? "text-green-500 font-semibold"
                    : "text-yellow-500 font-semibold"
                }
              >
                {selectedProperty.status}
              </span>
            </p>
          )}
        </div>

        {/* ── Feature 1: Rent Suggestion ───────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">💰 Rent Price Suggestion</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                AI analyzes your property location, current pricing, and lease
                history to suggest the optimal monthly rent.
              </p>
            </div>
            <button
              onClick={handleRentSuggestion}
              disabled={loadingRent || !selectedPropertyId}
              className="ml-4 shrink-0 rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {loadingRent ? "Analyzing..." : "Get Suggestion"}
            </button>
          </div>

          {rentError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {rentError}
            </p>
          )}

          {rentResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Suggested Rent</p>
                  <p className="text-4xl font-bold text-purple-500">
                    {rentResult.currency}{" "}
                    {Number(rentResult.suggestedRent).toLocaleString()}
                    <span className="text-lg font-normal text-zinc-500">
                      /mo
                    </span>
                  </p>
                </div>
                <div className="ml-4">
                  <ConfidenceBadge level={rentResult.confidence} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Market Range
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {rentResult.currency}{" "}
                    {Number(rentResult.marketRange.low).toLocaleString()} —{" "}
                    {rentResult.currency}{" "}
                    {Number(rentResult.marketRange.high).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    AI Reasoning
                  </p>
                  <p className="mt-1 text-sm">{rentResult.reasoning}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Tips to maximize rent:
                </p>
                <ul className="space-y-1">
                  {rentResult.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-500 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ── Feature 2: Vacancy Prediction ───────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">🔮 Vacancy Prediction</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                AI assesses lease expiry, tenant stability, and maintenance data
                to predict vacancy risk.
              </p>
            </div>
            <button
              onClick={handleVacancyPrediction}
              disabled={loadingVacancy || !selectedPropertyId}
              className="ml-4 shrink-0 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loadingVacancy ? "Predicting..." : "Predict Risk"}
            </button>
          </div>

          {vacancyError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {vacancyError}
            </p>
          )}

          {vacancyResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-6">
                <RiskBadge level={vacancyResult.riskLevel} />
                <div>
                  <p className="text-sm text-zinc-500">Risk Score</p>
                  <p className="text-3xl font-bold">
                    <span
                      className={
                        vacancyResult.riskScore >= 70
                          ? "text-red-500"
                          : vacancyResult.riskScore >= 40
                            ? "text-orange-500"
                            : "text-green-500"
                      }
                    >
                      {vacancyResult.riskScore}
                    </span>
                    <span className="text-lg text-zinc-500">/100</span>
                  </p>
                </div>
                {vacancyResult.daysUntilPotentialVacancy !== null && (
                  <div>
                    <p className="text-sm text-zinc-500">Potential Vacancy In</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {vacancyResult.daysUntilPotentialVacancy}
                      <span className="text-lg font-normal text-zinc-500">
                        {" "}
                        days
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-sm">{vacancyResult.prediction}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Key Risk Factors:
                  </p>
                  <ul className="space-y-1">
                    {vacancyResult.keyFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 font-bold">⚠</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Recommendations:
                  </p>
                  <ul className="space-y-1">
                    {vacancyResult.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 font-bold">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Feature 3: Description Generator ────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">✍️ Description Generator</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Generate a professional marketing description for your property
                listing — ready to copy and post.
              </p>
            </div>
            <button
              onClick={handleGenerateDescription}
              disabled={loadingDesc || !selectedPropertyId}
              className="ml-4 shrink-0 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingDesc ? "Writing..." : "Generate"}
            </button>
          </div>

          {descError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {descError}
            </p>
          )}

          {descResult && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  "{descResult.tagline}"
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  {descResult.description}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Property Highlights:
                  </p>
                  <ul className="space-y-1">
                    {descResult.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 font-bold">★</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Ideal For
                  </p>
                  <p className="mt-1 text-sm">{descResult.targetAudience}</p>
                </div>
              </div>
              <button
                onClick={copyDescription}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {copied ? "✅ Copied!" : "📋 Copy Full Description"}
              </button>
            </div>
          )}
        </div>

        {/* ── Feature 4: Portfolio Insights ────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">📊 Portfolio Insights</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                AI analyzes your entire portfolio — occupancy, income, risks,
                and opportunities — and gives you a strategic action plan.
              </p>
            </div>
            <button
              onClick={handlePortfolioInsights}
              disabled={loadingPortfolio}
              className="ml-4 shrink-0 rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loadingPortfolio ? "Analyzing..." : "Analyze Portfolio"}
            </button>
          </div>

          {portfolioError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {portfolioError}
            </p>
          )}

          {portfolioResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-6">
                <ScoreRing score={portfolioResult.portfolioScore} />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Portfolio Health Score
                  </p>
                  <p className="text-sm">{portfolioResult.summary}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                  <p className="mb-2 text-sm font-semibold text-green-700 dark:text-green-300">
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {portfolioResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 font-bold">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
                    Risks
                  </p>
                  <ul className="space-y-1">
                    {portfolioResult.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 font-bold">⚠</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Recommendations:
                </p>
                <ul className="space-y-1">
                  {portfolioResult.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 font-bold">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Next Best Action
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {portfolioResult.nextBestAction}
                  </p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Income Optimization
                  </p>
                  <p className="mt-1 text-sm">
                    {portfolioResult.incomeOptimization}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Feature 5: Occupancy Forecast ────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">📅 Occupancy Forecast</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                AI forecasts month-by-month occupancy for the next 6 months
                based on your lease expiry schedule.
              </p>
            </div>
            <button
              onClick={handleOccupancyForecast}
              disabled={loadingForecast}
              className="ml-4 shrink-0 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loadingForecast ? "Forecasting..." : "Forecast"}
            </button>
          </div>

          {forecastError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {forecastError}
            </p>
          )}

          {forecastResult && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-zinc-500">Overall Trend</p>
                  <TrendBadge trend={forecastResult.overallTrend} />
                </div>
                {forecastResult.criticalPeriod && (
                  <div>
                    <p className="text-sm text-zinc-500">Critical Period</p>
                    <p className="font-semibold text-red-500">
                      ⚠ {forecastResult.criticalPeriod}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {forecastResult.trendReason}
              </p>

              {/* Month-by-month forecast bars */}
              {forecastResult.forecast && forecastResult.forecast.length > 0 && (
                <div className="space-y-3">
                  {forecastResult.forecast.map((month, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {month.month}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {month.predictedOccupancyRate}%
                          </span>
                          <ConfidenceBadge level={month.confidence} />
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className={
                            "h-3 rounded-full transition-all " +
                            (month.predictedOccupancyRate >= 70
                              ? "bg-green-500"
                              : month.predictedOccupancyRate >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500")
                          }
                          style={{
                            width: month.predictedOccupancyRate + "%",
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {month.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Action Plan:
                </p>
                <ul className="space-y-1">
                  {forecastResult.actionPlan.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-500 font-bold">→</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
