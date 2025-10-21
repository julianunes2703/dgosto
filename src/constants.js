// Ajuste aqui os seus links:
const ID_DRE = "1IKM5Wc3nTQS2gCbpJvEGzW8XhiKlKTl1hXZuFIpyaxY";

export const DRE_URL  =
  `https://script.google.com/a/macros/consultingblue.com.br/s/AKfycbzEGR5h2wSMesQoCAqFICR-pPnhylrDnkB0bKB6elaDBKAm-2JpnVdVeOzlGdxM7emb/exec?id=${ID_DRE}&sheet=DRE 2025&range=A1:ZZ999&cachebust=${Date.now()}`;


const ID_COMPETENCIA = "1IKM5Wc3nTQS2gCbpJvEGzW8XhiKlKTl1hXZuFIpyaxY";

export const COMP_URL =
    `https://script.google.com/a/macros/consultingblue.com.br/s/AKfycbzEGR5h2wSMesQoCAqFICR-pPnhylrDnkB0bKB6elaDBKAm-2JpnVdVeOzlGdxM7emb/exec?id=${ID_COMPETENCIA}&sheet=DRE 2025 - Competência&range=A1:ZZ999&cachebust=${Date.now()}`;

//comercial
export const SEMANAS_AGOSTO = {
  '03-09': {
    faturado_por_cliente: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTK3L6tINbaoCqLbAIxpMu0I-fb2Mebfd5TyKwLCtMmWfS7NhFFO103Z6Nd2gNwvA/pub?gid=1381836017&single=true&output=csv',
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtKpSn1uoFDo15hanCJn7SAbhHXJ5pjuJ9fv0ISVQC3T1EhyJwu1ZXrU7Fi3Y0Ug/pub?gid=1883437290&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Ago/2025'], // ← confirmado
  },
  '10-16': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTdLorEuhWdJfF-Ty5GVtGjePDt67U7Kd22iQ0rm38As4tcO0zbjaYjapKjy7yKMQ/pub?gid=1762742247&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Ago/2025'], // teste, pode inverter se col tiver "Total"
  },
  '17-23': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSw0_9GJL-uB6R4edR7lyRm6Aw7VrXqMYSY_C-JZL2vtQZVcfP1h4WyEhglgYeSVg/pub?gid=1786781268&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Desempenho de Produtos - Vendas - Vendedor de', 'Ago/2025'], // ← coluna exata que apareceu no log
  },
  '24-06': {
    ranking_vendedores:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbIpb39MVC8kW8BdUn9XgLEcG289z3u3OPgUf31wfbbaAIHJO9lfKmN5_kQukT0A/pub?gid=551535669&single=true&output=csv',
    ranking_vendedores_col: ['Set/2025', 'Ago/2025', 'Total'], // se a última tiver Set/2025
  },
};

export const SEMANAS_AGOSTO_RANGES = {
  '03-09': { start: '2025-08-03', end: '2025-08-09' },
  '10-16': { start: '2025-08-10', end: '2025-08-16' },
  '17-23': { start: '2025-08-17', end: '2025-08-23' },
  '24-06': { start: '2025-08-24', end: '2025-09-06' },
};

// ====== SETEMBRO/2025 ======
export const SEMANAS_SETEMBRO = {
  '07-13': {
    faturado_por_cliente: '', // <-- cole o link publicado (CSV) dessa semana
    ranking_vendedores:   '', // <-- idem
    ranking_vendedores_col: ['Total', 'Set/2025'], // ordem de preferência
  },
  '14-20': {
    faturado_por_cliente: '',
    ranking_vendedores:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXRaMoVKYG_nv1aDuld5iNwduuKpIF355G25Nlm95Mw1Vvph1C65oZL3F_vkjRQ/pub?gid=903224891&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Set/2025'],
  },
  '21-27': {
    faturado_por_cliente: '',
    ranking_vendedores:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vShXRaMoVKYG_nv1aDuld5iNwduuKpIF355G25Nlm95Mw1Vvph1C65oZL3F_vkjRQ/pub?gid=903224891&single=true&output=csv',
    ranking_vendedores_col: ['Total', 'Set/2025'],
  },
  // essa última normalmente cruza pra OUT/2025
  '28-04': {
    faturado_por_cliente: '',
    ranking_vendedores:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS2c94V7efvKOoTt12d-bx0fEQOjd9bbpszty387OuJ30KQbJbfSG33v3f0rVxffQ/pub?gid=84654040&single=true&output=csv',
      ranking_vendedores_col: ['Total', 'Set/2025', 'Out/2025'],
  },
  };


export const SEMANAS_SETEMBRO_RANGES = {
  '07-13': { start: '2025-09-07', end: '2025-09-13' },
  '14-20': { start: '2025-09-14', end: '2025-09-20' },
  '21-27': { start: '2025-09-21', end: '2025-09-27' },
  '28-04': { start: '2025-09-28', end: '2025-10-04' }, // cruza para outubro
};



export const MESES = [
  {
    id: '2025-08',
    label: 'Agosto/2025',
    semanas: SEMANAS_AGOSTO,
    ranges: SEMANAS_AGOSTO_RANGES,
  },
  {
    id: '2025-09',
    label: 'Setembro/2025',
    semanas: SEMANAS_SETEMBRO,
    ranges: SEMANAS_SETEMBRO_RANGES,
  },
];


// ===== PRODUÇÃO – CUSTO DE PRODUTO =====
// mantém a mesma ideia: meses, semanas, ranges e colunas preferidas onde necessário


export const SEMANAS_AGOSTO_PROD = {
  '03-09': {
    custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQaFYlPK9XNBMICT2ruygeyPusEpZFB5uvfu9BkZq42swtOSLPZ0CdRAs3Uz95YWeBZMRZM9tnNUT6B/pub?gid=754061342&single=true&output=csv', // <- cole o CSV dessa semana (Custo de Produto)
  },
  '10-16': {
    custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk9Fx_Z4LeZz5cC2f3yQUbCsllsENk_UvGSFaTxUzS7EEbYuf-wH9pzl1Muyr0rhOnP8FVuVqESHkE/pub?gid=474525612&single=true&output=csv',
  },
  '17-23': {
    custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTF1eCsVT5HmTiwb1Wj66FXVy2RUsVtFz-Xn0L4X-498HizzJa9NfaBMQJ5JE9caWivjnDeNixwMiG7/pub?gid=155509490&single=true&output=csv',
  },
  '24-06': {
    custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRS1ZQ1mh8w7DwUdvSifjkAc4ProrU1YScjP274iPbjZ7PjNi6N3qotttzyCFOwpiv75I050-bvRlW1/pub?gid=1212750547&single=true&output=csv', // atravessa para Setembro, igual Comercial
  },
};

export const SEMANAS_AGOSTO_RANGES_PROD = {
  '03-09': { start: '2025-08-03', end: '2025-08-09' },
  '10-16': { start: '2025-08-10', end: '2025-08-16' },
  '17-23': { start: '2025-08-17', end: '2025-08-23' },
  '24-06': { start: '2025-08-24', end: '2025-09-06' },
};

// Setembro pode ficar preparado, mesmo que em branco por enquanto
export const SEMANAS_SETEMBRO_PROD = {
  '01-06':{custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTN4vBhAPprI4VivEKTDXq1CJsHRv_HoMkl8HLAX1o3mCaN17QgO24K86acsdypOA-6EnWzslaiW00/pub?gid=561498361&single=true&output=csv'},
  '07-13': { custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSUZGoCqaZroqWmSunZMdH0OfbjcWhRKQz_mUUYK6TcaP9utKYqCJFnglkFJF5oIaNvKvF6MxkysvSa/pub?gid=544100680&single=true&output=csv' },
  '14-20': { custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQzDNe9Eg9cLrk1MT0uEokpjnWPa1pGurQfkJmAAEaWEYjgNvLhL6mZ_tpW3_mFREE-TWxMxllAwoLO/pub?gid=1799531854&single=true&output=csv' },
  '21-27': { custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRevQ58NsNdHl0c5PqiV5B0_nK0-WVrwYTojBxE328FFyYlyAxf-Q-pyhcTlkPhrz8fPegIR8R6Xx0/pub?gid=2115247519&single=true&output=csv' },
  '28-04': { custo_produto: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTWRLvvQPz3JFV-1QNERanOe2QF81JziWezwTkhJidd5-o9Qkfk06wy47DS4RbpERAFAdhbDQ_Vgoca/pub?gid=78121148&single=true&output=csv' },
};

export const SEMANAS_SETEMBRO_RANGES_PROD = {
  '01-06':{start: '2025-09-01', end: '2025-09-06'},
  '07-13': { start: '2025-09-07', end: '2025-09-13' },
  '14-20': { start: '2025-09-14', end: '2025-09-20' },
  
  '21-27': { start: '2025-09-21', end: '2025-09-27' },
  '28-04': { start: '2025-09-28', end: '2025-10-04' },
};

export const MESES_PRODUCAO = [
  {
    id: '2025-08',
    label: 'Agosto/2025',
    semanas: SEMANAS_AGOSTO_PROD,
    ranges: SEMANAS_AGOSTO_RANGES_PROD,
  },
  {
    id: '2025-09',
    label: 'Setembro/2025',
    semanas: SEMANAS_SETEMBRO_PROD,
    ranges: SEMANAS_SETEMBRO_RANGES_PROD,
  },
];
