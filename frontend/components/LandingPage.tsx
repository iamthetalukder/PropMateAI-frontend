"use client";

// PropMate AI — Public landing page (no authentication required).
// This is the marketing homepage shown at "/". The protected dashboard now
// lives at "/dashboard". Everything below is fully public and self-contained.

import { useState } from "react";
import Link from "next/link";

// The four interactive modals are driven by a single piece of state.
// "null" means no modal is open.
type ModalType = "privacy" | "terms" | "blog" | "support" | null;

// All landing-page CSS lives in one string that we inject via a <style> tag.
// React 19 (Next.js 16 App Router) hoists this into the document head for us.
// Keeping the CSS here lets us use real media queries for responsiveness
// while sticking to the exact color system requested.
const landingStyles = `
  .lp-root {
    background: #070D1A;
    color: #E6EEF8;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    scroll-behavior: smooth;
  }
  .lp-root * { box-sizing: border-box; }

  /* ---------- Navbar ---------- */
  .lp-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #070D1A;
    border-bottom: 1px solid #0F1E35;
    padding: 22px 56px;
  }
  .lp-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .lp-logo-word { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; }
  .lp-logo-mate { color: #4A9EFF; }
  .lp-logo-ai { color: #F5C842; font-size: 13px; margin-left: 2px; }
  .lp-nav-center { display: flex; align-items: center; gap: 34px; }
  .lp-nav-link {
    background: none;
    border: none;
    color: #8AA6C4;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .lp-nav-link:hover { color: #FFFFFF; }
  .lp-nav-right { display: flex; align-items: center; gap: 14px; }
  .lp-btn-ghost {
    color: #B4C6DC;
    font-size: 15px;
    font-weight: 600;
    padding: 9px 18px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .lp-btn-ghost:hover { background: #0F1E35; color: #FFFFFF; }
  .lp-btn-blue {
    background: #4A9EFF;
    color: #0B1120;
    font-size: 15px;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.15s;
  }
  .lp-btn-blue:hover { background: #6BB0FF; }

  /* ---------- Shared button styles ---------- */
  .lp-btn-gold {
    background: #F5C842;
    color: #0B1120;
    font-size: 16px;
    font-weight: 800;
    padding: 16px 36px;
    border-radius: 12px;
    text-decoration: none;
    display: inline-block;
    transition: background 0.15s, transform 0.15s;
  }
  .lp-btn-gold:hover { background: #FFD766; transform: translateY(-1px); }
  .lp-btn-outline {
    background: transparent;
    color: #C4D4E8;
    font-size: 16px;
    font-weight: 700;
    padding: 16px 34px;
    border: 1px solid #1A2D4A;
    border-radius: 12px;
    text-decoration: none;
    display: inline-block;
    transition: border-color 0.15s, color 0.15s;
  }
  .lp-btn-outline:hover { border-color: #4A9EFF; color: #FFFFFF; }

  /* ---------- Section shells ---------- */
  .lp-section { padding: 100px 56px; }
  .lp-section-inner { max-width: 1120px; margin: 0 auto; }
  .lp-eyebrow {
    color: #F5C842;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: center;
  }
  .lp-title {
    font-size: 40px;
    font-weight: 900;
    letter-spacing: -1.5px;
    text-align: center;
    margin: 16px 0 14px;
    color: #FFFFFF;
    line-height: 1.1;
  }
  .lp-subtitle {
    font-size: 18px;
    color: #4A6A8A;
    text-align: center;
    max-width: 620px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ---------- Hero ---------- */
  .lp-hero {
    max-width: 960px;
    margin: 0 auto;
    padding: 120px 56px 100px;
    text-align: center;
  }
  .lp-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(74,158,255,0.10);
    border: 1px solid rgba(74,158,255,0.25);
    color: #7FB6FF;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 999px;
    margin-bottom: 30px;
  }
  .lp-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #4A9EFF; }
  .lp-h1 {
    font-size: 64px;
    font-weight: 900;
    letter-spacing: -3px;
    line-height: 1.05;
    margin: 0 0 26px;
    color: #FFFFFF;
  }
  .lp-h1-blue { color: #4A9EFF; }
  .lp-h1-gold { color: #F5C842; }
  .lp-hero-sub {
    font-size: 19px;
    color: #4A6A8A;
    max-width: 580px;
    margin: 0 auto 38px;
    line-height: 1.6;
  }
  .lp-cta-row {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 56px;
  }
  .lp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    border: 1px solid #0F1E35;
    border-radius: 16px;
    max-width: 700px;
    margin: 0 auto;
    overflow: hidden;
  }
  .lp-stat {
    background: #080E1C;
    padding: 24px 20px;
    text-align: center;
  }
  .lp-stat-num { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
  .lp-stat-label { font-size: 13px; color: #4A6A8A; }

  /* ---------- Features ---------- */
  .lp-features { background: #060B15; }
  .lp-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
    margin-top: 54px;
  }
  .lp-card {
    background: #080E1C;
    border: 1px solid #0F1E35;
    border-radius: 20px;
    padding: 32px;
    transition: border-color 0.18s;
  }
  .lp-card:hover { border-color: #1A2D4A; }
  .lp-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    margin-bottom: 20px;
  }
  .lp-card-title { font-size: 19px; font-weight: 700; color: #FFFFFF; margin: 0 0 10px; }
  .lp-card-desc { font-size: 15px; color: #4A6A8A; line-height: 1.65; margin: 0; }

  /* ---------- Comparison ---------- */
  .lp-compare { background: #070D1A; }
  .lp-badge-center { text-align: center; margin: 40px 0 20px; }
  .lp-badge {
    display: inline-block;
    background: rgba(74,158,255,0.10);
    border: 1px solid rgba(74,158,255,0.25);
    color: #7FB6FF;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 8px 16px;
    border-radius: 999px;
  }
  .lp-table {
    max-width: 860px;
    margin: 0 auto;
    background: #080E1C;
    border: 1px solid #0F1E35;
    border-radius: 20px;
    overflow: hidden;
  }
  .lp-trow {
    display: grid;
    grid-template-columns: 1fr 140px 140px 140px;
    align-items: center;
    border-bottom: 1px solid #0F1E35;
  }
  .lp-trow:last-child { border-bottom: none; }
  .lp-thead { background: #0A1220; }
  .lp-tcell { padding: 16px 18px; font-size: 14px; }
  .lp-tcell-center { text-align: center; }
  .lp-th-feature { color: #3A5A7A; font-weight: 700; font-size: 12px; letter-spacing: 0.06em; }
  .lp-th-comp { color: #3A5A7A; font-weight: 600; }
  .lp-th-prop { color: #4A9EFF; font-weight: 800; }
  .lp-td-feature { color: #B4C6DC; font-weight: 500; }
  .lp-td-comp { color: #2A4060; }
  .lp-td-prop { color: #4A9EFF; font-weight: 700; }
  .lp-td-prop-gold { color: #F5C842; font-weight: 700; }

  /* ---------- Testimonials ---------- */
  .lp-testimonials { background: #060B15; }
  .lp-tcard {
    background: #080E1C;
    border: 1px solid #0F1E35;
    border-radius: 20px;
    padding: 28px;
  }
  .lp-stars { color: #F5C842; font-size: 16px; letter-spacing: 2px; margin-bottom: 14px; }
  .lp-quote { font-size: 15px; color: #C4D4E8; line-height: 1.7; margin: 0 0 22px; }
  .lp-person { display: flex; align-items: center; gap: 12px; }
  .lp-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 15px;
  }
  .lp-person-name { font-size: 15px; font-weight: 700; color: #FFFFFF; }
  .lp-person-role { font-size: 13px; color: #4A6A8A; }

  /* ---------- Final CTA ---------- */
  .lp-finalcta {
    background: #080E1C;
    border-top: 1px solid #0F1E35;
    border-bottom: 1px solid #0F1E35;
    padding: 100px 56px;
    text-align: center;
  }
  .lp-finalcta h2 {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -2px;
    color: #FFFFFF;
    margin: 0 0 18px;
    line-height: 1.1;
  }
  .lp-finalcta-blue { color: #4A9EFF; }
  .lp-finalcta p {
    font-size: 18px;
    color: #4A6A8A;
    max-width: 560px;
    margin: 0 auto 36px;
    line-height: 1.6;
  }

  /* ---------- Footer ---------- */
  .lp-footer {
    padding: 48px 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #0F1E35;
    flex-wrap: wrap;
    gap: 20px;
  }
  .lp-footer-copy { font-size: 13px; color: #2A4060; }
  .lp-footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
  .lp-footer-link {
    background: none;
    border: none;
    color: #4A6A8A;
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .lp-footer-link:hover { color: #4A9EFF; }

  /* ---------- Modals ---------- */
  .lp-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(7,13,26,0.95);
    z-index: 1000;
    overflow-y: auto;
  }
  .lp-modal {
    max-width: 720px;
    margin: 60px auto;
    background: #080E1C;
    border: 1px solid #0F1E35;
    border-radius: 20px;
    padding: 48px;
    position: relative;
  }
  .lp-modal-close {
    position: absolute;
    top: 22px;
    right: 22px;
    background: #0F1E35;
    border: none;
    color: #B4C6DC;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    transition: background 0.15s, color 0.15s;
  }
  .lp-modal-close:hover { background: #1A2D4A; color: #FFFFFF; }
  .lp-modal-title { font-size: 30px; font-weight: 900; letter-spacing: -1px; color: #FFFFFF; margin: 0 0 8px; }
  .lp-modal-sub { font-size: 14px; color: #4A6A8A; margin: 0 0 28px; }
  .lp-modal-h3 { font-size: 17px; font-weight: 700; color: #4A9EFF; margin: 24px 0 8px; }
  .lp-modal-p { font-size: 14px; color: #8AA6C4; line-height: 1.7; margin: 0; }

  .lp-modal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .lp-blog-card {
    background: #060B15;
    border: 1px solid #0F1E35;
    border-radius: 12px;
    padding: 20px;
  }
  .lp-blog-tag { color: #4A9EFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .lp-blog-title { font-size: 15px; font-weight: 700; color: #E6EEF8; margin: 8px 0; line-height: 1.4; }
  .lp-blog-date { font-size: 11px; color: #2A4060; }

  .lp-faq {
    background: #060B15;
    border: 1px solid #0F1E35;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;
  }
  .lp-faq-q { font-weight: 700; color: #E6EEF8; font-size: 15px; margin: 0 0 8px; }
  .lp-faq-a { color: #4A6A8A; font-size: 13px; line-height: 1.7; margin: 0; }

  /* ---------- Responsive ---------- */
  @media (max-width: 768px) {
    .lp-nav { padding: 16px 20px; }
    .lp-nav-center { display: none; }
    .lp-section { padding: 64px 20px; }
    .lp-hero { padding: 96px 20px 64px; }
    .lp-h1 { font-size: 40px; letter-spacing: -1.5px; }
    .lp-hero-sub { font-size: 16px; }
    .lp-title { font-size: 30px; }
    .lp-subtitle { font-size: 16px; }
    .lp-grid-3 { grid-template-columns: 1fr; }
    .lp-stats { grid-template-columns: repeat(2, 1fr); }
    .lp-finalcta { padding: 64px 20px; }
    .lp-finalcta h2 { font-size: 32px; }
    .lp-modal { margin: 20px; padding: 28px; }
    .lp-modal-grid { grid-template-columns: 1fr; }
    .lp-trow { grid-template-columns: 1fr 80px 80px 80px; }
    .lp-tcell { padding: 12px 8px; font-size: 12px; }
    .lp-footer { flex-direction: column; text-align: center; }
  }
`;

// ---------- Data used by the Features / Comparison / Testimonials / Blog / FAQ ----------

type Feature = {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    icon: "ti-cpu",
    iconColor: "#4A9EFF",
    iconBg: "rgba(74,158,255,0.08)",
    title: "Claude AI insights",
    desc: "Get rent price suggestions, tenant screening summaries, and predictive maintenance alerts powered by Anthropic's Claude AI.",
  },
  {
    icon: "ti-map-pin",
    iconColor: "#F5C842",
    iconBg: "rgba(245,200,66,0.08)",
    title: "Google Maps integration",
    desc: "Interactive maps, neighborhood views, and weather widgets on every property page. Tenants find you instantly.",
  },
  {
    icon: "ti-file-invoice",
    iconColor: "#4AE88A",
    iconBg: "rgba(74,232,138,0.08)",
    title: "PDF lease exports",
    desc: "Generate professional lease agreements and rent receipts in one click. No Word docs, no manual formatting.",
  },
  {
    icon: "ti-message",
    iconColor: "#FF6B6B",
    iconBg: "rgba(255,107,107,0.08)",
    title: "Twilio SMS alerts",
    desc: "Send rent reminders, maintenance updates, and lease expiry notices directly to tenants via SMS.",
  },
  {
    icon: "ti-calendar",
    iconColor: "#4A9EFF",
    iconBg: "rgba(74,158,255,0.08)",
    title: "Google Calendar sync",
    desc: "Lease dates, rent due dates, and maintenance schedules sync automatically to your Google Calendar.",
  },
  {
    icon: "ti-world",
    iconColor: "#F5C842",
    iconBg: "rgba(245,200,66,0.08)",
    title: "16 global currencies",
    desc: "USD, GBP, AED, TRY, INR, SGD, MYR, THB, CHF and 7 more — all converted live via ExchangeRate API.",
  },
];

type CompareRow = {
  feature: string;
  buildium: string;
  showdigs: string;
  propmate: string;
  gold?: boolean;
};

const COMPARE_ROWS: CompareRow[] = [
  { feature: "Starting price", buildium: "$62/mo", showdigs: "$150/mo", propmate: "$0/mo", gold: true },
  { feature: "Per-unit fees", buildium: "Yes", showdigs: "$40-45/showing", propmate: "Never" },
  { feature: "AI-powered features", buildium: "Limited", showdigs: "Leasing only", propmate: "Full Claude AI" },
  { feature: "Google Maps on properties", buildium: "No", showdigs: "No", propmate: "Yes" },
  { feature: "SMS tenant notifications", buildium: "Paid add-on", showdigs: "No", propmate: "Built-in" },
  { feature: "Multi-currency support", buildium: "No", showdigs: "USD only", propmate: "16 currencies" },
  { feature: "Google Calendar sync", buildium: "No", showdigs: "Limited", propmate: "Yes" },
  { feature: "PDF lease export", buildium: "Basic", showdigs: "No", propmate: "Yes" },
  { feature: "Minimum portfolio size", buildium: "Any", showdigs: "200+ doors", propmate: "Any size" },
  { feature: "Global availability", buildium: "US only", showdigs: "US only", propmate: "40+ countries", gold: true },
];

type Testimonial = {
  quote: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  name: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Switched from Buildium and saving $45/mo. The AI rent suggestions alone paid for the subscription in the first month.",
    initials: "JM",
    avatarBg: "rgba(74,158,255,0.12)",
    avatarColor: "#4A9EFF",
    name: "James Mitchell",
    role: "12 properties · New York",
  },
  {
    quote: "The Google Maps + weather widget is incredible. My tenants love it. And the AED currency support is perfect for my Dubai portfolio.",
    initials: "SA",
    avatarBg: "rgba(245,200,66,0.12)",
    avatarColor: "#F5C842",
    name: "Sarah Al-Rashidi",
    role: "Agency owner · Dubai, UAE",
  },
  {
    quote: "I was using Showdigs but the $45 per showing was killing my margins. PropMate AI is flat rate and does more. Easy switch.",
    initials: "RK",
    avatarBg: "rgba(74,232,138,0.12)",
    avatarColor: "#4AE88A",
    name: "Rahul Kumar",
    role: "28 properties · Singapore",
  },
];

type BlogPost = { tag: string; title: string; date: string };

const BLOG_POSTS: BlogPost[] = [
  { tag: "AI & Automation", title: "How AI is changing rent price optimization in 2026", date: "June 10, 2026" },
  { tag: "Pricing", title: "Buildium vs PropMate AI: A full cost breakdown", date: "June 5, 2026" },
  { tag: "Growth", title: "How to scale from 1 to 15 properties without hiring staff", date: "May 28, 2026" },
  { tag: "International", title: "Managing properties across multiple currencies: A guide", date: "May 20, 2026" },
  { tag: "Features", title: "Why every landlord needs Google Calendar sync in 2026", date: "May 14, 2026" },
  { tag: "Tenant Management", title: "SMS vs email: Which works better for rent reminders?", date: "May 8, 2026" },
];

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "How do I add my first property?",
    a: 'After logging in, go to the dashboard and scroll to "Add Property". Fill in the property title, address, city, country, and monthly price. Upload up to 20 images and click "Add Property".',
  },
  {
    q: "Why didn't I receive my verification email?",
    a: "Check your spam folder. Wait 2 minutes and try registering again. Contact support if the issue persists.",
  },
  {
    q: "How do I upgrade from Free to Pro?",
    a: 'Go to /pricing, click "Start Pro — 14 days free", and complete the Stripe checkout. Your plan upgrades instantly.',
  },
  {
    q: "Can I manage properties in multiple currencies?",
    a: "Yes. Use the currency selector in the navbar to switch between 16 currencies. Rates update automatically every hour.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings → Billing → Manage Subscription to open the Stripe billing portal and cancel.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (SSL) and at rest (MongoDB Atlas). Passwords are hashed with bcrypt. We never share your data.",
  },
];

export default function LandingPage() {
  // Tracks which modal (if any) is currently open.
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Smoothly scrolls to a section by its id (used by the Features/Compare nav links).
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="lp-root">
      {/* Inject landing-page CSS + Tabler icon webfont. React hoists both to <head>. */}
      <style>{landingStyles}</style>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />

      {/* ---------- SECTION 1 — Navbar ---------- */}
      <nav className="lp-nav">
        <div
          className="lp-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width={30}
            height={30}
            aria-hidden="true"
          >
            <rect x="8" y="11" width="4" height="17" rx="1" fill="#4A9EFF" opacity="0.5" />
            <rect x="14" y="8" width="5" height="20" rx="1" fill="#4A9EFF" opacity="0.75" />
            <rect x="21" y="11" width="4" height="17" rx="1" fill="#4A9EFF" opacity="0.5" />
            <rect x="13" y="6" width="7" height="22" rx="2" fill="#4A9EFF" />
            <circle cx="16" cy="4" r="2.5" fill="#F5C842" />
          </svg>
          <span className="lp-logo-word">
            Prop<span className="lp-logo-mate">Mate</span>
            <span className="lp-logo-ai">AI</span>
          </span>
        </div>

        <div className="lp-nav-center">
          <button className="lp-nav-link" onClick={() => scrollToSection("features")}>
            Features
          </button>
          <button className="lp-nav-link" onClick={() => scrollToSection("compare")}>
            Compare
          </button>
          <button className="lp-nav-link" onClick={() => setActiveModal("blog")}>
            Blog
          </button>
          <button className="lp-nav-link" onClick={() => setActiveModal("support")}>
            Support
          </button>
        </div>

        <div className="lp-nav-right">
          <Link href="/login" className="lp-btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="lp-btn-blue">
            Start free
          </Link>
        </div>
      </nav>

      {/* ---------- SECTION 2 — Hero ---------- */}
      <header className="lp-hero">
        <div className="lp-pill">
          <span className="lp-pill-dot" />
          Trusted by landlords in 40+ countries
        </div>

        <h1 className="lp-h1">
          Property management
          <br />
          reimagined with <span className="lp-h1-blue">AI.</span>
          <br />
          Priced for <span className="lp-h1-gold">humans.</span>
        </h1>

        <p className="lp-hero-sub">
          The only property management platform that combines Claude AI, Google
          Maps, SMS notifications, and 16-currency support — at a flat rate that
          never grows with your portfolio.
        </p>

        <div className="lp-cta-row">
          <Link href="/register" className="lp-btn-gold">
            Start free — no credit card
          </Link>
          <Link href="/pricing" className="lp-btn-outline">
            View pricing
          </Link>
        </div>

        <div className="lp-stats">
          <div className="lp-stat">
            <div className="lp-stat-num" style={{ color: "#4A9EFF" }}>
              $0
            </div>
            <div className="lp-stat-label">To get started</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num" style={{ color: "#F5C842" }}>
              62%
            </div>
            <div className="lp-stat-label">Less than Buildium</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num" style={{ color: "#4AE88A" }}>
              8+
            </div>
            <div className="lp-stat-label">Integrations built-in</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num" style={{ color: "#FF6B6B" }}>
              16
            </div>
            <div className="lp-stat-label">Currencies supported</div>
          </div>
        </div>
      </header>

      {/* ---------- SECTION 3 — Features ---------- */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-section-inner">
          <div className="lp-eyebrow">EVERYTHING YOU NEED</div>
          <h2 className="lp-title">Built for every landlord, at every scale</h2>
          <p className="lp-subtitle">
            From your first property to your hundredth — PropMate AI grows with
            you.
          </p>

          <div className="lp-grid-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="lp-card">
                <div
                  className="lp-icon"
                  style={{ background: feature.iconBg, color: feature.iconColor }}
                >
                  <i className={feature.icon} />
                </div>
                <h3 className="lp-card-title">{feature.title}</h3>
                <p className="lp-card-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECTION 4 — Competitor Comparison ---------- */}
      <section id="compare" className="lp-section lp-compare">
        <div className="lp-section-inner">
          <div className="lp-eyebrow">HONEST COMPARISON</div>
          <h2 className="lp-title">
            Why landlords choose PropMate AI over the rest
          </h2>
          <p className="lp-subtitle">
            We did the research so you don&apos;t have to. No spin — just facts.
          </p>

          <div className="lp-badge-center">
            <span className="lp-badge">PROPMATE AI WINS ON EVERY ROW</span>
          </div>

          <div className="lp-table">
            <div className="lp-trow lp-thead">
              <div className="lp-tcell lp-th-feature">FEATURE</div>
              <div className="lp-tcell lp-tcell-center lp-th-comp">Buildium</div>
              <div className="lp-tcell lp-tcell-center lp-th-comp">Showdigs</div>
              <div className="lp-tcell lp-tcell-center lp-th-prop">PropMate AI</div>
            </div>

            {COMPARE_ROWS.map((row) => (
              <div key={row.feature} className="lp-trow">
                <div className="lp-tcell lp-td-feature">{row.feature}</div>
                <div className="lp-tcell lp-tcell-center lp-td-comp">
                  {row.buildium}
                </div>
                <div className="lp-tcell lp-tcell-center lp-td-comp">
                  {row.showdigs}
                </div>
                <div
                  className={
                    "lp-tcell lp-tcell-center " +
                    (row.gold ? "lp-td-prop-gold" : "lp-td-prop")
                  }
                >
                  {row.propmate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECTION 5 — Testimonials ---------- */}
      <section className="lp-section lp-testimonials">
        <div className="lp-section-inner">
          <div className="lp-eyebrow">REAL LANDLORDS</div>
          <h2 className="lp-title">
            Loved by property managers across the world
          </h2>
          <p className="lp-subtitle">
            From independent landlords to full agencies managing hundreds of
            doors.
          </p>

          <div className="lp-grid-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="lp-tcard">
                <div className="lp-stars">★★★★★</div>
                <p className="lp-quote">{testimonial.quote}</p>
                <div className="lp-person">
                  <div
                    className="lp-avatar"
                    style={{
                      background: testimonial.avatarBg,
                      color: testimonial.avatarColor,
                    }}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="lp-person-name">{testimonial.name}</div>
                    <div className="lp-person-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECTION 6 — Final CTA ---------- */}
      <section className="lp-finalcta">
        <h2>
          Ready to manage smarter, not{" "}
          <span className="lp-finalcta-blue">harder?</span>
        </h2>
        <p>
          Join landlords across 40+ countries. Start free — upgrade when
          you&apos;re ready.
        </p>
        <div className="lp-cta-row" style={{ marginBottom: 0 }}>
          <Link href="/register" className="lp-btn-gold">
            Start free today
          </Link>
          <Link href="/pricing" className="lp-btn-outline">
            View pricing
          </Link>
        </div>
      </section>

      {/* ---------- SECTION 7 — Footer ---------- */}
      <footer className="lp-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="lp-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width={26}
              height={26}
              aria-hidden="true"
            >
              <rect x="8" y="11" width="4" height="17" rx="1" fill="#4A9EFF" opacity="0.5" />
              <rect x="14" y="8" width="5" height="20" rx="1" fill="#4A9EFF" opacity="0.75" />
              <rect x="21" y="11" width="4" height="17" rx="1" fill="#4A9EFF" opacity="0.5" />
              <rect x="13" y="6" width="7" height="22" rx="2" fill="#4A9EFF" />
              <circle cx="16" cy="4" r="2.5" fill="#F5C842" />
            </svg>
            <span className="lp-logo-word">
              Prop<span className="lp-logo-mate">Mate</span>
              <span className="lp-logo-ai">AI</span>
            </span>
          </div>
          <span className="lp-footer-copy">
            © 2026 PropMate AI · FrictionLab LLC · All rights reserved
          </span>
        </div>

        <div className="lp-footer-links">
          <button className="lp-footer-link" onClick={() => setActiveModal("privacy")}>
            Privacy Policy
          </button>
          <button className="lp-footer-link" onClick={() => setActiveModal("terms")}>
            Terms of Service
          </button>
          <button className="lp-footer-link" onClick={() => setActiveModal("blog")}>
            Blog
          </button>
          <button className="lp-footer-link" onClick={() => setActiveModal("support")}>
            Support
          </button>
        </div>
      </footer>

      {/* ---------- MODALS ---------- */}
      {activeModal !== null && (
        <div
          className="lp-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          {/* Stop clicks inside the modal from closing it via the backdrop handler. */}
          <div className="lp-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="lp-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Privacy Policy */}
            {activeModal === "privacy" && (
              <>
                <h2 className="lp-modal-title">Privacy Policy</h2>
                <p className="lp-modal-sub">
                  Last updated: June 14, 2026 · FrictionLab LLC
                </p>

                <h3 className="lp-modal-h3">Information we collect</h3>
                <p className="lp-modal-p">
                  We collect your name, email, and password when you create an
                  account, along with the property and tenant data you choose to
                  add. This information is stored securely on MongoDB Atlas.
                </p>

                <h3 className="lp-modal-h3">How we use your information</h3>
                <p className="lp-modal-p">
                  We use your information only to provide the PropMate AI service.
                  AI insights are generated using only the data you submit. We
                  never sell your data to third parties.
                </p>

                <h3 className="lp-modal-h3">Third-party services</h3>
                <p className="lp-modal-p">
                  We rely on trusted providers to power certain features:
                  Cloudinary (image hosting), Stripe (payments), Resend (email),
                  Twilio (SMS), and Google Maps / Calendar APIs.
                </p>

                <h3 className="lp-modal-h3">Data retention</h3>
                <p className="lp-modal-p">
                  Your data is retained while your account is active. On request
                  to support@propmateai.com, we will delete your data within 30
                  days.
                </p>

                <h3 className="lp-modal-h3">Security</h3>
                <p className="lp-modal-p">
                  We protect your data with SSL encryption, JWT authentication,
                  MongoDB Atlas, and bcrypt password hashing.
                </p>

                <h3 className="lp-modal-h3">Contact</h3>
                <p className="lp-modal-p">
                  privacy@propmateai.com · FrictionLab LLC, Dhaka, Bangladesh
                </p>
              </>
            )}

            {/* Terms of Service */}
            {activeModal === "terms" && (
              <>
                <h2 className="lp-modal-title">Terms of Service</h2>
                <p className="lp-modal-sub">
                  Last updated: June 14, 2026 · FrictionLab LLC
                </p>

                <h3 className="lp-modal-h3">Acceptance of terms</h3>
                <p className="lp-modal-p">
                  By creating an account you agree to these terms. We will give
                  you 14 days notice before any updates take effect.
                </p>

                <h3 className="lp-modal-h3">Your account</h3>
                <p className="lp-modal-p">
                  You are responsible for keeping your login credentials secure
                  and for all activity under your account.
                </p>

                <h3 className="lp-modal-h3">Acceptable use</h3>
                <p className="lp-modal-p">
                  PropMate AI may be used for lawful property management only. No
                  harassment, illegal content, or misuse of the platform is
                  permitted.
                </p>

                <h3 className="lp-modal-h3">Subscription and billing</h3>
                <p className="lp-modal-p">
                  Plans are billed monthly or annually via Stripe. You may cancel
                  anytime. We do not offer partial refunds.
                </p>

                <h3 className="lp-modal-h3">Service availability</h3>
                <p className="lp-modal-p">
                  We target 99.9% uptime and will provide 24 hours notice before
                  any planned maintenance.
                </p>

                <h3 className="lp-modal-h3">Limitation of liability</h3>
                <p className="lp-modal-p">
                  We are not liable for indirect damages. Our total liability is
                  capped at the amount you paid in the previous 12 months.
                </p>

                <h3 className="lp-modal-h3">Contact</h3>
                <p className="lp-modal-p">legal@propmateai.com</p>
              </>
            )}

            {/* Blog */}
            {activeModal === "blog" && (
              <>
                <h2 className="lp-modal-title">PropMate AI Blog</h2>
                <p className="lp-modal-sub">
                  Insights on property management, AI, and growing your
                  portfolio.
                </p>

                <div className="lp-modal-grid">
                  {BLOG_POSTS.map((post) => (
                    <div key={post.title} className="lp-blog-card">
                      <div className="lp-blog-tag">{post.tag}</div>
                      <div className="lp-blog-title">{post.title}</div>
                      <div className="lp-blog-date">{post.date}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Support */}
            {activeModal === "support" && (
              <>
                <h2 className="lp-modal-title">Support Center</h2>
                <p className="lp-modal-sub">
                  Get help with PropMate AI · Email: support@propmateai.com
                </p>

                {FAQS.map((faq) => (
                  <div key={faq.q} className="lp-faq">
                    <p className="lp-faq-q">{faq.q}</p>
                    <p className="lp-faq-a">{faq.a}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
