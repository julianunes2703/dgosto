import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import "./CompareDRECompetencia.css";

// paleta bordô
const C_DRE  = "#7a1c1c";
const C_COMP = "#c24a4a";

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const pct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

// normalizador PT-BR
const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function CompareDRECompetencia({
  dre,                 // retorno do useDREData(DRE_URL)
  comp,                // retorno do useDREData(COMP_URL)
  mes: mesProp,        // mês opcional (ex.: vindo do seletor global)
  setMes,              // opcional, se quiser selecionar aqui
}) {
  const [metric, setMetric] = useState("realizado"); // "realizado" | "previsto"

  // mês padrão = interseção dos dois
  const commonMonths = useMemo(() => {
    if (!dre?.months?.length || !comp?.months?.length) return dre?.months ?? [];
    return dre.months.filter((m) => comp.months.includes(m));
  }, [dre?.months, comp?.months]);

  const [mesLocal, setMesLocal] = useState(null);
  const mes = mesProp ?? mesLocal;

  useEffect(() => {
    if (!mesProp) {
      const base = commonMonths?.length ? commonMonths : dre?.months ?? [];
      if (base.length) setMesLocal(base[base.length - 1]);
    }
  }, [mesProp, commonMonths, dre?.months]);

  // atalhos de leitura
  const vD = (keyOrName, m) => readValue(dre, keyOrName, m, metric);
  const vC = (keyOrName, m) => readValue(comp, keyOrName, m, metric);

  // mapeamento de linhas comuns (por chave normalizada do nome)
  const pairs = useMemo(() => {
    const mapComp = new Map();
    (comp?.rows ?? []).forEach((r) => mapComp.set(norm(r.name), r));
    const out = [];
    (dre?.rows ?? []).forEach((r) => {
      const peer = mapComp.get(norm(r.name));
      if (peer) out.push([r, peer]);
    });
    return out;
  }, [dre?.rows, comp?.rows]);

  // tabela base com difs
  const table = useMemo(() => {
    if (!mes) return [];
    return pairs.map(([rDre]) => {
      const name = rDre.name;
      const dreVal  = vD(rDre.key, mes);
      const compVal = vC(name, mes); // procura por nome no dataset da competência
      const delta = dreVal - compVal;
      const base  = Math.abs(compVal) > 1e-9 ? (delta / compVal) * 100 : 0;

      return {
        conta: name,
        dre: dreVal,
        comp: compVal,
        delta,
        deltaPct: base,
        label: name.length > 42 ? name.slice(0, 39) + "..." : name,
        absDelta: Math.abs(delta),
      };
    })
    // só mantém linhas em que pelo menos um lado tenha valor
    .filter(r => Math.abs(r.dre) + Math.abs(r.comp) > 0)
    // ordena por maior divergência
    .sort((a,b) => b.absDelta - a.absDelta);
  }, [pairs, mes, metric, vD, vC]);

  const topChart = useMemo(() => table.slice(0, 12), [table]);

  // KPIs que costumam existir nos dois
  const kpis = useMemo(() => {
    const keys = ["receita_liquida", "custos_totais", "ebitda"];
    return keys.map((k) => {
      const name =
        k === "receita_liquida" ? "Receita Líquida" :
        k === "custos_totais"   ? "Custos Totais"   :
        "EBITDA";
      const dreVal  = vD(k, mes);
      const compVal = vC(k, mes);
      const delta = dreVal - compVal;
      const good  = (k === "custos_totais") ? delta <= 0 : delta >= 0; // custo menor é bom
      return { key: k, name, dreVal, compVal, delta, good };
    });
  }, [mes, metric, vD, vC]);

  if (!mes) {
    return <div className="cmp-card cmp-empty">Selecione uma competência.</div>;
  }

  return (
    <div className="cmp-page">
      {/* Header + seletor local (se não houver seletor global) */}
      <div className="cmp-toolbar">
        <div className="cmp-title">
          <h2>Comparativo DRE × Competência</h2>
          <small>{metric === "realizado" ? "Realizado" : "Previsto"} — {mes.toUpperCase()}</small>
        </div>

        <div className="cmp-controls">
          {!mesProp && (
            <select value={mes} onChange={(e) => (setMes ? setMes(e.target.value) : setMesLocal(e.target.value))}>
              {commonMonths.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
          )}
          <div className="cmp-toggle">
            <button
              className={metric === "realizado" ? "active" : ""}
              onClick={() => setMetric("realizado")}
            >
              Realizado
            </button>
            <button
              className={metric === "previsto" ? "active" : ""}
              onClick={() => setMetric("previsto")}
            >
              Previsto
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="cmp-kpis">
        {kpis.map((k) => (
          <div key={k.key} className="cmp-card">
            <h4>{k.name}</h4>
            <div className="row">
              <span>DRE</span><b>{money(k.dreVal)}</b>
            </div>
            <div className="row">
              <span>Competência</span><b>{money(k.compVal)}</b>
            </div>
            <div className={`delta ${k.good ? "pos" : "neg"}`}>
              Δ {money(k.delta)}
            </div>
          </div>
        ))}
      </section>

      {/* Tabela top divergências */}
      <section className="cmp-grid">
        <div className="cmp-panel">
          <h3>Maiores divergências por conta</h3>
          <div className="cmp-table-wrap">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>DRE</th>
                  <th>Competência</th>
                  <th>Δ (R$)</th>
                  <th>Δ (%)</th>
                </tr>
              </thead>
              <tbody>
                {table.slice(0, 30).map((r, i) => (
                  <tr key={r.conta + i}>
                    <td className="conta">{r.conta}</td>
                    <td>{money(r.dre)}</td>
                    <td>{money(r.comp)}</td>
                    <td className={r.delta >= 0 ? "pos" : "neg"}>{money(r.delta)}</td>
                    <td className={r.delta >= 0 ? "pos" : "neg"}>{pct(r.deltaPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico horizontal */}
        <div className="cmp-panel">
          <h3>Top 12 divergências (DRE − Competência)</h3>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={topChart} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="label" width={280} />
              <Tooltip formatter={(v) => money(v)} />
              <Legend />
              <Bar dataKey="comp" name="Competência" fill={C_COMP} />
              <Bar dataKey="dre"  name="DRE"         fill={C_DRE} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

/** util: lê valor por key (se existir) ou tenta por nome normalizado */
function readValue(dataset, keyOrName, mes, tipo) {
  if (!dataset) return 0;
  const { rows = [], valueAt } = dataset;
  // 1) tenta por key nos aliases tradicionais
  const v = valueAt?.(keyOrName, mes, tipo);
  if (typeof v === "number" && !Number.isNaN(v) && v !== 0) return v;

  // 2) se falhar, tenta achar por nome normalizado
  const target = norm(String(keyOrName));
  const row = rows.find((r) => norm(r.name) === target || norm(r.key) === target);
  if (!row) return 0;

  const bag = (tipo === "previsto" ? row.valuesPrevisto : row.valuesRealizado) || {};
  return Number(bag?.[mes] || 0);
}
