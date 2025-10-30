import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';

// …seus helpers existentes…
const fmtInt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtMes = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
};

/**
 * Bloco de gráfico: "Quantidade por Produto no Mês"
 * Props esperadas: { mesesOrdenados, porProdutoMes }
 */
function GraficoQtdPorProdutoMes({ mesesOrdenados, porProdutoMes }) {
  const [mesSel, setMesSel] = useState(
    mesesOrdenados?.length ? mesesOrdenados[mesesOrdenados.length - 1] : ''
  );

  // dados do gráfico: pega porProdutoMes e filtra o mês selecionado
  const data = useMemo(() => {
    if (!mesSel || !porProdutoMes) return [];
    const acc = [];
    for (const [produto, arr] of Object.entries(porProdutoMes)) {
      const node = arr.find((a) => a.mes_id === mesSel);
      if (node && node.qtd > 0) acc.push({ name: produto, qtd: node.qtd });
    }
    // top 12 por quantidade
    acc.sort((a, b) => b.qtd - a.qtd);
    return acc.slice(0, 12);
  }, [mesSel, porProdutoMes]);

  if (!mesesOrdenados?.length) return null;

  return (
    <div className="comex-card mt-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="comex-card-title">Quantidade por Produto no Mês</h3>
        <select
          className="comex-select"
          value={mesSel}
          onChange={(e) => setMesSel(e.target.value)}
        >
          {mesesOrdenados.map((m) => (
            <option key={m} value={m}>{fmtMes(m)}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {fmtMes(mesSel)} — {data.length ? `${data.length} produtos (Top 12)` : 'Sem dados'}
      </div>

      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={fmtInt}
              domain={[0, 'dataMax']}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={380} // ajuste conforme precisar para caber os nomes
            />
            <Tooltip
              formatter={(v) => fmtInt(v)}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="qtd" name="Qtd produzida" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
