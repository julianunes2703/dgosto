import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush,
} from 'recharts';

const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mesLabelLong = (yyyy_mm) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date((yyyy_mm || '2000-01') + '-01'))
    .replace(/^./, c => c.toUpperCase());
const mesLabelShort = (yyyy_mm) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
    .format(new Date((yyyy_mm || '2000-01') + '-01'));

export default function CustoProdutoMesChart({
  meses = [],
  produtos = [],
  porProdutoMes = {},
  mesSelecionado = null,        // <-- NEW: se vier, mostra "todos os produtos desse mês"
  maxSeries = 6,                // limite do modo agrupado
}) {

  // ====== MODO 2: todos os produtos em UM mês ======
  if (mesSelecionado) {
    const data = Object.entries(porProdutoMes)
      .map(([produto, pontos]) => {
        const hit = (pontos || []).find(p => p.mes_id === mesSelecionado);
        return hit ? { produto, custo_unit_medio: hit.custo_unit_medio } : null;
      })
      .filter(Boolean)
      .sort((a,b) => (b.custo_unit_medio || 0) - (a.custo_unit_medio || 0));

    // altura dinâmica (26px por barra, entre 320 e 900)
    const h = Math.max(320, Math.min(900, data.length * 26));

    return (
      <div style={{ width: '100%', height: h }}>
        <div className="comex-card-sub" style={{ marginBottom: 6 }}>
          {mesLabelLong(mesSelecionado)} — {data.length} produtos
        </div>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={fmtBRL} />
            <YAxis dataKey="produto" type="category" width={260} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmtBRL(v)} />
            <Bar dataKey="custo_unit_medio" name="Custo unit. médio" />
            {data.length > 22 && <Brush dataKey="produto" height={20} travellerWidth={10} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ====== MODO 1: agrupado por mês (até maxSeries produtos) ======
  const prods = produtos.slice(0, maxSeries);
  const data = meses.map((mes_id) => {
    const row = { mes_id, mes: mesLabelShort(mes_id) };
    for (const p of prods) {
      const arr = porProdutoMes[p] || [];
      const hit = arr.find(x => x.mes_id === mes_id);
      row[p] = hit ? hit.custo_unit_medio : null;
    }
    return row;
  });

  return (
    <div style={{ width: '100%', height: 380 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis tickFormatter={(v) => fmtBRL(v)} />
          <Tooltip formatter={(v) => fmtBRL(v)} />
          <Legend />
          {prods.map((p) => (
            <Bar key={p} dataKey={p} name={p} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
