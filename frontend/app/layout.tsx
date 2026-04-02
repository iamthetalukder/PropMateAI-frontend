import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-zinc-950 text-white">
        {/* MAIN CONTENT */}
        <main className="flex-1">{children}</main>

        {/* FOOTER */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-4 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} Developed by{" "}
          <span className="font-semibold text-blue-500">FrictionLab</span>
        </footer>
      </body>
    </html>
  );
}
