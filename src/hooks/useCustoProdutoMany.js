import { useEffect, useMemo, useState } from 'react';

/* ===========================
   Helpers
=========================== */

// número robusto: 1.234,56 | 1,234.56 | 1234,56 | 1234.56 | 1.234 | 1,234 | 1234
const toNumberBR = (v) => {
  if (v == null || v === '') return 0;
  const s0 = String(v).trim();
  if (/^\d{1,3}(\.\d{3})+,\d{1,4}$/.test(s0)) return Number(s0.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(,\d{3})+\.\d{1,4}$/.test(s0)) return Number(s0.replace(/,/g, ''));
  if (/^\d+,\d{1,4}$/.test(s0)) return Number(s0.replace(',', '.'));
  if (/^\d+\.\d{1,4}$/.test(s0)) return Number(s0);
  if (/^\d{1,3}(\.\d{3})+$/.test(s0)) return Number(s0.replace(/\./g, ''));
  if (/^\d{1,3}(,\d{3})+$/.test(s0)) return Number(s0.replace(/,/g, ''));
  if (/^\d+$/.test(s0)) return Number(s0);
  const s = s0.replace(/[\uFEFF\u200B\u00A0\sR$]/g, '');
  if (s.includes(',') && !s.includes('.')) return Number(s.replace(',', '.'));
  if (s.includes('.') && !s.includes(',')) return Number(s);
  return Number(s.replace(/\./g, '').replace(',', '.')) || 0;
};

const clean = (s) =>
  String(s).replace(/[\uFEFF\u200B\u00A0]/g, ' ').replace(/^"+|"+$/g, '').trim();

const norm = (s) =>
  clean(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');

const looksLikeTotalRow = (s) => /^total|^soma/i.test(s || '');

const detectSep = (text) => {
  const first = text.split(/\r?\n/)[0] || '';
  if (first.includes('\t')) return '\t';
  if (first.includes(';')) return ';';
  return ',';
};



/* ===========================
   Parse CSV (acha header correto e ignora pivô da direita)
=========================== */
// === CSV parsing que respeita aspas e escolhe o melhor header para AMBOS formatos ===

// separa uma linha CSV respeitando "..." e "" (escapado)
function splitCSVLine(line, sep = ',') {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === sep) { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// tenta parsear com um separador e devolve um "candidato" com score
function tryParseWithSep(text, sep) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length > 0);

  let best = null;
  let bestScore = -Infinity;

  const maxProbe = Math.min(lines.length, 150);
  for (let i = 0; i < maxProbe; i++) {
    const cols = splitCSVLine(lines[i], sep).map(s => String(s).trim());
    if (!cols.length) continue;

    const colsN = cols.map(c => c.toLowerCase());

    const hasProduto =
      colsN.some(c => c === 'produto' || /descri(ç|c)ao.*produto/.test(c));

    const hasCustoPA_exact =
      colsN.some(c => /^\s*custo\s*pa\s*$/.test(c)); // evita "average de custo pa"

    const hasCustoUnit =
      colsN.some(c => /custo\s*unit/.test(c) || /unit[áa]rio/.test(c));

    const looksLikePivot =
      colsN.some(c => /average.*custo\s*pa/.test(c)); // pivô da direita

    const hasLeftId =
      colsN.some(c =>
        /dt\.\s*ent\/sai|dt\.?\s*neg|nuno?ta|c[oó]d\.\s|c[oó]d\s|^op$|\bop\b/.test(c)
      );

    // linha candidata a header?
    if (!(hasProduto && (hasCustoPA_exact || hasCustoUnit)) && !hasLeftId) continue;

    // pontuação: produto +2, custoPA +2 (ou custoUnit +1), bônus por colunas da esquerda +1, penaliza pivô -3
    let score = 0;
    if (hasProduto) score += 2;
    if (hasCustoPA_exact) score += 2;
    else if (hasCustoUnit) score += 1;
    if (hasLeftId) score += 1;
    if (looksLikePivot) score -= 3;

    if (score > bestScore) {
      bestScore = score;
      best = { headerIdx: i, headers: cols, hasCustoUnit, hasCustoPA_exact };
    }
  }

  // fallback: primeira não-vazia
  if (!best) {
    const cols = splitCSVLine(lines[0] || '', sep).map(s => String(s).trim());
    best = { headerIdx: 0, headers: cols, hasCustoUnit: false, hasCustoPA_exact: false };
  }

  // manter apenas a tabela útil (da esquerda). Corta até "Custo Unitário" se existir,
  // senão até "Custo PA" (caso simples só com Produto + Custo PA).
  const headers = best.headers;
  const idxUnit = headers.findIndex(h => /custo\s*unit/i.test(h) || /unit.rio/i.test(h));
  const idxPA   = headers.findIndex(h => /^\s*custo\s*pa\s*$/i.test(h));

  let stopIdx = -1;
  if (idxUnit >= 0) stopIdx = idxUnit;
  else if (idxPA >= 0) stopIdx = idxPA;

  const headersLeft = stopIdx >= 0 ? headers.slice(0, stopIdx + 1) : headers;

  // montar linhas usando apenas a parte "left"
  const rows = [];
  for (let j = best.headerIdx + 1; j < lines.length; j++) {
    const cols = splitCSVLine(lines[j], sep);
    if (!cols || cols.length === 0) continue;
    const o = {};
    for (let k = 0; k < headersLeft.length; k++) {
      o[headersLeft[k]] = (cols[k] ?? '').replace(/[\uFEFF\u200B\u00A0]/g, ' ').replace(/^"+|"+$/g, '').trim();
    }
    // descarta linha totalmente vazia
    if (Object.values(o).every(v => !String(v || '').trim())) continue;
    rows.push(o);
  }

  // ok se tiver Produto e (Custo PA OU Custo Unitário) em headersLeft
  const ok =
    headersLeft.some(h => /produto/i.test(h)) &&
    (headersLeft.some(h => /^\s*custo\s*pa\s*$/i.test(h)) ||
     headersLeft.some(h => /custo\s*unit/i.test(h)));

  return { ok, headers: headersLeft, rows, score: bestScore };
}

// testa ',', ';' e tab, escolhe o melhor candidato
function parseCSV(text) {
  const candidates = [',', ';', '\t'];
  let best = null;

  for (const sep of candidates) {
    const parsed = tryParseWithSep(text, sep);
    if (!best || parsed.score > best.score || (parsed.ok && !best.ok)) {
      best = parsed;
      if (parsed.ok) break; // achou um bom o suficiente
    }
  }
  return best || { headers: [], rows: [], score: -Infinity };
}


/* ===========================
   Header pickers
=========================== */
const pickHeader = (headers, candidates) => {
  const H = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const c of candidates) {
    const n = norm(c);
    const hit = H.find((h) => h.n === n);
    if (hit) return hit.raw;
  }
  return null;
};

const pickNumericHeader = (headers, rows, candidates) => {
  const h = pickHeader(headers, candidates);
  if (!h) return null;
  const hasNumeric = rows.some((r) => toNumberBR(r[h]) !== 0);
  return hasNumeric ? h : null;
};

/* ===========================
   Fetch + normalize (uma semana)
=========================== */
async function fetchCustoSemana(url, semanaKey) {
  const res = await fetch(url);
  const text = await res.text();
  const { headers, rows } = parseCSV(text);

  const produtoCandidates = [
    'Produto','produto','Item','Item/Produto',
    'Código Produto','Codigo Produto',
    'Descricao Produto','Descrição','Descrição do Produto',
  ];

  // prioriza Dt. Ent/Sai → Dt. Neg. → genéricos
  const dataCandidates = [
    'Dt. Ent/Sai','Dt Ent/Sai',
    'Dt. Neg.','Dt Neg',
    'Data','data','Dt',
    'Emissão','Emissao',
    'Data Produção','Data Producao',
  ];

  const linhaCandidates   = ['Linha','linha','Centro','Centro de Trabalho','Departamento','Célula','Celula'];
  const unidadeCandidates = ['Unidade','UN','UM','Un','unidade'];
  const qtdCandidates     = ['Qtd Produzida','Quantidade','Qtd','Qtde','Qtd.','Qtd Produção','Quantidade Produzida'];

  // custos — inclui Custo PA (total) e Custo Unitário
  const custoTotalCandidates = ['Custo Total','Total Custo','CustoTotal','Total','Custo PA','CustoPA','Custo Pa'];
  const custoUnitCandidates  = ['Custo Unitário','Custo Unitario','Custo Unit','Unitário','Unitario','CU'];
  const custoMPCandidates    = ['Custo Matéria-Prima','Custo MP','MP','Materia Prima','Matéria Prima'];
  const custoEmbCandidates   = ['Custo Embalagem','Custo Emb','Embalagem','Emb'];
  const custoMOCandidates    = ['Mão de Obra','MO','Custo MO','Mao de Obra'];
  const custoOVHCandidates   = ['Overhead','OVH','CIF','Custo Fixo','Custos Indiretos'];
  const custoOutrosCandidates= ['Outros','Outros Custos','Custo Outros','Despesas','Adicionais'];

  const produtoKey = pickHeader(headers, produtoCandidates) ?? headers[0];

  const dataKeyPreferA = pickHeader(headers, ['Dt. Ent/Sai','Dt Ent/Sai']);
  const dataKeyPreferB = pickHeader(headers, ['Dt. Neg.','Dt Neg']);
  const dataKey = dataKeyPreferA || dataKeyPreferB || pickHeader(headers, dataCandidates) || null;

  const linhaKey   = pickHeader(headers, linhaCandidates) ?? null;
  const unidadeKey = pickHeader(headers, unidadeCandidates) ?? null;

  const qtdKey         = pickNumericHeader(headers, rows, qtdCandidates);
  const custoTotalKey  = pickNumericHeader(headers, rows, custoTotalCandidates);
  const custoUnitKey   = pickNumericHeader(headers, rows, custoUnitCandidates);
  const custoMPKey     = pickNumericHeader(headers, rows, custoMPCandidates);
  const custoEmbKey    = pickNumericHeader(headers, rows, custoEmbCandidates);
  const custoMOKey     = pickNumericHeader(headers, rows, custoMOCandidates);
  const custoOVHKey    = pickNumericHeader(headers, rows, custoOVHCandidates);
  const custoOutrosKey = pickNumericHeader(headers, rows, custoOutrosCandidates);

  const out = [];
  for (const r of rows) {
    const produto = clean(r[produtoKey] || '');
    if (!produto || looksLikeTotalRow(produto)) continue;

    const data    = dataKey ? clean(r[dataKey]) : undefined;
    const linha   = linhaKey ? clean(r[linhaKey]) : undefined;
    const unidade = unidadeKey ? clean(r[unidadeKey]) : undefined;

    let qtd = qtdKey ? toNumberBR(r[qtdKey]) : 0;

    const custo_total_raw = custoTotalKey ? toNumberBR(r[custoTotalKey]) : 0;
    const custo_mp     = custoMPKey ? toNumberBR(r[custoMPKey]) : 0;
    const custo_emb    = custoEmbKey ? toNumberBR(r[custoEmbKey]) : 0;
    const custo_mo     = custoMOKey ? toNumberBR(r[custoMOKey]) : 0;
    const custo_ovh    = custoOVHKey ? toNumberBR(r[custoOVHKey]) : 0;
    const custo_outros = custoOutrosKey ? toNumberBR(r[custoOutrosKey]) : 0;

    // se não houver qtd, mas existir custo unitário + total: infere
    if (!qtd && custoUnitKey && custo_total_raw) {
      const cu = toNumberBR(r[custoUnitKey]);
      if (cu) qtd = custo_total_raw / cu;
    }

    const somaComp    = custo_mp + custo_emb + custo_mo + custo_ovh + custo_outros;
    const custo_total = custo_total_raw || somaComp;

    if (!custo_total && !qtd) continue;

    out.push({
      produto, data, linha, unidade, qtd,
      custo_mp, custo_emb, custo_mo, custo_ovh, custo_outros,
      custo_total,
      _semana: semanaKey,
    });
  }
  return out;
}

/* ===========================
   Hook principal (multi-semanas)
=========================== */
export default function useCustoProdutoMany(semanasObj = {}, semanaKeys = [], mesId = '2025-08') {
  const [loading, setLoading] = useState(true);
  const [rowsAll, setRowsAll] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const out = [];
      for (const k of semanaKeys) {
        const meta = semanasObj?.[k];
        const url = meta?.custo_produto;
        if (!url) { console.warn(`[custo produto][${k}] SEM URL`); continue; }
        try {
          const rows = await fetchCustoSemana(url, k);
          rows.forEach((r) => out.push(r));
        } catch (e) {
          console.error(`[custo produto][${k}] erro ao buscar`, e);
        }
      }
      setRowsAll(out);
      setLoading(false);
    })();
  }, [JSON.stringify(semanasObj), JSON.stringify(semanaKeys), mesId]);

  const aggs = useMemo(() => {
    const byProduto = {};
    const byLinha = {};
    const bySemana = {};
    let totalCusto = 0;
    let totalQtd = 0;

    for (const r of rowsAll) {
      totalCusto += r.custo_total;
      totalQtd   += r.qtd;

      byProduto[r.produto] = byProduto[r.produto] || { custo_total: 0, qtd: 0 };
      byProduto[r.produto].custo_total += r.custo_total;
      byProduto[r.produto].qtd         += r.qtd;

      if (r.linha) {
        byLinha[r.linha] = byLinha[r.linha] || { custo_total: 0, qtd: 0 };
        byLinha[r.linha].custo_total += r.custo_total;
        byLinha[r.linha].qtd         += r.qtd;
      }

      bySemana[r._semana] = bySemana[r._semana] || { custo_total: 0, qtd: 0 };
      bySemana[r._semana].custo_total += r.custo_total;
      bySemana[r._semana].qtd         += r.qtd;
    }

    const arrProduto = Object.entries(byProduto)
      .map(([produto, v]) => ({
        produto,
        custo_total: v.custo_total,
        qtd: v.qtd,
        custo_unit_medio: v.qtd ? v.custo_total / v.qtd : 0,
      }))
      .sort((a, b) => b.custo_total - a.custo_total);

    const top10Produtos = arrProduto.slice(0, 10);

    const arrLinha = Object.entries(byLinha)
      .map(([linha, v]) => ({
        linha,
        custo_total: v.custo_total,
        qtd: v.qtd,
        custo_unit_medio: v.qtd ? v.custo_total / v.qtd : 0,
      }))
      .sort((a, b) => b.custo_total - a.custo_total);

    const arrSemana = Object.entries(bySemana)
      .map(([semana, v]) => ({
        semana,
        custo_total: v.custo_total,
        qtd: v.qtd,
        custo_unit_medio: v.qtd ? v.custo_total / v.qtd : 0,
      }))
      .sort((a, b) => a.semana.localeCompare(b.semana));

    const custoUnitarioMedioGeral = totalQtd ? totalCusto / totalQtd : 0;

    return {
      totalCusto,
      totalQtd,
      custoUnitarioMedioGeral,
      porProduto: arrProduto,
      top10Produtos,
      porLinha: arrLinha,
      porSemana: arrSemana,
    };
  }, [rowsAll]);

  return { loading, rows: rowsAll, ...aggs };
}
