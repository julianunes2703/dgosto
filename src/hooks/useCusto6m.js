import { useMemo } from 'react';
import useCustoProdutoMany from './useCustoProdutoMany';

// helpers de data (mesma lógica que já usamos)
const TZ_SP = -3 * 60 * 60 * 1000; // ms
const todayISO = () =>
  new Date(Date.now() + TZ_SP).toISOString().slice(0, 10);

const sixMonthsCutoff = () => {
  const [y, m] = todayISO().split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 5); // mês atual + 5 anteriores
  return d.toISOString().slice(0,10);
};
const monthId = (r) => r?.month_id || (r?.data_iso ? r.data_iso.slice(0,7) : null);

export function useCustoProdutoUltimos6Meses(link) {
  // reaproveita SEU hook atual com 1 "semana" apontando pro Apps Script
  const semanas = useMemo(() => ({ ALL: { custo_produto: link } }), [link]);
  const base = useCustoProdutoMany(semanas, ['ALL'], '6m');

  // filtra os últimos 6 meses
  const filtered = useMemo(() => {
    const hi = todayISO();
    const lo = sixMonthsCutoff();
    const isIn = (r) => {
      const iso = r?.data_iso || (monthId(r) ? `${monthId(r)}-01` : null);
      return !!iso && iso >= lo && iso <= hi;
    };
    return (base.rows || []).filter(isIn);
  }, [base.rows]);

  // re-agrega (total, qtd, porProduto), idêntico à lógica do seu useCustoProdutoMany
  const aggs = useMemo(() => {
    const byProduto = {};
    let totalCusto = 0, totalQtd = 0;

    for (const r of filtered) {
      totalCusto += r.custo_total || 0;
      totalQtd   += r.qtd || 0;

      const k = r.produto;
      if (!k) continue;
      byProduto[k] = byProduto[k] || { custo_total: 0, qtd: 0 };
      byProduto[k].custo_total += r.custo_total || 0;
      byProduto[k].qtd         += r.qtd || 0;
    }

    const porProduto = Object.entries(byProduto)
      .map(([produto, v]) => ({
        produto,
        custo_total: v.custo_total,
        qtd: v.qtd,
        custo_unit_medio: v.qtd ? v.custo_total / v.qtd : 0,
      }))
      .sort((a,b) => b.custo_total - a.custo_total);

    const custoUnitarioMedioGeral = totalQtd ? totalCusto / totalQtd : 0;

    return { totalCusto, totalQtd, custoUnitarioMedioGeral, porProduto };
  }, [filtered]);

  return { loading: base.loading, rows: filtered, ...aggs };
}

export default useCustoProdutoUltimos6Meses;
