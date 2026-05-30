"use client";

// Tenant Management page — full CRUD for tenants, linked to properties
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Property = {
  _id: string;
  title: string;
  location: string;
};

type Tenant = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  propertyId: Property | null;
  createdAt?: string;
};

export default function TenantsPage() {
  const router = useRouter();

  // Data state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all tenants from the API
  const fetchTenants = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/tenants",
        { headers: { Authorization: "Bearer " + token } },
      );
      if (!res.ok) throw new Error("Failed to fetch tenants");
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch tenants error:", err);
      setTenants([]);
    }
  };

  // Fetch all properties so user can link a tenant to a property
  const fetchProperties = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/properties",
        { headers: { Authorization: "Bearer " + token } },
      );
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch properties error:", err);
      setProperties([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([fetchTenants(token), fetchProperties(token)]).finally(() =>
      setLoading(false),
    );
  }, [router]);

  // Reset the form to blank state
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRentAmount("");
    setLeaseStart("");
    setLeaseEnd("");
    setSelectedPropertyId("");
    setEditingId(null);
  };

  // Populate form fields when clicking Edit on a tenant
  const handleEditTenant = (tenant: Tenant) => {
    setEditingId(tenant._id);
    setName(tenant.name);
    setEmail(tenant.email);
    setPhone(tenant.phone || "");
    setRentAmount(String(tenant.rentAmount));
    // Convert stored ISO date to YYYY-MM-DD for the date input
    setLeaseStart(tenant.leaseStart ? tenant.leaseStart.slice(0, 10) : "");
    setLeaseEnd(tenant.leaseEnd ? tenant.leaseEnd.slice(0, 10) : "");
    setSelectedPropertyId(tenant.propertyId ? tenant.propertyId._id : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add a new tenant or update an existing one
  const handleAddOrUpdateTenant = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!name.trim() || !email.trim() || !rentAmount || !leaseStart || !leaseEnd) {
      showNotification(
        "Please fill name, email, rent amount, lease start, and lease end",
        "error",
      );
      return;
    }
    if (new Date(leaseEnd) <= new Date(leaseStart)) {
      showNotification("Lease end date must be after lease start date", "error");
      return;
    }

    try {
      setSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        rentAmount: Number(rentAmount),
        leaseStart,
        leaseEnd,
        propertyId: selectedPropertyId || null,
      };

      const url = editingId
        ? apiUrl + "/api/tenants/" + editingId
        : apiUrl + "/api/tenants";
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
      if (!res.ok) throw new Error(data.message || "Failed to save tenant");

      await fetchTenants(token);
      resetForm();
      showNotification(
        editingId
          ? "Tenant updated successfully!"
          : "Tenant added successfully!",
        "success",
      );
    } catch (error: any) {
      showNotification(error.message || "Failed to save tenant", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a tenant
  const handleDeleteTenant = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/tenants/" + id,
        { method: "DELETE", headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete tenant");

      if (editingId === id) resetForm();
      await fetchTenants(token);
      showNotification("Tenant deleted successfully!", "success");
    } catch (error: any) {
      showNotification(error.message || "Failed to delete tenant", "error");
    } finally {
      setDeletingId("");
    }
  };

  // Format a date string for display (e.g. "January 15, 2025")
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a lease is currently active, expired, or upcoming
  const getLeaseStatus = (leaseStart: string, leaseEnd: string) => {
    const now = new Date();
    const start = new Date(leaseStart);
    const end = new Date(leaseEnd);
    if (now < start) return { label: "Upcoming", color: "text-blue-400" };
    if (now > end) return { label: "Expired", color: "text-red-400" };
    return { label: "Active", color: "text-green-400" };
  };

  // Filter tenants by search query (name, email, or property title)
  const filteredTenants = tenants.filter((tenant) => {
    const query = search.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(query) ||
      tenant.email.toLowerCase().includes(query) ||
      (tenant.propertyId?.title || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950 dark:text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-lg font-semibold">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
      {/* NOTIFICATION TOAST */}
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
            <p className="text-sm uppercase tracking-[0.25em] text-blue-500">
              PropMate AI
            </p>
            <h1 className="text-3xl font-bold">Tenant Management</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Total Tenants</h2>
            <p className="mt-4 text-3xl font-bold text-blue-500">
              {tenants.length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Active Leases</h2>
            <p className="mt-4 text-3xl font-bold text-green-500">
              {
                tenants.filter((t) => {
                  const now = new Date();
                  return (
                    new Date(t.leaseStart) <= now && new Date(t.leaseEnd) >= now
                  );
                }).length
              }
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Monthly Rent Total</h2>
            <p className="mt-4 text-3xl font-bold text-purple-500">
              {tenants
                .reduce((sum, t) => sum + Number(t.rentAmount || 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* ADD / EDIT FORM */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Tenant" : "Add New Tenant"}
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
            {/* Tenant full name */}
            <input
              type="text"
              placeholder="Tenant Full Name *"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {/* Email address */}
            <input
              type="email"
              placeholder="Email Address *"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {/* Phone number */}
            <input
              type="text"
              placeholder="Phone Number"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {/* Monthly rent amount */}
            <input
              type="number"
              placeholder="Monthly Rent Amount *"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
            />
            {/* Lease start date */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Lease Start Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={leaseStart}
                onChange={(e) => setLeaseStart(e.target.value)}
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
                value={leaseEnd}
                onChange={(e) => setLeaseEnd(e.target.value)}
              />
            </div>
            {/* Link to property dropdown */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Linked Property (Optional)
              </label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">No property linked</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.title} — {property.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAddOrUpdateTenant}
            disabled={submitting}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
                ? "Update Tenant"
                : "Add Tenant"}
          </button>
        </div>

        {/* TENANT LIST */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">All Tenants</h2>
            <input
              type="text"
              placeholder="Search by name, email, or property..."
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredTenants.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              {tenants.length === 0
                ? "No tenants added yet. Add your first tenant above."
                : "No tenants match your search."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => {
                const leaseStatus = getLeaseStatus(
                  tenant.leaseStart,
                  tenant.leaseEnd,
                );
                return (
                  <div
                    key={tenant._id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* LEFT: Tenant info */}
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">{tenant.name}</h3>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-bold " +
                              (leaseStatus.label === "Active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : leaseStatus.label === "Expired"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300")
                            }
                          >
                            {leaseStatus.label}
                          </span>
                        </div>

                        <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Email:{" "}
                            </span>
                            {tenant.email}
                          </p>
                          {tenant.phone && (
                            <p>
                              <span className="font-semibold text-black dark:text-white">
                                Phone:{" "}
                              </span>
                              {tenant.phone}
                            </p>
                          )}
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Rent:{" "}
                            </span>
                            {Number(tenant.rentAmount).toLocaleString()} / month
                          </p>
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Lease:{" "}
                            </span>
                            {formatDate(tenant.leaseStart)} →{" "}
                            {formatDate(tenant.leaseEnd)}
                          </p>
                          {tenant.propertyId && (
                            <p className="sm:col-span-2">
                              <span className="font-semibold text-black dark:text-white">
                                Property:{" "}
                              </span>
                              <button
                                onClick={() =>
                                  router.push(
                                    "/property/" + tenant.propertyId!._id,
                                  )
                                }
                                className="text-blue-500 underline hover:text-blue-600"
                              >
                                {tenant.propertyId.title}
                              </button>
                              {" — "}
                              {tenant.propertyId.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTenant(tenant)}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant._id)}
                          disabled={deletingId === tenant._id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === tenant._id ? "Deleting..." : "Delete"}
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
