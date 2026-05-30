"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Property = {
  _id: string;
  title: string;
  location: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  currency?: string;
  status: "occupied" | "vacant";
  images?: string[];
  createdAt?: string;
};

type Tenant = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
};

type Lease = {
  _id: string;
  tenantId: { _id: string; name: string; email: string } | null;
  startDate: string;
  endDate: string;
  rentAmount: number;
  currency: string;
  status: "active" | "upcoming" | "expired" | "terminated";
  notes: string;
};

type MaintenanceRequest = {
  _id: string;
  title: string;
  description: string;
  tenantId: { _id: string; name: string } | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  category: string;
  createdAt?: string;
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Fetch properties, tenants, leases, and maintenance requests in parallel
    Promise.all([
      fetch(process.env.NEXT_PUBLIC_API_URL + "/api/properties", {
        headers: { Authorization: "Bearer " + token },
        signal: controller.signal,
      }).then((res) => res.json()),
      fetch(process.env.NEXT_PUBLIC_API_URL + "/api/tenants/property/" + id, {
        headers: { Authorization: "Bearer " + token },
      }).then((res) => res.json()),
      fetch(process.env.NEXT_PUBLIC_API_URL + "/api/leases/property/" + id, {
        headers: { Authorization: "Bearer " + token },
      }).then((res) => res.json()),
      fetch(process.env.NEXT_PUBLIC_API_URL + "/api/maintenance/property/" + id, {
        headers: { Authorization: "Bearer " + token },
      }).then((res) => res.json()),
    ])
      .then(([propertiesData, tenantsData, leasesData, maintenanceData]) => {
        clearTimeout(timeout);
        if (Array.isArray(propertiesData)) {
          const found = propertiesData.find((p: Property) => p._id === id);
          setProperty(found || null);
        }
        if (Array.isArray(tenantsData)) {
          setTenants(tenantsData);
        }
        if (Array.isArray(leasesData)) {
          setLeases(leasesData);
        }
        if (Array.isArray(maintenanceData)) {
          setMaintenanceRequests(maintenanceData);
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [id, router]);

  const getInsight = (property: Property) => {
    const insights = [];
    if (property.status === "vacant") {
      insights.push(
        "This property is currently vacant. Consider reviewing the rental price or listing it on multiple platforms to attract tenants.",
      );
    } else {
      insights.push(
        "This property is occupied and generating income. Ensure lease renewal is tracked to avoid unexpected vacancies.",
      );
    }
    if (property.images && property.images.length < 3) {
      insights.push(
        "Adding more photos can increase interest by up to 40%. Consider uploading high-quality images of each room.",
      );
    }
    if (property.images && property.images.length >= 5) {
      insights.push(
        "Great photo coverage! Properties with 5+ images receive significantly more inquiries.",
      );
    }
    if (!property.latitude || !property.longitude) {
      insights.push(
        "No map location set. Adding an address helps potential tenants find the property easily.",
      );
    } else {
      insights.push(
        "Location is mapped. Tenants can easily find this property on Google Maps.",
      );
    }
    return insights;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const mapsEmbedUrl =
    property && property.latitude && property.longitude
      ? "https://maps.google.com/maps?q=" +
        property.latitude +
        "," +
        property.longitude +
        "&output=embed"
      : null;

  const mapsLinkUrl =
    property && property.latitude && property.longitude
      ? "https://www.google.com/maps?q=" +
        property.latitude +
        "," +
        property.longitude
      : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-lg font-semibold">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
        <p className="text-2xl font-bold">Property not found</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const images =
    property.images && property.images.length > 0 ? property.images : [];
  const insights = getInsight(property);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* LIGHTBOX */}
      {lightbox && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-6 top-6 text-3xl text-white"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-60 px-4 py-2 text-2xl text-white hover:bg-opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              setActiveImage(
                (prev) => (prev - 1 + images.length) % images.length,
              );
            }}
          >
            ‹
          </button>
          <img
            src={process.env.NEXT_PUBLIC_API_URL + images[activeImage]}
            alt="Full view"
            className="max-h-screen max-w-5xl rounded-xl object-contain p-6"
          />
          <button
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-60 px-4 py-2 text-2xl text-white hover:bg-opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              setActiveImage((prev) => (prev + 1) % images.length);
            }}
          >
            ›
          </button>
          <div className="absolute bottom-6 text-sm text-zinc-400">
            {activeImage + 1} / {images.length}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            ← Back to Dashboard
          </button>
          <p className="text-sm uppercase tracking-widest text-blue-500">
            PropMate AI
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* TITLE ROW */}
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <p className="mt-1 text-zinc-400">{property.location}</p>
            {(property.address || property.city || property.country) && (
              <p className="text-sm text-zinc-500">
                {[property.address, property.city, property.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={
                "rounded-full px-4 py-1 text-sm font-bold " +
                (property.status === "occupied"
                  ? "bg-green-900 text-green-400"
                  : "bg-yellow-900 text-yellow-400")
              }
            >
              {property.status === "occupied" ? "● Occupied" : "● Vacant"}
            </span>
            <p className="text-2xl font-bold text-blue-400">
              {(property.currency || "USD") +
                " " +
                Number(property.price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* IMAGE GALLERY */}
        {images.length > 0 ? (
          <div className="mb-10">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={process.env.NEXT_PUBLIC_API_URL + images[activeImage]}
                alt={property.title}
                className="h-96 w-full cursor-pointer object-cover"
                onClick={() => setLightbox(true)}
              />
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-60 px-4 py-2 text-2xl text-white hover:bg-opacity-90"
                    onClick={() =>
                      setActiveImage(
                        (prev) => (prev - 1 + images.length) % images.length,
                      )
                    }
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-60 px-4 py-2 text-2xl text-white hover:bg-opacity-90"
                    onClick={() =>
                      setActiveImage((prev) => (prev + 1) % images.length)
                    }
                  >
                    ›
                  </button>
                </>
              )}
              <div className="absolute bottom-4 right-4 rounded-full bg-black bg-opacity-60 px-3 py-1 text-sm text-white">
                {activeImage + 1} / {images.length}
              </div>
              <div className="absolute bottom-4 left-4 rounded-full bg-black bg-opacity-60 px-3 py-1 text-sm text-white">
                🔍 Click to enlarge
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={process.env.NEXT_PUBLIC_API_URL + img}
                    alt={"Thumbnail " + (index + 1)}
                    onClick={() => setActiveImage(index)}
                    className={
                      "h-16 w-24 flex-shrink-0 cursor-pointer rounded-lg object-cover border-2 transition " +
                      (activeImage === index
                        ? "border-blue-500"
                        : "border-transparent hover:border-zinc-500")
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-10 flex h-64 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
            <p className="text-zinc-500">
              No images uploaded for this property
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* PROPERTY DETAILS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-xl font-bold">Property Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Location
                  </p>
                  <p className="mt-1 font-semibold">{property.location}</p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    City
                  </p>
                  <p className="mt-1 font-semibold">
                    {property.city || "Not specified"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Country
                  </p>
                  <p className="mt-1 font-semibold">
                    {property.country || "Not specified"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Full Address
                  </p>
                  <p className="mt-1 font-semibold">
                    {property.address || "Not specified"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Price
                  </p>
                  <p className="mt-1 font-semibold text-blue-400">
                    {(property.currency || "USD") +
                      " " +
                      Number(property.price).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Status
                  </p>
                  <p
                    className={
                      "mt-1 font-semibold " +
                      (property.status === "occupied"
                        ? "text-green-400"
                        : "text-yellow-400")
                    }
                  >
                    {property.status === "occupied" ? "Occupied" : "Vacant"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Total Photos
                  </p>
                  <p className="mt-1 font-semibold">
                    {images.length} image{images.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Added On
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatDate(property.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* GOOGLE MAP */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Location Map</h2>
                {mapsLinkUrl && (
                  <a
                    href={mapsLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
              {mapsEmbedUrl ? (
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="320"
                  className="rounded-xl border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-800">
                  <p className="text-zinc-500">
                    No location coordinates available
                  </p>
                </div>
              )}
            </div>

            {/* LEASE HISTORY */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Lease History</h2>
                <button
                  onClick={() => router.push("/leases")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  Manage Leases
                </button>
              </div>
              {leases.length === 0 ? (
                <p className="text-zinc-500">
                  No leases recorded for this property.
                </p>
              ) : (
                <div className="space-y-3">
                  {leases.map((lease) => {
                    const statusColors: Record<string, string> = {
                      active: "bg-green-900 text-green-400",
                      upcoming: "bg-blue-900 text-blue-400",
                      expired: "bg-red-900 text-red-400",
                      terminated: "bg-zinc-700 text-zinc-400",
                    };
                    return (
                      <div
                        key={lease._id}
                        className="rounded-xl border border-zinc-700 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-semibold">
                            {lease.tenantId?.name || "Unknown Tenant"}
                          </p>
                          <span
                            className={
                              "rounded-full px-2.5 py-0.5 text-xs font-bold " +
                              (statusColors[lease.status] || "")
                            }
                          >
                            {lease.status.charAt(0).toUpperCase() +
                              lease.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid gap-1 text-sm text-zinc-400 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-white">
                              Rent:{" "}
                            </span>
                            {(lease.currency || "USD")}{" "}
                            {Number(lease.rentAmount).toLocaleString()} / mo
                          </p>
                          <p>
                            <span className="font-semibold text-white">
                              Term:{" "}
                            </span>
                            {formatDate(lease.startDate)} →{" "}
                            {formatDate(lease.endDate)}
                          </p>
                          {lease.notes && (
                            <p className="sm:col-span-2 text-zinc-500 italic">
                              {lease.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MAINTENANCE REQUESTS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Maintenance Requests</h2>
                <button
                  onClick={() => router.push("/maintenance")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                >
                  Manage
                </button>
              </div>
              {maintenanceRequests.length === 0 ? (
                <p className="text-zinc-500">
                  No maintenance requests for this property.
                </p>
              ) : (
                <div className="space-y-3">
                  {maintenanceRequests.map((req) => {
                    const priorityColors: Record<string, string> = {
                      low: "bg-zinc-700 text-zinc-300",
                      medium: "bg-blue-900 text-blue-300",
                      high: "bg-amber-900 text-amber-300",
                      urgent: "bg-red-900 text-red-300",
                    };
                    const statusColors: Record<string, string> = {
                      open: "bg-yellow-900 text-yellow-300",
                      "in-progress": "bg-blue-900 text-blue-300",
                      resolved: "bg-green-900 text-green-300",
                      closed: "bg-zinc-700 text-zinc-400",
                    };
                    return (
                      <div
                        key={req._id}
                        className="rounded-xl border border-zinc-700 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{req.title}</p>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-bold " +
                              (priorityColors[req.priority] || "")
                            }
                          >
                            {req.priority.charAt(0).toUpperCase() +
                              req.priority.slice(1)}
                          </span>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-bold " +
                              (statusColors[req.status] || "")
                            }
                          >
                            {req.status === "in-progress"
                              ? "In Progress"
                              : req.status.charAt(0).toUpperCase() +
                                req.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {req.description}
                        </p>
                        {req.tenantId && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Reported by: {req.tenantId.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* QUICK STATS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3">
                  <span className="text-sm text-zinc-400">Status</span>
                  <span
                    className={
                      "text-sm font-bold " +
                      (property.status === "occupied"
                        ? "text-green-400"
                        : "text-yellow-400")
                    }
                  >
                    {property.status === "occupied"
                      ? "✅ Occupied"
                      : "⚠️ Vacant"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3">
                  <span className="text-sm text-zinc-400">Monthly Price</span>
                  <span className="text-sm font-bold text-blue-400">
                    {property.currency || "USD"}{" "}
                    {Number(property.price).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3">
                  <span className="text-sm text-zinc-400">Photos</span>
                  <span className="text-sm font-bold">{images.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3">
                  <span className="text-sm text-zinc-400">Map</span>
                  <span className="text-sm font-bold">
                    {property.latitude ? "✅ Set" : "❌ Not set"}
                  </span>
                </div>
              </div>
            </div>

            {/* TENANTS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Tenants</h2>
                <button
                  onClick={() => router.push("/tenants")}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Manage
                </button>
              </div>
              {tenants.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No tenants linked to this property.
                </p>
              ) : (
                <div className="space-y-3">
                  {tenants.map((tenant) => {
                    const now = new Date();
                    const isActive =
                      new Date(tenant.leaseStart) <= now &&
                      new Date(tenant.leaseEnd) >= now;
                    return (
                      <div
                        key={tenant._id}
                        className="rounded-xl bg-zinc-800 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <p className="font-semibold">{tenant.name}</p>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-xs font-bold " +
                              (isActive
                                ? "bg-green-900 text-green-400"
                                : "bg-red-900 text-red-400")
                            }
                          >
                            {isActive ? "Active" : "Expired"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{tenant.email}</p>
                        {tenant.phone && (
                          <p className="text-xs text-zinc-400">{tenant.phone}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">
                          Rent:{" "}
                          <span className="font-semibold text-blue-400">
                            {Number(tenant.rentAmount).toLocaleString()} / mo
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(tenant.leaseStart)} →{" "}
                          {formatDate(tenant.leaseEnd)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI INSIGHTS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">🤖 AI Insights</h2>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="rounded-xl bg-zinc-800 p-3">
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Actions</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600"
                >
                  ✏️ Edit Property
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full rounded-lg border border-zinc-700 px-4 py-3 font-semibold hover:bg-zinc-800"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
