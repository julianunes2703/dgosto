import { useMemo } from 'react';
import {QUANT_PROD_LINK} from '../constants'
import useProducaoQtdUltimos6Meses from '../hooks/useProducaoQtd6m';
import './ProducaoExplore.css';

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

export default function ProducaoQtdExplore() {
  const { loading, rows, totalQtd, porProduto } = useProducaoQtdUltimos6Meses(QUANT_PROD_LINK);

  // === separação por tipo de embalagem ===
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

  // === top 10 mais e menos produzidos ===
  const topMais = useMemo(() => porProduto.slice(0, 10), [porProduto]);
  const topMenos = useMemo(() => [...porProduto].reverse().slice(0, 10), [porProduto]);

  return (
    <div className="comex">
      <h2 className="comex-card-title mb-16">Produção — Quantidade (últimos 6 meses)</h2>

      {/* === KPIs principais === */}
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

      {/* === tabela geral por produto === */}
      <div className="mt-24">
        <h3 className="comex-card-title mb-8">Produção Total por Produto</h3>
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

      {/* === Top 10 mais e menos produzidos === */}
      <div className="comex-grid-2 mt-32">
        <div>
          <h3 className="comex-card-title mb-8">Top 10 Mais Produzidos</h3>
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
          <h3 className="comex-card-title mb-8">Top 10 Menos Produzidos</h3>
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
