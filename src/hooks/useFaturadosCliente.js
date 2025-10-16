import { useEffect, useMemo, useState } from 'react';

const toNumberBR = (v) => {
  if (v == null || v === '') return 0;
  const s = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

async function fetchTable(url) {
  const res = await fetch(url);
  const text = await res.text();

  // detecta separador: TAB, ; ou ,
  const firstLine = text.split(/\r?\n/)[0] || '';
  const sep = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');

  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(sep).map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = l.split(sep);
    const o = {};
    headers.forEach((h, i) => (o[h] = (cols[i] ?? '').trim()));
    return o;
  });
  return { headers, rows };
}

const pickKey = (headers, candidates) => {
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  const H = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const c of candidates) {
    const cN = norm(c);
    const hit = H.find((h) => h.n === cN || h.n.startsWith(cN));
    if (hit) return hit.raw;
  }
  return null;
};

/**
 * semanasObj: { '03-09': { faturado_por_cliente: '...' }, ... }
 * semanaKeys: ['03-09', ...] (filtradas pelo range)
 */
export default function useFaturadoClientesMany(semanasObj = {}, semanaKeys = []) {
  const [loading, setLoading] = useState(true);
  const [rowsAll, setRowsAll] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const out = [];
      for (const k of semanaKeys) {
        const url = semanasObj?.[k]?.faturado_por_cliente;
        if (!url) continue;

        const { headers, rows } = await fetchTable(url);
        // mapeia seu cabeçalho real: Perfil / Vendas (R$)
        const clienteKey = pickKey(headers, ['Perfil', 'Cliente', 'Nome do Cliente']);
        const valorKey   = pickKey(headers, ['Vendas (R$)', 'Valor', 'Faturamento', 'Total']);

        for (const r of rows) {
          const cliente = clienteKey ? r[clienteKey] : '—';
          const valor = valorKey ? toNumberBR(r[valorKey]) : 0;
          if (cliente && valor) out.push({ cliente, valor, _semana: k });
        }
      }
      setRowsAll(out);
      setLoading(false);
    })();
  }, [JSON.stringify(semanasObj), JSON.stringify(semanaKeys)]);

  const { total, porCliente, top10 } = useMemo(() => {
    const map = {};
    for (const r of rowsAll) map[r.cliente] = (map[r.cliente] || 0) + r.valor;
    const arr = Object.entries(map)
      .map(([cliente, valor]) => ({ cliente, valor }))
      .sort((a, b) => b.valor - a.valor);
    return {
      total: arr.reduce((s, x) => s + x.valor, 0),
      porCliente: arr,
      top10: arr.slice(0, 10),
    };
  }, [rowsAll]);

  return { loading, total, porCliente, top10 };
}
