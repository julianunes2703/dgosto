import React, { useMemo, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import "./DRE.css";

// tons bordô/preto
const C_PREV  = "#b83434ff";
const C_REAL  = "#000000ff";
const PIE_COLORS = ["#a12e2e", "#c24a4a", "#7a1c1c"];
const C_VAR_POS = "#090909ff";
const C_VAR_NEG = "#ef4444";

// helpers
const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const normStr = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const label42 = (s = "") => (s.length > 42 ? s.slice(0, 39) + "..." : s);

// ================== COMPONENTE ==================
export default function DREDashboard({ data, mes, setMes, monthOptions }) {
  const { months = [], valueAt } = data || {};
  const rows = Array.isArray(data?.rows) ? data.rows : [];

  // Normaliza o mês selecionado para lower-case **apenas para leitura**
  const mesKey = (mes || "").toLowerCase();

  // ========== Seletor de mês robusto ==========
  // Gera uma lista de opções sempre em lower nas values (labels em UPPER)
  const monthList = useMemo(() => {
    const base = (monthOptions?.length ? monthOptions : months) || [];
    const asLower = base.map((m) => String(m || "").toLowerCase());
    // remove duplicatas mantendo ordem
    return Array.from(new Set(asLower));
  }, [monthOptions, months]);

  // garante que o select tenha opções e sincroniza valor com a lista
  useEffect(() => {
    if (monthList.length && !monthList.includes(mesKey)) {
      setMes(monthList[monthList.length - 1]); // seta o último mês disponível
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthList.join("|")]); // junta pra evitar warn de dependências

  // ========= KPIs =========
  const receitaLiquida = useMemo(() => valueAt?.("receita_liquida", mesKey, "realizado") ?? 0, [mesKey, valueAt]);
  const receitaPrev    = useMemo(() => valueAt?.("receita_liquida", mesKey, "previsto")   ?? 0, [mesKey, valueAt]);
  const custosTotais   = useMemo(() => valueAt?.("custos_totais",   mesKey, "realizado")  ?? 0, [mesKey, valueAt]);
  const custosPrev     = useMemo(() => valueAt?.("custos_totais",   mesKey, "previsto")   ?? 0, [mesKey, valueAt]);
  const ebitda         = useMemo(() => valueAt?.("ebitda",          mesKey, "realizado")  ?? 0, [mesKey, valueAt]);
  const ebitdaPrev     = useMemo(() => valueAt?.("ebitda",          mesKey, "previsto")   ?? 0, [mesKey, valueAt]);
  const lucroLiquido   = useMemo(() => valueAt?.("lucro_liquido",   mesKey, "realizado")  ?? 0, [mesKey, valueAt]);

  const margemEbitda = receitaLiquida ? (ebitda / receitaLiquida) * 100 : 0;

  // ========= Séries por mês (Prev x Real) =========
  const receitaSerie = useMemo(() =>
    (months || []).map((m) => {
      const k = String(m || "").toLowerCase();
      return {
        mes: String(m || "").toUpperCase(),
        Previsto:  valueAt?.("receita_liquida", k, "previsto")   ?? 0,
        Realizado: valueAt?.("receita_liquida", k, "realizado")  ?? 0,
        Variacao: (valueAt?.("receita_liquida", k, "realizado") ?? 0) - (valueAt?.("receita_liquida", k, "previsto") ?? 0),
      };
    }), [months, valueAt]);

  const custosSerie = useMemo(() =>
    (months || []).map((m) => {
      const k = String(m || "").toLowerCase();
      return {
        mes: String(m || "").toUpperCase(),
        Previsto:  valueAt?.("custos_totais", k, "previsto")   ?? 0,
        Realizado: valueAt?.("custos_totais", k, "realizado")  ?? 0,
        Variacao: (valueAt?.("custos_totais", k, "realizado") ?? 0) - (valueAt?.("custos_totais", k, "previsto") ?? 0),
      };
    }), [months, valueAt]);

  const ebitdaSerie = useMemo(() =>
    (months || []).map((m) => {
      const k = String(m || "").toLowerCase();
      return {
        mes: String(m || "").toUpperCase(),
        Previsto:  valueAt?.("ebitda", k, "previsto")   ?? 0,
        Realizado: valueAt?.("ebitda", k, "realizado")  ?? 0,
        Variacao: (valueAt?.("ebitda", k, "realizado") ?? 0) - (valueAt?.("ebitda", k, "previsto") ?? 0),
      };
    }), [months, valueAt]);

  const compReceita = useMemo(() => {
    const serv = valueAt?.("receitas_servicos", mesKey, "realizado") ?? 0;
    const rev  = valueAt?.("receitas_revenda",  mesKey, "realizado") ?? 0;
    const fab  = valueAt?.("receitas_fabricacao", mesKey, "realizado") ?? 0;
    const items = [
      { name: "Serviços",   value: Math.max(0, serv) },
      { name: "Revenda",    value: Math.max(0, rev)  },
      { name: "Fabricação", value: Math.max(0, fab)  },
    ].filter(i => i.value > 0);
    return items.length ? items : [{ name: "Receita Líquida", value: Math.max(0, receitaLiquida) }];
  }, [mesKey, valueAt, receitaLiquida]);

  const barColor = (x) => (x >= 0 ? C_VAR_POS : C_VAR_NEG);

  // ========= ADIÇÕES: Top 10 Despesas com TOGGLE =========
  // filtros/palavras-chave
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
    "ggf","agua","água","esgoto","aluguéis","imoveis","imóveis","veiculos","veículos",
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
  const isLikelyExpense = (name = "") =>
    !REVENUE_KW.some((k) => normStr(name).includes(normStr(k)));

  // extrai valores de uma linha para o mês atual (funciona com o shape do seu hook)
  const readRowVals = (r, kMes) => {
    const prev = Number(r?.valuesPrevisto?.[kMes] ?? 0);
    const real = Number(r?.valuesRealizado?.[kMes] ?? 0);
    return { prev, real };
  };

  // Top 10 AGREGADAS
  const topDespesasAgregadas = useMemo(() => {
    if (!mesKey || !rows.length) return [];
    return rows
      .map((r) => {
        const { prev, real } = readRowVals(r, mesKey);
        return {
          name: r.name,
          label: label42(r.name || ""),
          Previsto: prev,
          Realizado: real,
          absReal: Math.abs(real),
        };
      })
      .filter((d) => d.absReal > 0 && isLikelyExpense(d.name || ""))
      .sort((a, b) => b.absReal - a.absReal)
      .slice(0, 10);
  }, [rows, mesKey]);

  // Top 10 DETALHADAS
  const topDespesasDetalhadas = useMemo(() => {
    if (!mesKey || !rows.length) return [];
    const items = rows
      .map((r) => {
        const { prev, real } = readRowVals(r, mesKey);
        return {
          name: r.name,
          label: label42(r.name || ""),
          Previsto: prev,
          Realizado: real,
          absReal: Math.abs(real),
          isDetail: looksLikeExpenseDetail(r.name || ""),
        };
      })
      .filter((d) => d.absReal > 0 && !isTotalOrHeader(d.name || ""));

    items.sort((a, b) => {
      if (a.isDetail !== b.isDetail) return a.isDetail ? -1 : 1;
      return b.absReal - a.absReal;
    });

    return items.slice(0, 10);
  }, [rows, mesKey]);

  // estado e dataset do toggle
  const [rankMode, setRankMode] = useState("agregadas"); // "agregadas" | "detalhadas"
  const chartDataset = rankMode === "detalhadas" ? topDespesasDetalhadas : topDespesasAgregadas;

  return (
    <div className="dre-page bg-gray-50">
      {/* Top bar: seletor de mês */}
      <div className="dre-toolbar">
        <div />
        <div className="dre-select">
          <label>Mês</label>
          <select
            value={mesKey}
            onChange={(e) => setMes(e.target.value)} // passa sempre lower-case
          >
            {monthList.map((m) => (
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
              Top 10 Despesas — {rankMode === "detalhadas" ? "Detalhadas" : "Agregadas"} ({(mesKey || "-").toUpperCase()})
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
              Nenhum dado encontrado para {(mesKey || "-").toUpperCase()}.<br/>
              Verifique se <code>data.rows</code> possui valores para esse mês e se os filtros não estão removendo tudo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartDataset} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={260} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
                <Bar dataKey="Previsto"  fill={C_PREV} />
                <Bar dataKey="Realizado" fill={C_REAL} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
