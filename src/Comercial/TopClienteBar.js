import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

export default function TopClientesBar({ data = [] }) {
  if (!data?.length) {
    return (
      <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
        Nenhum dado disponível neste intervalo.
      </div>
    );
  }

  // pega os top 10 e inverte (para gráfico vertical crescente)
  const ordered = [...data].slice(0, 10).reverse();

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={ordered}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(v) => money(v).replace("R$", "")}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={200}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(v) => money(v)} />
        <Bar dataKey="value" fill="#000000ff" radius={[4, 4, 4, 4]}>
          <LabelList dataKey="value" position="right" formatter={money} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
