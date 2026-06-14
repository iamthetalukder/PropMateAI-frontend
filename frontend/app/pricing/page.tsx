"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Feature {
  text: string;
  included: boolean;
  highlight: "blue" | "gold" | null;
}

const STARTER_FEATURES: Feature[] = [
  { text: "1 property", included: true, highlight: null },
  { text: "5 tenants", included: true, highlight: null },
  { text: "Lease management", included: true, highlight: null },
  { text: "Maintenance requests", included: true, highlight: null },
  { text: "Image gallery", included: true, highlight: null },
  { text: "AI features", included: false, highlight: null },
  { text: "Analytics dashboard", included: false, highlight: null },
  { text: "Team roles", included: false, highlight: null },
];

const PRO_FEATURES: Feature[] = [
  { text: "15 properties", included: true, highlight: null },
  { text: "Unlimited tenants", included: true, highlight: null },
  { text: "All Starter features", included: true, highlight: null },
  { text: "AI rent suggestions", included: true, highlight: "blue" },
  { text: "Analytics dashboard", included: true, highlight: "blue" },
  { text: "Team roles", included: false, highlight: null },
];

const AGENCY_FEATURES: Feature[] = [
  { text: "Unlimited properties", included: true, highlight: null },
  { text: "Unlimited tenants", included: true, highlight: null },
  { text: "All Pro features", included: true, highlight: null },
  { text: "All AI features", included: true, highlight: "gold" },
  { text: "Analytics dashboard", included: true, highlight: "gold" },
  { text: "Team roles & admin panel", included: true, highlight: "gold" },
];

function FeatureRow({ feature }: { feature: Feature }) {
  let textColor = "#CBD5E1";
  let iconColor = "#4A9EFF";
  const textDecoration: "none" | "line-through" = feature.included
    ? "none"
    : "line-through";

  if (!feature.included) {
    textColor = "#475569";
    iconColor = "#475569";
  } else if (feature.highlight === "blue") {
    textColor = "#4A9EFF";
    iconColor = "#4A9EFF";
  } else if (feature.highlight === "gold") {
    textColor = "#F5C842";
    iconColor = "#F5C842";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        marginBottom: "13px",
      }}
    >
      <span
        style={{
          color: iconColor,
          fontWeight: 700,
          fontSize: "13px",
          flexShrink: 0,
          lineHeight: "1.5",
          marginTop: "1px",
          width: "14px",
        }}
      >
        {feature.included ? "✓" : "✗"}
      </span>
      <span
        style={{
          color: textColor,
          fontSize: "14px",
          lineHeight: "1.5",
          textDecoration,
        }}
      >
        {feature.text}
      </span>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAnnual = billing === "annual";
  const proPrice = isAnnual ? 37 : 49;
  const agencyPrice = isAnnual ? 74 : 99;

  const handleCheckout = async (plan: "pro" | "agency") => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setCheckoutLoading(plan);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ plan }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Checkout failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#FFFFFF" }}>
      {/* Error toast */}
      {errorMsg && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 50,
            background: "#DC2626",
            color: "#FFFFFF",
            padding: "14px 24px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Eyebrow */}
        <p
          style={{
            textAlign: "center",
            color: "#F5C842",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "3px",
            marginBottom: "16px",
          }}
        >
          SIMPLE PRICING
        </p>

        {/* H1 */}
        <h1
          className="mx-auto max-w-2xl text-center"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          AI-powered management. Human-friendly pricing.
        </h1>

        {/* Subtext */}
        <p
          style={{
            textAlign: "center",
            color: "#8AB4D4",
            fontSize: "18px",
            marginBottom: "48px",
          }}
        >
          No per-unit fees. No hidden costs. Cancel anytime.
        </p>

        {/* Monthly / Annual toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "64px",
          }}
        >
          <span
            style={{
              color: isAnnual ? "#8AB4D4" : "#FFFFFF",
              fontWeight: 600,
              fontSize: "15px",
              transition: "color 0.2s",
            }}
          >
            Monthly
          </span>

          <button
            onClick={() => setBilling(isAnnual ? "monthly" : "annual")}
            aria-label="Toggle billing cycle"
            style={{
              position: "relative",
              width: "52px",
              height: "28px",
              borderRadius: "14px",
              border: "none",
              background: isAnnual ? "#4A9EFF" : "#1A2D4A",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "4px",
                left: isAnnual ? "28px" : "4px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#FFFFFF",
                display: "block",
                transition: "left 0.2s",
              }}
            />
          </button>

          <span
            style={{
              color: isAnnual ? "#FFFFFF" : "#8AB4D4",
              fontWeight: 600,
              fontSize: "15px",
              transition: "color 0.2s",
            }}
          >
            Annual
          </span>

          <span
            style={{
              background: "#F5C842",
              color: "#0B1120",
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            Save 25%
          </span>
        </div>

        {/* Plan cards — pt-4 gives the PRO badge room to overlap upward */}
        <div className="grid gap-6 pt-4 lg:grid-cols-3">

          {/* ── STARTER ── */}
          <div
            style={{
              background: "#0F1A2E",
              border: "1px solid #1A2D4A",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9BAFC4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span
                style={{
                  color: "#9BAFC4",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                }}
              >
                STARTER
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: 800,
                  color: "#9BAFC4",
                  lineHeight: 1,
                }}
              >
                $0
              </span>
              <span style={{ color: "#6B7280", fontSize: "15px" }}>
                /mo forever
              </span>
            </div>

            {/* Spacer keeps vertical rhythm equal to paid plans' annual note area */}
            <div style={{ height: "32px" }} />

            <div style={{ flex: 1, marginBottom: "32px" }}>
              {STARTER_FEATURES.map((f, i) => (
                <FeatureRow key={i} feature={f} />
              ))}
            </div>

            <a
              href="/register"
              style={{
                display: "block",
                textAlign: "center",
                background: "#1A2D4A",
                color: "#9BAFC4",
                padding: "14px 24px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "15px",
              }}
            >
              Get started free
            </a>
          </div>

          {/* ── PRO ── */}
          <div
            style={{
              position: "relative",
              background: "#0D1F3A",
              border: "2px solid #4A9EFF",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Most popular badge */}
            <div
              style={{
                position: "absolute",
                top: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#4A9EFF",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                padding: "4px 18px",
                borderRadius: "20px",
                whiteSpace: "nowrap",
              }}
            >
              Most popular
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4A9EFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M2 8h20M2 16h20M8 2v20M16 2v20" />
              </svg>
              <span
                style={{
                  color: "#4A9EFF",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                }}
              >
                PRO
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                ${proPrice}
              </span>
              <span style={{ color: "#8AB4D4", fontSize: "15px" }}>/mo</span>
            </div>

            <div style={{ height: "32px", display: "flex", alignItems: "center" }}>
              {isAnnual && (
                <p
                  style={{
                    color: "#F5C842",
                    fontSize: "13px",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  $37/mo billed annually — save $144/yr
                </p>
              )}
            </div>

            <div style={{ flex: 1, marginBottom: "32px", marginTop: "8px" }}>
              {PRO_FEATURES.map((f, i) => (
                <FeatureRow key={i} feature={f} />
              ))}
            </div>

            <button
              onClick={() => handleCheckout("pro")}
              disabled={checkoutLoading === "pro"}
              style={{
                width: "100%",
                background: "#4A9EFF",
                color: "#FFFFFF",
                padding: "14px 24px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor: checkoutLoading === "pro" ? "not-allowed" : "pointer",
                opacity: checkoutLoading === "pro" ? 0.65 : 1,
              }}
            >
              {checkoutLoading === "pro"
                ? "Redirecting..."
                : "Start Pro — 14 days free"}
            </button>
          </div>

          {/* ── AGENCY ── */}
          <div
            style={{
              background: "#0F1A2E",
              border: "1px solid #1A2D4A",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F5C842"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 5l4.5 11h11L22 5l-5 6.5L12 4l-5 7.5L2 5z" />
                <line x1="5" y1="21" x2="19" y2="21" />
              </svg>
              <span
                style={{
                  color: "#F5C842",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                }}
              >
                AGENCY
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: 800,
                  color: "#F5C842",
                  lineHeight: 1,
                }}
              >
                ${agencyPrice}
              </span>
              <span style={{ color: "#8AB4D4", fontSize: "15px" }}>/mo</span>
            </div>

            <div style={{ height: "32px", display: "flex", alignItems: "center" }}>
              {isAnnual && (
                <p
                  style={{
                    color: "#F5C842",
                    fontSize: "13px",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  $74/mo billed annually — save $300/yr
                </p>
              )}
            </div>

            <div style={{ flex: 1, marginBottom: "32px", marginTop: "8px" }}>
              {AGENCY_FEATURES.map((f, i) => (
                <FeatureRow key={i} feature={f} />
              ))}
            </div>

            <button
              onClick={() => handleCheckout("agency")}
              disabled={checkoutLoading === "agency"}
              style={{
                width: "100%",
                background: "#F5C842",
                color: "#0B1120",
                padding: "14px 24px",
                borderRadius: "10px",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                cursor:
                  checkoutLoading === "agency" ? "not-allowed" : "pointer",
                opacity: checkoutLoading === "agency" ? 0.65 : 1,
              }}
            >
              {checkoutLoading === "agency"
                ? "Redirecting..."
                : "Start Agency — 14 days free"}
            </button>
          </div>
        </div>

        {/* Competitor comparison note */}
        <p
          style={{
            textAlign: "center",
            color: "#8AB4D4",
            fontSize: "15px",
            marginTop: "64px",
            lineHeight: 1.7,
          }}
        >
          Buildium charges $62–$400/mo with per-unit fees.
          <br />
          PropMate AI is flat rate — more properties, same price.
        </p>

        {/* Footer features note */}
        <p
          style={{
            textAlign: "center",
            color: "#3D5470",
            fontSize: "13px",
            marginTop: "20px",
          }}
        >
          All plans include · SSL security · Cloud storage · 99.9% uptime · No
          setup fees
        </p>
      </div>
    </div>
  );
}
