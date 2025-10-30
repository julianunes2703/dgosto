import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { QUANT_MENSAL_URLS } from '../constants';
import useProducaoQtdFromMonthlyCSVs from '../hooks/useProducaoPorMes';
import './ProducaoExplore.css';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtMes = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
};
const fmtInt = fmt;

/** ============================
 *  Gráfico: Quantidade por Produto no Mês (Top N)
 *  ============================
 */
function GraficoQtdPorProdutoMes({ mesesOrdenados, porProdutoMes, topN = 12 }) {
  const [mesSel, setMesSel] = useState(
    mesesOrdenados?.length ? mesesOrdenados[mesesOrdenados.length - 1] : ''
  );

  const data = useMemo(() => {
    if (!mesSel || !porProdutoMes) return [];
    const acc = [];
    for (const [produto, arr] of Object.entries(porProdutoMes)) {
      const node = arr.find((a) => a.mes_id === mesSel);
      if (node && node.qtd > 0) acc.push({ name: produto, qtd: node.qtd });
    }
    acc.sort((a, b) => b.qtd - a.qtd);
    return acc.slice(0, topN);
  }, [mesSel, porProdutoMes, topN]);

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
        {mesSel ? `${fmtMes(mesSel)} — ${data.length ? `Top ${data.length}` : 'Sem dados'}` : '—'}
      </div>

      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={fmtInt} domain={[0, 'dataMax']} />
            <YAxis dataKey="name" type="category" width={380} />
            <Tooltip formatter={(v) => fmtInt(v)} labelFormatter={(label) => label} />
            <Bar dataKey="qtd" name="Qtd produzida" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** ============================
 *  Página: Explorar Produção (Quantidade)
 *  ============================
 */
export default function ProducaoQtdExplore() {
  const {
    loading,
    rows,
    totalQtd,
    porProduto,
    porMes,
    porProdutoMes,
    mesesOrdenados,
  } = useProducaoQtdFromMonthlyCSVs(QUANT_MENSAL_URLS);

  // === separação por tipo de embalagem (geral) ===
  const { qtd50, qtd100, qtdOutros } = useMemo(() => {
    let qtd50 = 0, qtd100 = 0, qtdOutros = 0;
    for (const r of rows) {
      const nome = (r.produto || '').toUpperCase();
      if (nome.includes('50 UNID')) qtd50 += r.qtd;
      else if (nome.includes('100 UNID')) qtd100 += r.qtd;
      else qtdOutros += r.qtd;
    }
    return { qtd50, qtd100, qtdOutros };
  }, [rows]);

  // === top 10 gerais ===
  const topMais = useMemo(() => porProduto.slice(0, 10), [porProduto]);
  const topMenos = useMemo(() => [...porProduto].reverse().slice(0, 10), [porProduto]);

  // === mapa rápido: mes_id -> total qtd (a partir de porMes) ===
  const totalPorMes = useMemo(() => {
    const m = new Map();
    for (const { mes_id, qtd } of porMes) m.set(mes_id, qtd);
    return m;
  }, [porMes]);

  // === produto mais produzido em cada mês ===
  const topProdutoPorMes = useMemo(() => {
    const top = {}; // { [mes_id]: { produto, qtd } }
    for (const [produto, arr] of Object.entries(porProdutoMes || {})) {
      for (const { mes_id, qtd } of arr) {
        const cur = top[mes_id];
        if (!cur || qtd > cur.qtd) top[mes_id] = { produto, qtd };
      }
    }
    return top;
  }, [porProdutoMes]);

  // período (texto) a partir dos meses carregados
  const periodoLabel = useMemo(() => {
    if (!mesesOrdenados.length) return '';
    const first = mesesOrdenados[0];
    const last = mesesOrdenados[mesesOrdenados.length - 1];
    if (first === last) return fmtMes(first);
    return `${fmtMes(first)} – ${fmtMes(last)}`;
  }, [mesesOrdenados]);

  return (
    <div className="comex">
      <h2 className="comex-card-title mb-16">
        Produção — Quantidade (geral e por mês){periodoLabel ? ` • ${periodoLabel}` : ''}
      </h2>

      {/* === KPIs gerais === */}
      <div className="comex-cards mt-16">
        <div className="comex-card">
          <div className="comex-card-title">Total Produzido</div>
          <div className="comex-card-sub">Soma de todas as quantidades</div>
          <div className="comex-card-value">{loading ? '—' : fmt(totalQtd)}</div>
        </div>
        <div className="comex-card">
          <div className="comex-card-title">Produtos 50 unid</div>
          <div className="comex-card-value">{loading ? '—' : fmt(qtd50)}</div>
        </div>
        <div className="comex-card">
          <div className="comex-card-title">Produtos 100 unid</div>
          <div className="comex-card-value">{loading ? '—' : fmt(qtd100)}</div>
        </div>
        <div className="comex-card">
          <div className="comex-card-title">Outros formatos</div>
          <div className="comex-card-value">{loading ? '—' : fmt(qtdOutros)}</div>
        </div>
      </div>

      {/* === Gráfico estilo "Custo Médio" só que de Quantidade === */}
      <GraficoQtdPorProdutoMes
        mesesOrdenados={mesesOrdenados}
        porProdutoMes={porProdutoMes}
        topN={12}
      />

      {/* === Resumo por mês: total e top produto === */}
      <div className="mt-24">
        <h3 className="comex-card-title mb-8">Resumo por Mês</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mesesOrdenados.map((m) => {
            const totalMes = totalPorMes.get(m) || 0;
            const top = topProdutoPorMes[m];
            return (
              <div className="comex-card" key={m}>
                <div className="comex-card-title">{fmtMes(m)}</div>
                <div className="comex-card-sub">Total produzido</div>
                <div className="comex-card-value mb-4">{loading ? '—' : fmt(totalMes)}</div>

                <div className="text-sm text-gray-600 mb-1">Mais produzido no mês</div>
                {loading ? (
                  <div className="text-base">—</div>
                ) : top ? (
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{top.produto}</div>
                    <div className="text-sm text-gray-700">Qtd: {fmt(top.qtd)}</div>
                  </div>
                ) : (
                  <div className="text-base">Sem dados</div>
                )}
              </div>
            );
          })}
          {!loading && !mesesOrdenados.length && (
            <div className="text-muted">Sem dados por mês.</div>
          )}
        </div>
      </div>



      {/* === tabela geral por produto === */}
      <div className="mt-24">
        <h3 className="comex-card-title mb-8">Produção Total por Produto (Geral)</h3>
        <div className="comex-table">
          <div className="comex-thead comex-row">
            <div className="comex-cell" style={{ flex: 3 }}>Produto</div>
            <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Qtd Produzida</div>
          </div>
          {porProduto.map((p) => (
            <div className="comex-row" key={p.produto}>
              <div className="comex-cell" style={{ flex: 3 }}>{p.produto}</div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmt(p.qtd)}</div>
            </div>
          ))}
          {!loading && !porProduto.length && <div className="text-muted comex-row">Sem dados.</div>}
        </div>
      </div>

      {/* === Top 10 gerais === */}
      <div className="comex-grid-2 mt-32">
        <div>
          <h3 className="comex-card-title mb-8">Top 10 Mais Produzidos (Geral)</h3>
          <div className="comex-table">
            <div className="comex-thead comex-row">
              <div className="comex-cell" style={{ flex: 3 }}>Produto</div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Qtd</div>
            </div>
            {topMais.map((p) => (
              <div className="comex-row" key={p.produto}>
                <div className="comex-cell" style={{ flex: 3 }}>{p.produto}</div>
                <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmt(p.qtd)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="comex-card-title mb-8">Top 10 Menos Produzidos (Geral)</h3>
          <div className="comex-table">
            <div className="comex-thead comex-row">
              <div className="comex-cell" style={{ flex: 3 }}>Produto</div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Qtd</div>
            </div>
            {topMenos.map((p) => (
              <div className="comex-row" key={p.produto}>
                <div className="comex-cell" style={{ flex: 3 }}>{p.produto}</div>
                <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmt(p.qtd)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
