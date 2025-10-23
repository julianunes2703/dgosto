import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell,
} from "recharts";
import "./Competencia.css";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
const num = (v) => Number(v) || 0;
const label42 = (s = "") => (String(s).length > 42 ? String(s).slice(0, 39) + "..." : String(s));
const norm = (s="") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

export default function CompetenciaResumoAnual({ data, monthsOverride }) {
  const { months = [], rows = [], valueAt } = data || {};

  // meses base (lower + sem duplicatas)
  const meses = useMemo(() => {
    const base = (monthsOverride?.length ? monthsOverride : months) || [];
    return Array.from(new Set(base.map((m) => String(m || "").toLowerCase())));
  }, [monthsOverride, months]);

  // considerar médias só nos meses com receita_liquida(realizado) > 0
  const mesesValidos = useMemo(() => {
    return meses.filter((m) => num(valueAt?.("receita_liquida", m, "realizado")) > 0);
  }, [meses, valueAt]);

  const mesesParaMedia = mesesValidos.length ? mesesValidos : meses; // fallback
  const nMesesMedia = mesesParaMedia.length || 1;

  // ===== helpers para achar chave por nome (p/ "Receita de Venda Redes de Supermercados")
  const findKeyByExactName = (wantedName = "") => {
    const t = norm(wantedName);
    const hit = rows.find(r => norm(r?.name || "") === t);
    return hit?.key || null;
  };

  // ===== agregadores
  const sumMetricAno = (keyOrName, tipo) => {
    // tenta chave direta; se não, tenta por nome de linha
    let key = keyOrName;
    if (!key || key.includes(" ")) key = findKeyByExactName(keyOrName) || keyOrName;
    return meses.reduce((acc, m) => acc + num(valueAt?.(key, m, tipo)), 0);
  };

  // agrega por CONTA (linha) — mantido do seu componente anterior
  const linhas = useMemo(() => {
    if (!rows.length) return [];
    return rows.map((r) => {
      // totais do ano (sobre TODOS os meses carregados)
      let prevAno = 0, realAno = 0;
      for (const m of meses) {
        prevAno += num(valueAt?.(r.key, m, "previsto"));
        realAno += num(valueAt?.(r.key, m, "realizado"));
      }
      const deltaAno = realAno - prevAno;

      // médias mensais (só mesesParaMedia)
      let prevSum = 0, realSum = 0;
      for (const m of mesesParaMedia) {
        prevSum += num(valueAt?.(r.key, m, "previsto"));
        realSum += num(valueAt?.(r.key, m, "realizado"));
      }
      const previstoMedio = prevSum / nMesesMedia;
      const realizadoMedio = realSum / nMesesMedia;
      const deltaMedio = realizadoMedio - previstoMedio;

      return {
        key: r.key,
        conta: r.name,
        label: label42(r.name),
        prevAno, realAno, deltaAno,
        previstoMedio, realizadoMedio, deltaMedio,
      };
    });
  }, [rows, meses, mesesParaMedia, nMesesMedia, valueAt]);

  // ===== NOVO: KPIs de destaque (ano inteiro — Prev/Real/Δ)
  const KPI_META = [
    { label: "Faturamento Bruto", key: "faturamento_bruto" },
    { label: "Receita Líquida", key: "receita_liquida" },
    { label: "Receita de Venda Redes de Supermercados", name: "Receita de Venda Redes de Supermercados" },
    { label: "Custos Totais", key: "custos_totais" },
    { label: "Lucro Bruto", key: "lucro_bruto" },
    { label: "EBITDA", key: "ebitda" },
    { label: "Lucro Líquido", key: "lucro_liquido" },
  ];

  const kpiCards = useMemo(() => {
    return KPI_META.map(meta => {
      const keyOrName = meta.key || meta.name;
      const prevAno = sumMetricAno(keyOrName, "previsto");
      const realAno = sumMetricAno(keyOrName, "realizado");
      return {
        label: meta.label,
        prevAno,
        realAno,
        deltaAno: realAno - prevAno,
      };
    });
  }, [KPI_META, meses, valueAt, rows]); // deps conservadoras

  // Top 10 (acumulado no ano)
  const topAno = useMemo(() => {
    return [...linhas]
      .filter(d => Math.abs(d.deltaAno) > 0)
      .sort((a,b) => Math.abs(b.deltaAno) - Math.abs(a.deltaAno))
      .slice(0, 10)
      .map(d => ({ conta: d.label, Variacao: d.deltaAno }));
  }, [linhas]);

  // Top 10 (média mensal)
  const topMedias = useMemo(() => {
    return [...linhas]
      .filter(d => Math.abs(d.previstoMedio) + Math.abs(d.realizadoMedio) > 0)
      .sort((a,b) => Math.abs(b.deltaMedio) - Math.abs(a.deltaMedio))
      .slice(0, 10)
      .map(d => ({
        conta: d.label,
        PrevistoMedio: d.previstoMedio,
        RealizadoMedio: d.realizadoMedio,
        deltaMedio: d.deltaMedio,
      }));
  }, [linhas]);

  const barColor = (x) => (x >= 0 ? "#22c55e" : "#ef4444");

  // pequenos KPIs agregados (informativos)
  const deltaAnoTotal = useMemo(() => linhas.reduce((acc, d) => acc + d.deltaAno, 0), [linhas]);
  const deltaMedioTotal = useMemo(() => linhas.reduce((acc, d) => acc + d.deltaMedio, 0), [linhas]);

  return (
    <div className="comp-page">
      <div className="comp-header">
        <h2>Resumo Anual — Competência</h2>
        <small>
          Médias calculadas sobre {nMesesMedia} {nMesesMedia === 1 ? "mês" : "meses"} com receita &gt; 0.
        </small>
      </div>

      {/* ===== Destaques do Ano (Prev / Real / Δ) ===== */}
      <div className="comp-kpis" style={{display:"grid", gridTemplateColumns:"repeat(3, minmax(0,1fr))", gap:16, marginBottom:16}}>
        {kpiCards.map((k,i) => (
          <div key={i} className="comp-card" style={{ background:"#fff", borderRadius:12, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
            <h4 style={{margin:"0 0 6px"}}>{k.label}</h4>
            <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", rowGap:4, columnGap:8, fontSize:14}}>
              <span style={{opacity:.7}}>Prev.</span>
              <b>{money(k.prevAno)}</b>
              <span style={{opacity:.7}}>Real.</span>
              <b>{money(k.realAno)}</b>
              <span style={{opacity:.7}}>Δ</span>
              <b className={k.deltaAno >= 0 ? "delta pos" : "delta neg"}>{money(k.deltaAno)}</b>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs agregados auxiliares */}
      <div className="comp-kpis" style={{display:"grid", gridTemplateColumns:"repeat(3, minmax(0,1fr))", gap:16, marginBottom:16}}>
        <div className="comp-card">
          <h4>Desvio Total (Ano)</h4>
          <div className={deltaAnoTotal >= 0 ? "delta pos" : "delta neg"} style={{fontSize:20, fontWeight:700}}>
            {money(deltaAnoTotal)}
          </div>
          <small>Real − Prev (soma das contas)</small>
        </div>
        <div className="comp-card">
          <h4>Desvio Médio Mensal</h4>
          <div className={deltaMedioTotal >= 0 ? "delta pos" : "delta neg"} style={{fontSize:20, fontWeight:700}}>
            {money(deltaMedioTotal)}
          </div>
          <small>Média das diferenças mensais</small>
        </div>
        <div className="comp-card">
          <h4>Meses considerados</h4>
          <div style={{fontSize:20, fontWeight:700}}>{nMesesMedia}</div>
          <small>Critério: receita_liquida (real) &gt; 0</small>
        </div>
      </div>

      {/* Top 10 acumulado no ano */}
      <div className="comp-panel">
        <h3>Top 10 desvios do ano (Real − Prev)</h3>
        {topAno.length === 0 ? (
          <div style={{padding:16, opacity:0.7}}>Sem dados para o período.</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={topAno} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="conta" width={260} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="Variacao" name="Δ (R$)">
                {topAno.map((d, i) => (
                  <Cell key={i} fill={barColor(d.Variacao)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top 10 por média mensal */}
      <div className="comp-panel">
        <h3>Top 10 — Médias mensais (Prev × Real)</h3>
        {topMedias.length === 0 ? (
          <div style={{padding:16, opacity:0.7}}>Sem dados para o período.</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={topMedias} layout="vertical" margin={{ left: 20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="conta" width={260} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="PrevistoMedio"  name="Prev. (média)"  fill="#b83434ff" />
              <Bar dataKey="RealizadoMedio" name="Real. (média)" fill="#000000ff" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
