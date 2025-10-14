import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

const PT_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez","total"];

const normalize = (s) =>
  String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();

const SUBLABELS = {
  previsto: ["previsto", "orcado", "orçado", "budget"],
  realizado: ["realizado", "executado", "actual", "atual"]
};
const isMatch = (label, targets) => targets.some(t => label.includes(normalize(t)));

const toNumber = (raw) => {
  if (raw == null || raw === "" || raw === "-" || raw === "%") return 0;
  let s = String(raw).replace(/[^\d,().-]/g, "");
  const isNeg = /\(.*\)/.test(s) || /^-/.test(s);
  s = s.replace(/[()]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : (isNeg ? -Math.abs(n) : n);
};

/**
 * useDREData(csvUrl)
 * Lê um CSV publicado do Google Sheets (ou outro) e devolve:
 * - months: meses detectados
 * - rows: [{ name, key, valuesPrevisto, valuesRealizado }]
 * - helpers: findRow, valueAt
 */
export function useDREData(csvUrl) {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!csvUrl) { setRows([]); setMonths([]); setLoading(false); setError("URL ausente"); return; }
    (async () => {
      try {
        setLoading(true); setError("");
        const text = await fetch(csvUrl).then((r) => r.text());
        const { data } = Papa.parse(text, { header: false, skipEmptyLines: false });

        // 1) Header de meses
        let headerIdx = -1, header = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i] || [];
          const found = row.reduce((acc, c) => {
            const base = normalize(c);
            const mes = PT_MONTHS.find(m => base.startsWith(m));
            return acc + (mes ? 1 : 0);
          }, 0);
          if (found >= 3) { headerIdx = i; header = row.map((c) => normalize(c)); break; }
        }
        if (headerIdx === -1) { setMonths([]); setRows([]); setLoading(false); setError("Cabeçalho de meses não encontrado"); return; }

        const subHeader = (data[headerIdx + 1] || []).map(c => normalize(c));
        const titleCol = 1;

        // 2) Mapear colunas de Previsto/Realizado por mês
        const monthCols = []; // [{mes, colPrev, colReal}]
        header.forEach((h, idx) => {
          const base = normalize(h);
          const mes = PT_MONTHS.find(m => base.startsWith(m));
          if (mes && mes !== "total") {
            const candidatos = [idx, idx + 1, idx + 2, idx + 3];
            let colPrev = null, colReal = null;
            for (const c of candidatos) {
              const lab = subHeader[c] || "";
              if (!lab) continue;
              if (!colPrev && isMatch(lab, SUBLABELS.previsto)) colPrev = c;
              if (!colReal && isMatch(lab, SUBLABELS.realizado)) colReal = c;
            }
            if (colPrev == null) colPrev = idx + 1;
            if (colReal == null) colReal = idx + 2;
            monthCols.push({ mes, colPrev, colReal });
          }
        });

        // 3) Linhas
        const resultRows = [];
        for (let r = headerIdx + 2; r < data.length; r++) {
          const row = data[r] || [];
          const title = (row[titleCol] || "").toString().trim();
          if (!title) continue;

          const valuesPrevisto = {};
          const valuesRealizado = {};
          monthCols.forEach(({ mes, colPrev, colReal }) => {
            valuesPrevisto[mes]  = toNumber(row[colPrev]);
            valuesRealizado[mes] = toNumber(row[colReal]);
          });

          resultRows.push({
            name: title,
            key: normalize(title).replace(/\s+/g, "_").slice(0, 80),
            valuesPrevisto,
            valuesRealizado,
            values: valuesRealizado, // compat
          });
        }

        setMonths(monthCols.map(m => m.mes));
        setRows(resultRows);
        setLoading(false);
      } catch (e) {
        console.error("Erro ao carregar CSV:", e);
        setRows([]); setMonths([]); setLoading(false); setError(String(e?.message || e));
      }
    })();
  }, [csvUrl]);

  // helpers
  const map = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.key, r));
    return m;
  }, [rows]);

  const aliases = useMemo(() => ({
    faturamento_bruto: ["faturamento bruto"],
    deducoes: ["deducoes"],
    receita_liquida: ["receita liquida"],
    custos_totais: ["custos totais"],
    custos_operacionais: ["custos operacionais"],
    despesas_adm: ["despesas adm"],
    despesas_comercial: ["despesas comercial"],
    despesas_logistica: ["despesas com logistica", "despesas com logística"],
    ebitda: ["ebitda"],
    lucro_operacional: ["lucro operacional (ebit)","lucro operacional ebit"],
    resultado_financeiro: ["resultado financeiro"],
    impostos_sobre_lucro: ["impostos sobre o lucro"],
    lucro_liquido: ["lucro liquido"],
    geracao_caixa: ["geracao de caixa","geração de caixa"],
  }), []);

  const findRow = (aliasKey) => {
    const opts = aliases[aliasKey] || [];
    for (const opt of opts) {
      const k = normalize(opt).replace(/\s+/g, "_");
      if (map.has(k)) return map.get(k);
      for (const [key, obj] of map.entries()) if (key.includes(k)) return obj;
    }
    return null;
  };

  const valueAt = (aliasKey, mes, tipo = "realizado") => {
    const row = findRow(aliasKey);
    if (!row) return 0;
    const bag = tipo === "previsto" ? row.valuesPrevisto : row.valuesRealizado;
    return Number(bag?.[mes] || 0);
  };

  return { rows, months, loading, error, findRow, valueAt };
}
