import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TopProdutosBar({ data = [] }) {
  const short = (s) => (s?.length > 16 ? s.slice(0, 16) + '…' : s);
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="produto" tickFormatter={short} />
        <YAxis />
        <Tooltip formatter={(v) => fmtBRL(v)} />
        <Bar dataKey="custo_total" fill="#7d0b0b" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
