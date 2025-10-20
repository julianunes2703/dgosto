import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toNumber = (raw) => {
  if (raw == null || raw === "" || raw === "-" || raw === "—") return 0;
  let s = String(raw).trim();

  // ignora porcentagens
  if (s.includes("%")) return NaN;

  // remove R$, espaços e símbolos
  s = s.replace(/[R$\s]/g, "");

  // substitui vírgula decimal por ponto
  if (s.includes(",")) s = s.replace(",", ".");

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};


// Abreviações EN → PT
const MONTH_MAP = {
  jan: "jan", feb: "fev", mar: "mar", apr: "abr", may: "mai", jun: "jun",
  jul: "jul", aug: "ago", sep: "set", oct: "out", nov: "nov", dec: "dez"
};

export function useDREData(csvUrl) {
  const [rows, setRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!csvUrl) {
      setRows([]); setMonths([]); setLoading(false); setError("URL ausente");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const text = await fetch(csvUrl).then(r => r.text());
        const { data } = Papa.parse(text, { header: false, skipEmptyLines: false });

        // linha 2 (index 1): datas completas
        const headerDates = data[1] || [];
        // linha 3 (index 2): subcabeçalhos ("Previsto", "Realizado", "%", etc.)
        const subHeader = data[2] || [];

        // identificar colunas onde aparecem meses (nas datas)
        const monthStarts = [];
        for (let i = 0; i < headerDates.length; i++) {
          const txt = normalize(headerDates[i]);
          const match = txt.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/);
          if (match) {
            const mes = MONTH_MAP[match[1]];
            monthStarts.push({ mes, start: i });
          }
        }

        if (!monthStarts.length) throw new Error("Nenhum mês detectado nas datas");

        // localizar colunas previstas/realizadas próximas a cada mês
        const monthCols = [];
        for (let k = 0; k < monthStarts.length; k++) {
          const { mes, start } = monthStarts[k];
          const nextStart = monthStarts[k + 1]?.start || headerDates.length;
          let colPrev = null, colReal = null;

          for (let c = start; c < nextStart; c++) {
            const label = normalize(subHeader[c] || "");
            if (!colPrev && label.includes("previsto")) colPrev = c;
            if (!colReal && label.includes("realizado")) colReal = c;
          }

          // fallback se não achar
          if (colPrev == null) colPrev = start + 1;
          if (colReal == null) colReal = start + 2;

          monthCols.push({ mes, colPrev, colReal });
        }

        // processar linhas de dados (a partir da linha 4 / index 3)
        const resultRows = [];
        for (let r = 3; r < data.length; r++) {
          const row = data[r];
          if (!row) continue;

          const title = String(row[1] ?? "").trim();
          if (!title || normalize(title).includes("dre")) continue;

          const valuesPrevisto = {};
          const valuesRealizado = {};

          monthCols.forEach(({ mes, colPrev, colReal }) => {
            const p = toNumber(row[colPrev]);
            const v = toNumber(row[colReal]);
            valuesPrevisto[mes] = Number.isNaN(p) ? 0 : p;
            valuesRealizado[mes] = Number.isNaN(v) ? 0 : v;
          });

          resultRows.push({
            name: title,
            key: normalize(title).replace(/\s+/g, "_"),
            valuesPrevisto,
            valuesRealizado,
          });
        }

        console.groupCollapsed("📊 Mapeamento de meses/colunas");
        console.table(monthCols.map(m => ({
          MES: m.mes.toUpperCase(),
          Previsto_col: m.colPrev,
          Realizado_col: m.colReal,
        })));
        console.groupEnd();

        setMonths(monthCols.map(m => m.mes.toUpperCase()));
        setRows(resultRows);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError(String(e.message || e));
        setRows([]);
        setMonths([]);
        setLoading(false);
      }
    })();
  }, [csvUrl]);

  const map = useMemo(() => {
    const m = new Map();
    rows.forEach(r => m.set(r.key, r));
    return m;
  }, [rows]);

  const valueAt = (aliasKey, mes, tipo = "realizado") => {
    if (!aliasKey || !mes) return 0;
    const key = normalize(aliasKey).replace(/\s+/g, "_");
    const row = map.get(key);
    if (!row) return 0;
    const bag = tipo === "previsto" ? row.valuesPrevisto : row.valuesRealizado;
    return Number(bag?.[mes.toLowerCase()] || 0);
  };

  return { rows, months, loading, error, valueAt };
}
