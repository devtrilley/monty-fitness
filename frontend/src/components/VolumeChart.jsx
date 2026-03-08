import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-bright)",
        boxShadow: "0 0 12px var(--color-accent-30)",
        borderRadius: "8px",
        padding: "8px 12px",
      }}>
        <p className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>{label}</p>
        <p className="text-sm font-semibold" style={{
          color: "var(--color-accent)",
          textShadow: "0 0 8px var(--color-accent-60)",
        }}>
          {payload[0].value.toLocaleString()} lbs
        </p>
      </div>
    );
  }
  return null;
};

export default function VolumeChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: "var(--color-muted)" }}>No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-accent-subtle)" }} />
        <Bar dataKey="volume" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}