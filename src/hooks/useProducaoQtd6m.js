import { useEffect, useMemo, useState } from 'react';

/* ===== Helpers ===== */

const toNumberBR = (v) => {
  if (v == null || v === '') return 0;
  const s = String(v).trim();
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
};
const clean = (s) => String(s ?? '').trim();

function parseLoteToDateISO(lote) {
  if (!lote) return undefined;
  const digits = String(lote).replace(/\D/g, '');
  // ddmmaaaa [+ qualquer sufixo]
  if (digits.length >= 8) {
    const dd = digits.slice(0,2), mm = digits.slice(2,4), yyyy = digits.slice(4,8);
    const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
    return d.toISOString().slice(0,10);
  }
  // ddmmaa
  if (digits.length === 6) {
    const dd = digits.slice(0,2), mm = digits.slice(2,4), aa = digits.slice(4,6);
    const yyyy = 2000 + +aa;
    const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
    return d.toISOString().slice(0,10);
  }
  return undefined;
}

const monthIdFromISO = (iso) => (iso ? iso.slice(0, 7) : undefined);


/* ===== CSV parsing robusto ===== */

const detectSep = (text) => {
  const first = (text.split(/\r?\n/).find(l => l.trim().length) || '');
  if (first.includes('\t')) return '\t';
  const comma = (first.match(/,/g) || []).length;
  const semi  = (first.match(/;/g) || []).length;
  return semi > comma ? ';' : ',';
};

function splitCSVLine(line, sep) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
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
  // procura nas primeiras 30 linhas um header com as colunas chave
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
    // ignora linhas totalmente vazias
    if (Object.values(o).every(v => !String(v).trim())) continue;
    rows.push(o);
  }
  return { headers, rows };
}

/* ===== Hook principal ===== */

export function useProducaoQtdUltimos6Meses(linkCSV) {
  const [loading, setLoading] = useState(true);
  const [rowsAll, setRowsAll] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!linkCSV) {
          console.warn('[qtd] linkCSV vazio');
          setRowsAll([]);
          return;
        }
        const res = await fetch(linkCSV);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const { headers, rows } = parseCSVSmart(text);

        const hDesc = headers.find(h => /descri/i.test(h));
        const hUni  = headers.find(h => /unid|unidade|um\b/i.test(h));
        const hQtd  = headers.find(h => /quant|qtd/i.test(h));
        const hLote = headers.find(h => /lote/i.test(h));
        const hProc = headers.find(h => /processo/i.test(h));

        const parsed = rows.map((r) => {
          const produto = clean(r[hDesc]);
          const unidade = clean(r[hUni]);
          const qtd     = toNumberBR(r[hQtd]);
          const processo= clean(r[hProc]);
          const lote    = r[hLote];
          const data_iso= parseLoteToDateISO(lote);
          const month_id= monthIdFromISO(data_iso);
          return { produto, unidade, qtd, processo, lote, data_iso, month_id };
       }).filter(r => r.qtd > 0 && r.produto);

        setRowsAll(parsed);
      } catch (e) {
        console.error('[producao qtd] erro ao buscar/parsear:', e);
        setRowsAll([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [linkCSV]);

  // últimos 6 meses
 const rows = rowsAll;

  const { totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados } = useMemo(() => {
    let totalQtd = 0;
    const byProd = new Map();
    const byMes = new Map();
    const byProdMes = new Map();
    const mesesSet = new Set();

    for (const r of rows) {
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
      .sort((a,b) => b.qtd - a.qtd);

    const porMes = Array.from(byMes.entries())
      .map(([mes_id, qtd]) => ({ mes_id, qtd }))
      .sort((a,b) => a.mes_id.localeCompare(b.mes_id));

    const porProdutoMes = {};
    for (const [key, qtd] of byProdMes.entries()) {
      const [produto, mes_id] = key.split('||');
      porProdutoMes[produto] ??= [];
      porProdutoMes[produto].push({ mes_id, qtd });
    }
    for (const p in porProdutoMes) porProdutoMes[p].sort((a,b)=>a.mes_id.localeCompare(b.mes_id));

    const mesesOrdenados = Array.from(mesesSet).sort();

    return { totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados };
  }, [rows]);

  return { loading, rows, totalQtd, porProduto, porMes, porProdutoMes, mesesOrdenados };
}

export default useProducaoQtdUltimos6Meses;
