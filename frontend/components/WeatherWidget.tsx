"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  city: string;
}

interface WeatherWidgetProps {
  city: string;
}

export default function WeatherWidget({ city }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) {
      setError("No city provided");
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(
          backendUrl + "/api/weather?city=" + encodeURIComponent(city),
          { headers: { Authorization: "Bearer " + token } },
        );

        if (!res.ok) {
          setError("Weather unavailable");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setWeather(data);
        setLoading(false);
      } catch (err) {
        console.error("WeatherWidget error:", err);
        setError("Weather unavailable");
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  const cardStyle: React.CSSProperties = {
    background: "#0F1A2E",
    border: "1px solid #1A2D4A",
    borderRadius: "12px",
    padding: "16px",
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div
          style={{
            height: "80px",
            background: "#1A2D4A",
            borderRadius: "8px",
            animation: "pulse 1.5s infinite",
          }}
        />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div style={{ ...cardStyle, color: "#8AB4D4", fontSize: "14px" }}>
        {error || "Weather unavailable"}
      </div>
    );
  }

  const isHighWind = weather.wind_speed > 40;
  const isRainy =
    weather.description.toLowerCase().includes("rain") ||
    weather.description.toLowerCase().includes("drizzle");

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "16px" }}>
            {weather.city}
          </div>
          <div
            style={{
              color: "#8AB4D4",
              fontSize: "13px",
              textTransform: "capitalize",
            }}
          >
            {weather.description}
          </div>
        </div>
        <img
          src={"https://openweathermap.org/img/wn/" + weather.icon + "@2x.png"}
          alt={weather.description}
          style={{ width: "56px", height: "56px" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
        <span style={{ color: "#FFFFFF", fontSize: "36px", fontWeight: 700 }}>
          {Math.round(weather.temp)}°C
        </span>
        <span style={{ color: "#8AB4D4", fontSize: "13px" }}>
          Feels like {Math.round(weather.feels_like)}°C
        </span>
      </div>

      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#8AB4D4" }}>
        <span>Humidity: {weather.humidity}%</span>
        <span>Wind: {weather.wind_speed} km/h</span>
      </div>

      {(isHighWind || isRainy) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {isHighWind && (
            <span
              style={{
                background: "rgba(234, 179, 8, 0.15)",
                color: "#EAB308",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                borderRadius: "6px",
                padding: "2px 10px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              High Wind
            </span>
          )}
          {isRainy && (
            <span
              style={{
                background: "rgba(74, 158, 255, 0.15)",
                color: "#4A9EFF",
                border: "1px solid rgba(74, 158, 255, 0.3)",
                borderRadius: "6px",
                padding: "2px 10px",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Rain
            </span>
          )}
        </div>
      )}
    </div>
  );
}
