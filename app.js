/* ===================================================
   CHAVEAMENTO 3v3 — RioRise RP PVP
   app.js
   =================================================== */

/* ===== DADOS ===== */
const EQUIPES = Array.from({ length: 12 }, (_, i) => 'Equipe ' + (i + 1));
const CORES  = ['gA', 'gB', 'gC', 'gD'];
const NOMES  = ['A', 'B', 'C', 'D'];

/* ===================================================
   UTILIDADES
   =================================================== */

/**
 * Embaralha um array (Fisher-Yates) e retorna uma cópia.
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ===================================================
   SORTEIO PRINCIPAL
   =================================================== */

/**
 * Realiza um novo sorteio e re-renderiza todas as seções.
 */
function sortear() {
  const eq = shuffle(EQUIPES);
  const grupos = [
    eq.slice(0, 3),
    eq.slice(3, 6),
    eq.slice(6, 9),
    eq.slice(9, 12),
  ];
  renderGrupos(grupos);
  renderPontuacao(grupos);
  renderMata(grupos);
}

/* ===================================================
   FASE DE GRUPOS
   =================================================== */

/**
 * Renderiza os cards de grupos no #grupos-grid.
 * @param {string[][]} grupos - Array de 4 grupos, cada um com 3 equipes.
 */
function renderGrupos(grupos) {
  const grid = document.getElementById('grupos-grid');
  grid.innerHTML = '';

  grupos.forEach((g, gi) => {
    /* Card */
    const card = document.createElement('div');
    card.className = 'grupo-card ' + CORES[gi];

    /* Header */
    const header = document.createElement('div');
    header.className = 'grupo-header';
    header.innerHTML = `<span class="grupo-dot"></span>Grupo ${NOMES[gi]}`;
    card.appendChild(header);

    /* Equipes */
    const eqs = document.createElement('div');
    eqs.className = 'grupo-equipes';

    g.forEach((eq, i) => {
      const row = document.createElement('div');
      row.className = 'equipe-row ' + (i < 2 ? 'avanca' : 'nao-avanca');

      const posClass = ['pos-1', 'pos-2', 'pos-3'][i];
      const posNum   = ['1°', '2°', '3°'][i];
      const tag      = i < 2 ? '<span class="avanca-tag">✓</span>' : '';

      row.innerHTML = `
        <span class="pos-badge ${posClass}">${posNum}</span>
        <span style="flex:1">${eq}</span>
        ${tag}
      `;
      eqs.appendChild(row);
    });
    card.appendChild(eqs);

    /* Partidas dentro do grupo */
    const jogos = document.createElement('div');
    jogos.className = 'grupo-jogos';
    jogos.innerHTML = '<div class="jogo-label">Partidas</div>';

    const pares = [[0, 1], [0, 2], [1, 2]];
    pares.forEach(([a, b], ji) => {
      const item = document.createElement('div');
      item.className = 'jogo-item';
      const nA = g[a].replace('Equipe', 'Eq.');
      const nB = g[b].replace('Equipe', 'Eq.');
      item.innerHTML = `
        <span class="jogo-num">J${ji + 1}</span>
        <span>${nA} <span style="color:var(--text3)">vs</span> ${nB}</span>
      `;
      jogos.appendChild(item);
    });
    card.appendChild(jogos);

    grid.appendChild(card);
  });
}

/* ===================================================
   TABELA DE PONTUAÇÃO
   =================================================== */

/**
 * Renderiza as tabelas de pontuação editáveis no #pontuacao-grid.
 * @param {string[][]} grupos
 */
function renderPontuacao(grupos) {
  const grid = document.getElementById('pontuacao-grid');
  grid.innerHTML = '';

  grupos.forEach((g, gi) => {
    const card = document.createElement('div');
    card.className = 'pont-card ' + CORES[gi];

    /* Header */
    const header = document.createElement('div');
    header.className = 'pont-header';
    header.innerHTML = `<span class="grupo-dot"></span>Grupo ${NOMES[gi]}`;
    card.appendChild(header);

    /* Tabela */
    const table = document.createElement('table');
    table.className = 'pont-table';
    table.innerHTML = `
      <colgroup>
        <col class="col-eq">
        <col class="col-num">
        <col class="col-num">
        <col class="col-num">
        <col class="col-pts">
      </colgroup>
      <thead>
        <tr>
          <th>Equipe</th>
          <th>J</th>
          <th>V</th>
          <th>D</th>
          <th>Pts</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');

    g.forEach((eq, i) => {
      const tr = document.createElement('tr');
      tr.className = 'row-' + (i + 1);
      const nome = eq.replace('Equipe ', 'Eq. ');

      tr.innerHTML = `
        <td>${nome}</td>
        <td><input class="input-pts" type="number" min="0" max="2" value="" placeholder="-" oninput="calcPts(this)"></td>
        <td><input class="input-pts" type="number" min="0" max="2" value="" placeholder="-" oninput="calcPts(this)"></td>
        <td><input class="input-pts" type="number" min="0" max="2" value="" placeholder="-" oninput="calcPts(this)"></td>
        <td class="pts-cell" id="pts-${gi}-${i}">—</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    grid.appendChild(card);
  });
}

/**
 * Recalcula e exibe os pontos (V × 3) ao editar um input.
 * Chamado via oninput inline nos inputs gerados.
 * @param {HTMLInputElement} input
 */
function calcPts(input) {
  const tr        = input.closest('tr');
  const tbody     = tr.parentElement;
  const pontCard  = tr.closest('.pont-card');
  const gi        = Array.from(document.querySelectorAll('.pont-card')).indexOf(pontCard);
  const ri        = Array.from(tbody.children).indexOf(tr);
  const cells     = tr.querySelectorAll('input');

  /* Colunas: J=0, V=1, D=2  →  Pts = V × 3 */
  const v   = parseInt(cells[1].value) || 0;
  const pts = v * 3;

  const ptsCel = document.getElementById('pts-' + gi + '-' + ri);
  if (ptsCel) {
    ptsCel.textContent =
      cells[1].value === '' && cells[0].value === '' ? '—' : pts;
  }
}

/* ===================================================
   MATA-MATA (Quartas → Semi → Final)
   =================================================== */

/**
 * Cria um elemento de time dentro de um match-box.
 * @param {string}  label
 * @param {string}  cor      - classe CSS (tA, tB, tC, tD, tX)
 * @param {boolean} isFinal  - adiciona badge MD3 se true
 * @returns {HTMLElement}
 */
function makeTeam(label, cor, isFinal) {
  const d = document.createElement('div');
  d.className = 'match-team ' + (cor || 'tX');

  let inner = `<span class="match-team-name">${label}</span>`;
  if (isFinal) inner += `<span class="md3-tag">MD3</span>`;
  d.innerHTML = inner;

  return d;
}

/**
 * Cria um match-box com dois times.
 * @param {string}  t1, t2   - labels dos times
 * @param {string}  c1, c2   - classes de cor
 * @param {boolean} isFinal
 * @returns {HTMLElement}
 */
function makeMatch(t1, c1, t2, c2, isFinal) {
  const wrap = document.createElement('div');
  const box  = document.createElement('div');
  box.className = 'match-box' + (isFinal ? ' final-box' : '');
  box.appendChild(makeTeam(t1, c1, isFinal));
  box.appendChild(makeTeam(t2, c2, isFinal));
  wrap.appendChild(box);
  return wrap;
}

/**
 * Cria uma coluna de rodada (label + lista de confrontos).
 * @param {string}        label
 * @param {HTMLElement[]} matches
 * @returns {HTMLElement}
 */
function makeRound(label, matches) {
  const col = document.createElement('div');
  col.className = 'round-col';

  const lbl = document.createElement('div');
  lbl.className = 'round-label';
  lbl.textContent = label;
  col.appendChild(lbl);

  const mw = document.createElement('div');
  mw.className = 'round-matches';
  matches.forEach(m => mw.appendChild(m));
  col.appendChild(mw);

  return col;
}

/**
 * Cria um conector SVG entre rodadas.
 * @param {number} n - número de linhas/pares a conectar
 * @returns {HTMLElement}
 */
function makeConn(n) {
  const c = document.createElement('div');
  c.className = 'connector';
  c.style.cssText = 'width:26px;align-self:stretch;display:flex;align-items:center';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '26');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 26 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'width:26px;height:100%;display:block';

  const stroke = 'rgba(204,34,34,0.3)';

  for (let i = 0; i < n; i++) {
    const y1   = (100 / (n * 2)) * (2 * i + 1);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M0 ${y1} L13 ${y1} L13 50 L26 50`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
  }

  c.appendChild(svg);
  return c;
}

/**
 * Renderiza o bracket de mata-mata completo no #mata-mata.
 * @param {string[][]} grupos
 */
function renderMata(grupos) {
  const mm = document.getElementById('mata-mata');
  mm.innerHTML = '';

  /* Quartas de Final */
  const qMatches = [
    makeMatch('1º Grupo A', 'tA', '2º Grupo B', 'tB'),
    makeMatch('1º Grupo B', 'tB', '2º Grupo A', 'tA'),
    makeMatch('1º Grupo C', 'tC', '2º Grupo D', 'tD'),
    makeMatch('1º Grupo D', 'tD', '2º Grupo C', 'tC'),
  ];
  mm.appendChild(makeRound('Quartas de Final', qMatches));
  mm.appendChild(makeConn(4));

  /* Semifinal */
  const sMatches = [
    makeMatch('Venc. Q1', 'tX', 'Venc. Q2', 'tX'),
    makeMatch('Venc. Q3', 'tX', 'Venc. Q4', 'tX'),
  ];
  mm.appendChild(makeRound('Semifinal', sMatches));
  mm.appendChild(makeConn(2));

  /* Troféu central */
  const trophyCol = document.createElement('div');
  trophyCol.className = 'trophy-col';
  trophyCol.innerHTML = `
    <div class="trophy-label">Final</div>
    <div class="trophy-icon">🏆</div>
    <div class="trophy-label" style="font-size:9px;letter-spacing:1.5px;color:var(--text3)">Melhor de 3</div>
  `;
  mm.appendChild(trophyCol);
  mm.appendChild(makeConn(2));

  /* Final */
  const fMatch = [makeMatch('Venc. Semi 1', 'tX', 'Venc. Semi 2', 'tX', true)];
  mm.appendChild(makeRound('Campeão', fMatch));
}

/* ===================================================
   INICIALIZAÇÃO
   =================================================== */

// Botão de sorteio
document.addEventListener('DOMContentLoaded', () => {
  const btnSortear = document.getElementById('btn-sortear');
  if (btnSortear) btnSortear.addEventListener('click', sortear);

  // Primeiro sorteio automático
  sortear();
});
