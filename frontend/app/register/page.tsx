"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
      return;
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed");
        return;
      }

      toast.success("Registered successfully");
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (!mounted) return null;

  const isDark = theme === "dark";

  const pageBg = isDark
    ? "min-h-screen bg-zinc-950 text-white"
    : "min-h-screen bg-zinc-100 text-black";

  const cardBg = isDark
    ? "w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-xl"
    : "w-full max-w-md rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-xl";

  const inputClass = isDark
    ? "w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500";

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";

  return (
    <div
      className={`${pageBg} flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%)] px-4 py-10`}
    >
      <div className={cardBg}>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
              PropMate AI
            </p>
            <h1 className="text-3xl font-bold text-blue-600">Create Account</h1>
            <p className={muted}>Start managing your properties beautifully</p>
          </div>

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition hover:opacity-90"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          <button
            onClick={handleRegister}
            className="w-full rounded-2xl bg-green-600 py-3 font-medium text-white transition hover:opacity-90"
          >
            Register
          </button>

          <p className={`text-sm ${muted}`}>
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-blue-600">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
