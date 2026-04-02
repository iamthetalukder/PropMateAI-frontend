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

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-zinc-200 bg-white py-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          © {new Date().getFullYear()} Developed by{" "}
          <span className="font-semibold text-blue-500">FrictionLab</span>
        </footer>
      </body>
    </html>
  );
}
Talukder Abir
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(
        ${process.env.NEXT_PUBLIC_API_URL}/api/auth/login,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        alert("Login successful ✅");
        window.location.href = "/";
      } else {
        alert(data.message || "Login failed ❌");
      }
    } catch (error) {
      console.error(error);
      alert("Server error ❌");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-black dark:bg-zinc-950 dark:text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-bold text-blue-600">
          Login to PropMate AI
        </h1>

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
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
        >
          Login
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
Talukder Abir
"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch(
        ${process.env.NEXT_PUBLIC_API_URL}/api/auth/register,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful ✅");
        window.location.href = "/login";
      } else {
        alert(data.message || "Registration failed ❌");
      }
    } catch (error) {
      console.error(error);
      alert("Server error ❌");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-black dark:bg-zinc-950 dark:text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-bold text-blue-600">
          Create PropMate AI Account
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          className="mb-4 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          onClick={handleRegister}
          className="w-full rounded-lg bg-green-600 p-3 font-semibold text-white hover:bg-green-700"
        >
          Register
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <a href="/login" className="cursor-pointer text-blue-500">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}