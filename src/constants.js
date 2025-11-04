// ====== DRE / COMP ======
const ID_DRE = "1IKM5Wc3nTQS2gCbpJvEGzW8XhiKlKTl1hXZuFIpyaxY";
export const DRE_URL =
  `https://script.google.com/a/macros/consultingblue.com.br/s/AKfycbzEGR5h2wSMesQoCAqFICR-pPnhylrDnkB0bKB6elaDBKAm-2JpnVdVeOzlGdxM7emb/exec?id=${ID_DRE}&sheet=DRE 2025&range=A1:ZZ999&cachebust=${Date.now()}`;

const ID_COMPETENCIA = "1IKM5Wc3nTQS2gCbpJvEGzW8XhiKlKTl1hXZuFIpyaxY";
export const COMP_URL =
  `https://script.google.com/a/macros/consultingblue.com.br/s/AKfycbzEGR5h2wSMesQoCAqFICR-pPnhylrDnkB0bKB6elaDBKAm-2JpnVdVeOzlGdxM7emb/exec?id=${ID_COMPETENCIA}&sheet=DRE 2025 - Competência&range=A1:ZZ999&cachebust=${Date.now()}`;


// ====== COMERCIAL ======
// Outubro/2025 PARCIAL — só 05–11 e 12–18
export const SEMANAS_OUTUBRO_RANGES = {
  '05-11': { start: '2025-10-05', end: '2025-10-11' },
  '12-18': { start: '2025-10-12', end: '2025-10-18' },
};

// Se você tiver fontes semanais de clientes/vendedores, pluga aqui.
// Como vamos focar no ranking de produtos (perfil), deixo vazio por enquanto:
export const SEMANAS_OUTUBRO = {
  '05-11': {},
  '12-18': {},
};

// Agosto e Setembro — mantém os teus atuais (se ainda usar)
export const SEMANAS_AGOSTO = {
  '03-09': {
    faturado_por_cliente: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTK3L6tINbaoCqLbAIxpMu0I-fb2Mebfd5TyKwLCtMmWfS7NhFFO103Z6Nd2gNwvA/pub?gid=1381836017&single=true&output=csv',
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtKpSn1uoFDo15hanCJn7SAbhHXJ5pjuJ9fv0ISVQC3T1EhyJwu1ZXrU7Fi3Y0Ug/pub?gid=1883437290&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Ago/2025'],
  },
  '10-16': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTdLorEuhWdJfF-Ty5GVtGjePDt67U7Kd22iQ0rm38As4tcO0zbjaYjapKjy7yKMQ/pub?gid=1762742247&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Ago/2025'],
  },
  '17-23': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSw0_9GJL-uB6R4edR7lyRm6Aw7VrXqMYSY_C-JZL2vtQZVcfP1h4WyEhglgYeSVg/pub?gid=1786781268&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Desempenho de Produtos - Vendas - Vendedor de', 'Ago/2025'],
  },
  '24-06': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbIpb39MVC8kW8BdUn9XgLEcG289z3u3OPgUf31wfbbaAIHJO9lfKmN5_kQukT0A/pub?gid=551535669&single=true&output=csv',
    ranking_vendedores_col: ['Set/2025', 'Ago/2025', 'Total'],
  },
};
export const SEMANAS_AGOSTO_RANGES = {
  '03-09': { start: '2025-08-03', end: '2025-08-09' },
  '10-16': { start: '2025-08-10', end: '2025-08-16' },
  '17-23': { start: '2025-08-17', end: '2025-08-23' },
  '24-06': { start: '2025-08-24', end: '2025-09-06' },
};

export const SEMANAS_SETEMBRO = {
  '07-13': { faturado_por_cliente: '', ranking_vendedores: '', ranking_vendedores_col: ['Total', 'Set/2025'] },
  '14-20': {
    faturado_por_cliente: '',
    ranking_vendedores: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXRaMoVKYG_nv1aDuld5iNwduuKpIF355G25Nlm95Mw1Vvph1C65oZL3F_vkjRQ/pub?gid=903224891&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Set/2025'],
  },
  '21-27': {
    faturado_por_cliente: '',
    ranking_vendedores: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXRaMoVKYG_nv1aDuld5iNwduuKpIF355G25Nlm95Mw1Vvph1C65oZL3F_vkjRQ/pub?gid=903224891&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Set/2025'],
  },
  '28-04': {
    faturado_por_cliente: '',
    ranking_vendedores: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2c94V7efvKOoTt12d-bx0fEQOjd9bbpszty387OuJ30KQbJbfSG33v3f0rVxffQ/pub?gid=84654040&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Set/2025', 'Out/2025'],
  },
};
export const SEMANAS_SETEMBRO_RANGES = {
  '07-13': { start: '2025-09-07', end: '2025-09-13' },
  '14-20': { start: '2025-09-14', end: '2025-09-20' },
  '21-27': { start: '2025-09-21', end: '2025-09-27' },
  '28-04': { start: '2025-09-28', end: '2025-10-04' },
};

// ====== MESES visíveis no Comercial ======
export const MESES = [
  {
    id: '2025-10',
    label: 'Outubro/2025 (parcial)',
    semanas: SEMANAS_OUTUBRO,
    ranges: SEMANAS_OUTUBRO_RANGES,
  },
  {
    id: '2025-09',
    label: 'Setembro/2025',
    semanas: SEMANAS_SETEMBRO,
    ranges: SEMANAS_SETEMBRO_RANGES,
  },
  {
    id: '2025-08',
    label: 'Agosto/2025',
    semanas: SEMANAS_AGOSTO,
    ranges: SEMANAS_AGOSTO_RANGES,
  },
];


// ====== Produção / Custos (mantém os teus) ======
export const CUSTO_PROD_LINK =
  'https://script.google.com/macros/s/AKfycbz4V3Cf17n6E3zMCxMN6A7EVEEL_IgnWeFazLaO6XvsMeOdHiNsdbEWQdKOwg37JWyt/exec?sheet=Planilha1&range=A1:Z999';

export const QUANT_PROD_LINK =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4EPlLYlZYJCmZBJJmgw3CqCvIufQlTKdeZSmbdOaTXjdF4sMSyCUcp9lLvqDZm5qSpa0iqmGLHzeB/pub?gid=2087240142&single=true&output=csv";

export const QUANT_MENSAL_URLS = {
  '2025-04': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSxTel-78DcIWNG1zVPyUzZboYL61QfJJZq8p2sdF53_3NWwEKAYFYJjqTR9E8OtQ/pub?gid=1335577500&single=true&output=csv',
  '2025-05': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIcaZDv6QsFZooCwYXkQpP5rchnTbJ9kjYHz4B3HG0RRbq5UPitrsW237c00WGaA/pub?gid=1909097353&single=true&output=csv',
  '2025-06': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQL8wQdJJVC7tZ4TyXAK47A8SmSLnPsbmrGkjAlH5ykl39poUqitLzW3qvHHURPeA/pub?gid=1175800941&single=true&output=csv',
  '2025-07': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjPk7xa0--bUy0VPr3I3gLwzrRIzvYplaHq83PMOjLBgf5IVO0p_CVD_5YPWboig/pub?gid=772202557&single=true&output=csv',
  '2025-08': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsuc40D6zwcQ1w3m1uK4jvruMKNNXNgSNkA6Fk6zlbEmaChUp_Zc-_vCkPPmhwwg/pub?gid=1346856445&single=true&output=csv',
  '2025-09': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrUIGHemRsR_jVbgaZiADnIepJmkvxVlHzZHhGGxXHiEpm89S23d8It6fBLnDafA/pub?gid=1476233989&single=true&output=csv',
  '2025-10': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJjIsOKDiwRIi8DoBQ2uieOQWhMvpBnT9e3_CmjrFeFnb6P4lfD1v4IPidFOiXrA/pub?gid=943100252&single=true&output=csv',
};


export const RANKING_TOPICOS = {
  perfil: "https://docs.google.com/spreadsheets/d/e/2PACX-1vShpvXUvyFwXKnwEXJUePjR1cHX1AMhYlE6OYoGg_RZKDB04xFZGPNZd3PnzVY2Rg/pub?gid=1790371300&single=true&output=csv",
};

export const RANKING_SCHEMAS = {
  perfil: {
    productCol: "Descrição",
    valueCol: "Vlr. Vendas",
    dateCol: null, // não há coluna de data
  },
};

// === Faturado por Cliente (CSV único) ===
export const FATURADO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpZrTEtuytwRIYGRPGNzErLRc34BnCbU1vj7aWZIqRJ21PQRX7EilwfHPTEAK19g/pub?gid=1105035593&single=true&output=csv";

export const FATURADO_SCHEMA = {
  groupCol: "Nome Parceiro (Parceiro)", // agrupar por cliente
  valueCol: "Vlr. Nota",                // somar este valor
  dateCol:  "Dt. Neg.",                 // filtrar por data
};
