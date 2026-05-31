"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "tenant";
  createdAt: string;
};

type AdminStats = {
  totalUsers: number;
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  usersByRole: { admin: number; manager: number; tenant: number };
};

type Notification = { message: string; type: "success" | "error" };

const roleColors = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  tenant:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return token;
  };

  const fetchData = async (token: string) => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(apiUrl + "/api/admin/users", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch(apiUrl + "/api/admin/stats", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);

      if (usersRes.status === 403) {
        showNotification("Access denied — admin role required", "error");
        router.push("/");
        return;
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Decode JWT to check role and get current user id
    try {
      const decoded: {
        id: string;
        role: string;
        name: string;
      } = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role !== "admin") {
        showNotification("Access denied — admin role required", "error");
        router.push("/");
        return;
      }

      setCurrentUserId(decoded.id);
    } catch {
      router.push("/login");
      return;
    }

    fetchData(token).finally(() => setLoading(false));
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = getToken();
    if (!token) return;

    setUpdatingId(userId);
    try {
      const res = await fetch(apiUrl + "/api/admin/users/" + userId + "/role", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, role: newRole as "admin" | "manager" | "tenant" }
            : u,
        ),
      );
      showNotification(
        `Role updated to "${newRole}" for ${data.name}`,
        "success",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating role";
      showNotification(msg, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Delete user "${userName}"? This cannot be undone.`,
      )
    )
      return;

    const token = getToken();
    if (!token) return;

    setDeletingId(userId);
    try {
      const res = await fetch(apiUrl + "/api/admin/users/" + userId, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showNotification(`User "${userName}" deleted successfully`, "success");

      // Refresh stats
      fetchData(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting user";
      showNotification(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <p className="text-lg font-semibold">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-red-500">
              Admin Panel
            </p>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Manage all users and their roles across PropMate AI
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ← Dashboard
          </button>
        </div>

        {/* System stats */}
        {stats && (
          <div className="mb-8 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Total Users</p>
              <p className="text-3xl font-bold text-blue-500">
                {stats.totalUsers}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Properties</p>
              <p className="text-3xl font-bold text-purple-500">
                {stats.totalProperties}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Occupied</p>
              <p className="text-3xl font-bold text-green-500">
                {stats.occupiedProperties}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Vacant</p>
              <p className="text-3xl font-bold text-yellow-500">
                {stats.vacantProperties}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">Occupancy Rate</p>
              <p className="text-3xl font-bold text-emerald-500">
                {stats.occupancyRate}%
              </p>
            </div>
          </div>
        )}

        {/* Role breakdown */}
        {stats && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold">Users by Role</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                  Admin
                </span>
                <span className="font-bold">{stats.usersByRole.admin}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Manager
                </span>
                <span className="font-bold">{stats.usersByRole.manager}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                  Tenant
                </span>
                <span className="font-bold">{stats.usersByRole.tenant}</span>
              </div>
            </div>
          </div>
        )}

        {/* User list */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">All Users ({users.length})</h2>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:w-80"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">No users found.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isCurrentUser = user._id === currentUserId;
                return (
                  <div
                    key={user._id}
                    className={
                      "flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between " +
                      (isCurrentUser
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800")
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.name}</p>
                        {isCurrentUser && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                            You
                          </span>
                        )}
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-xs font-semibold " +
                            roleColors[user.role]
                          }
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role change dropdown — disabled for current user */}
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        disabled={isCurrentUser || updatingId === user._id}
                        className="rounded-lg border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-red-500 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="tenant">Tenant</option>
                      </select>

                      <button
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        disabled={isCurrentUser || deletingId === user._id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === user._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Role guide */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-bold">Role Guide</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="font-bold text-red-700 dark:text-red-300">Admin</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Full access to all features. Can manage users, view system
                stats, and control all properties across the platform.
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="font-bold text-blue-700 dark:text-blue-300">
                Manager
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Default role for new users. Can manage their own properties,
                tenants, leases, maintenance requests, and use AI features.
              </p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="font-bold text-green-700 dark:text-green-300">
                Tenant
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Read-only access. Can view their assigned lease and submit
                maintenance requests. Cannot create or edit properties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
