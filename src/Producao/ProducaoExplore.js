import { useMemo, useState, useEffect } from 'react';
import { CUSTO_PROD_LINK } from '../constants';
import { useCustoProdutoUltimos6Meses } from '../hooks/useCusto6m';
import CustoProdutoMesChart from './CustoProdutoMesChart';
import './ProducaoExplore.css';
import ProducaoQtdExplore from './ProducaoQtdExplore';


const fmtBRL = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const mesLabel = (yyyy_mm) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date((yyyy_mm || '2000-01') + '-01'))
    .replace(/^./, (c) => c.toUpperCase());

// Helper: limites da semana (seg→dom) a partir de "YYYY-MM-DD"
function weekBoundsFromISO(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00Z');
  const day = d.getUTCDay() || 7; // 1..7 (seg=1)
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - (day - 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    id: start.toISOString().slice(0, 10) + '→' + end.toISOString().slice(0, 10),
  };
}

export default function ProducaoCustoProduto() {
  const [aba, setAba] = useState('CUSTO' | 'QTD'); // 'CUSTO' | 'QTD' (futuro)
  const [semanaOpen, setSemanaOpen] = useState(false); // fechado por padrão
  const [mensalOpen, setMensalOpen] = useState(true); // começa aberto



  // dados (últimos 6 meses) — rows já vêm com data_iso / month_id / custo_unit
  const { loading, rows } = useCustoProdutoUltimos6Meses(CUSTO_PROD_LINK);

  // ======== AGREGAÇÕES BÁSICAS ========
  const getMonthId = (r) => r?.month_id || (r?.data_iso ? r.data_iso.slice(0, 7) : null);

  // KPI: média simples geral de custo_unit (mostrada no topo)
  const mediaGeralCU = useMemo(() => {
    const cu = (rows || []).map((r) => Number(r.custo_unit || 0)).filter((x) => x > 0);
    if (!cu.length) return 0;
    const sum = cu.reduce((a, b) => a + b, 0);
    return sum / cu.length;
  }, [rows]);

  // Por produto + por mês (médias simples)
  const { porProdutoResumo, porProdutoMes, mesesOrdenados, topProdutos } = useMemo(() => {
    const byProd = {}; // produto -> { sumCU, n }
    const byProdMes = {}; // "produto||YYYY-MM" -> { sumCU, n }
    const mesesSet = new Set();

    for (const r of rows || []) {
      const prod = r?.produto;
      const cu = Number(r?.custo_unit || 0);
      const mes = getMonthId(r);
      if (!prod || !cu) continue;

      byProd[prod] ??= { sumCU: 0, n: 0 };
      byProd[prod].sumCU += cu;
      byProd[prod].n += 1;

      if (mes) {
        const key = `${prod}||${mes}`;
        byProdMes[key] ??= { sumCU: 0, n: 0, produto: prod, mes_id: mes };
        byProdMes[key].sumCU += cu;
        byProdMes[key].n += 1;
        mesesSet.add(mes);
      }
    }

    const porProdutoResumo = Object.entries(byProd)
      .map(([produto, v]) => ({
        produto,
        custo_unit_medio: v.n ? v.sumCU / v.n : 0,
        linhas: v.n,
      }))
      .sort((a, b) => a.produto.localeCompare(b.produto));

    const porProdutoMes = {};
    for (const [k, v] of Object.entries(byProdMes)) {
      const [produto, mes_id] = k.split('||');
      porProdutoMes[produto] ??= [];
      porProdutoMes[produto].push({
        mes_id,
        custo_unit_medio: v.n ? v.sumCU / v.n : 0,
        linhas: v.n,
      });
    }
    for (const p in porProdutoMes) {
      porProdutoMes[p].sort((a, b) => a.mes_id.localeCompare(b.mes_id));
    }

    const mesesOrdenados = Array.from(mesesSet).sort(); // YYYY-MM

    const topProdutos = porProdutoResumo
      .slice()
      .sort((a, b) => (b.linhas || 0) - (a.linhas || 0))
      .slice(0, 6)
      .map((x) => x.produto);

    return { porProdutoResumo, porProdutoMes, mesesOrdenados, topProdutos };
  }, [rows]);

  // ======== COMPARATIVO vs MÉDIA GERAL (SEMANA / MÊS) ========

  // média de referência (pode ser igual à mediaGeralCU — deixei separado por semântica)
  const mediaGeralReferencia = useMemo(() => {
    const cu = (rows || []).map((r) => Number(r.custo_unit || 0)).filter((x) => x > 0);
    if (!cu.length) return 0;
    return cu.reduce((a, b) => a + b, 0) / cu.length;
  }, [rows]);

  const comparativoSemanal = useMemo(() => {
    const map = new Map(); // weekId -> { start, end, sumCU, n }
    for (const r of rows || []) {
      const wb = r?.data_iso ? weekBoundsFromISO(r.data_iso) : null;
      if (!wb) continue;
      if (!map.has(wb.id)) map.set(wb.id, { start: wb.start, end: wb.end, sumCU: 0, n: 0 });
      if (r.custo_unit) {
        const it = map.get(wb.id);
        it.sumCU += Number(r.custo_unit);
        it.n += 1;
      }
    }
    return Array.from(map.values())
      .map((w) => {
        const cu = w.n ? w.sumCU / w.n : 0;
        const diff = cu - mediaGeralReferencia;
        const pct = mediaGeralReferencia ? (diff / mediaGeralReferencia) * 100 : 0;
        return {
          week_id: `${w.start} → ${w.end}`,
          start: w.start,
          custo_unit_medio: cu,
          variacao: diff,
          variacao_pct: pct,
          status: diff > 0 ? 'subiu' : diff < 0 ? 'desceu' : 'igual',
        };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [rows, mediaGeralReferencia]);

  const comparativoMensal = useMemo(() => {
    const map = new Map(); // mesId -> { sumCU, n }
    for (const r of rows || []) {
      const mes = r?.month_id || (r?.data_iso ? r.data_iso.slice(0, 7) : null);
      if (!mes) continue;
      if (!map.has(mes)) map.set(mes, { mes_id: mes, sumCU: 0, n: 0 });
      if (r.custo_unit) {
        const it = map.get(mes);
        it.sumCU += Number(r.custo_unit);
        it.n += 1;
      }
    }
    return Array.from(map.values())
      .map((m) => {
        const cu = m.n ? m.sumCU / m.n : 0;
        const diff = cu - mediaGeralReferencia;
        const pct = mediaGeralReferencia ? (diff / mediaGeralReferencia) * 100 : 0;
        return {
          mes_id: m.mes_id,
          custo_unit_medio: cu,
          variacao: diff,
          variacao_pct: pct,
          status: diff > 0 ? 'subiu' : diff < 0 ? 'desceu' : 'igual',
        };
      })
      .sort((a, b) => a.mes_id.localeCompare(b.mes_id));
  }, [rows, mediaGeralReferencia]);

  // ===== gráfico “todos os produtos desse mês” =====
  const [mesTodosSel, setMesTodosSel] = useState('');
  useEffect(() => {
    if (!mesTodosSel && (mesesOrdenados?.length || 0) > 0) {
      setMesTodosSel(mesesOrdenados[mesesOrdenados.length - 1]); // último mês disponível
    }
  }, [mesesOrdenados, mesTodosSel]);

  // ============================

  return (
    <div className="comex">
      {/* Tabs simples */}
      <div className="comex-tabs">
          <button
            className={`comex-tab ${aba === 'CUSTO' ? 'is-active' : ''}`}
            onClick={() => setAba('CUSTO')}
          >
            Produção — Custo
          </button>
          <button
            className={`comex-tab ${aba === 'QTD' ? 'is-active' : ''}`}
            onClick={() => setAba('QTD')}
          >
            Produção — Quantidade
          </button>
        </div>


          {aba === 'QTD' && (
                          <>
                           
                            <ProducaoQtdExplore /> 
                          </>
                        )}


      {aba === 'CUSTO' && (
        <>
          {/* KPI principal */}
          <div className="comex-cards mt-16">
            <div className="comex-card">
              <div className="comex-card-title">Custo Unitário Médio — Geral</div>
              <div className="comex-card-sub">Soma dos custos unitários ÷ nº de linhas</div>
              <div className="comex-card-value">{loading ? '—' : fmtBRL(mediaGeralCU)}</div>
            </div>
          </div>

          {/* Gráfico: custo médio por produto por mês */}
          {!loading && !!mesesOrdenados.length && (
            <div className="comex-chart mt-24">
              <div className="comex-grid-2" style={{ alignItems: 'end', marginBottom: 8 }}>
                <h3 className="comex-card-title mb-2">Custo Médio por Produto por Mês</h3>
                <div style={{ textAlign: 'right' }}>
                  <label className="comex-label">Ver todos os produtos de</label>
                  <select
                    className="comex-input"
                    value={mesTodosSel || ''}
                    onChange={(e) => setMesTodosSel(e.target.value)}
                  >
                    {mesesOrdenados.map((m) => (
                      <option key={m} value={m}>{mesLabel(m)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <CustoProdutoMesChart
                meses={mesesOrdenados}          // agrupado por mês (top N)
                produtos={topProdutos}
                porProdutoMes={porProdutoMes}
                mesSelecionado={mesTodosSel}    // quando setado, mostra "todos os produtos desse mês"
              />

            </div>
          )}

  {/* Comparativo Semanal (dobrável) */}
{!loading && (
  <div className="comex-chart mt-24">
    <div
      className="comex-accordion-header"
      onClick={() => setSemanaOpen(v => !v)}
      role="button"
      aria-expanded={semanaOpen}
    >
      <h3 className="comex-card-title">
        Semanas — Custo Médio vs Média Geral ({fmtBRL(mediaGeralReferencia)})
      </h3>
      <span className={`comex-chevron ${semanaOpen ? 'is-open' : ''}`}>▸</span>
    </div>

    {semanaOpen && (
      <div className="comex-accordion-body">
        <div className="comex-table">
          <div className="comex-thead comex-row">
            <div className="comex-cell" style={{flex:2}}>Semana</div>
            <div className="comex-cell" style={{flex:1,textAlign:'right'}}>CU Médio</div>
            <div className="comex-cell" style={{flex:1,textAlign:'right'}}>Δ (R$)</div>
            <div className="comex-cell" style={{flex:1,textAlign:'right'}}>Δ (%)</div>
            <div className="comex-cell" style={{flex:1}}>Tendência</div>
          </div>
          {comparativoSemanal.map((s)=>(
            <div className="comex-row" key={s.start}>
              <div className="comex-cell" style={{flex:2}}>{s.week_id}</div>
              <div className="comex-cell" style={{flex:1,textAlign:'right'}}>{fmtBRL(s.custo_unit_medio)}</div>
              <div className="comex-cell" style={{flex:1,textAlign:'right'}}>{fmtBRL(s.variacao)}</div>
              <div className="comex-cell" style={{flex:1,textAlign:'right'}}>{s.variacao_pct.toFixed(1)}%</div>
              <div className="comex-cell" style={{flex:1,color:s.status==='subiu'?'#d33':s.status==='desceu'?'#0a0':'#666'}}>
                {s.status==='subiu'?'▲ Subiu':s.status==='desceu'?'▼ Desceu':'— Igual'}
              </div>
            </div>
          ))}
          {!comparativoSemanal.length && <div className="text-muted comex-row">Sem dados.</div>}
        </div>
      </div>
    )}
  </div>
)}

          {/* Comparativo Mensal (dobrável) */}
{!loading && (
  <div className="comex-chart mt-24">
    <div
      className="comex-accordion-header"
      onClick={() => setMensalOpen((v) => !v)}
      role="button"
      aria-expanded={mensalOpen}
    >
      <h3 className="comex-card-title">
        Meses — Custo Médio vs Média Geral ({fmtBRL(mediaGeralReferencia)})
      </h3>
      <span className={`comex-chevron ${mensalOpen ? 'is-open' : ''}`}>▸</span>
    </div>

    {mensalOpen && (
      <div className="comex-accordion-body">
        <div className="comex-table">
          <div className="comex-thead comex-row">
            <div className="comex-cell" style={{ flex: 2 }}>Mês</div>
            <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>CU Médio</div>
            <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Δ (R$)</div>
            <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Δ (%)</div>
            <div className="comex-cell" style={{ flex: 1 }}>Tendência</div>
          </div>

          {comparativoMensal.map((m) => (
            <div className="comex-row" key={m.mes_id}>
              <div className="comex-cell" style={{ flex: 2 }}>
                {new Date(m.mes_id + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmtBRL(m.custo_unit_medio)}</div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmtBRL(m.variacao)}</div>
              <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{m.variacao_pct.toFixed(1)}%</div>
              <div
                className="comex-cell"
                style={{ flex: 1, color: m.status === 'subiu' ? '#d33' : m.status === 'desceu' ? '#0a0' : '#666' }}
              >
                {m.status === 'subiu'
                  ? '▲ Subiu'
                  : m.status === 'desceu'
                  ? '▼ Desceu'
                  : '— Igual'}
              </div>
            </div>
          ))}

          {!comparativoMensal.length && <div className="text-muted comex-row">Sem dados.</div>}
        </div>
      </div>
    )}
  </div>
)}


          {/* Tabela por produto: média + melhor/pior mês */}
          <div className="mt-16">
            <h3 className="comex-card-title mb-8">Resumo por Produto</h3>
            <div className="comex-table">
              <div className="comex-thead comex-row">
                <div className="comex-cell" style={{ flex: 3 }}>Produto</div>
                <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Média (CU)</div>
                <div className="comex-cell" style={{ flex: 1.5 }}>Melhor mês</div>
                <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Valor</div>
                <div className="comex-cell" style={{ flex: 1.5 }}>Pior mês</div>
                <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>Valor</div>
              </div>
              {(loading ? [] : porProdutoResumo).map((p) => {
                const mp = (function () {
                  const arr = porProdutoMes[p.produto] || [];
                  if (!arr.length) return null;
                  let melhor = arr[0], pior = arr[0];
                  for (const m of arr) {
                    if (m.custo_unit_medio < melhor.custo_unit_medio) melhor = m;
                    if (m.custo_unit_medio > pior.custo_unit_medio) pior = m;
                  }
                  return {
                    melhor: { mes_id: melhor.mes_id, label: mesLabel(melhor.mes_id), valor: melhor.custo_unit_medio },
                    pior: { mes_id: pior.mes_id, label: mesLabel(pior.mes_id), valor: pior.custo_unit_medio },
                  };
                })();

                return (
                  <div className="comex-row" key={p.produto}>
                    <div className="comex-cell" style={{ flex: 3 }}>{p.produto}</div>
                    <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{fmtBRL(p.custo_unit_medio)}</div>
                    <div className="comex-cell" style={{ flex: 1.5 }}>{mp?.melhor?.label || '—'}</div>
                    <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{mp ? fmtBRL(mp.melhor.valor) : '—'}</div>
                    <div className="comex-cell" style={{ flex: 1.5 }}>{mp?.pior?.label || '—'}</div>
                    <div className="comex-cell" style={{ flex: 1, textAlign: 'right' }}>{mp ? fmtBRL(mp.pior.valor) : '—'}</div>
                  </div>
                );
              })}
              {!loading && !porProdutoResumo.length && <div className="text-muted comex-row">Sem dados.</div>}
            </div>
          </div>

          
        </>
      )}
    </div>
  );
}
