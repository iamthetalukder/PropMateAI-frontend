"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Property = {
  _id: string;
  name: string;
  location: string;
  rent: number;
  currency?: string;
  status?: string;
};

type CurrentUser = {
  _id: string;
  name: string;
  email: string;
};

const currencies = ["USD", "EUR", "GBP", "BDT", "AED", "INR", "TRY"];

export default function Home() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    rent: "",
    currency: "USD",
    status: "vacant",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    rent: "",
    currency: "USD",
    status: "vacant",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    document.documentElement.classList.toggle(
      "dark",
      (savedTheme || theme) === "dark",
    );

    const loadData = async () => {
      await Promise.all([fetchUser(token), fetchProperties(token)]);
      setLoading(false);
    };

    loadData();
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch {
      toast.error("Failed to load user");
    }
  };

  const fetchProperties = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load properties");
    }
  };

  const handleAddProperty = async () => {
    if (!form.name || !form.location || !form.rent) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setAdding(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          rent: Number(form.rent),
          currency: form.currency,
          status: form.status,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add property");
        return;
      }

      toast.success("Property added successfully");

      setForm({
        name: "",
        location: "",
        rent: "",
        currency: "USD",
        status: "vacant",
      });

      if (token) {
        fetchProperties(token);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (property: Property) => {
    setEditingId(property._id);
    setEditForm({
      name: property.name,
      location: property.location,
      rent: String(property.rent),
      currency: property.currency || "USD",
      status: property.status || "vacant",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      location: "",
      rent: "",
      currency: "USD",
      status: "vacant",
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name || !editForm.location || !editForm.rent) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSavingEdit(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          rent: Number(editForm.rent),
          currency: editForm.currency,
          status: editForm.status,
        }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update property");
        return;
      }

      toast.success("Property updated");
      cancelEdit();

      if (token) {
        fetchProperties(token);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete property");
        return;
      }

      toast.success("Property deleted");

      if (token) {
        fetchProperties(token);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const q = search.toLowerCase();
      return (
        property.name.toLowerCase().includes(q) ||
        property.location.toLowerCase().includes(q) ||
        String(property.rent).includes(q) ||
        (property.currency || "").toLowerCase().includes(q) ||
        (property.status || "").toLowerCase().includes(q)
      );
    });
  }, [properties, search]);

  if (!mounted) return null;

  const totalProperties = properties.length;
  const totalRent = properties.reduce((sum, item) => sum + item.rent, 0);
  const vacantUnits = properties.filter(
    (item) => (item.status || "vacant") === "vacant",
  ).length;

  const isDark = theme === "dark";

  const pageBg = isDark
    ? "min-h-screen bg-zinc-950 text-white"
    : "min-h-screen bg-zinc-100 text-black";

  const cardBg = isDark
    ? "rounded-3xl border border-zinc-800 bg-zinc-900/95 shadow-xl"
    : "rounded-3xl border border-zinc-200 bg-white/95 shadow-xl";

  const mutedText = isDark ? "text-zinc-400" : "text-zinc-600";

  const inputClass = isDark
    ? "w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
    : "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-black outline-none transition focus:border-blue-500";

  if (loading) {
    return (
      <div
        className={`${pageBg} flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%)]`}
      >
        <div className={`p-6 ${cardBg}`}>
          <p className={mutedText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${pageBg} bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%)]`}
    >
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
              PropMate AI
            </p>
            <h1 className="text-3xl font-bold text-blue-600">
              PropMate AI Dashboard
            </h1>
            <p className={mutedText}>
              {user
                ? `Welcome back, ${user.name}`
                : "Premium property management dashboard"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-white transition hover:opacity-90"
            >
              {isDark ? "Light" : "Dark"}
            </button>

            <button
              onClick={handleLogout}
              className="rounded-2xl bg-red-500 px-4 py-2 text-white transition hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div className={`p-6 ${cardBg}`}>
            <h3 className="text-lg font-semibold">Total Properties</h3>
            <p className="mt-2 text-3xl font-bold text-blue-500">
              {totalProperties}
            </p>
          </div>

          <div className={`p-6 ${cardBg}`}>
            <h3 className="text-lg font-semibold">Total Rent</h3>
            <p className="mt-2 text-3xl font-bold text-green-500">
              {totalRent}
            </p>
          </div>

          <div className={`p-6 ${cardBg}`}>
            <h3 className="text-lg font-semibold">Vacant Units</h3>
            <p className="mt-2 text-3xl font-bold text-red-500">
              {vacantUnits}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`p-6 ${cardBg}`}>
            <h2 className="mb-4 text-xl font-semibold">Add Property</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Property name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />

              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
              />

              <input
                type="text"
                inputMode="numeric"
                placeholder="Rent"
                value={form.rent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rent: e.target.value.replace(/\D/g, ""),
                  })
                }
                className={inputClass}
              />

              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inputClass}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                <option value="vacant">vacant</option>
                <option value="occupied">occupied</option>
              </select>

              <button
                onClick={handleAddProperty}
                disabled={adding}
                className="w-full rounded-2xl bg-blue-600 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Property"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4">
              <input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={`p-6 ${cardBg}`}>
              <h2 className="text-xl font-semibold">Recent Properties</h2>

              {filteredProperties.length === 0 ? (
                <p className={`mt-4 ${mutedText}`}>No properties found.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {filteredProperties.map((property) => (
                    <div
                      key={property._id}
                      className={`rounded-2xl border p-4 ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950"
                          : "border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      {editingId === property._id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Property name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className={inputClass}
                          />

                          <input
                            type="text"
                            placeholder="Location"
                            value={editForm.location}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                location: e.target.value,
                              })
                            }
                            className={inputClass}
                          />

                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rent"
                            value={editForm.rent}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                rent: e.target.value.replace(/\D/g, ""),
                              })
                            }
                            className={inputClass}
                          />

                          <select
                            value={editForm.currency}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                currency: e.target.value,
                              })
                            }
                            className={inputClass}
                          >
                            {currencies.map((currency) => (
                              <option key={currency} value={currency}>
                                {currency}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                status: e.target.value,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="vacant">vacant</option>
                            <option value="occupied">occupied</option>
                          </select>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(property._id)}
                              disabled={savingEdit}
                              className="rounded-2xl bg-blue-600 px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>

                            <button
                              onClick={cancelEdit}
                              className="rounded-2xl bg-zinc-500 px-4 py-2 text-white transition hover:opacity-90"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-bold">
                              {property.name}
                            </h3>
                            <p className={mutedText}>{property.location}</p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="font-semibold text-blue-600">
                              {property.rent} {property.currency || "USD"}
                            </p>
                            <p className={`capitalize ${mutedText}`}>
                              {property.status || "vacant"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(property)}
                              className="rounded-2xl bg-amber-500 px-4 py-2 text-white transition hover:opacity-90"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteProperty(property._id)}
                              disabled={deletingId === property._id}
                              className="rounded-2xl bg-red-500 px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {deletingId === property._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`mt-6 p-6 ${cardBg}`}>
              <h2 className="text-xl font-semibold">AI Insights</h2>
              <p className={`mt-2 ${mutedText}`}>
                Your dashboard is now connected to the live backend and MongoDB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
