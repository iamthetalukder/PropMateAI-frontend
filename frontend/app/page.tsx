"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-black dark:bg-zinc-950 dark:text-white">
        Loading...
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-500">
              PropMate AI
            </p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Welcome to your property management dashboard.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Total Properties</h2>
            <p className="mt-4 text-3xl font-bold text-blue-500">0</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Occupied Units</h2>
            <p className="mt-4 text-3xl font-bold text-green-500">0</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Vacant Units</h2>
            <p className="mt-4 text-3xl font-bold text-yellow-500">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-bold">Next Step</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Authentication is working. Next we can connect your real property
            data from the backend and MongoDB.
          </p>
        </div>
      </div>
    </div>
  );
}
