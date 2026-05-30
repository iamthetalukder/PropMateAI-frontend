"use client";

// Maintenance Requests page — log and track repair/issue tickets per property
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PropertyRef = { _id: string; title: string; location: string };
type TenantRef = { _id: string; name: string; email: string };

type MaintenanceRequest = {
  _id: string;
  title: string;
  description: string;
  propertyId: PropertyRef | null;
  tenantId: TenantRef | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  category: string;
  resolvedAt: string | null;
  createdAt?: string;
};

type PropertyOption = { _id: string; title: string; location: string };
type TenantOption = { _id: string; name: string; email: string };

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
};

const CATEGORIES = [
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "other",
];

export default function MaintenancePage() {
  const router = useRouter();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formTenantId, setFormTenantId] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formCategory, setFormCategory] = useState("other");
  const [formStatus, setFormStatus] = useState("open");

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRequests = async (token: string) => {
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/maintenance",
        { headers: { Authorization: "Bearer " + token } },
      );
      if (!res.ok) throw new Error("Failed to fetch maintenance requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch maintenance error:", err);
      setRequests([]);
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    Promise.all([
      fetchRequests(token),
      fetchProperties(token),
      fetchTenants(token),
    ]).finally(() => setLoading(false));
  }, [router]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormPropertyId("");
    setFormTenantId("");
    setFormPriority("medium");
    setFormCategory("other");
    setFormStatus("open");
    setEditingId(null);
  };

  const handleEditRequest = (req: MaintenanceRequest) => {
    setEditingId(req._id);
    setFormTitle(req.title);
    setFormDescription(req.description);
    setFormPropertyId(req.propertyId ? req.propertyId._id : "");
    setFormTenantId(req.tenantId ? req.tenantId._id : "");
    setFormPriority(req.priority);
    setFormCategory(req.category);
    setFormStatus(req.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    if (!formTitle.trim() || !formDescription.trim() || !formPropertyId) {
      showNotification("Please fill title, description, and select a property", "error");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        propertyId: formPropertyId,
        tenantId: formTenantId || null,
        priority: formPriority,
        category: formCategory,
      };
      // Status can only be changed when editing
      if (editingId) payload.status = formStatus;

      const url = editingId
        ? process.env.NEXT_PUBLIC_API_URL + "/api/maintenance/" + editingId
        : process.env.NEXT_PUBLIC_API_URL + "/api/maintenance";
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
      if (!res.ok) throw new Error(data.message || "Failed to save request");

      await fetchRequests(token);
      resetForm();
      showNotification(
        editingId ? "Request updated!" : "Request created!",
        "success",
      );
    } catch (error: any) {
      showNotification(error.message || "Failed to save request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!window.confirm("Delete this maintenance request?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/maintenance/" + id,
        { method: "DELETE", headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");

      if (editingId === id) resetForm();
      await fetchRequests(token);
      showNotification("Request deleted!", "success");
    } catch (error: any) {
      showNotification(error.message || "Failed to delete", "error");
    } finally {
      setDeletingId("");
    }
  };

  // Quick status change without opening the full edit form
  const handleQuickStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/maintenance/" + id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!res.ok) throw new Error("Status update failed");
      await fetchRequests(token);
    } catch (err) {
      console.error("Quick status update error:", err);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Summary counts
  const openCount = requests.filter((r) => r.status === "open").length;
  const inProgressCount = requests.filter((r) => r.status === "in-progress").length;
  const resolvedCount = requests.filter((r) => r.status === "resolved").length;
  const urgentOpenCount = requests.filter(
    (r) => r.priority === "urgent" && r.status === "open",
  ).length;

  // Filter + search
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesPriority = filterPriority === "all" || r.priority === filterPriority;
    const query = search.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      (r.propertyId?.title || "").toLowerCase().includes(query) ||
      (r.tenantId?.name || "").toLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950 dark:text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-lg font-semibold">Loading maintenance requests...</p>
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
            <p className="text-sm uppercase tracking-[0.25em] text-blue-500">
              PropMate AI
            </p>
            <h1 className="text-3xl font-bold">Maintenance Requests</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {requests.length} request{requests.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Dashboard
          </button>
        </div>

        {/* URGENT ALERT */}
        {urgentOpenCount > 0 && (
          <div className="mb-6 rounded-2xl border border-red-400 bg-red-50 p-4 dark:border-red-600 dark:bg-red-950">
            <p className="font-semibold text-red-700 dark:text-red-300">
              🚨 Urgent:{" "}
              {urgentOpenCount} open request{urgentOpenCount > 1 ? "s" : ""}{" "}
              marked urgent and need immediate attention.
            </p>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Total
            </h2>
            <p className="mt-3 text-3xl font-bold text-blue-500">
              {requests.length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Open
            </h2>
            <p className="mt-3 text-3xl font-bold text-yellow-500">{openCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              In Progress
            </h2>
            <p className="mt-3 text-3xl font-bold text-blue-500">
              {inProgressCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Resolved
            </h2>
            <p className="mt-3 text-3xl font-bold text-green-500">
              {resolvedCount}
            </p>
          </div>
        </div>

        {/* ADD / EDIT FORM */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Request" : "Log New Request"}
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
            {/* Title */}
            <input
              type="text"
              placeholder="Issue Title *  (e.g. Broken kitchen tap)"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            {/* Property selector */}
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={formPropertyId}
              onChange={(e) => setFormPropertyId(e.target.value)}
            >
              <option value="">Select Property *</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} — {p.location}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value)}
            >
              <option value="low">Priority: Low</option>
              <option value="medium">Priority: Medium</option>
              <option value="high">Priority: High</option>
              <option value="urgent">Priority: Urgent</option>
            </select>

            {/* Category */}
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category:{" "}
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>

            {/* Tenant selector (optional) */}
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={formTenantId}
              onChange={(e) => setFormTenantId(e.target.value)}
            >
              <option value="">Reported by tenant (optional)</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} — {t.email}
                </option>
              ))}
            </select>

            {/* Status override — only visible when editing */}
            {editingId && (
              <select
                className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="open">Status: Open</option>
                <option value="in-progress">Status: In Progress</option>
                <option value="resolved">Status: Resolved</option>
                <option value="closed">Status: Closed</option>
              </select>
            )}

            {/* Description — full width */}
            <div className="md:col-span-2">
              <textarea
                rows={3}
                placeholder="Describe the issue in detail *"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={submitting}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? editingId
                ? "Updating..."
                : "Logging..."
              : editingId
                ? "Update Request"
                : "Log Request"}
          </button>
        </div>

        {/* REQUEST LIST */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">All Requests</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Search by title, property, or tenant..."
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
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              {requests.length === 0
                ? "No maintenance requests yet. Log your first request above."
                : "No requests match your filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div
                  key={req._id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* LEFT: Request info */}
                    <div className="flex-1">
                      {/* Title row with badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{req.title}</h3>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                            (PRIORITY_STYLES[req.priority] || "")
                          }
                        >
                          {req.priority.charAt(0).toUpperCase() +
                            req.priority.slice(1)}
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                            (STATUS_STYLES[req.status] || "")
                          }
                        >
                          {req.status === "in-progress"
                            ? "In Progress"
                            : req.status.charAt(0).toUpperCase() +
                              req.status.slice(1)}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {req.category.charAt(0).toUpperCase() +
                            req.category.slice(1)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {req.description}
                      </p>

                      {/* Meta info */}
                      <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                        {req.propertyId && (
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Property:{" "}
                            </span>
                            <button
                              onClick={() =>
                                router.push("/property/" + req.propertyId!._id)
                              }
                              className="text-blue-500 underline hover:text-blue-600"
                            >
                              {req.propertyId.title}
                            </button>
                          </p>
                        )}
                        {req.tenantId && (
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Reported by:{" "}
                            </span>
                            {req.tenantId.name}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-black dark:text-white">
                            Logged:{" "}
                          </span>
                          {formatDate(req.createdAt)}
                        </p>
                        {req.resolvedAt && (
                          <p>
                            <span className="font-semibold text-black dark:text-white">
                              Resolved:{" "}
                            </span>
                            {formatDate(req.resolvedAt)}
                          </p>
                        )}
                      </div>

                      {/* Quick status workflow buttons */}
                      {req.status !== "closed" && req.status !== "resolved" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {req.status === "open" && (
                            <button
                              onClick={() =>
                                handleQuickStatus(req._id, "in-progress")
                              }
                              className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                            >
                              → Mark In Progress
                            </button>
                          )}
                          {req.status === "in-progress" && (
                            <button
                              onClick={() =>
                                handleQuickStatus(req._id, "resolved")
                              }
                              className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                            >
                              → Mark Resolved
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Edit / Delete */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRequest(req)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(req._id)}
                        disabled={deletingId === req._id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === req._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
