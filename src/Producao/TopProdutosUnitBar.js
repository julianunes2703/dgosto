import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TopProdutosUnitBar({ data = [] }) {
  const short = (s) => (s?.length > 22 ? s.slice(0, 22) + '…' : s);
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="produto" tickFormatter={short} />
        <YAxis />
        <Tooltip formatter={(v) => fmtBRL(v)} />
        <Bar dataKey="custo_unit_medio" fill="#a01414" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
