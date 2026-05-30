"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

type Property = {
  _id: string;
  title: string;
  price: number;
  currency?: string;
  status: "occupied" | "vacant";
  createdAt?: string;
};

type Props = {
  properties: Property[];
};

const COLORS = ["#22c55e", "#eab308"];

export default function AnalyticsSection({ properties }: Props) {
  if (properties.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-xl font-bold">Analytics</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Add properties to see analytics charts.
        </p>
      </div>
    );
  }

  const occupied = properties.filter((p) => p.status === "occupied").length;
  const vacant = properties.filter((p) => p.status === "vacant").length;

  const occupancyData = [
    { name: "Occupied", value: occupied },
    { name: "Vacant", value: vacant },
  ];

  const revenueData = properties.map((p) => ({
    name: p.title.length > 12 ? p.title.slice(0, 12) + "..." : p.title,
    price: p.price,
  }));

  const sortedByDate = [...properties].sort((a, b) => {
    return (
      new Date(a.createdAt || 0).getTime() -
      new Date(b.createdAt || 0).getTime()
    );
  });

  let runningTotal = 0;
  const portfolioTrend = sortedByDate.map((p) => {
    runningTotal += p.price;
    return {
      name: p.title.length > 10 ? p.title.slice(0, 10) + "..." : p.title,
      value: runningTotal,
    };
  });

  const totalRevenue = properties.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = Math.round(totalRevenue / properties.length);
  const occupancyRate = Math.round((occupied / properties.length) * 100);

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Total Revenue
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-500">
            {totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-400">across all properties</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Average Price
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-500">
            {avgPrice.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-400">per property</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Occupancy Rate
          </p>
          <p
            className={
              "mt-2 text-2xl font-bold " +
              (occupancyRate >= 50 ? "text-green-500" : "text-yellow-500")
            }
          >
            {occupancyRate}%
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {occupied} of {properties.length} occupied
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Vacant Units
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-500">{vacant}</p>
          <p className="mt-1 text-xs text-zinc-400">need attention</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-bold">Occupancy Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => name + ": " + value}
              >
                {occupancyData.map((entry, index) => (
                  <Cell
                    key={"cell-" + index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Occupied ({occupied})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Vacant ({vacant})
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-bold">Revenue by Property</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={revenueData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => [
                  Number(value).toLocaleString(),
                  "Price",
                ]}
              />
              <Bar dataKey="price" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-bold">Portfolio Value Growth</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={portfolioTrend}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="portfolioGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: any) => [
                Number(value).toLocaleString(),
                "Portfolio Value",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
