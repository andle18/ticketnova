import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLang } from "../context/LangContext";

const COLORS = {
  fresco: "#639922",
  minimo: "#1D9E75",
  procesado: "#EF9F27",
  ultra: "#E24B4A",
};

export default function NovaChart({ summary }) {
  const { t, formatNumber } = useLang();

  const LABELS = {
    fresco: t("novaFresco"),
    minimo: t("novaMinimo"),
    procesado: t("novaProcesado"),
    ultra: t("novaUltra"),
  };

  const data = [
    { key: "fresco", value: summary.freshPct },
    { key: "minimo", value: summary.minimoPct },
    { key: "procesado", value: summary.procesadoPct },
    { key: "ultra", value: summary.ultraPct },
  ];

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.07] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white/90">
          {t("novaDistribution")}
        </p>
        <span className="text-xs text-white/30">{t("pctSpend")}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#111827",
                  padding: "6px 10px",
                }}
                formatter={(value, name, props) => [
                  `${formatNumber(value, 1)}%`,
                  LABELS[props.payload.key],
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: COLORS[d.key] }}
                />
                <span className="text-sm text-white/55">{LABELS[d.key]}</span>
              </div>
              <span className="text-sm font-medium tabular text-white/85">
                {formatNumber(d.value, 1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
