// src/components/TopClienteBar.jsx
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList,
} from 'recharts';

const fmtBRL = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// encurta nomes longos no eixo X
function shortLabel(s, max = 20) {
  if (!s) return '';
  const txt = String(s);
  return txt.length > max ? txt.slice(0, max - 1) + '…' : txt;
}

export default function TopClienteBar({ data = [], title = 'Top 10 Clientes — Faturamento' }) {
  // normaliza para { name, value }
  const chartData = useMemo(() => {
    return (Array.isArray(data) ? data : [])
      .map(d => ({
        name: d.name ?? d.cliente ?? d.Cliente ?? d.label ?? '—',
        value: Number(d.value ?? d.faturado ?? d.total ?? 0) || 0,
      }))
      .filter(d => d.value > 0);
  }, [data]);

  return (
    <div className="card card-chart">
      <div className="card-title">{title}</div>
      <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={(v) => shortLabel(v)}
              interval={0}
              height={60}
            />
            <YAxis tickFormatter={fmtBRL} />
            <Tooltip formatter={(v) => fmtBRL(v)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="value" position="top" formatter={fmtBRL} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
