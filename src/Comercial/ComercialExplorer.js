// src/components/ComercialExplorer.jsx
import { useMemo, useState } from 'react';
import {
  MESES,
  RANKING_TOPICOS,
  RANKING_SCHEMAS,
  FATURADO_CSV_URL,
  FATURADO_SCHEMA,
  PEDIDOS_CSV_URL,
  PEDIDOS_SCHEMA,
  RANK_VEND_CSV_URL,
  RANK_VEND_SCHEMA,
} from '../constants';

import useRankingProdutosCsv from '../hooks/useRankingProdutosCsv';
import useFaturadoCsv from '../hooks/useFaturadosCsv';

import TopProdutosBar from './TopProdutosBar';
import TopClientesBar from './TopClienteBar';

import './ComercialExplorer.css';

const fmtBRL = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// filtra semanas que colidem com o intervalo manual
function filterSemanasByRange(ranges, startISO, endISO) {
  if (!ranges || !startISO || !endISO) return [];
  const s0 = new Date(startISO);
  const e0 = new Date(endISO);
  return Object.entries(ranges)
    .filter(([_, r]) => {
      const rs = new Date(r.start);
      const re = new Date(r.end);
      return rs <= e0 && re >= s0;
    })
    .map(([k]) => k);
}

export default function ComercialExplorer() {
  // Drawer
  const [open, setOpen] = useState(false);

  // Fonte:
  // 'rank_perfil' | 'rank_produtos' | 'rank_vend' | 'fat_cli' | 'ped_cli'
  const [fonte, setFonte] = useState('rank_produtos');

  // Mês (default: primeiro da lista)
  const hasMeses = Array.isArray(MESES) && MESES.length > 0;
  const [mesId, setMesId] = useState(hasMeses ? MESES[0].id : '');
  const mes = useMemo(
    () => (hasMeses ? MESES.find((m) => m.id === mesId) ?? MESES[0] : { ranges: {}, semanas: {} }),
    [mesId, hasMeses]
  );

  // intervalo padrão = mês inteiro (parcial conforme ranges)
  const defaultStart = useMemo(() => Object.values(mes.ranges)[0]?.start ?? '', [mes]);
  const defaultEnd = useMemo(() => {
    const arr = Object.values(mes.ranges);
    return arr[arr.length - 1]?.end ?? '';
  }, [mes]);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // escopo / semanas
  const [escopo, setEscopo] = useState('ALL'); // 'ALL' | 'WEEK'
  const [semanaSel, setSemanaSel] = useState(null);
  const allWeekKeys = useMemo(() => Object.keys(mes.ranges || {}), [mes]);

  useMemo(() => {
    if (defaultStart && defaultEnd) {
      setStart(defaultStart);
      setEnd(defaultEnd);
      setEscopo('ALL');
      setSemanaSel(null);
    }
  }, [defaultStart, defaultEnd]);

  const semanaKeys = useMemo(() => {
    if (escopo === 'WEEK' && semanaSel) return [semanaSel];
    return filterSemanasByRange(mes.ranges, start, end);
  }, [escopo, semanaSel, mes, start, end]);

  // ====== URLs/Schemas de ranking (perfil | produtos) ======
  const rankPerfilUrl = RANKING_TOPICOS?.perfil || null;
  const rankPerfilSchema =
    RANKING_SCHEMAS?.perfil || { productCol: 'Descrição', valueCol: 'Vlr. Vendas', dateCol: null };

  const rankProdUrl = RANKING_TOPICOS?.produtos || null;
  const rankProdSchema =
    RANKING_SCHEMAS?.produtos || { productCol: 'Descrição', valueCol: 'Vlr. Vendas', dateCol: null };

  // ====== Hooks de dados ======
  // Ranking de Perfil
  const {
    loading: perfilLoading,
    top10: perfilTop10,
    total: perfilTotal,
  } = useRankingProdutosCsv(rankPerfilUrl, {
    startISO: start,
    endISO: end,
    schema: rankPerfilSchema,
  });

  // Ranking de Produtos
  const {
    loading: prodLoading,
    top10: prodTop10,
    total: prodTotal,
  } = useRankingProdutosCsv(rankProdUrl, {
    startISO: start,
    endISO: end,
    schema: rankProdSchema,
  });

  // Ranking de Vendedores (agrega por vendedor)
  const {
    loading: vendLoading,
    top10: vendTop10,
    total: vendTotal,
  } = useFaturadoCsv(RANK_VEND_CSV_URL, {
    startISO: start,
    endISO: end,
    schema: RANK_VEND_SCHEMA,
  });

  // Faturado por Cliente
  const {
    loading: fatLoading,
    top10: fatTop10,
    total: fatTotal,
  } = useFaturadoCsv(FATURADO_CSV_URL, {
    startISO: start,
    endISO: end,
    schema: FATURADO_SCHEMA,
  });

  // Pedidos por Cliente
  const {
    loading: pedLoading,
    top10: pedTop10,
    total: pedTotal,
  } = useFaturadoCsv(PEDIDOS_CSV_URL, {
    startISO: start,
    endISO: end,
    schema: PEDIDOS_SCHEMA,
  });

  // ====== Dados p/ UI ======
  let loading = false;
  let total = 0;
  let topData = [];
  let tituloCard = '';

  if (fonte === 'rank_perfil') {
    loading = perfilLoading;
    total = perfilTotal;
    topData = perfilTop10;
    tituloCard = 'Ranking de Perfil';
  } else if (fonte === 'rank_produtos') {
    loading = prodLoading;
    total = prodTotal;
    topData = prodTop10;
    tituloCard = 'Ranking de Produtos';
  } else if (fonte === 'rank_vend') {
    loading = vendLoading;
    total = vendTotal;
    topData = vendTop10;
    tituloCard = 'Ranking de Vendedores';
  } else if (fonte === 'ped_cli') {
    loading = pedLoading;
    total = pedTotal;
    topData = pedTop10;
    tituloCard = 'Pedidos por Cliente';
  } else if (fonte === 'fat_cli') {
    loading = fatLoading;
    total = fatTotal;
    topData = fatTop10;
    tituloCard = 'Faturado por Cliente';
  } else {
    loading = true;
    total = 0;
    topData = [];
    tituloCard = '—';
  }

  function selecionarAtalho(key) {
    if (key === 'ALL') {
      setEscopo('ALL');
      setSemanaSel(null);
      const s = Object.values(mes.ranges)[0]?.start;
      const e = Object.values(mes.ranges)[Object.values(mes.ranges).length - 1]?.end;
      if (s && e) {
        setStart(s);
        setEnd(e);
      }
      return;
    }
    setEscopo('WEEK');
    setSemanaSel(key);
    const r = mes.ranges[key];
    if (r) {
      setStart(r.start);
      setEnd(r.end);
    }
  }

  return (
    <div className="comex">
      <button className="comex-open-btn" onClick={() => setOpen(true)}>
        Abrir Comercial
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className="comex-overlay" onClick={() => setOpen(false)} />
          <div className="comex-drawer">
            <div className="comex-drawer-header">
              <h3 className="comex-title">Opções — Comercial</h3>
              <button className="comex-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="comex-drawer-body">
              {/* Fonte */}
              <div className="comex-field">
                <label className="comex-label">Fonte</label>
                <select className="comex-input" value={fonte} onChange={(e) => setFonte(e.target.value)}>
                  <option value="rank_perfil">Ranking de Perfil</option>
                  <option value="rank_produtos">Ranking de Produtos</option>
                  <option value="rank_vend">Ranking de Vendedores</option>
                  <option value="fat_cli">Faturado por Cliente</option>
                  <option value="ped_cli">Pedidos por Cliente</option>
                </select>
              </div>

              {/* Mês */}
              <div className="comex-field">
                <label className="comex-label">Mês</label>
                <select className="comex-input" value={mesId} onChange={(e) => setMesId(e.target.value)}>
                  {MESES.map((m) => (
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
                    onChange={(e) => { setStart(e.target.value); setEscopo('ALL'); setSemanaSel(null); }}
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
                    onChange={(e) => { setEnd(e.target.value); setEscopo('ALL'); setSemanaSel(null); }}
                  />
                </div>
              </div>

              {/* Semanas incluídas */}
              <div className="comex-field">
                <div className="comex-label">Semanas incluídas</div>
                <div className="comex-badges">
                  {semanaKeys.length ? (
                    semanaKeys.map((k) => <span key={k} className="comex-badge">{k}</span>)
                  ) : <span className="text-muted">Nenhuma semana no intervalo.</span>}
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
                    {MESES.find((m) => m.id === mesId)?.label} (Geral)
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

      {/* Cards */}
      <div className="comex-cards mt-24">
        <div className="comex-card">
          <div className="comex-card-title">
            {tituloCard} — {MESES.find((m) => m.id === mesId)?.label}
          </div>
          <div className="comex-card-sub">
            {mesId === '2025-10' ? 'Dados parciais: 05–18/out' : null}
            {` · ${start} → ${end}`}
          </div>
          <div className="comex-card-value">{loading ? '—' : fmtBRL(total)}</div>
        </div>
      </div>

      {/* Gráfico */}
      {!loading ? (
        <div className="comex-chart mt-16" style={{ height: 380 }}>
          {fonte === 'rank_perfil' || fonte === 'rank_produtos' ? (
            <TopProdutosBar data={topData} />
          ) : (
            <TopClientesBar data={topData} />
          )}
        </div>
      ) : (
        <div className="text-muted mt-16">Carregando dados…</div>
      )}
    </div>
  );
}
