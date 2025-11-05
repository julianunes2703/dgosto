import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

// ===== utils =====
const cleanHeader = (h) =>
  (h || "")
    .replace(/\u00A0/g, " ")     // NBSP -> espaço normal
    .replace(/\s+/g, " ")        // colapsa múltiplos espaços
    .trim();

function parseNumberBR(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v)
    .replace(/\s+/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "") // remove milhar
    .replace(",", ".");                  // vírgula decimal
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// datas sempre em UTC
function parseFlexDateUTC(s) {
  if (!s) return null;
  const t = String(s).trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(`${t}T00:00:00Z`);

  // dd/mm/yyyy ou mm/dd/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) {
    const [a, b, c] = t.split("/").map(Number);
    const yyyy = c < 100 ? 2000 + c : c;
    const dd = a > 12 ? a : b; // se primeiro > 12 => dd/mm
    const mm = a > 12 ? b : a; // senão => mm/dd
    return new Date(Date.UTC(yyyy, mm - 1, dd));
  }

  const d = new Date(t);
  if (Number.isNaN(+d)) return null;
  // normaliza 00:00Z
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function findCol(headers, aliases) {
  // match exato após limpeza
  for (const a of aliases) {
    const cleaned = cleanHeader(a);
    const hit = headers.find((h) => cleanHeader(h) === cleaned);
    if (hit) return hit;
  }
  // match “contém” (fallback)
  for (const h of headers) {
    const H = cleanHeader(h).toLowerCase();
    for (const a of aliases) {
      const A = cleanHeader(a).toLowerCase();
      if (H.includes(A)) return h;
    }
  }
  return null;
}

// ===== hook =====
export default function useFaturadoCsv(url, { startISO, endISO, schema }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState(null);
  const [colsInfo, setColsInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!url) return;
      setLoading(true); setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();

 // ---- CORTE DE PRÓLOGO: pega a partir do cabeçalho real (genérico) ----
      const normalized = text.replace(/\r\n/g, "\n");
      const lines = normalized.split("\n");

      // aliases para detectar a linha de cabeçalho
      const groupHints = [
        "Nome Parceiro", "Parceiro", "Cliente",
        "Apelido (Vendedor)", "Vendedor",
        "Descrição"
      ];
      const valueHints = [
        "Vlr. Nota", "Vlr. Vendas", "Vlr. Pedido",
        "Valor Nota", "Valor Venda", "Total do Pedido",
        "Valor", "Total", "Vlr"
      ];

      let startIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        const L = lines[i].trim();
        if (!L) continue;

        const low = L.toLowerCase();
        const hasGroup = groupHints.some(h => low.includes(h.toLowerCase()));
        const hasValue = valueHints.some(h => low.includes(h.toLowerCase()));
        const isCodigoDescricao = /^c[oó]digo\s*,\s*descri[cç][aã]o/i.test(L);

        if ((hasGroup && hasValue) || isCodigoDescricao) {
          startIdx = i;
          break;
        }
      }
      const csvToParse = lines.slice(startIdx).join("\n");

      const parsed = Papa.parse(csvToParse, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: "greedy",
        transformHeader: cleanHeader,
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

    // aliases robustos
    const groupColAliases = [
      schema?.groupCol || "Nome Parceiro (Parceiro)",
      "Nome Parceiro",
      "Parceiro",
      "Cliente",
    ];
    const valueColAliases = [
      schema?.valueCol || "Vlr. Nota",
      "Vlr. Pedido",
      "Valor Nota",
      "Valor",
      "Total",
      "Vlr",
    ];
    const dateColAliases = [
      schema?.dateCol || "Dt. Neg.",
      "Data do Pedido",
      "Data",
      "Dt",
    ];

    const groupCol = findCol(headers, groupColAliases);
    const valueCol = findCol(headers, valueColAliases);
    const dateCol  = findCol(headers, dateColAliases);

    setColsInfo({ groupCol, valueCol, dateCol });

    // logs úteis
    /* eslint-disable no-console */
    console.log("[FaturadoCsv] headers:", headers);
    console.log("[FaturadoCsv] cols:", { groupCol, valueCol, dateCol });

    const di = startISO ? new Date(`${startISO}T00:00:00Z`) : null;
    const df = endISO   ? new Date(`${endISO}T23:59:59Z`) : null;

    const map = new Map();
    let total = 0;
    let lidos = 0, noDate = 0, fora = 0;

    for (const r of rows) {
      lidos++;

      // filtro por data (se houver coluna)
      if (dateCol && (di || df)) {
        const d = parseFlexDateUTC(r[dateCol]);
        if (!d) { noDate++; continue; }
        if (di && d < di) { fora++; continue; }
        if (df && d > df) { fora++; continue; }
      }

      const keyRaw = groupCol ? r[groupCol] : null;
      const key = (keyRaw == null || String(keyRaw).trim() === "") ? "—" : String(keyRaw).trim();
      const v = parseNumberBR(valueCol ? r[valueCol] : 0);
      total += v;
      map.set(key, (map.get(key) || 0) + v);
    }

    console.log("[FaturadoCsv] lidos:", lidos, "noDate:", noDate, "foraIntervalo:", fora, "grupos:", map.size, "total:", total);

    const by = [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { top10: by.slice(0, 10), total, byGroup: by };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, startISO, endISO, JSON.stringify(schema), headers.join("|")]);

  return { loading, error, headers, rows, top10, total, byGroup, colsInfo };
}
