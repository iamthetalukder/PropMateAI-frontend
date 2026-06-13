"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setEmailNotVerified(false);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/");
      } else if (data.emailNotVerified) {
        setEmailNotVerified(true);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-black dark:bg-zinc-950 dark:text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex justify-center">
          <Logo theme="dark" size="lg" />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        {emailNotVerified && (
          <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="mb-1 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              Email not verified
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300">
              Please check your inbox and click the verification link we sent you before logging in.
            </p>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <a href="/register" className="cursor-pointer text-blue-500">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
