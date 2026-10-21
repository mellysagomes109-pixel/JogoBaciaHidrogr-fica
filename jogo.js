/* ==========================================================
   BACIA EM JOGO: CONSELHO DAS ÁGUAS (versão rápida, ~19 min)
   js/jogo.js
   Todos os valores abaixo são FICTÍCIOS e didáticos.
   Para usar dados reais, edite CONFIG, SETORES e PROPOSTAS.
   ========================================================== */
'use strict';

/* ---------------- CONFIGURAÇÃO ---------------- */
const CONFIG = {
  cenario: {
    nome: 'Bacia do Rio Amazonas (cenário hipotético)',
    problema: 'Uma estiagem prolongada reduziu a vazão do rio principal. A demanda somada dos sete setores é maior que a água disponível.'
  },
  // agua = UA disponíveis; qual e pres = valores iniciais (0 a 100)
  escassez: {
    moderada: { agua: 85, qual: 60, pres: 58 },
    severa:   { agua: 70, qual: 50, pres: 50 },
    critica:  { agua: 55, qual: 42, pres: 44 }
  },
  minEssencial: 0.9,          // atendimento mínimo do abastecimento (urbano e rural)
  quorum: 5,                  // votos "sim" necessários (de 7 setores)
  tentativas: 2,              // tentativas de votação antes de encerrar sem consenso
  maxPropostas: 3,            // propostas que cabem na mesa
  orcamento: 90,              // orçamento simulado das medidas
  coopInicial: 50,
  minutosPorFase: [3, 5, 7, 4] // soma = 19 min
};

/* ---------------- PERSONAGENS ----------------
   Troque o campo "nome" pelos nomes do grupo. NÃO altere o "id". */
const SETORES = [
  { id: 'energia', nome: 'Mellysa Ribeiro', setor: 'Energia elétrica', emoji: '⚡', cor: '#b8901d', demanda: 25, essencial: false,
    perfil: 'Engenheira que representa os empreendimentos de geração de energia.',
    posicao: 'Preciso manter a vazão para as turbinas.',
    interesse: 'Operar com segurança e sem prejuízo, respeitando os demais usos.',
    inegociavel: 'Segurança da operação.', concessao: 'Planejar a operação para os períodos de estiagem.' },
  { id: 'agricultura', nome: 'Miguel Vaneli', setor: 'Agricultura e agropecuária', emoji: '🌾', cor: '#6f8f22', demanda: 30, essencial: false,
    perfil: 'Produtor rural que representa os agricultores da bacia.',
    posicao: 'Precisamos de mais água para a agricultura.',
    interesse: 'Garantir a safra e a renda das famílias sem esgotar a fonte.',
    inegociavel: 'Água mínima para salvar a safra em curso.', concessao: 'Adotar irrigação eficiente e ajustar o calendário.' },
  { id: 'urbano', nome: 'Felipe Padovani', setor: 'Abastecimento urbano', emoji: '🏙️', cor: '#1d7a8c', demanda: 25, essencial: true,
    perfil: 'Gestor de uma companhia de abastecimento de água.',
    posicao: 'A cidade não pode ficar sem água.',
    interesse: 'Abastecimento contínuo, com qualidade e mananciais protegidos.',
    inegociavel: 'Consumo humano.', concessao: 'Reduzir perdas na distribuição e promover consumo consciente.' },
  { id: 'rural', nome: 'Davi Gonçalves', setor: 'Abastecimento rural', emoji: '🏡', cor: '#9a5f38', demanda: 8, essencial: true,
    perfil: 'Representante das comunidades rurais e de pequenos produtores.',
    posicao: 'As comunidades rurais não podem ser esquecidas.',
    interesse: 'Acesso seguro e justo à água, longe das redes urbanas.',
    inegociavel: 'Água para beber e cozinhar.', concessao: 'Adotar cisternas e sistemas comunitários.' },
  { id: 'navegacao', nome: 'Antony Almeida', setor: 'Navegação fluvial', emoji: '🚢', cor: '#3b6aa0', demanda: 10, essencial: false,
    perfil: 'Representante de empresas e comunidades que dependem do transporte fluvial.',
    posicao: 'O rio precisa continuar navegável.',
    interesse: 'Nível mínimo para transportar pessoas e cargas sem interrupções.',
    inegociavel: 'Acesso às comunidades isoladas.', concessao: 'Ajustar rotas e períodos de navegação.' },
  { id: 'pesca', nome: 'Gilmara Palermo', setor: 'Pesca e aquicultura', emoji: '🐟', cor: '#23856f', demanda: 12, essencial: false,
    perfil: 'Representante dos pescadores e produtores aquícolas.',
    posicao: 'Não podem mexer na vazão do rio.',
    interesse: 'Água limpa e regime de vazão que preserve a reprodução dos peixes.',
    inegociavel: 'Áreas e períodos de reprodução.', concessao: 'Respeitar o defeso e adotar aquicultura sustentável.' },
  { id: 'turismo', nome: 'Julinha Carvalho', setor: 'Recreação e turismo', emoji: '🏖️', cor: '#a8507f', demanda: 10, essencial: false,
    perfil: 'Representante de empreendedores turísticos e comunidades ligadas ao lazer nos rios.',
    posicao: 'O rio é o nosso cartão-postal.',
    interesse: 'Rio limpo, paisagem conservada e atividades seguras.',
    inegociavel: 'Qualidade da água para contato.', concessao: 'Apoiar educação ambiental e controle de resíduos.' }
];

/* ---------------- PROPOSTAS (estratégias A, B e C) ----------------
   ganho = UA extras; qual e pres = efeito sobre qualidade e preservação */
const PROPOSTAS = [
  { id: 'A1', est: 'A', nome: 'Reservatório de regularização de vazão', setores: ['energia', 'navegacao', 'urbano', 'agricultura'], ganho: 8, qual: 0, pres: -6, custo: 40, prazo: '24 a 36 meses', impacto: 'Alaga áreas e altera o regime do rio.', limite: 'Exige licenciamento e estudo de impacto.' },
  { id: 'A2', est: 'A', nome: 'Recuperação da rede de adução e captação', setores: ['urbano', 'rural'], ganho: 5, qual: 1, pres: 0, custo: 25, prazo: '12 meses', impacto: 'Obras pontuais, baixo impacto.', limite: 'Depende de projeto executivo.' },
  { id: 'A3', est: 'A', nome: 'Adaptação da operação da usina', setores: ['energia', 'navegacao', 'pesca'], ganho: 3, qual: 1, pres: 2, custo: 10, prazo: '6 meses', impacto: 'Vazão mínima de manutenção favorece o ecossistema.', limite: 'Reduz parte da geração.' },
  { id: 'B1', est: 'B', nome: 'Programa de redução de perdas na distribuição', setores: ['urbano', 'rural'], ganho: 9, qual: 2, pres: 2, custo: 30, prazo: '18 meses', impacto: 'Menos captação no rio.', limite: 'Resultado gradual.' },
  { id: 'B2', est: 'B', nome: 'Irrigação eficiente e calendário de irrigação', setores: ['agricultura', 'pesca'], ganho: 8, qual: 3, pres: 3, custo: 25, prazo: '12 meses', impacto: 'Menos retorno de agroquímicos ao rio.', limite: 'Exige assistência técnica.' },
  { id: 'B3', est: 'B', nome: 'Acordo de operação e fiscalização das captações', setores: ['energia', 'navegacao', 'agricultura', 'urbano', 'pesca'], ganho: 5, qual: 3, pres: 3, custo: 15, prazo: '6 meses', impacto: 'Controla captações irregulares e retiradas simultâneas.', limite: 'Exige cumprimento por todos.' },
  { id: 'C1', est: 'C', nome: 'Captação de água da chuva (cisternas)', setores: ['rural', 'agricultura'], ganho: 4, qual: 0, pres: 1, custo: 15, prazo: '6 meses', impacto: 'Baixo impacto.', limite: 'Volume sazonal, depende das chuvas.' },
  { id: 'C2', est: 'C', nome: 'Reuso de água tratada (usos não potáveis)', setores: ['urbano', 'agricultura', 'turismo'], ganho: 7, qual: 3, pres: 2, custo: 35, prazo: '24 meses', impacto: 'Reduz lançamento de efluentes.', limite: 'Exige tratamento avançado e controle sanitário.' },
  { id: 'C3', est: 'C', nome: 'Recuperação de nascentes e matas ciliares', setores: ['pesca', 'turismo', 'rural', 'urbano'], ganho: 5, qual: 5, pres: 8, custo: 20, prazo: '36 meses', impacto: 'Melhora qualidade e habitat.', limite: 'Resultado lento.' },
  { id: 'C4', est: 'C', nome: 'Poços em aquífero (uso complementar)', setores: ['rural', 'urbano'], ganho: 6, qual: -3, pres: -5, custo: 28, prazo: '12 meses', impacto: 'Risco de sobreexploração e contaminação.', limite: 'Exige estudo hidrogeológico.' }
];
const NOME_EST = { A: 'Água a distribuir', B: 'Gestão do uso', C: 'Novas fontes' };

/* ---------------- UTILITÁRIOS ---------------- */
const $ = id => document.getElementById(id);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
const soma = a => a.reduce((x, y) => x + y, 0);
const lim = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const setor = id => SETORES.find(s => s.id === id);
const prop = id => PROPOSTAS.find(p => p.id === id);
const demandaTotal = () => soma(SETORES.map(s => s.demanda));
const sinal = v => (v > 0 ? '+' : '') + v;

function toast(msg, tipo = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

/* ---------------- ESTADO ---------------- */
let S = novoEstado();
let timer = null, ultimoFoco = null;
function novoEstado() {
  return {
    cen: 'severa', fase: 0, donos: {}, mesa: [], recebido: {}, just: {}, distConfirmada: false,
    coop: CONFIG.coopInicial, log: [], tentativas: 0, votos: {}, acordo: null, c: null, restante: 0, pausado: false
  };
}

/* ---------------- NAVEGAÇÃO E MODAIS ---------------- */
function mostrarTela(nome) {
  $$('.tela').forEach(t => t.classList.toggle('ativa', t.id === 'tela-' + nome));
  window.scrollTo(0, 0);
  const h = document.querySelector('#tela-' + nome + ' h1, #tela-' + nome + ' h2');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  if (nome !== 'negociacao') pararRelogio();
  if (nome === 'preparacao') montarPreparacao();
}
function abrirModal(id) {
  ultimoFoco = document.activeElement;
  const m = $(id); m.hidden = false;
  const alvo = m.querySelector('button:not(.modal-fechar)'); if (alvo) alvo.focus();
}
function fecharModal(m) { m.hidden = true; if (ultimoFoco) ultimoFoco.focus(); }

/* ---------------- PREPARAÇÃO ---------------- */
const numJogadores = () => parseInt($('sel-jogadores').value, 10);

function atualizarDadosIniciais() {
  const agua = CONFIG.escassez[$('sel-cenario').value].agua, dem = demandaTotal();
  $('prep-agua').textContent = agua;
  $('prep-demanda').textContent = dem;
  $('prep-deficit').textContent = Math.max(0, dem - agua);
}
function sortear() {
  const P = numJogadores(), ids = SETORES.map(s => s.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  S.donos = {};
  ids.forEach((id, i) => { S.donos[id] = (i % P) + 1; });
  montarGrade();
}
function montarGrade() {
  $('grade-personagens').innerHTML = SETORES.map(s => `
    <article class="card-personagem" style="--cor-setor:${s.cor}">
      <div class="avatar" style="--cor-setor:${s.cor}" aria-hidden="true">${s.emoji}</div>
      <h4>${esc(s.nome)}</h4>
      <p class="setor">${esc(s.setor)}</p>
      <p class="jogador">Jogador ${S.donos[s.id]}</p>
      <p class="nota">${esc(s.perfil)}</p>
      <p class="nota">Demanda simulada: <strong>${s.demanda} UA</strong></p>
    </article>`).join('');
}
function montarPreparacao() {
  $('texto-conflito').textContent = CONFIG.cenario.problema;
  atualizarDadosIniciais();
  if (!Object.keys(S.donos).length) sortear(); else montarGrade();
}

/* ---------------- CÁLCULOS DA SIMULAÇÃO ---------------- */
function calc() {
  const e = CONFIG.escassez[S.cen];
  const mesa = S.mesa.map(prop);
  const disp = e.agua + soma(mesa.map(p => p.ganho));
  const dem = demandaTotal();
  const rec = soma(SETORES.map(s => S.recebido[s.id] || 0));
  const at = s => Math.min(1, (S.recebido[s.id] || 0) / s.demanda);
  const atend = soma(SETORES.map(s => Math.min(S.recebido[s.id] || 0, s.demanda))) / dem * 100;
  const abast = (at(setor('urbano')) + at(setor('rural'))) / 2 * 100;
  const qual = lim(e.qual + soma(mesa.map(p => p.qual)));
  const pres = lim(e.pres + soma(mesa.map(p => p.pres)) - Math.round(Math.max(0, rec / disp - 0.8) * 50));
  const sat = {};
  SETORES.forEach(s => {
    const beneficios = mesa.filter(p => p.setores.includes(s.id)).length;
    const amb = (s.id === 'pesca' || s.id === 'turismo') ? (qual + pres) / 2 : S.coop;
    sat[s.id] = Math.round(lim(0.6 * at(s) * 100 + 0.25 * Math.min(1, beneficios * 0.5) * 100 + 0.15 * amb));
  });
  const mediaSat = soma(Object.values(sat)) / SETORES.length;
  const equi = Math.round(lim(0.3 * abast + 0.2 * qual + 0.2 * pres + 0.2 * mediaSat + 0.1 * S.coop));
  return { disp, dem, rec, atend: Math.round(atend), abast: Math.round(abast), qual: Math.round(qual), pres: Math.round(pres), coop: Math.round(S.coop), equi, sat, custo: soma(mesa.map(p => p.custo)), mesa };
}

/* ---------------- INDICADORES ---------------- */
const IND = [
  { k: 'agua', r: 'Disponibilidade hídrica', u: ' UA' },
  { k: 'qual', r: 'Qualidade da água', u: '' },
  { k: 'pres', r: 'Preservação ambiental', u: '' },
  { k: 'atend', r: 'Atendimento às demandas', u: '%' },
  { k: 'coop', r: 'Cooperação', u: '' },
  { k: 'equi', r: 'Equilíbrio da bacia', u: '' }
];
function montarIndicadores(el) {
  el.innerHTML = IND.map(i => `<div class="indicador" data-k="${i.k}"><div class="indicador-topo"><span>${i.r}</span><strong>0${i.u}</strong></div><div class="barra"><div class="barra-preench"></div></div></div>`).join('');
}
function atualizarIndicadores(el, c) {
  const v = { agua: c.disp, qual: c.qual, pres: c.pres, atend: c.atend, coop: c.coop, equi: c.equi };
  IND.forEach(i => {
    const n = el.querySelector(`[data-k="${i.k}"]`);
    const pct = i.k === 'agua' ? lim(c.disp / Math.max(c.dem, c.disp) * 100) : lim(v[i.k]);
    const antes = n.dataset.v;
    n.dataset.v = v[i.k];
    n.querySelector('strong').textContent = v[i.k] + i.u;
    const b = n.querySelector('.barra-preench');
    b.style.width = pct + '%';
    b.className = 'barra-preench ' + (pct >= 66 ? 'alto' : pct >= 40 ? 'medio' : 'baixo');
    if (antes !== undefined && antes != v[i.k]) { n.classList.remove('mudou'); void n.offsetWidth; n.classList.add('mudou'); }
  });
}

/* ---------------- ATUALIZAÇÃO GERAL ---------------- */
function atualizar() {
  const c = S.c = calc();
  atualizarIndicadores($('painel-indicadores'), c);
  $('agua-disponivel').textContent = c.disp;
  $('agua-distribuida').textContent = c.rec;
  const nivel = $('nivel-agua');
  nivel.style.width = lim(c.rec / c.disp * 100) + '%';
  nivel.classList.toggle('excedido', c.rec > c.disp);
  const al = $('alerta-deficit');
  if (S.fase >= 2 && c.rec > c.disp) { al.hidden = false; al.textContent = `A soma distribuída (${c.rec} UA) ultrapassa a água disponível (${c.disp} UA). Reduza ${c.rec - c.disp} UA.`; }
  else if (S.fase >= 2 && c.dem > c.disp) { al.hidden = false; al.textContent = `Demanda de ${c.dem} UA acima dos ${c.disp} UA disponíveis: déficit de ${c.dem - c.disp} UA. Negociem a divisão.`; }
  else al.hidden = true;
  atualizarTabela(c);
  atualizarPessoas(c);
  renderMesa();
  renderEstrategias();
}
function atualizarPessoas(c) {
  $$('#roda-personagens .pessoa').forEach(p => {
    p.querySelector('.mini-satisfacao span').style.width = c.sat[p.dataset.id] + '%';
  });
}
function montarPessoas() {
  $('roda-personagens').innerHTML = SETORES.map(s => `
    <div class="pessoa" data-id="${s.id}" style="--cor-setor:${s.cor}">
      <div class="avatar" style="--cor-setor:${s.cor}" aria-hidden="true">${s.emoji}</div>
      <div><strong>${esc(s.nome)}</strong><small>${esc(s.setor)} · Jogador ${S.donos[s.id]}</small>
      <div class="mini-satisfacao" title="Satisfação do setor"><span></span></div></div>
    </div>`).join('');
}

/* ---------------- FASE 1: INTERESSES ---------------- */
function montarInteresses() {
  $('lista-interesses').innerHTML = SETORES.map(s => `
    <article class="interesse-item" style="--cor-setor:${s.cor}">
      <h4>${s.emoji} ${esc(s.nome)} <small>(Jogador ${S.donos[s.id]})</small></h4>
      <p class="setor">${esc(s.setor)} · demanda ${s.demanda} UA</p>
      <dl>
        <dt>Posição (o que diz querer)</dt><dd>${esc(s.posicao)}</dd>
        <dt>Interesse (o que precisa)</dt><dd>${esc(s.interesse)}</dd>
        <dt>Inegociável</dt><dd>${esc(s.inegociavel)}</dd>
        <dt>Concessão possível</dt><dd>${esc(s.concessao)}</dd>
      </dl>
    </article>`).join('');
}

/* ---------------- FASE 2: DISTRIBUIÇÃO ---------------- */
function montarTabela() {
  $('corpo-tabela-agua').innerHTML = SETORES.map(s => `
    <tr data-id="${s.id}">
      <th scope="row">${s.emoji} ${esc(s.setor)}</th>
      <td>${s.demanda} UA</td>
      <td><input type="number" class="in-rec" min="0" max="200" value="0" aria-label="Água recebida por ${esc(s.setor)}"></td>
      <td class="cel-pct"></td>
      <td><input type="text" class="in-just" maxlength="90" placeholder="Justificativa" aria-label="Justificativa para ${esc(s.setor)}"></td>
    </tr>`).join('');
}
function sincronizarInputs() {
  $$('#corpo-tabela-agua tr').forEach(tr => {
    tr.querySelector('.in-rec').value = S.recebido[tr.dataset.id] || 0;
    tr.querySelector('.in-just').value = S.just[tr.dataset.id] || '';
  });
}
function atualizarTabela(c) {
  $$('#corpo-tabela-agua tr').forEach(tr => {
    const s = setor(tr.dataset.id);
    const p = Math.round(Math.min(1, (S.recebido[s.id] || 0) / s.demanda) * 100);
    tr.querySelector('.cel-pct').innerHTML = `<span class="pct-barra"><span style="width:${p}%"></span></span>${p}%`;
  });
  $('total-demanda').textContent = c.dem;
  const tr = $('total-recebido'); tr.textContent = c.rec; tr.className = c.rec > c.disp ? 'excede' : '';
  $('total-atendimento').textContent = c.atend + '%';
  const st = $('total-status');
  st.className = c.rec > c.disp ? 'excede' : 'dentro';
  st.textContent = c.rec > c.disp ? `Excede em ${c.rec - c.disp} UA` : `Dentro do limite (${c.disp - c.rec} UA livres)`;
}
function distribuir(modo) {
  const disp = calc().disp, alvo = {};
  SETORES.forEach(s => { alvo[s.id] = 0; });
  let resto = disp, grupo = SETORES;
  if (modo === 'essenciais') {
    SETORES.filter(s => s.essencial).forEach(s => {
      const v = Math.min(s.demanda, resto); alvo[s.id] = v; resto -= v;
      S.just[s.id] = 'Prioridade legal: consumo humano e dessedentação animal';
    });
    grupo = SETORES.filter(s => !s.essencial);
  }
  const dem = soma(grupo.map(s => s.demanda)), fator = Math.min(1, resto / dem);
  let usado = 0;
  grupo.forEach(s => {
    const v = Math.floor(s.demanda * fator); alvo[s.id] += v; usado += v;
    if (modo !== 'essenciais') S.just[s.id] = 'Atendimento proporcional à demanda';
    else S.just[s.id] = 'Divisão proporcional do que restou';
  });
  let sobra = Math.min(resto, dem) - usado;
  grupo.slice().sort((a, b) => b.demanda - a.demanda).forEach(s => {
    if (sobra > 0 && alvo[s.id] < s.demanda) { alvo[s.id]++; sobra--; }
  });
  S.recebido = alvo; S.distConfirmada = false;
  sincronizarInputs(); atualizar();
  toast(modo === 'essenciais' ? 'Usos essenciais atendidos primeiro; o restante foi dividido proporcionalmente.' : 'Água dividida proporcionalmente à demanda.');
}
function confirmarDistribuicao() {
  const c = calc();
  if (c.rec > c.disp) { S.coop = lim(S.coop - 2); atualizar(); return toast('A soma ultrapassa a água disponível. Ajuste os valores.', 'negativo'); }
  if (c.rec === 0) return toast('Distribua alguma água antes de propor.', 'negativo');
  S.distConfirmada = true;
  addLog(`Distribuição proposta: ${SETORES.map(s => `${s.setor} ${S.recebido[s.id] || 0} UA`).join(', ')} (total ${c.rec} de ${c.disp} UA).`, 'positivo');
  S.coop = lim(S.coop + 2);
  atualizar();
  if (S.fase === 2) irFase(3); else toast('Distribuição registrada.', 'positivo');
}

/* ---------------- FASE 3: ESTRATÉGIAS ---------------- */
function renderEstrategias() {
  const cheia = S.mesa.length >= CONFIG.maxPropostas;
  ['A', 'B', 'C'].forEach(e => {
    $('lista-' + e).innerHTML = PROPOSTAS.filter(p => p.est === e).map(p => {
      const na = S.mesa.includes(p.id);
      return `<article class="proposta-card ${na ? 'aprovada' : ''}">
        <h4>${esc(p.nome)}</h4>
        <div class="meta"><span class="etiqueta bom">+${p.ganho} UA</span><span class="etiqueta">custo ${p.custo}</span><span class="etiqueta">${esc(p.prazo)}</span>${p.pres < 0 ? '<span class="etiqueta risco">impacto ambiental</span>' : ''}</div>
        <p class="nota">Beneficia: ${p.setores.map(x => esc(setor(x).setor)).join(', ')}.</p>
        <p class="nota">${esc(p.impacto)} ${esc(p.limite)}</p>
        <button class="btn btn-mini" type="button" data-propor="${p.id}" ${(na || cheia || S.fase !== 3) ? 'disabled' : ''}>${na ? 'Na mesa' : 'Colocar na mesa'}</button>
      </article>`;
    }).join('');
  });
}
function renderMesa() {
  const ul = $('propostas-mesa');
  if (!S.mesa.length) { ul.innerHTML = '<li class="vazio">Nenhuma proposta na mesa.</li>'; return; }
  ul.innerHTML = S.mesa.map(id => {
    const p = prop(id);
    return `<li><strong>${esc(p.nome)}</strong><br>
      <span class="etiqueta">${p.est}. ${NOME_EST[p.est]}</span> <span class="etiqueta bom">+${p.ganho} UA</span> <span class="etiqueta">custo ${p.custo}</span>
      ${S.fase === 3 ? `<br><button class="btn btn-mini" type="button" data-retirar="${p.id}">Retirar</button>` : ''}</li>`;
  }).join('');
}
function colocarNaMesa(id) {
  const p = prop(id);
  if (S.fase !== 3) return toast('As propostas abrem na fase de estratégias.', 'negativo');
  if (S.mesa.includes(id)) return;
  if (S.mesa.length >= CONFIG.maxPropostas) return toast(`A mesa comporta ${CONFIG.maxPropostas} propostas. Retire uma antes.`, 'negativo');
  S.mesa.push(id);
  S.distConfirmada = false;
  S.coop = lim(S.coop + (p.setores.length >= 3 ? 7 : 4));
  addLog(`Proposta na mesa (${p.est}. ${NOME_EST[p.est]}): ${p.nome}. Água extra: ${p.ganho} UA.`, 'positivo');
  toast(`${p.nome} entrou na mesa (+${p.ganho} UA). Redistribuam e reconfirmem a água.`, 'positivo');
  if (calc().custo > CONFIG.orcamento) { S.coop = lim(S.coop - 3); toast(`Custo das medidas acima do orçamento simulado (${CONFIG.orcamento}).`, 'negativo'); }
  atualizar();
}
function retirarDaMesa(id) {
  S.mesa = S.mesa.filter(x => x !== id);
  S.distConfirmada = false;
  S.coop = lim(S.coop - 1);
  addLog(`Proposta retirada da mesa: ${prop(id).nome}.`, 'negativo');
  atualizar();
}

/* ---------------- FASE 4: VOTAÇÃO ---------------- */
function montarVotacao() {
  const c = calc();
  S.votos = {};
  $('votacao-resumo').textContent = `Água distribuída: ${c.rec} de ${c.disp} UA. Propostas na mesa: ${S.mesa.length}. Abastecimento humano atendido em ${c.abast}%. São necessários ${CONFIG.quorum} votos "sim" de ${SETORES.length}.`;
  $('votacao-lista').innerHTML = SETORES.map(s => `
    <div class="voto" data-id="${s.id}">
      <span>${s.emoji} ${esc(s.nome)}, ${esc(s.setor)} <small>(satisfação ${c.sat[s.id]}%)</small></span>
      <span class="voto-opcoes">
        <button type="button" class="sim" data-v="sim">Sim</button>
        <button type="button" class="talvez" data-v="talvez">Com ressalvas</button>
        <button type="button" class="nao" data-v="nao">Não</button>
      </span>
    </div>`).join('');
  placar();
}
function placar() {
  const v = Object.values(S.votos);
  $('votacao-placar').textContent = `Sim: ${v.filter(x => x === 'sim').length} · Com ressalvas: ${v.filter(x => x === 'talvez').length} · Não: ${v.filter(x => x === 'nao').length} · Faltam votar: ${SETORES.length - v.length}`;
}
function encerrarVotacao() {
  const c = calc();
  if (c.rec > c.disp) return toast('A distribuição ultrapassa a água disponível.', 'negativo');
  if (c.abast < CONFIG.minEssencial * 100) return toast(`Critério legal: o abastecimento humano precisa de pelo menos ${Math.round(CONFIG.minEssencial * 100)}% de atendimento.`, 'negativo');
  SETORES.forEach(s => { if (!S.votos[s.id]) S.votos[s.id] = 'talvez'; });
  const sim = Object.values(S.votos).filter(v => v === 'sim').length;
  if (sim >= CONFIG.quorum) {
    S.acordo = true; S.coop = lim(S.coop + 10);
    addLog(`Acordo aprovado com ${sim} votos "sim" de ${SETORES.length}.`, 'positivo');
    mostrarResultado();
  } else {
    S.tentativas++; S.coop = lim(S.coop - 8);
    addLog(`Votação sem consenso: ${sim} votos "sim" (mínimo ${CONFIG.quorum}).`, 'negativo');
    if (S.tentativas >= CONFIG.tentativas) { S.acordo = false; mostrarResultado(); }
    else { toast('Sem consenso. Revisem a distribuição e as propostas e votem de novo.', 'negativo'); irFase(3); }
  }
}

/* ---------------- HISTÓRICO ---------------- */
function addLog(txt, tipo = '') {
  S.log.push({ txt, tipo });
  const h = $('historico');
  h.innerHTML = S.log.map(l => `<li class="${l.tipo}">${esc(l.txt)}</li>`).join('');
  h.scrollTop = h.scrollHeight;
}

/* ---------------- RELÓGIO ---------------- */
function iniciarRelogio() {
  pararRelogio();
  S.restante = CONFIG.minutosPorFase[S.fase - 1] * 60;
  mostrarRelogio();
  timer = setInterval(() => {
    if (S.pausado || S.restante <= 0) return;
    S.restante--; mostrarRelogio();
    if (S.restante === 0) toast('Tempo da fase esgotado. A mesa pode seguir quando estiver pronta.');
  }, 1000);
}
function pararRelogio() { if (timer) clearInterval(timer); timer = null; }
function mostrarRelogio() {
  const m = String(Math.floor(S.restante / 60)).padStart(2, '0'), s = String(S.restante % 60).padStart(2, '0');
  $('relogio-tempo').textContent = `${m}:${s}`;
  document.querySelector('.relogio').classList.toggle('urgente', S.restante <= 30);
}

/* ---------------- FASES ---------------- */
function fala(texto, autor = 'André Ribeiro, mediador') {
  $('fala-autor').textContent = autor;
  $('fala-texto').textContent = texto;
}
function irFase(n) {
  S.fase = n; S.pausado = false;
  $('btn-pausar').textContent = 'Pausar';
  $$('#etapas li').forEach(li => {
    const f = +li.dataset.fase;
    li.classList.toggle('ativa', f === n);
    li.classList.toggle('concluida', f < n);
  });
  $('bloco-interesses').hidden = n !== 1;
  $('bloco-distribuicao').hidden = !(n === 2 || n === 3);
  $('bloco-estrategias').hidden = n !== 3;
  $('bloco-votacao').hidden = n !== 4;
  const av = $('btn-avancar');
  av.hidden = (n === 2 || n === 4);
  if (n === 1) {
    av.textContent = 'Ir para a distribuição';
    const e = CONFIG.escassez[S.cen];
    fala(`${CONFIG.cenario.problema} Hoje há ${e.agua} UA para uma demanda de ${demandaTotal()} UA. Cada jogador lê a ficha do seu setor em voz alta. Atenção: posição é o que se pede; interesse é o que precisa acontecer. Regras: gentis com as pessoas, firmes com o problema, e decisões apoiadas em critérios objetivos. Não negociar não é opção, pois a lei exige gestão integrada e usos múltiplos.`);
  }
  if (n === 2) fala('Primeira proposta de distribuição. Critério legal: em escassez, o consumo humano e a dessedentação de animais vêm primeiro. Preencham a tabela sem ultrapassar a água disponível e justifiquem cada valor. Os botões de apoio ajudam a começar.');
  if (n === 3) {
    av.textContent = 'Ir para a votação';
    fala(`Hora de inventar opções de ganho mútuo. Escolham até ${CONFIG.maxPropostas} propostas entre as estratégias A, B e C. Cada uma muda a água disponível, a qualidade e a preservação. Depois, redistribuam a água extra e reconfirmem a distribuição.`);
  }
  if (n === 4) { fala('Hora de votar. Cada setor vota com base no que recebeu e no que foi acordado. O abastecimento humano precisa estar garantido e o limite de água respeitado.'); montarVotacao(); }
  iniciarRelogio();
  atualizar();
}
function avancar() {
  if (S.fase === 1) return irFase(2);
  if (S.fase === 3) {
    if (!S.mesa.length) return toast('Coloquem ao menos uma proposta na mesa antes de votar.', 'negativo');
    if (!S.distConfirmada) return toast('Redistribuam a água e cliquem em "Propor esta distribuição" antes de votar.', 'negativo');
    irFase(4);
  }
}

/* ---------------- RESULTADO ---------------- */
function mostrarResultado() {
  const c = calc(), e = CONFIG.escassez[S.cen];
  $('selo-resultado').classList.toggle('sem-acordo', !S.acordo);
  $('resultado-titulo').textContent = S.acordo ? 'Acordo alcançado' : 'Ausência de consenso';
  $('resultado-resumo').textContent = `Equilíbrio da bacia: ${c.equi}/100 · Cooperação: ${c.coop}/100 · Custo simulado das medidas: ${c.custo} (orçamento ${CONFIG.orcamento}).`;
  $('resultado-distribuicao').innerHTML = SETORES.map(s => {
    const r = S.recebido[s.id] || 0;
    return `<tr><th scope="row">${s.emoji} ${esc(s.setor)}</th><td>${s.demanda} UA</td><td>${r} UA</td><td>${Math.round(Math.min(1, r / s.demanda) * 100)}%</td></tr>`;
  }).join('');
  montarIndicadores($('resultado-indicadores'));
  atualizarIndicadores($('resultado-indicadores'), c);
  $('resultado-medidas').innerHTML = c.mesa.length
    ? c.mesa.map(p => `<li>${esc(p.nome)} (${p.est}. ${NOME_EST[p.est]}): +${p.ganho} UA, custo ${p.custo}, prazo ${esc(p.prazo)}.</li>`).join('')
    : '<li>Nenhuma medida escolhida.</li>';
  $('resultado-impactos').innerHTML =
    `<li>Qualidade da água: ${c.qual} (${sinal(c.qual - e.qual)} em relação ao início).</li>
     <li>Preservação ambiental: ${c.pres} (${sinal(c.pres - e.pres)} em relação ao início).</li>
     <li>Pressão sobre o rio: ${Math.round(c.rec / c.disp * 100)}% da água disponível foi destinada aos usos.</li>` +
    c.mesa.map(p => `<li>${esc(p.nome)}: ${esc(p.impacto)}</li>`).join('');
  $('resultado-satisfacao').innerHTML = SETORES.map(s => `
    <div class="indicador"><div class="indicador-topo"><span>${s.emoji} ${esc(s.setor)}</span><strong>${c.sat[s.id]}%</strong></div>
    <div class="barra"><div class="barra-preench ${c.sat[s.id] >= 66 ? 'alto' : c.sat[s.id] >= 40 ? 'medio' : 'baixo'}" style="width:${c.sat[s.id]}%"></div></div></div>`).join('');
  $('resultado-relatorio').innerHTML = S.log.map(l => `<li class="${l.tipo}">${esc(l.txt)}</li>`).join('');
  const menor = SETORES.slice().sort((a, b) => c.sat[a.id] - c.sat[b.id])[0];
  const risco = c.mesa.some(p => p.pres < 0);
  $('resultado-reflexao').innerHTML = [
    `O setor menos satisfeito foi ${menor.setor} (${c.sat[menor.id]}%). Que concessão ou proposta teria equilibrado melhor?`,
    'Que posições se mostraram, na verdade, interesses compatíveis?',
    'Por que "não negociar" não é alternativa na gestão de recursos hídricos?',
    risco ? 'Alguma nova fonte ou obra trouxe impacto ambiental. Ela é realmente sustentável?' : 'As medidas escolhidas têm limites técnicos. Quais são?',
    'Num conflito real, quem mais deveria estar à mesa (comunidades tradicionais, indígenas, quilombolas, ONGs)?'
  ].map(t => `<li>${esc(t)}</li>`).join('');
  mostrarTela('resultado');
}

/* ---------------- INÍCIO DA PARTIDA ---------------- */
function iniciarPartida() {
  const donos = S.donos;
  S = novoEstado();
  S.donos = donos;
  S.cen = $('sel-cenario').value;
  SETORES.forEach(s => { S.recebido[s.id] = 0; S.just[s.id] = ''; });
  montarPessoas(); montarInteresses(); montarTabela();
  montarIndicadores($('painel-indicadores'));
  $('historico').innerHTML = '<li class="vazio">As decisões aparecem aqui.</li>';
  mostrarTela('negociacao');
  irFase(1);
}
function encerrarPartida() {
  $$('.modal').forEach(m => { m.hidden = true; });
  pararRelogio();
  S = novoEstado();
  mostrarTela('menu');
  toast('Partida encerrada.');
}

/* ---------------- EVENTOS ---------------- */
function ligarEventos() {
  $('btn-iniciar').onclick = () => mostrarTela('preparacao');
  $('btn-como-jogar').onclick = () => abrirModal('modal-como-jogar');
  $('btn-creditos').onclick = () => abrirModal('modal-creditos');
  $$('[data-voltar]').forEach(b => b.onclick = () => mostrarTela(b.dataset.voltar));
  $$('[data-fechar]').forEach(b => b.onclick = () => fecharModal(b.closest('.modal')));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) fecharModal(m); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal').forEach(m => { if (!m.hidden) fecharModal(m); });
  });

  $('sel-cenario').onchange = atualizarDadosIniciais;
  $('sel-jogadores').onchange = sortear;
  $('btn-sortear').onclick = sortear;
  $('btn-comecar').onclick = iniciarPartida;

  $('btn-avancar').onclick = avancar;
  $('btn-pausar').onclick = () => { S.pausado = !S.pausado; $('btn-pausar').textContent = S.pausado ? 'Retomar' : 'Pausar'; };
  $('btn-cancelar-partida').onclick = () => abrirModal('modal-cancelar');
  $('btn-confirmar-cancelar').onclick = encerrarPartida;

  $('corpo-tabela-agua').addEventListener('input', e => {
    const tr = e.target.closest('tr'); if (!tr) return;
    const id = tr.dataset.id;
    if (e.target.classList.contains('in-just')) { S.just[id] = e.target.value; return; }
    if (e.target.classList.contains('in-rec')) {
      S.recebido[id] = Math.max(0, Math.floor(Number(e.target.value) || 0));
      S.distConfirmada = false;
      atualizar();
    }
  });
  $('btn-distribuir-proporcional').onclick = () => distribuir('proporcional');
  $('btn-priorizar-essenciais').onclick = () => distribuir('essenciais');
  $('btn-confirmar-distribuicao').onclick = confirmarDistribuicao;

  $('bloco-estrategias').addEventListener('click', e => {
    const aba = e.target.closest('.aba[data-estrategia]');
    if (aba) {
      $$('#bloco-estrategias .aba').forEach(a => { const on = a === aba; a.classList.toggle('ativa', on); a.setAttribute('aria-selected', on); });
      ['A', 'B', 'C'].forEach(x => { $('lista-' + x).hidden = aba.dataset.estrategia !== x; });
    }
    const b = e.target.closest('[data-propor]'); if (b) colocarNaMesa(b.dataset.propor);
  });
  $('propostas-mesa').addEventListener('click', e => {
    const b = e.target.closest('[data-retirar]'); if (b) retirarDaMesa(b.dataset.retirar);
  });

  $('votacao-lista').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    const linha = b.closest('.voto');
    S.votos[linha.dataset.id] = b.dataset.v;
    $$('button', linha).forEach(x => x.classList.toggle('escolhido', x === b));
    placar();
  });
  $('btn-fechar-votacao').onclick = encerrarVotacao;

  $('btn-imprimir').onclick = () => window.print();
  $('btn-reiniciar').onclick = () => { S = novoEstado(); mostrarTela('preparacao'); };
  $('btn-menu-final').onclick = () => { S = novoEstado(); mostrarTela('menu'); };
}

/* ---------------- INICIALIZAÇÃO ---------------- */
ligarEventos();
atualizarDadosIniciais();
