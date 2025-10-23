import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import "./DRE.css";

const C_PREV  = "#b83434ff";
const C_REAL  = "#000000ff";
const PIE_COLORS = ["#a12e2e", "#c24a4a", "#7a1c1c"];
const C_VAR_POS = "#090909ff";
const C_VAR_NEG = "#ef4444";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
const num = (v) => Number(v) || 0;
const normStr = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const label42 = (s = "") => (s.length > 42 ? s.slice(0, 39) + "..." : s);

export default function DREResumoAnual({ data, monthsOverride }) {
  const { months = [], valueAt } = data || {};
  const rows = Array.isArray(data?.rows) ? data.rows : [];

  // meses base (lower, sem duplicatas)
  const meses = useMemo(() => {
    const base = (monthsOverride?.length ? monthsOverride : months) || [];
    return Array.from(new Set(base.map((m) => String(m || "").toLowerCase())));
  }, [monthsOverride, months]);

  // ===== NOVO: meses válidos (receita realizada > 0) =====
  const mesesValidos = useMemo(() => {
    if (!meses.length) return [];
    return meses.filter((m) => num(valueAt?.("receita_liquida", m, "realizado")) > 0);
  }, [meses, valueAt]);

  // fallback: se nenhum mês tiver receita>0, usa todos (evita divisão por 0)
  const mesesParaMedia = mesesValidos.length ? mesesValidos : meses;
  const nMesesMedia = mesesParaMedia.length || 1;

  // ===== somadores (sempre sobre TODOS os meses disponíveis) =====
  const sumMetric = (name, tipo) =>
    meses.reduce((acc, m) => acc + num(valueAt?.(name, m, tipo)), 0);

  // Totais do ano
  const receitaAnoReal = useMemo(() => sumMetric("receita_liquida", "realizado"), [meses, valueAt]);
  const receitaAnoPrev = useMemo(() => sumMetric("receita_liquida", "previsto"),   [meses, valueAt]);
  const custosAnoReal  = useMemo(() => sumMetric("custos_totais",   "realizado"),  [meses, valueAt]);
  const custosAnoPrev  = useMemo(() => sumMetric("custos_totais",   "previsto"),   [meses, valueAt]);
  const ebitdaAnoReal  = useMemo(() => sumMetric("ebitda",          "realizado"),  [meses, valueAt]);
  const ebitdaAnoPrev  = useMemo(() => sumMetric("ebitda",          "previsto"),   [meses, valueAt]);
  const lucroAnoReal   = useMemo(() => sumMetric("lucro_liquido",   "realizado"),  [meses, valueAt]);

  // ===== médias mensais (apenas meses com receita>0) =====
  const medReceita = receitaAnoReal / nMesesMedia;
  const medCustos  = custosAnoReal  / nMesesMedia;
  const medEbitda  = ebitdaAnoReal  / nMesesMedia;
  const medLucro   = lucroAnoReal   / nMesesMedia;

  // Margens
  const margemAno = receitaAnoReal ? (ebitdaAnoReal / receitaAnoReal) * 100 : 0;

  // média simples da margem: soma das margens mensais / nº de meses com receita>0
  const margemMediaSimples = useMemo(() => {
    if (!mesesParaMedia.length) return 0;
    let soma = 0, cnt = 0;
    for (const m of mesesParaMedia) {
      const r = num(valueAt?.("receita_liquida", m, "realizado"));
      const e = num(valueAt?.("ebitda",          m, "realizado"));
      if (r !== 0) { soma += (e / r) * 100; cnt++; }
    }
    return cnt ? soma / cnt : 0;
  }, [mesesParaMedia, valueAt]);

  // Composição média mensal da receita (média sobre mesesParaMedia)
  const sumOver = (name) => mesesParaMedia.reduce((acc, m) => acc + num(valueAt?.(name, m, "realizado")), 0);
  const recServMed = sumOver("receitas_servicos")   / nMesesMedia;
  const recRevMed  = sumOver("receitas_revenda")    / nMesesMedia;
  const recFabMed  = sumOver("receitas_fabricacao") / nMesesMedia;

  const compReceitaMedia = useMemo(() => {
    const serv = Math.max(0, recServMed);
    const rev  = Math.max(0, recRevMed);
    const fab  = Math.max(0, recFabMed);
    const itens = [
      { name: "Serviços (média)",   value: serv },
      { name: "Revenda (média)",    value: rev  },
      { name: "Fabricação (média)", value: fab  },
    ].filter(i => i.value > 0);
    return itens.length ? itens : [{ name: "Receita Líquida (média)", value: Math.max(0, medReceita) }];
  }, [recServMed, recRevMed, recFabMed, medReceita]);

  // ===== Top 10 despesas por MÉDIA mensal (sobre mesesParaMedia) =====
  const EXCLUDE_TOTALS = [
    "faturamento bruto","receita liquida","custos totais","custos operacionais",
    "lucro bruto","lucro operacional","ebitda","resultado","geracao de caixa",
    "kg fabricado","cmv","investimentos","dividendos",
    "despesas adm","despesas comercial","despesas com logistica","despesas com logística",
  ];
  const looksHeaderPct = (n) => /\(\s*\d+\s*%/.test(n);
  const isTotalOrHeader = (name = "") => {
    const n = normStr(name);
    if (looksHeaderPct(n)) return true;
    return EXCLUDE_TOTALS.some((k) => n.includes(normStr(k)));
  };
  const INCLUDE_EXP_TERMS = [
    "salario","salarios","comissao","comissoes","consultoria","assessoria",
    "contabilidade","material","escritorio","escritório","seguranca","segurança",
    "monitoramento","seguros","marketing","campanha","frete","aluguel","aluguéis",
    "manutencao","manutenção","viagem","depreciacao","depreciação",
    "ggf","agua","água","esgoto","imoveis","imóveis","veiculos","veículos",
    "infraestrutura","terceirizada","maquinas","máquinas","equipamentos",
    "uso e consumo","servico de limpeza","serviço de limpeza",
    "laboratorio","laboratório","quimico","químico",
    "taxas","licencas","licenças","iptu",
  ];
  const looksLikeExpenseDetail = (name = "") => {
    const n = normStr(name);
    return INCLUDE_EXP_TERMS.some((k) => n.includes(normStr(k)));
  };
  const REVENUE_KW = ["receita","faturamento","venda","revenda","servico","serviço","fabricacao","fabricação","vendas"];
  const isLikelyExpense = (name = "") => !REVENUE_KW.some((k) => normStr(name).includes(normStr(k)));

  const readRowValsForMonth = (r, kMes) => {
    const prev = num(r?.valuesPrevisto?.[kMes]);
    const real = num(r?.valuesRealizado?.[kMes]);
    return { prev, real };
  };

  const linhasComMedias = useMemo(() => {
    if (!mesesParaMedia.length || !rows.length) return [];
    return rows.map((r) => {
      let somaPrev = 0, somaReal = 0;
      for (const m of mesesParaMedia) {
        const { prev, real } = readRowValsForMonth(r, m);
        somaPrev += prev; somaReal += real;
      }
      return {
        name: r.name,
        label: label42(r.name || ""),
        PrevistoMedio: somaPrev / nMesesMedia,
        RealizadoMedio: somaReal / nMesesMedia,
        absRealMedio: Math.abs(somaReal / nMesesMedia),
        isDetail: looksLikeExpenseDetail(r.name || ""),
      };
    });
  }, [rows, mesesParaMedia, nMesesMedia]);

  const topDespesasAgregadas = useMemo(() => {
    return linhasComMedias
      .filter((d) => d.absRealMedio > 0 && isLikelyExpense(d.name || ""))
      .sort((a, b) => b.absRealMedio - a.absRealMedio)
      .slice(0, 10);
  }, [linhasComMedias]);

  const topDespesasDetalhadas = useMemo(() => {
    const items = linhasComMedias
      .filter((d) => d.absRealMedio > 0 && !isTotalOrHeader(d.name || ""));
    items.sort((a, b) => {
      if (a.isDetail !== b.isDetail) return a.isDetail ? -1 : 1;
      return b.absRealMedio - a.absRealMedio;
    });
    return items.slice(0, 10);
  }, [linhasComMedias]);

  const [rankMode, setRankMode] = useState("agregadas");
  const chartDataset = rankMode === "detalhadas" ? topDespesasDetalhadas : topDespesasAgregadas;

  const barColor = (x) => (x >= 0 ? C_VAR_POS : C_VAR_NEG);

  const totaisAnoDataset = [
    { name: "Receita Líquida", Previsto: receitaAnoPrev, Realizado: receitaAnoReal, Variacao: receitaAnoReal - receitaAnoPrev },
    { name: "Custos Totais",    Previsto: custosAnoPrev,  Realizado: custosAnoReal,  Variacao: custosAnoReal  - custosAnoPrev  },
    { name: "EBITDA",           Previsto: ebitdaAnoPrev,  Realizado: ebitdaAnoReal,  Variacao: ebitdaAnoReal  - ebitdaAnoPrev  },
  ];

  return (
    <div className="dre-page bg-gray-50">
      <div className="dre-toolbar">
        <div />
        <div className="dre-select">
          <label>Resumo Geral do DRE</label>
          <div style={{ fontWeight: 600 }}>
            {nMesesMedia} {nMesesMedia === 1 ? "mês" : "meses"} considerados (receita &gt; 0)
          </div>
        </div>
      </div>

      <section className="dre-cards dre-cards-3col">
        <div className="dre-card">
          <h4>Receita Líquida — Total Ano</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(receitaAnoPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(receitaAnoReal)}</b></div>
          <div className={`dre-delta ${(receitaAnoReal - receitaAnoPrev) >= 0 ? "pos" : "neg"}`}>
            Δ {money(receitaAnoReal - receitaAnoPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>Custos Totais — Total Ano</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(custosAnoPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(custosAnoReal)}</b></div>
          <div className={`dre-delta ${(custosAnoReal - custosAnoPrev) <= 0 ? "pos" : "neg"}`}>
            Δ {money(custosAnoReal - custosAnoPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>EBITDA — Total Ano</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(ebitdaAnoPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(ebitdaAnoReal)}</b></div>
          <div className={`dre-delta ${(ebitdaAnoReal - ebitdaAnoPrev) >= 0 ? "pos" : "neg"}`}>
            Δ {money(ebitdaAnoReal - ebitdaAnoPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>Margem EBITDA</h4>
          <div className="dre-row"><span>Sobre o Total</span><b>{margemAno.toFixed(1)}%</b></div>
          <div className="dre-row"><span>Média (meses c/ receita)</span><b>{margemMediaSimples.toFixed(1)}%</b></div>
        </div>
      </section>

      <section className="dre-cards dre-cards-3col">
        <div className="dre-card">
          <h4>Médias Mensais (receita &gt; 0)</h4>
          <div className="dre-row"><span>Receita Líquida</span><b>{money(medReceita)}</b></div>
          <div className="dre-row"><span>Custos Totais</span><b>{money(medCustos)}</b></div>
          <div className="dre-row"><span>EBITDA</span><b>{money(medEbitda)}</b></div>
          <div className="dre-row"><span>Lucro Líquido</span><b>{money(medLucro)}</b></div>
        </div>
      </section>

      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Totais do Ano — Previsto x Realizado</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={totaisAnoDataset}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Previsto"  fill={C_PREV} />
              <Bar dataKey="Realizado" fill={C_REAL} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dre-panel">
          <h3>Variação no Ano (Real − Prev)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={totaisAnoDataset}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="Variacao" name="Δ (R$)">
                {totaisAnoDataset.map((d, i) => (
                  <Cell key={i} fill={barColor(d.Variacao)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Composição da Receita — Média Mensal (só meses com receita)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip formatter={(v) => money(v)} />
              <Pie data={compReceitaMedia} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2}>
                {compReceitaMedia.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="dre-grid">
        <div className="dre-panel">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h3 style={{margin:0}}>
              Top 10 Despesas — {rankMode === "detalhadas" ? "Detalhadas" : "Agregadas"} (média mensal c/ receita)
            </h3>
            <div className="dre-toggle" style={{display:"flex", gap:8}}>
              <button
                onClick={() => setRankMode("agregadas")}
                style={{
                  padding:"6px 10px", borderRadius:6, border:"1px solid #c24a4a",
                  background: rankMode === "agregadas" ? "#7a1c1c" : "#fff",
                  color: rankMode === "agregadas" ? "#fff" : "#7a1c1c",
                  cursor:"pointer"
                }}
              >
                Agregadas
              </button>
              <button
                onClick={() => setRankMode("detalhadas")}
                style={{
                  padding:"6px 10px", borderRadius:6, border:"1px solid #c24a4a",
                  background: rankMode === "detalhadas" ? "#7a1c1c" : "#fff",
                  color: rankMode === "detalhadas" ? "#fff" : "#7a1c1c",
                  cursor:"pointer"
                }}
              >
                Detalhadas
              </button>
            </div>
          </div>

          {chartDataset.length === 0 ? (
            <div style={{padding: 24, textAlign: "center", opacity: 0.7}}>
              Sem dados suficientes para calcular médias mensais.<br/>
              Verifique se <code>data.rows</code> possui valores nos meses considerados.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartDataset} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={260} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
                <Bar dataKey="PrevistoMedio"  name="Prev. (média)"  fill={C_PREV} />
                <Bar dataKey="RealizadoMedio" name="Real. (média)" fill={C_REAL} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
