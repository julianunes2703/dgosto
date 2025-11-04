import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

function parseNumberBR(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v)
    .replace(/\s+/g, '')
    .replace(/[R$\u00A0]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '') // remove milhares
    .replace(',', '.'); // decimal
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const ALIASES = {
  produto: ['produto','produtos','descrição','descricao','name','item'],
  valor:   ['valor','vlr. vendas','vendas','total','receita','receita líquida','receita liquida'],
  data:    ['data','dt','emissão','emissao'],
};

// tenta localizar a linha de cabeçalho real dentro do CSV bruto
function sliceFromHeader(text) {
  const lines = text.split(/\r?\n/);
  const needleCols = ['Código','Descrição','Vlr. Vendas']; // do teu CSV
  const headerIdx = lines.findIndex(l => {
    const parts = l.split(/,|;/).map(s => s.trim().toLowerCase());
    return needleCols.every(h => parts.includes(h.toLowerCase()));
  });
  if (headerIdx >= 0) {
    return lines.slice(headerIdx).join('\n'); // corta título/preambulo
  }
  return text; // fallback
}

function findCol(headers, wantedList) {
  const lower = headers.map(h => (h||'').toString().trim().toLowerCase());
  for (const w of wantedList) {
    const i = lower.indexOf(w);
    if (i >= 0) return headers[i];
  }
  return null;
}

export default function useRankingProdutosCsv(url, { startISO, endISO, schema } = {}) {
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
        const res = await fetch(url, { cache: 'no-store' });
        const raw = await res.text();

        // remove linhas de título até achar o cabeçalho
        const text = sliceFromHeader(raw);

        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: 'greedy',
          transformHeader: h => (h || '').toString().trim(),
        });

        if (!alive) return;
        setHeaders(parsed.meta.fields || []);
        setRows((parsed.data || []).filter(r => Object.keys(r).length));
      } catch (e) {
        if (!alive) return;
        setError(e);
        setRows([]);
        setHeaders([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [url]);

  const { top10, total } = useMemo(() => {
    if (!rows.length) return { top10: [], total: 0 };

    const hs = headers.length ? headers : Object.keys(rows[0] || {});
    // usa schema (preferido) ou tenta por alias
    const produtoCol = schema?.productCol || findCol(hs, ALIASES.produto) || 'Descrição';
    const valorCol   = schema?.valueCol   || findCol(hs, ALIASES.valor)   || 'Vlr. Vendas';
    const dataCol    = schema?.dateCol    || findCol(hs, ALIASES.data)    || null;

    const di = startISO ? new Date(startISO) : null;
    const df = endISO ? new Date(endISO) : null;

    const map = new Map();
    for (const r of rows) {
      if (dataCol && di && df) {
        const d = r[dataCol] ? new Date(r[dataCol]) : null;
        if (d && !(d >= di && d <= df)) continue;
      }
      const nome = (r[produtoCol] ?? r.produto ?? r.Produto ?? '—') || '—';
      const v = parseNumberBR(r[valorCol] ?? r.valor ?? r.Valor ?? 0);
      map.set(nome, (map.get(nome) || 0) + v);
    }

    const by = [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    const tot = by.reduce((acc, r) => acc + (Number(r.value)||0), 0);
    return { top10: by.slice(0,10), total: tot };
  }, [rows, headers, startISO, endISO, schema]);

  return { loading, error, rows, headers, top10, total };
}
