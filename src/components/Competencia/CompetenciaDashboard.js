import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import "./Competencia.css";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function DRECompetencia({ data, mes }) {
  const { rows, valueAt } = data;

  const tableData = useMemo(() => {
    if (!mes) return [];
    return rows
      .map(r => {
        const prev = valueAt(r.key, mes, "previsto");
        const real = valueAt(r.key, mes, "realizado");
        const delta = real - prev;
        const deltaPct = prev ? (delta / prev) * 100 : 0;
        return { conta: r.name, previsto: prev, realizado: real, delta, deltaPct };
      })
      .filter(d => Math.abs(d.previsto) + Math.abs(d.realizado) > 0.0001)
      .sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [rows, mes, valueAt]);

  const topDeltas = useMemo(() => tableData.slice(0, 10).map(d => ({
    conta: d.conta,
    Variacao: d.delta,
  })), [tableData]);

  const barColor = (x) => (x >= 0 ? "#22c55e" : "#ef4444");

  return (
    <div className="comp-page">
      <div className="comp-header">
        <h2>Competência: {mes?.toUpperCase()}</h2>
        <small>Previsto × Realizado por conta</small>
      </div>

      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Previsto</th>
              <th>Realizado</th>
              <th>Δ (R$)</th>
              <th>Δ (%)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((d, i) => (
              <tr key={i}>
                <td className="conta">{d.conta}</td>
                <td>{money(d.previsto)}</td>
                <td>{money(d.realizado)}</td>
                <td className={d.delta >= 0 ? "delta pos" : "delta neg"}>{money(d.delta)}</td>
                <td className={d.delta >= 0 ? "delta pos" : "delta neg"}>{d.deltaPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comp-panel">
        <h3>Maiores desvios (Real − Prev)</h3>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={topDeltas} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="conta" width={220} />
            <Tooltip formatter={(v) => money(v)} />
            <Legend />
            <Bar dataKey="Variacao" name="Δ (R$)">
              {topDeltas.map((d, i) => (
                <cell key={i} fill={barColor(d.Variacao)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
