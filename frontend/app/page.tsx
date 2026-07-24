// PropMate AI — Public landing route ("/").
// This file is a Server Component so it can export `metadata` for SEO / Open Graph.
// The interactive UI (navbar, modals, smooth scroll) lives in the client component
// below, since `metadata` cannot be exported from a "use client" file.

import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "PropMate AI — AI-Powered Property Management",
  description: "Manage properties like a pro. Flat-rate pricing, Claude AI insights, Google Maps, SMS, 16 currencies. No per-unit fees.",
  openGraph: {
    title: "PropMate AI — AI-Powered Property Management",
    description: "The only property management platform that combines Claude AI, Google Maps, SMS notifications, and 16-currency support — at a flat rate.",
    url: "https://prop-mate-ai-frontend.vercel.app",
    siteName: "PropMate AI",
    images: [
      {
        url: "https://prop-mate-ai-frontend.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropMate AI — AI-Powered Property Management",
    description: "Manage properties with Claude AI, Google Maps, SMS, and 16 currencies. Flat rate, never growing.",
  },
};

// Render the public landing page (no authentication required).
export default function Page() {
  return <LandingPage />;
}
