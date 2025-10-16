import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function TopVendedoresBar({ data }) {
  const fmtBRL = (n) => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  return (
    <div className="rounded-2xl shadow p-4 bg-white">
      <h3 className="font-semibold mb-2">Ranking de Vendedores — Faturamento</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ left: 10, right: 20, top: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="vendedor" interval={0} angle={-20} textAnchor="end" height={60}/>
          <YAxis tickFormatter={fmtBRL} />
          <Tooltip formatter={(v)=>fmtBRL(v)} />
          <Bar dataKey="valor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
