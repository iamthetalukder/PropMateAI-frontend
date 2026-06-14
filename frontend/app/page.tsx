"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AnalyticsSection from "../components/AnalyticsSection";
import Logo from "@/components/Logo";
import { useCurrency } from "@/hooks/useCurrency";

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

export default function DashboardPage() {
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string>("manager");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<"occupied" | "vacant">("vacant");
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [stockPhotoUrls, setStockPhotoUrls] = useState<string[]>([]);
  const [unsplashResults, setUnsplashResults] = useState<
    { id: string; url: string; thumb: string; photographer: string }[]
  >([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProperties = async (token: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/properties",
        {
          headers: { Authorization: "Bearer " + token },
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch properties error:", err);
      setProperties([]);
    }
  };

  const getCoordinates = async () => {
    const parts = [address, city, country].filter(Boolean);
    const fullAddress = parts.join(", ");
    if (!fullAddress.trim()) return null;
    try {
      const res = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&q=" +
          encodeURIComponent(fullAddress),
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const decoded: { name?: string; role?: string } = JSON.parse(
        atob(token.split(".")[1]),
      );
      setUserName(decoded.name || "User");
      setUserRole(decoded.role || "manager");
    } catch {
      setUserName("User");
    }
    fetchProperties(token).finally(() => setLoading(false));
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (files.length > 20) {
      showNotification("Maximum 20 images allowed", "error");
      return;
    }
    setImages(files);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setPreviewUrls(urls);
  };

  const fetchUnsplashPhotos = async (keyword: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setUnsplashLoading(true);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL +
          "/api/unsplash/search?query=" +
          encodeURIComponent(keyword),
        { headers: { Authorization: "Bearer " + token } },
      );
      if (res.ok) {
        const data = await res.json();
        setUnsplashResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Unsplash fetch error:", err);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const toggleStockPhoto = (url: string) => {
    setStockPhotoUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const resetForm = () => {
    setTitle("");
    setLocation("");
    setAddress("");
    setCity("");
    setCountry("");
    setPrice("");
    setCurrency("USD");
    setStatus("vacant");
    setImages(null);
    setPreviewUrls([]);
    setStockPhotoUrls([]);
    setUnsplashResults([]);
    setEditingId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleAddOrUpdateProperty = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!title.trim() || !location.trim() || !price.trim()) {
      showNotification("Please fill title, location, and price", "error");
      return;
    }
    try {
      setSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (editingId) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("location", location);
        formData.append("address", address);
        formData.append("city", city);
        formData.append("country", country);
        formData.append("price", price);
        formData.append("currency", currency);
        formData.append("status", status);
        if (stockPhotoUrls.length > 0) {
          formData.append("stockPhotoUrls", JSON.stringify(stockPhotoUrls));
        }
        const coords = await getCoordinates();
        if (coords) {
          formData.append("latitude", coords.lat);
          formData.append("longitude", coords.lon);
        }
        if (images) {
          for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
          }
        }
        const res = await fetch(apiUrl + "/api/properties/" + editingId, {
          method: "PUT",
          headers: { Authorization: "Bearer " + token },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to update property");
        await fetchProperties(token);
        resetForm();
        showNotification("Property updated successfully!", "success");
      } else {
        const coords = await getCoordinates();
        if (!coords && (address.trim() || city.trim() || country.trim())) {
          showNotification(
            "Could not detect location. Check address, city, or country.",
            "error",
          );
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("location", location);
        formData.append("address", address);
        formData.append("city", city);
        formData.append("country", country);
        formData.append("price", price);
        formData.append("currency", currency);
        formData.append("status", status);
        if (stockPhotoUrls.length > 0) {
          formData.append("stockPhotoUrls", JSON.stringify(stockPhotoUrls));
        }
        if (coords) {
          formData.append("latitude", coords.lat);
          formData.append("longitude", coords.lon);
        }
        if (images) {
          for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
          }
        }
        const res = await fetch(apiUrl + "/api/properties", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to add property");
        await fetchProperties(token);
        resetForm();
        showNotification("Property added successfully!", "success");
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to save property", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingId(property._id);
    setTitle(property.title || "");
    setLocation(property.location || "");
    setAddress(property.address || "");
    setCity(property.city || "");
    setCountry(property.country || "");
    setPrice(String(property.price ?? ""));
    setCurrency(property.currency || "USD");
    setStatus(property.status || "vacant");
    setImages(null);
    setPreviewUrls([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProperty = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this property?"))
      return;
    try {
      setDeletingId(id);
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/properties/" + id,
        { method: "DELETE", headers: { Authorization: "Bearer " + token } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete property");
      if (editingId === id) resetForm();
      await fetchProperties(token);
      showNotification("Property deleted successfully!", "success");
    } catch (error: any) {
      showNotification(error.message || "Failed to delete property", "error");
    } finally {
      setDeletingId("");
    }
  };

  const totalProperties = properties.length;
  const occupiedUnits = properties.filter(
    (p) => p.status === "occupied",
  ).length;
  const vacantUnits = properties.filter((p) => p.status === "vacant").length;

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase()) ||
      (property.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (property.country || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "all" || property.status === filter);
  });

  const totalPortfolioValue = useMemo(
    () => properties.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [properties],
  );
  const highestPricedProperty = useMemo(
    () =>
      properties.length === 0
        ? null
        : properties.reduce((max, c) => (c.price > max.price ? c : max)),
    [properties],
  );
  const vacancyRate = useMemo(
    () =>
      totalProperties === 0
        ? 0
        : Math.round((vacantUnits / totalProperties) * 100),
    [vacantUnits, totalProperties],
  );
  const insightMessage = useMemo(() => {
    if (properties.length === 0)
      return "Start by adding your first property to unlock insights.";
    if (vacancyRate >= 50)
      return "Vacancy is high. Focus on filling empty units to improve performance.";
    if (occupiedUnits === totalProperties)
      return "Excellent — all your listed properties are occupied.";
    return "Your portfolio looks balanced. Keep monitoring vacancies and pricing.";
  }, [properties.length, vacancyRate, occupiedUnits, totalProperties]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950 dark:text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-lg font-semibold">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-zinc-500">Connecting to database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-black dark:bg-zinc-950 dark:text-white">
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute right-6 top-6 text-3xl text-white hover:text-zinc-300"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-h-screen max-w-5xl rounded-xl object-contain p-4"
          />
        </div>
      )}

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Logo theme="dark" size="md" />
            <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Welcome back, {userName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/tenants")}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Tenants
            </button>
            <button
              onClick={() => router.push("/leases")}
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
            >
              Leases
            </button>
            <button
              onClick={() => router.push("/maintenance")}
              className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Maintenance
            </button>
            <button
              onClick={() => router.push("/ai")}
              className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
            >
              AI Features
            </button>
            {userRole === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
              >
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Total Properties</h2>
            <p className="mt-4 text-3xl font-bold text-blue-500">
              {totalProperties}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Occupied Units</h2>
            <p className="mt-4 text-3xl font-bold text-green-500">
              {occupiedUnits}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Vacant Units</h2>
            <p className="mt-4 text-3xl font-bold text-yellow-500">
              {vacantUnits}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Portfolio Value</h2>
            <p className="mt-4 text-3xl font-bold text-purple-500">
              {formatAmount(totalPortfolioValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Highest Priced Property</h2>
            <p className="mt-4 text-lg font-bold text-emerald-500">
              {highestPricedProperty
                ? highestPricedProperty.title
                : "No data yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Vacancy Rate</h2>
            <p className="mt-4 text-3xl font-bold text-rose-500">
              {vacancyRate}%
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-xl font-bold">AI Insights</h2>
          <p className="text-zinc-600 dark:text-zinc-400">{insightMessage}</p>
        </div>

        {/* ANALYTICS SECTION */}
        <AnalyticsSection properties={properties} />

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Property" : "Add Property"}
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
            <input
              type="text"
              placeholder="Property Title"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <input
              type="text"
              placeholder="Full Address"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="City"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <input
              type="text"
              placeholder="Country"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
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
            <select
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "occupied" | "vacant")
              }
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {editingId
                ? "Upload new images to replace existing ones (max 20)"
                : "Upload property images (max 20)"}
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              onChange={handleImageChange}
            />
            {previewUrls.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  {previewUrls.length} image{previewUrls.length > 1 ? "s" : ""}{" "}
                  selected — preview:
                </p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={"Preview " + (index + 1)}
                        className="h-20 w-full cursor-pointer rounded-lg border border-zinc-300 object-cover dark:border-zinc-600 hover:opacity-80 transition"
                        onClick={() => setLightboxImage(url)}
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black bg-opacity-60 px-1 text-xs text-white">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* UNSPLASH STOCK PHOTOS */}
          <div
            style={{
              marginTop: "16px",
              background: "#0F1A2E",
              border: "1px solid #1A2D4A",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <p
              style={{
                color: "#8AB4D4",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Or pick stock photos from Unsplash
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {["Modern Home", "Apartment", "Office Space"].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => fetchUnsplashPhotos(kw)}
                  style={{
                    background: "#1A2D4A",
                    color: "#FFFFFF",
                    border: "1px solid #2A3D5A",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {kw}
                </button>
              ))}
            </div>

            {unsplashLoading && (
              <p style={{ color: "#8AB4D4", fontSize: "13px" }}>Loading photos...</p>
            )}

            {unsplashResults.length > 0 && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  {unsplashResults.slice(0, 9).map((photo) => {
                    const selected = stockPhotoUrls.includes(photo.url);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => toggleStockPhoto(photo.url)}
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: selected ? "2px solid #4A9EFF" : "2px solid transparent",
                          transition: "border-color 0.15s",
                        }}
                      >
                        <img
                          src={photo.thumb}
                          alt={photo.photographer}
                          style={{ width: "100%", height: "80px", objectFit: "cover", display: "block" }}
                        />
                        {selected && (
                          <div
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "#4A9EFF",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {stockPhotoUrls.length > 0 && (
                  <p style={{ color: "#4A9EFF", fontSize: "13px" }}>
                    {stockPhotoUrls.length} stock photo{stockPhotoUrls.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </>
            )}
          </div>

          <button
            onClick={handleAddOrUpdateProperty}
            disabled={submitting}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
                ? "Update Property"
                : "Add Property"}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Recent Properties</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Search properties..."
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No properties found yet.
            </p>
          ) : (
            <div className="space-y-6">
              {filteredProperties.map((property) => {
                const mapsUrl =
                  "https://www.google.com/maps?q=" +
                  String(property.latitude) +
                  "," +
                  String(property.longitude);
                const hasCoords =
                  property.latitude != null && property.longitude != null;
                const addressLine = [
                  property.address,
                  property.city,
                  property.country,
                ]
                  .filter(Boolean)
                  .join(", ");
                const hasAddress = Boolean(
                  property.address || property.city || property.country,
                );
                const imageCount = property.images ? property.images.length : 0;
                return (
                  <div
                    key={property._id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {property.title}
                            </h3>
                            {imageCount > 0 && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                {imageCount} photo{imageCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {property.location}
                          </p>
                          {hasAddress && (
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {addressLine}
                            </p>
                          )}
                          {hasCoords && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-sm text-blue-500 underline"
                            >
                              View on Map
                            </a>
                          )}
                        </div>
                        <div className="text-sm">
                          <p>
                            <span className="font-semibold">Price: </span>
                            {formatAmount(property.price)}
                          </p>
                          <p>
                            <span className="font-semibold">Status: </span>
                            <span
                              className={
                                property.status === "occupied"
                                  ? "font-semibold text-green-500"
                                  : "font-semibold text-yellow-500"
                              }
                            >
                              {property.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push("/property/" + property._id)
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditProperty(property)}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            disabled={deletingId === property._id}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deletingId === property._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                      {property.images && property.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                          {property.images.map((image, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer"
                              onClick={() =>
                                setLightboxImage(
                                  image.startsWith("http")
                                    ? image
                                    : process.env.NEXT_PUBLIC_API_URL + image,
                                )
                              }
                            >
                              <img
                                src={
                                    image.startsWith("http")
                                      ? image
                                      : process.env.NEXT_PUBLIC_API_URL + image
                                  }
                                alt={property.title + " " + (index + 1)}
                                className="h-24 w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700 group-hover:opacity-80 transition"
                              />
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-30 transition">
                                <span className="text-xl text-white opacity-0 group-hover:opacity-100 transition">
                                  🔍
                                </span>
                              </div>
                              {index === 0 && (
                                <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                  Main
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
