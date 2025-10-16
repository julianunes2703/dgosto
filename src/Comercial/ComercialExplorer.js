import { useMemo, useState } from 'react';
import { MESES } from '../constants';
import useFaturadoClientesMany from '../hooks/useFaturadosCliente';
import useRankingVendedoresMany from '../hooks/useRankingVendedores';
import TopClientesBar from './TopClienteBar';
import TopVendedoresBar from './TopBarVendedores';
import './ComercialExplorer.css';

const fmtBRL = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  // drawer
  const [open, setOpen] = useState(false);

  // fonte: clientes x vendedores
  const [fonte, setFonte] = useState('fat_cli'); // 'fat_cli' | 'rank_vend'

  // mês
  const hasMeses = Array.isArray(MESES) && MESES.length > 0;
  const [mesId, setMesId] = useState(hasMeses ? MESES[0].id : '');
  const mes = useMemo(
    () => (hasMeses ? MESES.find((m) => m.id === mesId) ?? MESES[0] : { ranges: {}, semanas: {} }),
    [mesId, hasMeses]
  );

  // intervalo padrão = mês inteiro
  const defaultStart = useMemo(() => Object.values(mes.ranges)[0]?.start ?? '', [mes]);
  const defaultEnd = useMemo(() => {
    const arr = Object.values(mes.ranges);
    return arr[arr.length - 1]?.end ?? '';
  }, [mes]);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // escopo: mês inteiro (ALL) ou uma semana específica (WEEK)
  const [escopo, setEscopo] = useState('ALL');    // 'ALL' | 'WEEK'
  const [semanaSel, setSemanaSel] = useState(null); // '03-09', '10-16', ...

  // semanas do mês atual
  const allWeekKeys = useMemo(() => Object.keys(mes.ranges || {}), [mes]);

  // quando mudar de mês, reseta para mês inteiro
  useMemo(() => {
    if (defaultStart && defaultEnd) {
      setStart(defaultStart);
      setEnd(defaultEnd);
      setEscopo('ALL');
      setSemanaSel(null);
    }
  }, [defaultStart, defaultEnd]);

  // calcular as semanas que serão buscadas
  const semanaKeys = useMemo(() => {
    if (escopo === 'WEEK' && semanaSel) return [semanaSel];
    return filterSemanasByRange(mes.ranges, start, end);
  }, [escopo, semanaSel, mes, start, end]);

  // hooks de dados
  const fat = useFaturadoClientesMany(mes.semanas, semanaKeys);
  const vend = useRankingVendedoresMany(mes.semanas, semanaKeys, mesId, 'mes'); // força coluna do mês

  const loading = fonte === 'fat_cli' ? fat.loading : vend.loading;
  const total = fonte === 'fat_cli' ? fat.total : vend.total;
  const topData = fonte === 'fat_cli' ? fat.top10 : vend.top10;

  const tituloCard =
    fonte === 'fat_cli' ? 'Faturamento por Cliente' : 'Faturamento por Vendedor';

  // atalhos (mês geral e semanas)
  function selecionarAtalho(key) {
    if (key === 'ALL') {
      setEscopo('ALL');
      setSemanaSel(null);
      const s = Object.values(mes.ranges)[0]?.start;
      const e = Object.values(mes.ranges)[Object.values(mes.ranges).length - 1]?.end;
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
        Abrir Comercial
      </button>

      {/* Drawer de filtros */}
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
                <select className="comex-input" value={fonte} onChange={(e)=>setFonte(e.target.value)}>
                  <option value="fat_cli">Faturado por Cliente</option>
                  <option value="rank_vend">Ranking de Vendedores</option>
                </select>
              </div>

              {/* Mês */}
              <div className="comex-field">
                <label className="comex-label">Mês</label>
                <select
                  className="comex-input"
                  value={mesId}
                  onChange={(e) => setMesId(e.target.value)}
                >
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

              {/* Semanas incluidas (informativo) */}
              <div className="comex-field">
                <div className="comex-label">Semanas incluídas</div>
                <div className="comex-badges">
                  {semanaKeys.length
                    ? semanaKeys.map((k) => <span key={k} className="comex-badge">{k}</span>)
                    : <span className="text-muted">Nenhuma semana no intervalo.</span>}
                </div>
              </div>

              {/* Atalhos: mês geral e semanas */}
              <div className="comex-field">
                <div className="comex-label">Atalhos</div>
                <div className="comex-badges">
                  <button
                    type="button"
                    className={`comex-badge-btn ${escopo === 'ALL' ? 'is-active' : ''}`}
                    onClick={() => selecionarAtalho('ALL')}
                  >
                    {MESES.find(m=>m.id===mesId)?.label} (Geral)
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
            {escopo === 'ALL'
              ? `${start} → ${end} (${semanaKeys.length} semana${semanaKeys.length === 1 ? '' : 's'})`
              : `Semana ${semanaSel} — ${start} → ${end}`}
          </div>
          <div className="comex-card-value">{loading ? '—' : fmtBRL(total)}</div>
        </div>
      </div>

      {/* Gráfico */}
      {!loading ? (
        <div className="comex-chart mt-16">
          {fonte === 'fat_cli' ? (
            <TopClientesBar data={topData} />
          ) : (
            <TopVendedoresBar data={topData} />
          )}
        </div>
      ) : (
        <div className="text-muted mt-16">Carregando dados…</div>
      )}
    </div>
  );
}
