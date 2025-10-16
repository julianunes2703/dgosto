import { useEffect, useMemo, useState } from 'react';

const toNumberBR = (v) => {
  if (v == null || v === '') return 0;
  const s = String(v)
    .replace(/[\uFEFF\u200B\u00A0\sR$]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const clean = (s) =>
  String(s).replace(/[\uFEFF\u200B\u00A0]/g, ' ').replace(/^"+|"+$/g, '').trim();

const norm = (s) =>
  clean(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, ''); // tira / espaço etc.

const detectSep = (text) => {
  const first = text.split(/\r?\n/)[0] || '';
  if (first.includes('\t')) return '\t';
  if (first.includes(';')) return ';';
  return ',';
};

const findHeaderIndex = (lines, sep) => {
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(sep).map(clean);
    if (parts.some((p) => norm(p).includes('vendedor'))) return i;
  }
  return 0;
};

// tenta casar a primeira coluna existente dentro da lista de candidatos
// NÃO case com coluna percentual quando a forçada NÃO tem '%'
const isPercentHeader = (h) => /%/.test(h);

function pickForcedHeader(headers, forcedCandidates) {
  if (!forcedCandidates) return null;
  const forceList = Array.isArray(forcedCandidates)
    ? forcedCandidates
    : [forcedCandidates];

  // Lista normalizada dos headers, mas mantendo o texto original
  const H = headers.map((h) => ({ raw: h, n: norm(h) }));

  for (const cand of forceList) {
    const n = norm(cand);
    // todos que batem com o normalizado
    const hits = H.filter((h) => h.n === n);
    // 1) se o candidato NÃO tem %, descarte headers que tenham %
    const prefer = cand.includes('%')
      ? hits                           // candidato explicitamente com %
      : hits.filter((h) => !isPercentHeader(h.raw));  // exclui % Total

    if (prefer.length) return prefer[0].raw;
  }
  return null;
}

function chooseValueKey(headers, preferMonthLabel, rows) {
  const H = headers.map(clean);
  const valid = (h) => !/%/.test(h);  // <<< ESSA LINHA É O FILTRO

  const monthExact = H.find((h) => valid(h) && norm(h) === norm(preferMonthLabel));
  if (monthExact) return monthExact;

  const totalExact = H.find((h) => valid(h) && norm(h) === 'total');
  if (totalExact) return totalExact;

  const monthAny = H.find(
    (h) => valid(h) && /\b(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\/\d{4}\b/i.test(h)
  );
  if (monthAny) return monthAny;

  for (const h of H) {
    if (!valid(h)) continue;
    const v = rows.find((r) => r[h] != null)?.[h];
    if (toNumberBR(v)) return h;
  }
  return H.find(valid) || H[0];
}


async function fetchRanking(url, preferLabel, forcedCandidates, semanaKey) {
  const res = await fetch(url);
  const text = await res.text();
  const sep = detectSep(text);
  const lines = text.trim().split(/\r?\n/);

  const headerIdx = findHeaderIndex(lines, sep);
  const headers = lines[headerIdx].split(sep).map(clean);
  const rows = lines.slice(headerIdx + 1).map((l) => {
    const cols = l.split(sep);
    const o = {};
    headers.forEach((h, i) => (o[h] = clean(cols[i] ?? '')));
    return o;
  });

  const vendKey =
    headers.find((h) => norm(h).startsWith('vendedor')) ||
    headers.find((h) => /vendedor/i.test(h)) ||
    'Vendedores';

  // 1) tenta as colunas forçadas (string ou array)
  let valorKey = pickForcedHeader(headers, forcedCandidates);

  // 2) se não houver, cai na heurística (mês -> total -> mês qq -> fallback)
  if (!valorKey) valorKey = chooseValueKey(headers, preferLabel, rows);

  // LOG rápido por semana (pode remover depois)
  console.log(`[rank vend][${semanaKey}] valorKey=`, valorKey, 'forced=', forcedCandidates, 'prefer=', preferLabel);

  const out = [];
  for (const r of rows) {
    const vendedor = clean(r[vendKey] || '');
    const valor = toNumberBR(r[valorKey]);
    if (!vendedor || !isFinite(valor)) continue;
    if (/^total|^soma/i.test(vendedor)) continue;
    out.push({ vendedor, valor });
  }
  return out;
}

export default function useRankingVendedoresMany(semanasObj = {}, semanaKeys = [], mesId = '2025-08') {
  const [loading, setLoading] = useState(true);
  const [rowsAll, setRowsAll] = useState([]);

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const preferLabel = (() => {
    const [y, m] = mesId.split('-').map(Number);
    return `${months[m - 1]}/${y}`;
  })();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const out = [];
      for (const k of semanaKeys) {
        const meta = semanasObj?.[k];
        const url = meta?.ranking_vendedores;
        if (!url) { console.warn(`[rank vend][${k}] SEM URL`); continue; }
        const forced = meta?.ranking_vendedores_col; // string OU array
        const rows = await fetchRanking(url, preferLabel, forced, k);
        rows.forEach((r) => out.push({ ...r, _semana: k }));
      }
      setRowsAll(out);
      setLoading(false);
    })();
  }, [JSON.stringify(semanasObj), JSON.stringify(semanaKeys), mesId]);

  const { total, ranking, top10 } = useMemo(() => {
    const map = {};
    for (const r of rowsAll) map[r.vendedor] = (map[r.vendedor] || 0) + r.valor;
    const arr = Object.entries(map)
      .map(([vendedor, valor]) => ({ vendedor, valor }))
      .sort((a, b) => b.valor - a.valor);
    return {
      total: arr.reduce((s, x) => s + x.valor, 0),
      ranking: arr,
      top10: arr.slice(0, 10),
    };
  }, [rowsAll]);

  return { loading, total, ranking, top10 };
}
