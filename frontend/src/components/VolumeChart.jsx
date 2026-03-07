import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs">
        <p className="text-muted mb-1">{label}</p>
        <p className="text-text font-semibold">{payload[0].value.toLocaleString()} lbs</p>
      </div>
    );
  }
  return null;
};

export default function VolumeChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted text-center py-8">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={{ stroke: "#2a2a2a" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#888888" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2a2a2a" }} />
        <Bar dataKey="volume" fill="#fa1653" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}