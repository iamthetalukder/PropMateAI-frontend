"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userName, setUserName] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState<"occupied" | "vacant">("vacant");
  const [images, setImages] = useState<FileList | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchProperties = async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch properties");
      }

      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch properties error:", err);
    }
  };

  const getCoordinates = async () => {
    const fullAddress = [address, city, country].filter(Boolean).join(", ");

    if (!fullAddress.trim()) {
      return null;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullAddress,
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch coordinates");
      }

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: data[0].lat,
          lon: data[0].lon,
        };
      }

      return null;
    } catch (error) {
      console.error("Location error:", error);
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
      const decoded: any = JSON.parse(atob(token.split(".")[1]));
      setUserName(decoded.name || "User");
    } catch (error) {
      console.error("Token decode error:", error);
      setUserName("User");
    }

    fetchProperties(token).finally(() => setLoading(false));
  }, [router]);

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
      alert("Please fill title, location, and price");
      return;
    }

    try {
      setSubmitting(true);

      const coords = await getCoordinates();

      if (!coords && (address.trim() || city.trim() || country.trim())) {
        alert(
          "Could not detect location. Please check address, city, or country.",
        );
        setSubmitting(false);
        return;
      }

      if (editingId) {
        const formData = new FormData();
        // Note: we no longer append "id" here — the backend reads it from req.params.id.
        formData.append("title", title);
        formData.append("location", location);
        formData.append("address", address);
        formData.append("city", city);
        formData.append("country", country);
        formData.append("price", price);
        formData.append("currency", currency);
        formData.append("status", status);

        if (coords) {
          formData.append("latitude", coords.lat);
          formData.append("longitude", coords.lon);
        }

        if (images) {
          for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
          }
        }

        // Backend route is defined as PUT /api/properties/:id
        // — must include the editingId in the URL path, not just the body.
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${editingId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to update property");
        }

        await fetchProperties(token);
        resetForm();
        alert("Property updated successfully");
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("location", location);
        formData.append("address", address);
        formData.append("city", city);
        formData.append("country", country);
        formData.append("price", price);
        formData.append("currency", currency);
        formData.append("status", status);

        if (coords) {
          formData.append("latitude", coords.lat);
          formData.append("longitude", coords.lon);
        }

        if (images) {
          for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
          }
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/properties`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to add property");
        }

        await fetchProperties(token);
        resetForm();
        alert("Property added successfully");
      }
    } catch (error: any) {
      console.error("Save property error:", error);
      alert(error.message || "Failed to save property");
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDeleteProperty = async (id: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this property?",
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete property");
      }

      if (editingId === id) {
        resetForm();
      }

      await fetchProperties(token);
    } catch (error: any) {
      console.error("Delete property error:", error);
      alert(error.message || "Failed to delete property");
    } finally {
      setDeletingId("");
    }
  };

  const totalProperties = properties.length;
  const occupiedUnits = properties.filter(
    (property) => property.status === "occupied",
  ).length;
  const vacantUnits = properties.filter(
    (property) => property.status === "vacant",
  ).length;

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase()) ||
      (property.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (property.country || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || property.status === filter;

    return matchesSearch && matchesFilter;
  });

  const totalPortfolioValue = useMemo(() => {
    return properties.reduce(
      (sum, property) => sum + Number(property.price || 0),
      0,
    );
  }, [properties]);

  const highestPricedProperty = useMemo(() => {
    if (properties.length === 0) return null;
    return properties.reduce((max, current) =>
      current.price > max.price ? current : max,
    );
  }, [properties]);

  const vacancyRate = useMemo(() => {
    if (totalProperties === 0) return 0;
    return Math.round((vacantUnits / totalProperties) * 100);
  }, [vacantUnits, totalProperties]);

  const insightMessage = useMemo(() => {
    if (properties.length === 0) {
      return "Start by adding your first property to unlock insights.";
    }
    if (vacancyRate >= 50) {
      return "Vacancy is high. Focus on filling empty units to improve performance.";
    }
    if (occupiedUnits === totalProperties) {
      return "Excellent — all your listed properties are occupied.";
    }
    return "Your portfolio looks balanced. Keep monitoring vacancies and pricing.";
  }, [properties.length, vacancyRate, occupiedUnits, totalProperties]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950 dark:text-white">
        Loading...
      </div>
    );
  }

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
              Welcome back, {userName} 👋
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
              {totalPortfolioValue}
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

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingId ? "Edit Property" : "Add Property"}
            </h2>

            {editingId && (
              <button
                onClick={handleCancelEdit}
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

            <input
              type="text"
              placeholder="Currency"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />

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

            <input
              type="file"
              multiple
              accept="image/*"
              className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white md:col-span-2"
              onChange={(e) => setImages(e.target.files)}
            />
          </div>

          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {editingId
              ? "Upload new image(s) only if you want to replace the existing images."
              : "You can upload multiple images for a new property."}
          </p>

          <button
            onClick={handleAddOrUpdateProperty}
            disabled={submitting}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <div
                  key={property._id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {property.title}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {property.location}
                        </p>

                        {(property.address ||
                          property.city ||
                          property.country) && (
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {[property.address, property.city, property.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}

                        {property.latitude != null &&
                          property.longitude != null && (
                            <a
                              href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-sm text-blue-500 underline"
                            >
                              View on Map 📍
                            </a>
                          )}
                      </div>

                      <div className="text-sm">
                        <p>
                          <span className="font-semibold">Price:</span>{" "}
                          {property.currency || "USD"} {property.price}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{" "}
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
                      <div className="flex flex-wrap gap-3">
                        {property.images.map((image, index) => (
                          <img
                            key={index}
                            src={`${process.env.NEXT_PUBLIC_API_URL}${image}`}
                            alt={property.title}
                            className="h-28 w-40 rounded-lg border border-zinc-300 object-cover dark:border-zinc-700"
                          />
                        ))}
                      </div>
                    )}
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
