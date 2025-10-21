import { useMemo, useState } from 'react';
import { MESES_PRODUCAO } from '../constants';
import useCustoProdutoMany from '../hooks/useCustoProdutoMany';
import TopProdutosBar from './TopProdutosBar';          // já existente (usa dataKey="custo_total")
import TopProdutosUnitBar from './TopProdutosUnitBar';  // novo (abaixo)
import '../Comercial/ComercialExplorer.css';            // reaproveita .comex

const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function filterSemanasByRange(ranges, startISO, endISO) {
  if (!ranges || !startISO || !endISO) return [];
  const s0 = new Date(startISO);
  const e0 = new Date(endISO);
  return Object.entries(ranges)
    .filter(([_, r]) => new Date(r.start) <= e0 && new Date(r.end) >= s0)
    .map(([k]) => k);
}

export default function ProducaoCustoProduto() {
  // Drawer
  const [open, setOpen] = useState(false);

  // Mês
  const hasMeses = Array.isArray(MESES_PRODUCAO) && MESES_PRODUCAO.length > 0;
  const [mesId, setMesId] = useState(hasMeses ? MESES_PRODUCAO[0].id : '');
  const mes = useMemo(
    () => (hasMeses ? MESES_PRODUCAO.find((m) => m.id === mesId) ?? MESES_PRODUCAO[0] : { ranges: {}, semanas: {} }),
    [mesId, hasMeses]
  );

  // Intervalo padrão = mês inteiro
  const defaultStart = useMemo(() => Object.values(mes.ranges)[0]?.start ?? '', [mes]);
  const defaultEnd = useMemo(() => {
    const arr = Object.values(mes.ranges);
    return arr[arr.length - 1]?.end ?? '';
  }, [mes]);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // Escopo: mês inteiro (ALL) ou semana específica (WEEK)
  const [escopo, setEscopo] = useState('ALL');
  const [semanaSel, setSemanaSel] = useState(null);

  const allWeekKeys = useMemo(() => Object.keys(mes.ranges || {}), [mes]);

  // reset ao trocar de mês
  useMemo(() => {
    if (defaultStart && defaultEnd) {
      setStart(defaultStart);
      setEnd(defaultEnd);
      setEscopo('ALL');
      setSemanaSel(null);
    }
  }, [defaultStart, defaultEnd]);

  // semanas a buscar
  const semanaKeys = useMemo(() => {
    if (escopo === 'WEEK' && semanaSel) return [semanaSel];
    return filterSemanasByRange(mes.ranges, start, end);
  }, [escopo, semanaSel, mes, start, end]);

  // DADOS (1x)
  const dados = useCustoProdutoMany(mes.semanas, semanaKeys, mesId);
  const { loading, totalCusto, totalQtd, custoUnitarioMedioGeral, porProduto, top10Produtos } = dados;

  // Top 10 por custo unitário (usa porProduto do hook, que já traz custo_unit_medio e qtd)
  const top10Unitario = useMemo(() => {
    const arr = (porProduto || [])
      .filter((x) => (x.qtd || 0) > 0)                // evita div/0 e ruído
      .sort((a, b) => (b.custo_unit_medio || 0) - (a.custo_unit_medio || 0))
      .slice(0, 10);
    return arr;
  }, [porProduto]);

  // UI
  function selecionarAtalho(key) {
    if (key === 'ALL') {
      setEscopo('ALL');
      setSemanaSel(null);
      const values = Object.values(mes.ranges);
      const s = values[0]?.start, e = values[values.length - 1]?.end;
      if (s && e) { setStart(s); setEnd(e); }
      return;
    }
    setEscopo('WEEK');
    setSemanaSel(key);
    const r = mes.ranges[key];
    if (r) { setStart(r.start); setEnd(r.end); }
  }

  return (
    <div className="comex">
      <button className="comex-open-btn" onClick={() => setOpen(true)}>
        Abrir Produção
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className="comex-overlay" onClick={() => setOpen(false)} />
          <div className="comex-drawer">
            <div className="comex-drawer-header">
              <h3 className="comex-title">Opções — Custo de Produto</h3>
              <button className="comex-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="comex-drawer-body">
              {/* Mês */}
              <div className="comex-field">
                <label className="comex-label">Mês</label>
                <select className="comex-input" value={mesId} onChange={(e)=>setMesId(e.target.value)}>
                  {MESES_PRODUCAO.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Intervalo manual */}
              <div className="comex-grid-2 comex-field">
                <div>
                  <label className="comex-label">Início</label>
                  <input
                    type="date"
                    className="comex-input"
                    min={Object.values(mes.ranges)[0]?.start}
                    max={Object.values(mes.ranges)[Object.values(mes.ranges).length - 1]?.end}
                    value={start}
                    onChange={(e)=>{ setStart(e.target.value); setEscopo('ALL'); setSemanaSel(null); }}
                  />
                </div>
                <div>
                  <label className="comex-label">Fim</label>
                  <input
                    type="date"
                    className="comex-input"
                    min={Object.values(mes.ranges)[0]?.start}
                    max={Object.values(mes.ranges)[Object.values(mes.ranges).length - 1]?.end}
                    value={end}
                    onChange={(e)=>{ setEnd(e.target.value); setEscopo('ALL'); setSemanaSel(null); }}
                  />
                </div>
              </div>

              {/* Semanas incluídas */}
              <div className="comex-field">
                <div className="comex-label">Semanas incluídas</div>
                <div className="comex-badges">
                  {semanaKeys.length
                    ? semanaKeys.map((k) => <span key={k} className="comex-badge">{k}</span>)
                    : <span className="text-muted">Nenhuma semana no intervalo.</span>}
                </div>
              </div>

              {/* Atalhos */}
              <div className="comex-field">
                <div className="comex-label">Atalhos</div>
                <div className="comex-badges">
                  <button
                    type="button"
                    className={`comex-badge-btn ${escopo === 'ALL' ? 'is-active' : ''}`}
                    onClick={() => selecionarAtalho('ALL')}
                  >
                    {MESES_PRODUCAO.find(m=>m.id===mesId)?.label} (Geral)
                  </button>
                  {allWeekKeys.map((wk) => (
                    <button
                      key={wk}
                      type="button"
                      className={`comex-badge-btn ${escopo === 'WEEK' && semanaSel === wk ? 'is-active' : ''}`}
                      onClick={() => selecionarAtalho(wk)}
                    >
                      {wk}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* KPIs */}
      <div className="comex-cards mt-24">
        <div className="comex-card">
          <div className="comex-card-title">
            Custo Total — {MESES_PRODUCAO.find((m) => m.id === mesId)?.label}
          </div>
          <div className="comex-card-sub">
            {escopo === 'ALL'
              ? `${start} → ${end} (${semanaKeys.length} semana${semanaKeys.length === 1 ? '' : 's'})`
              : `Semana ${semanaSel} — ${start} → ${end}`}
          </div>
          <div className="comex-card-value">
            {loading ? '—' : fmtBRL(totalCusto)}
          </div>
        </div>

        <div className="comex-card">
          <div className="comex-card-title">Custo Unit. Médio (Geral)</div>
          <div className="comex-card-value">
            {loading ? '—' : fmtBRL(custoUnitarioMedioGeral)}
          </div>
        </div>

        <div className="comex-card">
          <div className="comex-card-title">Qtd Produzida (estimada)</div>
          <div className="comex-card-value">
            {loading ? '—' : (totalQtd || 0).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Top 10 — Custo PA (Total) */}
      {!loading ? (
        <div className="comex-chart mt-16">
          <h3 className="comex-card-title mb-2">Top 10 Produtos — Custo Total (PA)</h3>
          <TopProdutosBar data={top10Produtos} />
        </div>
      ) : (
        <div className="text-muted mt-16">Carregando dados…</div>
      )}

      {/* Top 10 — Custo Unitário Médio */}
      {!loading && (
        <div className="comex-chart mt-16">
          <h3 className="comex-card-title mb-2">Top 10 Produtos — Custo Unitário Médio</h3>
          <TopProdutosUnitBar data={top10Unitario} />
        </div>
      )}
    </div>
  );
}
