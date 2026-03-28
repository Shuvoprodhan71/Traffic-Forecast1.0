import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Activity, Gauge, Database, TrendingUp, Clock, MapPin, BarChart2, Zap } from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

// ── Constants ─────────────────────────────────────────────────────────────────
const DOW_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DOW_SHORT  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "oklch(0.75 0.02 240)", font: { family: "Inter", size: 12 } } },
    tooltip: {
      backgroundColor: "oklch(0.18 0.02 240)",
      titleColor: "oklch(0.95 0.01 240)",
      bodyColor: "oklch(0.75 0.02 240)",
      borderColor: "oklch(0.30 0.03 240)",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: "oklch(0.55 0.02 240)", font: { family: "Inter", size: 11 } },
      grid:  { color: "oklch(0.20 0.015 240)" },
    },
    y: {
      ticks: { color: "oklch(0.55 0.02 240)", font: { family: "Inter", size: 11 } },
      grid:  { color: "oklch(0.20 0.015 240)" },
    },
  },
};

// ── Status helpers ─────────────────────────────────────────────────────────────
function getStatusClass(status: string) {
  if (status === "Fast")     return "badge-fast";
  if (status === "Moderate") return "badge-moderate";
  return "badge-slow";
}
function getStatusDot(status: string) {
  if (status === "Fast")     return "bg-emerald-400";
  if (status === "Moderate") return "bg-amber-400";
  return "bg-red-400";
}
function speedToStatus(mph: number): "Fast" | "Moderate" | "Slow" {
  if (mph >= 60) return "Fast";
  if (mph >= 50) return "Moderate";
  return "Slow";
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="card-glow rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
      <span className="w-1 h-5 rounded-full bg-primary inline-block" />
      {children}
    </h2>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [hour, setHour] = useState(new Date().getHours());
  const [dow, setDow]   = useState(() => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // convert to Mon=0
  });

  // tRPC queries
  const { data: prediction, isLoading: predLoading } = trpc.traffic.predict.useQuery(
    { hour, dow },
    { placeholderData: (prev) => prev }
  );
  const { data: hourlyData } = trpc.traffic.hourlyProfile.useQuery();
  const { data: seriesData } = trpc.traffic.testSeries.useQuery();
  const { data: metrics }    = trpc.traffic.metrics.useQuery();

  // ── Hourly Profile Chart ───────────────────────────────────────────────────
  const hourlyChartData = {
    labels: HOUR_LABELS,
    datasets: [
      {
        label: "Predicted Speed (mph)",
        data: hourlyData?.map((d) => d.predicted_mph) ?? [],
        borderColor: "oklch(0.65 0.22 250)",
        backgroundColor: "oklch(0.65 0.22 250 / 0.12)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: hourlyData?.map((d) => {
          const s = speedToStatus(d.predicted_mph);
          return s === "Fast" ? "#34d399" : s === "Moderate" ? "#fbbf24" : "#f87171";
        }) ?? [],
        pointBorderColor: "oklch(0.16 0.018 240)",
        pointBorderWidth: 1.5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // ── Test Series Chart ──────────────────────────────────────────────────────
  const seriesChartData = {
    labels: seriesData?.map((d) => `Step ${d.step}`) ?? [],
    datasets: [
      {
        label: "Actual Speed",
        data: seriesData?.map((d) => d.actual) ?? [],
        borderColor: "oklch(0.75 0.18 160)",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "RF Predicted",
        data: seriesData?.map((d) => d.rf_pred) ?? [],
        borderColor: "oklch(0.65 0.22 250)",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [5, 3],
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "LSTM Predicted",
        data: seriesData?.map((d) => d.lstm_pred) ?? [],
        borderColor: "oklch(0.70 0.20 310)",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  // ── Model Comparison Charts ────────────────────────────────────────────────
  const maeChartData = {
    labels: ["Random Forest", "LSTM"],
    datasets: [
      {
        label: "MAE (mph)",
        data: [
          metrics?.models.random_forest.mae_mph ?? 0,
          metrics?.models.lstm.mae_mph ?? 0,
        ],
        backgroundColor: ["oklch(0.65 0.22 250 / 0.8)", "oklch(0.70 0.20 310 / 0.8)"],
        borderColor:     ["oklch(0.65 0.22 250)", "oklch(0.70 0.20 310)"],
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const rmseChartData = {
    labels: ["Random Forest", "LSTM"],
    datasets: [
      {
        label: "RMSE (mph)",
        data: [
          metrics?.models.random_forest.rmse_mph ?? 0,
          metrics?.models.lstm.rmse_mph ?? 0,
        ],
        backgroundColor: ["oklch(0.70 0.20 160 / 0.8)", "oklch(0.60 0.22 25 / 0.8)"],
        borderColor:     ["oklch(0.70 0.20 160)", "oklch(0.60 0.22 25)"],
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const barOpts = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: false },
    },
    scales: {
      x: { ...CHART_DEFAULTS.scales.x },
      y: {
        ...CHART_DEFAULTS.scales.y,
        beginAtZero: true,
        title: { display: true, text: "Error (mph)", color: "oklch(0.55 0.02 240)", font: { size: 11 } },
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="gradient-header border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Traffic Forecasting System</h1>
              <p className="text-xs text-muted-foreground">METR-LA · ML-Powered Analytics</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Los Angeles, CA
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Dataset Overview</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Database}   label="Dataset"       value="METR-LA"     sub="Los Angeles, CA"         color="bg-blue-500/15 text-blue-400" />
            <KpiCard icon={Gauge}      label="Sensors"       value="207"         sub="Loop detectors"          color="bg-purple-500/15 text-purple-400" />
            <KpiCard icon={Activity}   label="Records"       value="16,212"      sub="Mar–Jun 2012"            color="bg-cyan-500/15 text-cyan-400" />
            <KpiCard icon={TrendingUp} label="Mean Speed"    value="58.34 mph"   sub="σ = 5.33 mph"            color="bg-emerald-500/15 text-emerald-400" />
          </div>
        </section>

        {/* ── Model Performance KPIs ─────────────────────────────────────────── */}
        <section>
          <SectionTitle>Model Performance</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={BarChart2}  label="RF — MAE"      value={`${metrics?.models.random_forest.mae_mph ?? "—"} mph`}  sub="Random Forest"  color="bg-blue-500/15 text-blue-400" />
            <KpiCard icon={BarChart2}  label="RF — RMSE"     value={`${metrics?.models.random_forest.rmse_mph ?? "—"} mph`} sub="Random Forest"  color="bg-blue-500/15 text-blue-400" />
            <KpiCard icon={Zap}        label="LSTM — MAE"    value={`${metrics?.models.lstm.mae_mph ?? "—"} mph`}           sub="LSTM Network"   color="bg-purple-500/15 text-purple-400" />
            <KpiCard icon={Zap}        label="LSTM — RMSE"   value={`${metrics?.models.lstm.rmse_mph ?? "—"} mph`}          sub="LSTM Network"   color="bg-purple-500/15 text-purple-400" />
          </div>
        </section>

        {/* ── Live Prediction ────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Live Traffic Speed Prediction</SectionTitle>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 space-y-5">
              <p className="text-sm text-muted-foreground">Select a time and day to get an instant prediction from the Random Forest model.</p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Hour of Day
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-input text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {HOUR_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label} (Hour {i})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Day of Week</label>
                <select
                  value={dow}
                  onChange={(e) => setDow(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-input text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {DOW_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Hour slider */}
              <div className="space-y-1">
                <input
                  type="range" min={0} max={23} value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-4">
              {predLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-muted-foreground text-sm">Running inference...</p>
                </div>
              ) : prediction ? (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {DOW_LABELS[dow]} at {HOUR_LABELS[hour]}
                    </p>
                    <div className="text-6xl font-bold text-foreground tabular-nums">
                      {prediction.predicted_mph}
                      <span className="text-2xl font-normal text-muted-foreground ml-2">mph</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusClass(prediction.status)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDot(prediction.status)}`} />
                    {prediction.status} Traffic
                  </span>

                  {/* Speed gauge bar */}
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>0 mph</span><span>50 mph</span><span>70 mph</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min((prediction.predicted_mph / 70) * 100, 100)}%`,
                          background: prediction.status === "Fast"
                            ? "linear-gradient(90deg, #34d399, #10b981)"
                            : prediction.status === "Moderate"
                            ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : "linear-gradient(90deg, #f87171, #ef4444)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full text-center text-xs">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                      <div className="text-emerald-400 font-semibold">Fast</div>
                      <div className="text-muted-foreground">≥ 60 mph</div>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                      <div className="text-amber-400 font-semibold">Moderate</div>
                      <div className="text-muted-foreground">50–59 mph</div>
                    </div>
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
                      <div className="text-red-400 font-semibold">Slow</div>
                      <div className="text-muted-foreground">&lt; 50 mph</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Select parameters to predict.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Hourly Speed Profile ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>24-Hour Speed Profile (Wednesday — Typical Weekday)</SectionTitle>
          <div className="rounded-xl border border-border bg-card p-5">
            <div style={{ height: 280 }}>
              {hourlyData ? (
                <Line
                  data={hourlyChartData}
                  options={{
                    ...CHART_DEFAULTS,
                    plugins: {
                      ...CHART_DEFAULTS.plugins,
                      title: { display: false },
                      tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: {
                          label: (ctx) => {
                            const mph = ctx.parsed.y as number;
                            const st = speedToStatus(mph ?? 0);
                            return ` ${mph} mph — ${st}`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: { ...CHART_DEFAULTS.scales.x },
                      y: {
                        ...CHART_DEFAULTS.scales.y,
                        min: 45,
                        max: 70,
                        title: { display: true, text: "Speed (mph)", color: "oklch(0.55 0.02 240)", font: { size: 11 } },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
              )}
            </div>
          </div>
        </section>

        {/* ── Actual vs Predicted Time Series ───────────────────────────────── */}
        <section>
          <SectionTitle>Actual vs Predicted Speed — Test Set (First 200 Steps)</SectionTitle>
          <div className="rounded-xl border border-border bg-card p-5">
            <div style={{ height: 300 }}>
              {seriesData ? (
                <Line
                  data={seriesChartData}
                  options={{
                    ...CHART_DEFAULTS,
                    plugins: {
                      ...CHART_DEFAULTS.plugins,
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        ...CHART_DEFAULTS.scales.x,
                        ticks: {
                          ...CHART_DEFAULTS.scales.x.ticks,
                          maxTicksLimit: 10,
                          callback: (_: unknown, i: number) => i % 2 === 0 ? `Step ${i * 20}` : '',
                        },
                      },
                      y: {
                        ...CHART_DEFAULTS.scales.y,
                        title: { display: true, text: "Speed (mph)", color: "oklch(0.55 0.02 240)", font: { size: 11 } },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
              )}
            </div>
          </div>
        </section>

        {/* ── Model Comparison Bar Charts ────────────────────────────────────── */}
        <section>
          <SectionTitle>Model Performance Comparison</SectionTitle>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Mean Absolute Error (MAE)</h3>
              <div style={{ height: 220 }}>
                {metrics ? (
                  <Bar data={maeChartData} options={barOpts} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Root Mean Square Error (RMSE)</h3>
              <div style={{ height: 220 }}>
                {metrics ? (
                  <Bar data={rmseChartData} options={barOpts} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
                )}
              </div>
            </div>
          </div>

          {/* Summary table */}
          {metrics && (
            <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Model</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">MAE (mph)</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">RMSE (mph)</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-5 py-3 font-medium text-blue-400">Random Forest</td>
                    <td className="px-5 py-3 text-center text-foreground font-mono">{metrics.models.random_forest.mae_mph}</td>
                    <td className="px-5 py-3 text-center text-foreground font-mono">{metrics.models.random_forest.rmse_mph}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="badge-fast px-2 py-0.5 rounded-full text-xs font-semibold">Best</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium text-purple-400">LSTM</td>
                    <td className="px-5 py-3 text-center text-foreground font-mono">{metrics.models.lstm.mae_mph}</td>
                    <td className="px-5 py-3 text-center text-foreground font-mono">{metrics.models.lstm.rmse_mph}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="badge-moderate px-2 py-0.5 rounded-full text-xs font-semibold">Baseline</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border pt-6 pb-4 text-center text-xs text-muted-foreground">
          Traffic Forecasting System · METR-LA Dataset · Random Forest &amp; LSTM Models
        </footer>
      </main>
    </div>
  );
}
