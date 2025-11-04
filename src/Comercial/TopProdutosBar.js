// src/components/TopProdutosBar.jsx
import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const fmtBRL = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TopProdutosBar({ data }) {
  const safe = Array.isArray(data) ? data.slice(0, 10) : [];
  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={safe} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={fmtBRL} />
        <YAxis type="category" dataKey="name" width={220} />
        <Tooltip formatter={(v) => fmtBRL(v)} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
