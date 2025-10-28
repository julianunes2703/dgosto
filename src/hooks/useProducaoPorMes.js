// hooks/useProducaoQtdFromMonthlyCSVs.js
import { useEffect, useMemo, useState } from 'react';

/* helpers */
const toNumberBR = (v) => {
  if (v == null || v === '') return 0;
  const s = String(v).trim();
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
};
const clean = (s) => String(s ?? '').trim();

function parseLoteToDateISO(lote) {
  if (!lote) return undefined;
  const digits = String(lote).replace(/\D/g, '');
  const mk = (yyyy, mm, dd) => {
    const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
    return d.toISOString().slice(0,10);
  };
  if (digits.length >= 8) {
    const dd = digits.slice(0,2), mm = digits.slice(2,4), yyyy = digits.slice(4,8);
    if (+yyyy >= 2024 && +yyyy <= 2026) return mk(yyyy, mm, dd);
    return undefined;
  }
  if (digits.length === 6) {
    const dd = digits.slice(0,2), mm = digits.slice(2,4), aa = digits.slice(4,6);
    const yyyy = 2000 + +aa;
    if (yyyy >= 2024 && yyyy <= 2026) return mk(yyyy, mm, dd);
    return undefined;
  }
  return undefined;
}
const monthIdFromISO = (iso) => (iso ? iso.slice(0,7) : undefined);

const detectSep = (text) => {
  const first = (text.split(/\r?\n/).find(l => l.trim().length) || '');
  if (first.includes('\t')) return '\t';
  const comma = (first.match(/,/g) || []).length;
  const semi  = (first.match(/;/g) || []).length;
  return semi > comma ? ';' : ',';
};
function splitCSVLine(line, sep) {
  const out = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i+1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === sep) { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}
function findHeaderIdx(lines, sep) {
  const maxProbe = Math.min(lines.length, 30);
  let bestIdx = -1, bestScore = -1;
  for (let i = 0; i < maxProbe; i++) {
    const cols = splitCSVLine(lines[i], sep).map(c => c.trim().toLowerCase());
    let score = 0;
    if (cols.some(c => /descri/.test(c))) score += 2;
    if (cols.some(c => /quant|qtd/.test(c))) score += 2;
    if (cols.some(c => /lote/.test(c))) score += 2;
    if (cols.some(c => /unid|unidade|um\b/.test(c))) score += 1;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx >= 0 ? bestIdx : 0;
}
function parseCSVSmart(text) {
  const sep = detectSep(text);
  const rawLines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length);
  const headerIdx = findHeaderIdx(rawLines, sep);
  const headers = splitCSVLine(rawLines[headerIdx], sep).map(h => h.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < rawLines.length; i++) {
    const cols = splitCSVLine(rawLines[i], sep);
    const o = {};
    for (let k = 0; k < headers.length; k++) o[headers[k]] = (cols[k] ?? '').trim();
    if (Object.values(o).every(v => !String(v).trim())) continue;
    rows.push(o);
  }
  return { headers, rows };
}

/* ===== hook ===== */
export default function useProducaoQtdFromMonthlyCSVs(monthUrlMap) {
  const [loading, setLoading] = useState(true);
  const [rowsAll, setRowsAll] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const entries = Object.entries(monthUrlMap)
          .filter(([, url]) => !!url)
          .sort((a, b) => a[0].localeCompare(b[0]));
        const allowedMonths = new Set(entries.map(([m]) => m));

        const texts = await Promise.all(entries.map(async ([, url]) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
          return res.text();
        }));

        const merged = [];
        const seen = new Set(); // DEDUPE GLOBAL

        for (let i = 0; i < entries.length; i++) {
          const [monthId] = entries[i];
          const { headers, rows } = parseCSVSmart(texts[i]);

          const hDesc = headers.find(h => /descri/i.test(h));
          const hUni  = headers.find(h => /unid|unidade|um\b/i.test(h));

          // quantidade mais segura (evita total/geral/acum/subtotal)
          const hQtdCandidates = headers.filter(h => /quantidade|qtd\b/i.test(h));
          const hQtd =
            hQtdCandidates.find(h => !/total|geral|acum|subtotal/i.test(h)) ||
            headers.find(h => /quant|qtd/i.test(h)) ||
            hQtdCandidates[0];

          const hLote = headers.find(h => /lote/i.test(h));
          const hProc = headers.find(h => /processo/i.test(h));

          for (const r of rows) {
            const produto = clean(hDesc ? r[hDesc] : '');
            const unidade = clean(hUni ? r[hUni] : '');
            const qtd     = toNumberBR(hQtd ? r[hQtd] : '');
            const processo= clean(hProc ? r[hProc] : '');
            const lote    = hLote ? r[hLote] : '';
            const data_iso= parseLoteToDateISO(lote);

            const fromLote = monthIdFromISO(data_iso);
            // ✅ PRIORIDADE: mês da aba; só usa do lote se estiver permitido
            const month_id = (fromLote && allowedMonths.has(fromLote)) ? fromLote : monthId;

            // ignora TOTAL/SUBTOTAL
            const isTotalRow = /^total\b|^subtotal\b/i.test(produto);

            // DEDUPE
            const key = [produto, unidade, processo, lote, month_id].join('||');
            if (seen.has(key)) continue;
            seen.add(key);

            if (!isTotalRow && qtd > 0 && produto && allowedMonths.has(month_id)) {
              merged.push({ produto, unidade, qtd, processo, lote, data_iso, month_id });
            }
          }
        }
        setRowsAll(merged);
      } catch (e) {
        console.error('[producao qtd] multi-CSV erro:', e);
        setRowsAll([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(monthUrlMap)]);

  const { totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados } = useMemo(() => {
    let totalQtd = 0;
    const byProd = new Map();
    const byMes  = new Map();
    const byProdMes = new Map();
    const mesesSet = new Set();

    for (const r of rowsAll) {
      totalQtd += r.qtd;
      const prod = r.produto;
      const mes  = r.month_id;
      if (!prod || !mes) continue;
      byProd.set(prod, (byProd.get(prod) || 0) + r.qtd);
      byMes.set(mes, (byMes.get(mes) || 0) + r.qtd);
      mesesSet.add(mes);
      const key = prod + '||' + mes;
      byProdMes.set(key, (byProdMes.get(key) || 0) + r.qtd);
    }

    const porProduto = Array.from(byProd.entries())
      .map(([produto, qtd]) => ({ produto, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    const porMes = Array.from(byMes.entries())
      .map(([mes_id, qtd]) => ({ mes_id, qtd }))
      .sort((a, b) => a.mes_id.localeCompare(b.mes_id));

    const porProdutoMes = {};
    for (const [key, qtd] of byProdMes.entries()) {
      const [produto, mes_id] = key.split('||');
      (porProdutoMes[produto] ??= []).push({ mes_id, qtd });
    }
    for (const p in porProdutoMes) porProdutoMes[p].sort((a, b) => a.mes_id.localeCompare(b.mes_id));

    const mesesOrdenados = Array.from(mesesSet).sort();

    return { totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados };
  }, [rowsAll]);

  return { loading, rows: rowsAll, totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados };
}
