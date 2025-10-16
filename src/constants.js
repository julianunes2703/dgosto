// Ajuste aqui os seus links:
export const DRE_URL  =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyaRCKYOme7dp2K4W03d8qF_nl0COiR_lCtpN1ErXSDqu8dwPPje_rOj5l8_0ToQ/pub?gid=1763808731&single=true&output=csv";

export const COMP_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyaRCKYOme7dp2K4W03d8qF_nl0COiR_lCtpN1ErXSDqu8dwPPje_rOj5l8_0ToQ/pub?gid=1548600636&single=true&output=csv";


 // links que você já começou
// preencha só as semanas que já têm link; as outras podem ficar vazias
// links que você já começou — sem duplicar chaves
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
