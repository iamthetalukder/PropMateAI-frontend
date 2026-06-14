"use client";

import { useEffect, useRef, useState } from "react";

interface PropertyMapProps {
  address: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setError("No address provided");
      setLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Maps not configured");
      setLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const geocodeRes = await fetch(
          backendUrl + "/api/geocode?address=" + encodeURIComponent(address),
          { headers: { Authorization: "Bearer " + token } },
        );

        if (!geocodeRes.ok) {
          setError("Could not find location on map");
          setLoading(false);
          return;
        }

        const { lat, lng } = await geocodeRes.json();

        if (!window.google) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById("google-maps-script");
            if (existingScript) {
              resolve();
              return;
            }
            const script = document.createElement("script");
            script.id = "google-maps-script";
            script.src =
              "https://maps.googleapis.com/maps/api/js?key=" + apiKey;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Maps script failed"));
            document.head.appendChild(script);
          });
        }

        if (!mapRef.current) return;

        const position = { lat, lng };
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0F1A2E" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0F1A2E" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8AB4D4" }] },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#1A2D4A" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0D1520" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#132236" }],
            },
          ],
        });

        new window.google.maps.Marker({
          position,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4A9EFF",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        });

        setLoading(false);
      } catch (err) {
        console.error("PropertyMap error:", err);
        setError("Failed to load map");
        setLoading(false);
      }
    };

    initMap();
  }, [address]);

  if (error) {
    return (
      <div
        style={{
          height: "300px",
          borderRadius: "12px",
          border: "1px solid #1A2D4A",
          background: "#0F1A2E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8AB4D4",
          fontSize: "14px",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "300px" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "12px",
            border: "1px solid #1A2D4A",
            background: "#0F1A2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8AB4D4",
            fontSize: "14px",
            zIndex: 1,
          }}
        >
          Loading map...
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          height: "300px",
          borderRadius: "12px",
          border: "1px solid #1A2D4A",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
