import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

function parseNumberBR(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v)
    .replace(/\s+/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// aceita "yyyy-mm-dd", "dd/mm/yyyy" ou "mm/dd/yyyy"
function parseFlexDate(s) {
  if (!s) return null;
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return new Date(t);
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) {
    const [a, b, c] = t.split("/").map(Number);
    // se primeiro > 12, assume dd/mm
    if (a > 12) return new Date(c < 100 ? 2000 + c : c, b - 1, a);
    // senão assume mm/dd
    return new Date(c < 100 ? 2000 + c : c, a - 1, b);
  }
  const d = new Date(t);
  return Number.isNaN(+d) ? null : d;
}

export default function useFaturadoCsv(url, { startISO, endISO, schema }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!url) return;
      setLoading(true); setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: "greedy",
          transformHeader: (h) => (h || "").toString().trim(),
        });
        if (!alive) return;
        setHeaders(parsed.meta.fields || []);
        setRows((parsed.data || []).filter((r) => Object.keys(r).length));
      } catch (e) {
        if (!alive) return;
        setError(e); setRows([]); setHeaders([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [url]);

  const { top10, total, byGroup } = useMemo(() => {
    if (!rows.length) return { top10: [], total: 0, byGroup: [] };
    const groupCol = schema?.groupCol || "Nome Parceiro (Parceiro)";
    const valueCol = schema?.valueCol || "Vlr. Nota";
    const dateCol  = schema?.dateCol  || "Dt. Neg.";

    const di = startISO ? new Date(startISO) : null;
    const df = endISO ? new Date(endISO) : null;

    const map = new Map();
    for (const r of rows) {
      // filtro por data
      if (dateCol && (di || df)) {
        const d = parseFlexDate(r[dateCol]);
        if (d) {
          if (di && d < di) continue;
          if (df && d > df) continue;
        }
      }
      const key = (r[groupCol] ?? "—") || "—";
      const v = parseNumberBR(r[valueCol]);
      map.set(key, (map.get(key) || 0) + v);
    }

    const by = [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const tot = by.reduce((acc, r) => acc + (Number(r.value) || 0), 0);
    return { top10: by.slice(0, 10), total: tot, byGroup: by };
  }, [rows, startISO, endISO, schema]);

  return { loading, error, headers, rows, top10, total, byGroup };
}
