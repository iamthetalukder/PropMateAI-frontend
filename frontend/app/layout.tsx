import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import CurrencySelector from "@/components/CurrencySelector";

export const metadata: Metadata = {
  title: "PropMate AI",
  description: "Developed by FrictionLab",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-white text-black dark:bg-zinc-950 dark:text-white transition-colors duration-300">
        {/* TOP BAR */}
        <div className="flex items-center justify-end gap-3 px-4 pt-4">
          <CurrencySelector />
          <ThemeToggle />
        </div>

        {/* MAIN */}
        <main className="flex-1">{children}</main>

        {/* FOOTER */}
        <footer className="border-t border-zinc-200 bg-white py-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          © {new Date().getFullYear()} Developed by{" "}
          <span className="font-semibold text-blue-500">FrictionLab</span>
        </footer>
      </body>
    </html>
  );
}
