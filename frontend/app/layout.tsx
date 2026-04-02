import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "PropMate AI",
  description: "Developed by FrictionLab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-zinc-100 text-black dark:bg-zinc-950 dark:text-white">
        <div className="flex justify-end px-4 pt-4">
          <ThemeToggle />
        </div>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-zinc-200 bg-white py-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          © {new Date().getFullYear()} Developed by{" "}
          <span className="font-semibold text-blue-500">FrictionLab</span>
        </footer>
      </body>
    </html>
  );
}
