import React, { useMemo, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import "./DRE.css";

// tons bordô/vermelho
const C_PREV  = "#b83434ff";
const C_REAL  = "#000000ff";
const PIE_COLORS = ["#a12e2e", "#c24a4a", "#7a1c1c"];
const C_VAR_POS = "#090909ff";
const C_VAR_NEG = "#ef4444";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

export default function DREDashboard({ data, mes, setMes, monthOptions }) {
  const { months, valueAt } = data;

  // garante que o select tenha opções
  useEffect(() => {
    if (monthOptions?.length && !monthOptions.includes(mes)) {
      setMes(monthOptions[monthOptions.length - 1]);
    }
  }, [monthOptions, mes, setMes]);

  // ========= KPIs =========
  const receitaLiquida = useMemo(() => valueAt("receita_liquida", mes, "realizado"), [mes, valueAt]);
  const receitaPrev    = useMemo(() => valueAt("receita_liquida", mes, "previsto"),   [mes, valueAt]);
  const custosTotais   = useMemo(() => valueAt("custos_totais",   mes, "realizado"),  [mes, valueAt]);
  const custosPrev     = useMemo(() => valueAt("custos_totais",   mes, "previsto"),   [mes, valueAt]);
  const ebitda         = useMemo(() => valueAt("ebitda",          mes, "realizado"),  [mes, valueAt]);
  const ebitdaPrev     = useMemo(() => valueAt("ebitda",          mes, "previsto"),   [mes, valueAt]);
  const lucroLiquido   = useMemo(() => valueAt("lucro_liquido",   mes, "realizado"),  [mes, valueAt]);

  const margemEbitda = receitaLiquida ? (ebitda / receitaLiquida) * 100 : 0;

  // ========= Séries por mês (Prev x Real) =========
  const receitaSerie = useMemo(() =>
    months.map((m) => ({
      mes: m.toUpperCase(),
      Previsto:  valueAt("receita_liquida", m, "previsto"),
      Realizado: valueAt("receita_liquida", m, "realizado"),
      Variacao:  valueAt("receita_liquida", m, "realizado") - valueAt("receita_liquida", m, "previsto"),
    })), [months, valueAt]);

  const custosSerie = useMemo(() =>
    months.map((m) => ({
      mes: m.toUpperCase(),
      Previsto:  valueAt("custos_totais", m, "previsto"),
      Realizado: valueAt("custos_totais", m, "realizado"),
      Variacao:  valueAt("custos_totais", m, "realizado") - valueAt("custos_totais", m, "previsto"),
    })), [months, valueAt]);

  const ebitdaSerie = useMemo(() =>
    months.map((m) => ({
      mes: m.toUpperCase(),
      Previsto:  valueAt("ebitda", m, "previsto"),
      Realizado: valueAt("ebitda", m, "realizado"),
      Variacao:  valueAt("ebitda", m, "realizado") - valueAt("ebitda", m, "previsto"),
    })), [months, valueAt]);

  const compReceita = useMemo(() => {
    const serv = valueAt("receitas_servicos", mes, "realizado");
    const rev  = valueAt("receitas_revenda",  mes, "realizado");
    const fab  = valueAt("receitas_fabricacao", mes, "realizado");
    const items = [
      { name: "Serviços",   value: Math.max(0, serv) },
      { name: "Revenda",    value: Math.max(0, rev)  },
      { name: "Fabricação", value: Math.max(0, fab)  },
    ].filter(i => i.value > 0);
    return items.length ? items : [{ name: "Receita Líquida", value: Math.max(0, receitaLiquida) }];
  }, [mes, valueAt, receitaLiquida]);

  const barColor = (x) => (x >= 0 ? C_VAR_POS : C_VAR_NEG);

  // ========= ADIÇÕES: Top 10 Despesas com TOGGLE =========
  // ========= ADIÇÕES (substitua seu bloco atual de helpers de ranking por este) =========

// normaliza PT-BR (tira acentos e baixa)
const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const rows = data?.rows ?? [];

/** Exclusões de totais / cabeçalhos / grupos (AGREGADORES) */
const EXCLUDE_TOTALS = [
  // grandes agregadores
  "faturamento bruto",
  "receita liquida",
  "custos totais",
  "custos operacionais",
  "lucro bruto",
  "lucro operacional",
  "ebitda",
  "resultado",
  "geracao de caixa",
  "kg fabricado",
  "cmv",
  "investimentos",
  "dividendos",
  // grupos de despesas
  "despesas adm",
  "despesas comercial",
  "despesas com logistica",
  "despesas com logística",
];

const looksHeaderPct = (n) => /\(\s*\d+\s*%/.test(n); // ex.: "Despesas Adm (5%)"
const isTotalOrHeader = (name = "") => {
  const n = norm(name);
  if (looksHeaderPct(n)) return true;
  return EXCLUDE_TOTALS.some(k => n.includes(norm(k)));
};

/** Termos típicos de linha DETALHADA de despesa */
const INCLUDE_EXP_TERMS = [
  // administrativos/operacionais comuns
  "salario","salarios","comissao","comissoes","consultoria","assessoria",
  "contabilidade","material","escritorio","escritório","seguranca","segurança",
  "monitoramento","seguros","marketing","campanha","frete","aluguel","aluguéis",
  "manutencao","manutenção","viagem","depreciacao","depreciação",
  // exemplo do seu print de Custos Operacionais
  "ggf","agua","água","esgoto","aluguéis","imoveis","imóveis","veiculos","veículos",
  "infraestrutura","terceirizada","maquinas","máquinas","equipamentos",
  "uso e consumo","servico de limpeza","serviço de limpeza",
  "laboratorio","laboratório","quimico","químico",
  "taxas","licencas","licenças","iptu"
];

const looksLikeExpenseDetail = (name = "") => {
  const n = norm(name);
  return INCLUDE_EXP_TERMS.some(k => n.includes(norm(k)));
};

/** Top 10 AGREGADAS (remove receitas, mas aceita grupos) */
const REVENUE_KW = ["receita","faturamento","venda","revenda","servico","serviço","fabricacao","fabricação","vendas"];
const isLikelyExpense = (name = "") =>
  !REVENUE_KW.some(k => norm(name).includes(norm(k)));

const topDespesasAgregadas = useMemo(() => {
  if (!mes || !rows.length) return [];
  return rows
  .map((r) => {
    const prev = Number(r.valuesPrevisto?.[mes] ?? 0);
    const real = Number(r.valuesRealizado?.[mes] ?? 0);
    return {
      name: r.name,
      label: r.name?.length > 42 ? r.name.slice(0, 39) + "..." : r.name,
      Previsto: prev,
      Realizado: real,
      absReal: Math.abs(real),
    };
  })

    .filter(d => d.absReal > 0 && isLikelyExpense(d.name))
    .sort((a, b) => b.absReal - a.absReal)
    .slice(0, 10);
}, [rows, mes, valueAt]);

/** Top 10 DETALHADAS (exclui agregadores e prioriza termos de despesa) */
const topDespesasDetalhadas = useMemo(() => {
  if (!mes || !rows.length) return [];
  const items = rows
  .map((r) => {
    const prev = Number(r.valuesPrevisto?.[mes] ?? 0);
    const real = Number(r.valuesRealizado?.[mes] ?? 0);
    return {
      name: r.name,
      label: r.name?.length > 42 ? r.name.slice(0, 39) + "..." : r.name,
      Previsto: prev,
      Realizado: real,
      absReal: Math.abs(real),
      isDetail: looksLikeExpenseDetail(r.name),
    };
  })

    .filter(d => d.absReal > 0 && !isTotalOrHeader(d.name));

  // detalhes primeiro; depois maior valor
  items.sort((a, b) => {
    if (a.isDetail !== b.isDetail) return a.isDetail ? -1 : 1;
    return b.absReal - a.absReal;
  });

  return items.slice(0, 10);
}, [rows, mes, valueAt]);

// estado e dataset do toggle (mantém igual ao seu)
const [rankMode, setRankMode] = useState("agregadas"); // "agregadas" | "detalhadas"
const chartDataset = rankMode === "detalhadas" ? topDespesasDetalhadas : topDespesasAgregadas;


  return (
    <div className="dre-page bg-gray-50">
      {/* Top bar: seletor compartilhado */}
      <div className="dre-toolbar">
        <div />
        <div className="dre-select">
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            {(monthOptions ?? months).map((m) => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <section className="dre-cards dre-cards-3col">
        <div className="dre-card">
          <h4>Receita Líquida</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(receitaPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(receitaLiquida)}</b></div>
          <div className={`dre-delta ${(receitaLiquida - receitaPrev) >= 0 ? "pos" : "neg"}`}>
            Δ {money(receitaLiquida - receitaPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>Custos Totais</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(custosPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(custosTotais)}</b></div>
          <div className={`dre-delta ${(custosTotais - custosPrev) <= 0 ? "pos" : "neg"}`}>
            Δ {money(custosTotais - custosPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>EBITDA</h4>
          <div className="dre-row"><span>Prev.</span><b>{money(ebitdaPrev)}</b></div>
          <div className="dre-row"><span>Real.</span><b>{money(ebitda)}</b></div>
          <div className={`dre-delta ${(ebitda - ebitdaPrev) >= 0 ? "pos" : "neg"}`}>
            Δ {money(ebitda - ebitdaPrev)}
          </div>
        </div>

        <div className="dre-card">
          <h4>Margem EBITDA</h4>
          <div className="dre-card-value">{margemEbitda.toFixed(1)}%</div>
        </div>
      </section>

      {/* Linhas: Prev x Real */}
      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Receita — Previsto x Realizado</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={receitaSerie}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="Previsto"  stroke={C_PREV} dot />
              <Line type="monotone" dataKey="Realizado" stroke={C_REAL} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="dre-panel">
          <h3>EBITDA — Previsto x Realizado</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={ebitdaSerie}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Line type="monotone" dataKey="Previsto"  stroke={C_PREV} dot />
              <Line type="monotone" dataKey="Realizado" stroke={C_REAL} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Barras agrupadas + Variação */}
      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Receita — Barras (Prev x Real)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={receitaSerie}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Previsto"  fill={C_PREV} />
              <Bar dataKey="Realizado" fill={C_REAL} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dre-panel">
          <h3>Variação da Receita (Real − Prev)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={receitaSerie}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="Variacao" name="Δ (R$)">
                {receitaSerie.map((d, i) => (
                  <Cell key={i} fill={barColor(d.Variacao)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Composição da Receita (pizza) */}
      <section className="dre-grid">
        <div className="dre-panel">
          <h3>Composição da Receita (Realizado)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip formatter={(v) => money(v)} />
              <Pie data={compReceita} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2}>
                {compReceita.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== Top 10 Despesas com Toggle ===== */}
      <section className="dre-grid">
        <div className="dre-panel">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h3 style={{margin:0}}>
              Top 10 Despesas — {rankMode === "detalhadas" ? "Detalhadas" : "Agregadas"} ({mes?.toUpperCase?.() || "-"})
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

          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={chartDataset}
              layout="vertical"
              margin={{ left: 20, right: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="label" width={260} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Previsto"  fill={C_PREV} />
              <Bar dataKey="Realizado" fill={C_REAL} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
