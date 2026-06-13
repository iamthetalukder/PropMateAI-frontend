"use client";

// Lease Management page — full CRUD for lease documents, linked to tenants and properties
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type TenantRef = {
  _id: string;
  name: string;
  email: string;
  phone: string;
};

type PropertyRef = {
  _id: string;
  title: string;
  location: string;
};

type Lease = {
  _id: string;
  tenantId: TenantRef | null;
  propertyId: PropertyRef | null;
  startDate: string;
  endDate: string;
  rentAmount: number;
  currency: string;
  status: "active" | "upcoming" | "expired" | "terminated";
  notes: string;
  createdAt?: string;
};

type TenantOption = { _id: string; name: string; email: string };
type PropertyOption = { _id: string; title: string; location: string };

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  upcoming:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  expired:
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  terminated:
    "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
};

export default function LeasesPage() {
  const router = useRouter();

  // Data
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("active");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchLeases = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/leases",
        { headers: { Authorization: "Bearer " + token } },
      );
      if (!res.ok) throw new Error("Failed to fetch leases");
      const data = await res.json();
      setLeases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch leases error:", err);
      setLeases([]);
    }
  };

  const fetchTenants = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/tenants",
        { headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      setTenants([]);
    }
  };

  const fetchProperties = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/properties",
        { headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch {
      setProperties([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      fetchLeases(token),
      fetchTenants(token),
      fetchProperties(token),
    ]).finally(() => setLoading(false));
  }, [router]);

  const resetForm = () => {
    setSelectedTenantId("");
    setSelectedPropertyId("");
    setStartDate("");
    setEndDate("");
    setRentAmount("");
    setCurrency("USD");
    setNotes("");
    setEditingId(null);
    setEditingStatus("active");
  };

  const handleEditLease = (lease: Lease) => {
    setEditingId(lease._id);
    setSelectedTenantId(lease.tenantId ? lease.tenantId._id : "");
    setSelectedPropertyId(lease.propertyId ? lease.propertyId._id : "");
    setStartDate(lease.startDate ? lease.startDate.slice(0, 10) : "");
    setEndDate(lease.endDate ? lease.endDate.slice(0, 10) : "");
    setRentAmount(String(lease.rentAmount));
    setCurrency(lease.currency || "USD");
    setNotes(lease.notes || "");
    setEditingStatus(lease.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddOrUpdateLease = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    if (!selectedTenantId || !selectedPropertyId || !startDate || !endDate || !rentAmount) {
      showNotification(
        "Please select tenant, property, both dates, and rent amount",
        "error",
      );
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      showNotification("End date must be after start date", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        tenantId: selectedTenantId,
        propertyId: selectedPropertyId,
        startDate,
        endDate,
        rentAmount: Number(rentAmount),
        currency,
        notes,
      };

      // Only include status override when editing and user chose "terminated"
      if (editingId && editingStatus === "terminated") {
        payload.status = "terminated";
      }

      const url = editingId
        ? process.env.NEXT_PUBLIC_API_URL + "/api/leases/" + editingId
        : process.env.NEXT_PUBLIC_API_URL + "/api/leases";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save lease");

      await fetchLeases(token);
      resetForm();
      showNotification(
        editingId ? "Lease updated successfully!" : "Lease created successfully!",
        "success",
      );
    } catch (error: any) {
      showNotification(error.message || "Failed to save lease", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLease = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!window.confirm("Are you sure you want to delete this lease?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/leases/" + id,
        { method: "DELETE", headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete lease");

      if (editingId === id) resetForm();
      await fetchLeases(token);
      showNotification("Lease deleted successfully!", "success");
    } catch (error: any) {
      showNotification(error.message || "Failed to delete lease", "error");
    } finally {
      setDeletingId("");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Returns days remaining until end date (negative = already expired)
  const daysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Summary counts
  const activeLeasesCount = leases.filter((l) => l.status === "active").length;
  const expiringSoonCount = leases.filter(
    (l) => l.status === "active" && daysUntilExpiry(l.endDate) <= 30,
  ).length;
  const expiredCount = leases.filter((l) => l.status === "expired").length;

  // Filter and search
  const filteredLeases = leases.filter((lease) => {
    const matchesStatus =
      filterStatus === "all" || lease.status === filterStatus;
    const query = search.toLowerCase();
    const matchesSearch =
      (lease.tenantId?.name || "").toLowerCase().includes(query) ||
      (lease.tenantId?.email || "").toLowerCase().includes(query) ||
      (lease.propertyId?.title || "").toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950 dark:text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-lg font-semibold">Loading leases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
      {/* NOTIFICATION */}
      {notification && (
        <div
          className={
            "fixed right-6 top-6 z-50 rounded-xl px-6 py-4 text-white shadow-2xl " +
            (notification.type === "success" ? "bg-green-600" : "bg-red-600")
          }
        >
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Logo theme="dark" size="md" />
            <h1 className="mt-1 text-3xl font-bold">Lease Management</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {leases.length} lease{leases.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Dashboard
          </button>
        </div>

        {/* RENEWAL ALERT — shown when leases expire within 30 days */}
        {expiringSoonCount > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-400 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-950">
            <p className="font-semibold text-yellow-700 dark:text-yellow-300">
              ⚠️ Renewal Alert:{" "}
              {expiringSoonCount} lease{expiringSoonCount > 1 ? "s" : ""}{" "}
              {expiringSoonCount > 1 ? "are" : "is"} expiring within 30 days.
              Review and renew them to avoid vacancies.
            </p>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Total Leases
            </h2>
            <p className="mt-3 text-3xl font-bold text-blue-500">
              {leases.length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Active
            </h2>
            <p className="mt-3 text-3xl font-bold text-green-500">
              {activeLeasesCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Expiring Soon
            </h2>
            <p className="mt-3 text-3xl font-bold text-yellow-500">
              {expiringSoonCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Expired
            </h2>
            <p className="mt-3 text-3xl font-bold text-red-500">
              {expiredCount}
            </p>
          </div>
        </div>

        {/* ADD / EDIT FORM */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Lease" : "Create New Lease"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Tenant selector */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tenant *
              </label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">Select a tenant</option>
                {tenants.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Property selector */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Property *
              </label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} — {p.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Lease start date */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Lease Start Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Lease end date */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Lease End Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Monthly rent */}
            <input
              type="number"
              placeholder="Monthly Rent Amount *"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
            />

            {/* Currency */}
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
              <option value="BDT">BDT</option>
            </select>

            {/* Status override — only visible when editing */}
            {editingId && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Override Status
                </label>
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value)}
                >
                  <option value="active">Auto-compute from dates</option>
                  <option value="terminated">Terminated (manually ended)</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div className={editingId ? "" : "md:col-span-2"}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any additional details about this lease..."
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleAddOrUpdateLease}
            disabled={submitting}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? editingId
                ? "Updating..."
                : "Creating..."
              : editingId
                ? "Update Lease"
                : "Create Lease"}
          </button>
        </div>

        {/* LEASE LIST */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">All Leases</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Search by tenant or property..."
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {filteredLeases.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              {leases.length === 0
                ? "No leases created yet. Create your first lease above."
                : "No leases match your filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredLeases.map((lease) => {
                const days = daysUntilExpiry(lease.endDate);
                const showRenewalWarning =
                  lease.status === "active" && days <= 30 && days >= 0;
                return (
                  <div
                    key={lease._id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* LEFT: Lease info */}
                      <div className="flex-1">
                        {/* Header row: tenant name + status badge */}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">
                            {lease.tenantId?.name || "Unknown Tenant"}
                          </h3>
                          <span
                            className={
                              "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                              (STATUS_COLORS[lease.status] || "")
                            }
                          >
                            {lease.status.charAt(0).toUpperCase() +
                              lease.status.slice(1)}
                          </span>
                          {showRenewalWarning && (
                            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                              ⚠️ Expires in {days} day{days !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Details grid */}
                        <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                          {lease.tenantId?.email && (
                            <p>
                              <span className="font-semibold text-black dark:text-white">
                                Email:{" "}
                              </span>
                              {lease.tenantId.email}
                            </p>
                          )}
                          {lease.propertyId && (
                            <p>
                              <span className="font-semibold text-black dark:text-white">
                                Property:{" "}
                              </span>
                              <button
                                onClick={() =>
                                  router.push(
                                    "/property/" + lease.propertyId!._id,
                                  )
                                }
                                className="text-blue-500 underline hover:text-blue-600"
                              >
                                {lease.propertyId.title}
                              </button>
                            </p>
                          )}
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Rent:{" "}
                            </span>
                            {(lease.currency || "USD")}{" "}
                            {Number(lease.rentAmount).toLocaleString()} / mo
                          </p>
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Term:{" "}
                            </span>
                            {formatDate(lease.startDate)} →{" "}
                            {formatDate(lease.endDate)}
                          </p>
                          {lease.notes && (
                            <p className="sm:col-span-2">
                              <span className="font-semibold text-black dark:text-white">
                                Notes:{" "}
                              </span>
                              {lease.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditLease(lease)}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLease(lease._id)}
                          disabled={deletingId === lease._id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === lease._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
