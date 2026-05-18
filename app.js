/* ===================================================
   CHAVEAMENTO 3v3 — RioRise RP PVP
   app.js
   =================================================== */

/* ===== DADOS ===== */
const EQUIPES = Array.from({ length: 12 }, (_, i) => 'Equipe ' + (i + 1));
const CORES  = ['gA', 'gB', 'gC', 'gD'];
const NOMES  = ['A', 'B', 'C', 'D'];

/* ===== SENHA DE ADMIN ===== */
const ADMIN_PASSWORD = 'riorise2025'; // ← TROQUE AQUI
const STORAGE_KEY    = 'riorise_state';
let   isAdmin        = false;

/* ===== CANAL DE TEMPO REAL (entre abas/dispositivos via localStorage) ===== */
const BC = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('riorise_pvp') : null;

function broadcastState() {
  const state = collectState();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
  if (BC) BC.postMessage({ type: 'state', state });
}

if (BC) {
  BC.onmessage = (ev) => {
    if (ev.data && ev.data.type === 'state') {
      applyState(ev.data.state, false);
    }
  };
}

window.addEventListener('storage', (ev) => {
  if (ev.key === STORAGE_KEY && ev.newValue) {
    try {
      const state = JSON.parse(ev.newValue);
      applyState(state, false);
    } catch(e) {}
  }
});

/* ===== COLETA ESTADO ATUAL ===== */
function collectState() {
  const tables = [];
  document.querySelectorAll('.pont-card').forEach((card) => {
    const rows = [];
    card.querySelectorAll('tbody tr').forEach((tr) => {
      const inputs = tr.querySelectorAll('input');
      rows.push([inputs[0].value, inputs[1].value, inputs[2].value]);
    });
    tables.push(rows);
  });
  return { tables, grupos: window._currentGrupos };
}

/* ===== APLICA ESTADO ===== */
function applyState(state, broadcast) {
  if (!state || !state.tables) return;
  const cards = document.querySelectorAll('.pont-card');
  state.tables.forEach((rows, gi) => {
    const card = cards[gi];
    if (!card) return;
    const trs = card.querySelectorAll('tbody tr');
    rows.forEach((vals, ri) => {
      const tr = trs[ri];
      if (!tr) return;
      const inputs = tr.querySelectorAll('input');
      inputs[0].value = vals[0];
      inputs[1].value = vals[1];
      inputs[2].value = vals[2];
      calcPts(inputs[0]);
    });
  });
  if (broadcast) broadcastState();
}

/* ===== BLOQUEIO DE INPUTS ===== */
function setInputsLocked(locked) {
  document.querySelectorAll('.input-pts').forEach(inp => {
    inp.disabled = locked;
    inp.style.cursor = locked ? 'not-allowed' : '';
    inp.style.opacity = locked ? '0.45' : '';
  });
}

/* ===== MODAL DE SENHA ===== */
function showPasswordModal() {
  // Remove modal anterior se existir
  const old = document.getElementById('admin-modal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'admin-modal';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.82);
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(4px);
  `;

  overlay.innerHTML = `
    <div style="
      background:var(--panel);
      border:1px solid var(--border-b);
      padding:28px 32px 24px;
      clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%);
      text-align:center;
      min-width:280px;
      box-shadow:0 0 40px rgba(204,34,34,0.3);
    ">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:5px;color:var(--accent2);margin-bottom:4px;">ACESSO ADMIN</div>
      <div style="font-size:12px;color:var(--text2);letter-spacing:2px;margin-bottom:18px;">INSIRA A SENHA PARA EDITAR</div>
      <input id="admin-pwd-input" type="password" placeholder="••••••••"
        style="
          font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;
          background:var(--bg2);border:1px solid var(--border);border-radius:2px;
          color:var(--text);text-align:center;padding:8px 14px;width:100%;
          outline:none;letter-spacing:4px;margin-bottom:12px;
        "
      >
      <div id="admin-pwd-err" style="color:var(--accent);font-size:11px;letter-spacing:2px;min-height:16px;margin-bottom:10px;"></div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button id="admin-cancel-btn" style="
          font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;
          text-transform:uppercase;padding:7px 20px;border:1px solid var(--border);
          background:var(--panel2);color:var(--text2);cursor:pointer;
          clip-path:polygon(6px 0%,calc(100% - 6px) 0%,100% 50%,calc(100% - 6px) 100%,6px 100%,0% 50%);
        ">Cancelar</button>
        <button id="admin-ok-btn" style="
          font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;
          text-transform:uppercase;padding:7px 20px;border:1px solid var(--border-b);
          background:var(--accent);color:#fff;cursor:pointer;
          clip-path:polygon(6px 0%,calc(100% - 6px) 0%,100% 50%,calc(100% - 6px) 100%,6px 100%,0% 50%);
        ">Entrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = document.getElementById('admin-pwd-input');
  const err   = document.getElementById('admin-pwd-err');
  input.focus();

  const tryLogin = () => {
    if (input.value === ADMIN_PASSWORD) {
      isAdmin = true;
      overlay.remove();
      setInputsLocked(false);
      updateAdminButton();
    } else {
      err.textContent = '✖ SENHA INCORRETA';
      input.value = '';
      input.focus();
    }
  };

  document.getElementById('admin-ok-btn').addEventListener('click', tryLogin);
  document.getElementById('admin-cancel-btn').addEventListener('click', () => overlay.remove());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
}

function updateAdminButton() {
  const btn = document.getElementById('btn-admin');
  if (!btn) return;
  if (isAdmin) {
    btn.textContent = '🔓 Admin';
    btn.style.borderColor = 'var(--gB)';
    btn.style.color = '#44dd88';
  } else {
    btn.textContent = '🔒 Admin';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

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
  window._currentGrupos = grupos;
  renderGrupos(grupos);
  renderPontuacao(grupos);
  renderMata(grupos);
  renderClassificacao();
  setInputsLocked(!isAdmin);
  /* Tenta restaurar estado salvo do localStorage */
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) applyState(JSON.parse(saved), false);
  } catch(e) {}
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
        <td class="pts-cell">—</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    grid.appendChild(card);
  });
}

/**
 * Recalcula pontos (V × 3) e reordena as linhas do grupo por pontuação.
 * Chamado via oninput inline nos inputs gerados.
 * @param {HTMLInputElement} input
 * @param {boolean} [skipBroadcast] - se true, não propaga (evita loop)
 */
function calcPts(input, skipBroadcast) {
  const tr       = input.closest('tr');
  const tbody    = tr.parentElement;
  const pontCard = tr.closest('.pont-card');
  const gi       = Array.from(document.querySelectorAll('.pont-card')).indexOf(pontCard);

  /* Recalcula pontos de cada linha */
  const rows = Array.from(tbody.children);
  rows.forEach((row) => {
    const cells   = row.querySelectorAll('input');
    const v       = parseInt(cells[1].value) || 0;
    const hasData = cells[0].value !== '' || cells[1].value !== '';
    const pts     = hasData ? v * 3 : null;

    /* pts-cell está DENTRO da própria linha — sem depender de ID externo */
    const ptsCel = row.querySelector('.pts-cell');
    if (ptsCel) ptsCel.textContent = pts !== null ? pts : '—';

    /* guarda pts no dataset para ordenação */
    row.dataset.pts = pts !== null ? pts : -1;
  });

  /* Reordena linhas por pontos (maior primeiro), estável */
  const sorted = [...rows].sort((a, b) => {
    const pA = parseInt(a.dataset.pts);
    const pB = parseInt(b.dataset.pts);
    if (pA === -1 && pB === -1) return 0;
    if (pA === -1) return 1;
    if (pB === -1) return -1;
    return pB - pA;
  });

  /* Só move se a ordem mudou */
  const changed = sorted.some((row, i) => row !== rows[i]);
  if (changed) {
    sorted.forEach(row => tbody.appendChild(row));

    /* Atualiza classes e badges de posição */
    Array.from(tbody.children).forEach((row, i) => {
      row.className = 'row-' + (i + 1);
      const badge = row.querySelector('.pos-badge');
      if (badge) {
        badge.className = 'pos-badge ' + ['pos-1', 'pos-2', 'pos-3'][i];
        badge.textContent = ['1°', '2°', '3°'][i];
      }
    });
  }

  /* Propaga para outras abas/dispositivos (apenas quando chamado pelo admin) */
  if (!skipBroadcast) broadcastState();
}

/* ===================================================
   MATA-MATA (Quartas → Final → Semi → Campeão)
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
 * @param {string}  [id]     - id opcional para o box
 * @returns {HTMLElement}
 */
function makeMatch(t1, c1, t2, c2, isFinal, id) {
  const wrap = document.createElement('div');
  const box  = document.createElement('div');
  box.className = 'match-box' + (isFinal ? ' final-box' : '');
  if (id) box.id = id;
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
 * Cria um conector SVG proporcional entre rodadas.
 * Conecta N match-boxes de uma coluna a N/2 da próxima (ou 1 se convergindo).
 * @param {number} fromCount - número de match-boxes na coluna de origem
 * @param {number} toCount   - número de match-boxes na coluna de destino
 * @returns {HTMLElement}
 */
function makeConn(fromCount, toCount) {
  const c = document.createElement('div');
  c.className = 'connector';
  c.style.cssText = 'width:32px;align-self:stretch;display:flex;align-items:center;flex-shrink:0';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 32 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'width:32px;height:100%;display:block';

  const stroke = 'rgba(204,34,34,0.45)';
  const strokeW = '1.5';

  if (fromCount === toCount) {
    /* Linhas retas: cada from conecta direto ao to correspondente */
    for (let i = 0; i < fromCount; i++) {
      const y = (100 / (fromCount * 2)) * (2 * i + 1);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', '32');
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', stroke);
      line.setAttribute('stroke-width', strokeW);
      svg.appendChild(line);
    }
  } else if (fromCount > toCount) {
    /* Convergir: pares de from → um to */
    const pairs = fromCount / toCount; /* normalmente 2 */
    for (let g = 0; g < toCount; g++) {
      const yTo = (100 / (toCount * 2)) * (2 * g + 1);
      for (let p = 0; p < pairs; p++) {
        const idx  = g * pairs + p;
        const yFrom = (100 / (fromCount * 2)) * (2 * idx + 1);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M0 ${yFrom} L16 ${yFrom} L16 ${yTo} L32 ${yTo}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', strokeW);
        svg.appendChild(path);
      }
    }
  } else {
    /* Divergir: um from → múltiplos to (usado antes do troféu→semi) */
    for (let i = 0; i < toCount; i++) {
      const yTo   = (100 / (toCount * 2)) * (2 * i + 1);
      const yFrom = 50;
      const path  = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M0 ${yFrom} L16 ${yFrom} L16 ${yTo} L32 ${yTo}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', strokeW);
      svg.appendChild(path);
    }
  }

  c.appendChild(svg);
  return c;
}

/**
 * Renderiza o bracket de mata-mata:
 * Quartas → [conn] → Semi → [conn] → Final → [conn] → Campeão
 * @param {string[][]} grupos
 */
function renderMata(grupos) {
  const mm = document.getElementById('mata-mata');
  mm.innerHTML = '';

  /* ── Quartas de Final ── */
  const qMatches = [
    makeMatch('1º Grupo A', 'tA', '1º Grupo B', 'tB'),
    makeMatch('2º Grupo A', 'tB', '2º Grupo B', 'tA'),
    makeMatch('1º Grupo C', 'tC', '1º Grupo D', 'tD'),
    makeMatch('2º Grupo C', 'tD', '2º Grupo D', 'tC'),
  ];
  mm.appendChild(makeRound('Quartas de Final', qMatches));
  mm.appendChild(makeConn(4, 2));

  /* ── Semifinal ── */
  const sMatches = [
    makeMatch('Venc. Q1', 'tX', 'Venc. Q2', 'tX'),
    makeMatch('Perd. Q3', 'tX', 'Perd. Q4', 'tX'),
  ];
  const semiCol = makeRound('Semifinal', sMatches);
  const semiNote = document.createElement('div');
  semiNote.style.cssText = 'font-size:9px;letter-spacing:1.5px;color:var(--bronze);text-align:center;margin-top:-12px;margin-bottom:4px;font-family:"Rajdhani",sans-serif;font-weight:700;';
  semiNote.textContent = '▲ DISPUTA 3° LUGAR';
  semiCol.appendChild(semiNote);
  mm.appendChild(semiCol);
  mm.appendChild(makeConn(2, 1));

  /* ── Troféu / Final ── */
  const trophyCol = document.createElement('div');
  trophyCol.className = 'trophy-col';
  trophyCol.innerHTML = `
    <div class="trophy-label">Final</div>
    <div class="trophy-icon">🏆</div>
    <div class="trophy-label" style="font-size:9px;letter-spacing:1.5px;color:var(--text3)">Melhor de 3</div>
  `;
  mm.appendChild(trophyCol);
  mm.appendChild(makeConn(1, 1));

  /* ── Tabela Final (sem label "Campeão" em cima) ── */
  const finalMatch = [makeMatch('Venc. Semi 1', 'tX', 'Venc. Semi 2', 'tX', true)];
  const finalCol = document.createElement('div');
  finalCol.className = 'round-col';
  /* Espaçador vazio no lugar do label para manter alinhamento vertical */
  const lblSpacer = document.createElement('div');
  lblSpacer.className = 'round-label';
  lblSpacer.innerHTML = '&nbsp;';
  finalCol.appendChild(lblSpacer);
  const finalMw = document.createElement('div');
  finalMw.className = 'round-matches';
  finalMatch.forEach(m => finalMw.appendChild(m));
  finalCol.appendChild(finalMw);
  mm.appendChild(finalCol);

  mm.appendChild(makeConn(1, 1));

  /* ── Campeão (uma única linha — vencedor da final) ── */
  const campWrap = document.createElement('div');
  const campBox  = document.createElement('div');
  campBox.className = 'match-box final-box camp-box';
  campBox.appendChild(makeTeam('Vencedor da Final', 'tGold', true));
  campWrap.appendChild(campBox);
  mm.appendChild(makeRound('Campeão', [campWrap]));
}

/* ===================================================
   CLASSIFICAÇÃO FINAL
   =================================================== */

/**
 * Renderiza a seção de Classificação Final com cards premium.
 * Atualiza automaticamente conforme progresso do bracket.
 * Por ora exibe estado inicial "aguardando"; 
 * pode ser expandido com inputs de resultado.
 */
function renderClassificacao() {
  const wrap = document.getElementById('classif-section');
  if (!wrap) return;

  wrap.innerHTML = `

    <!-- Cards de colocação -->
    <div class="classif-grid">
      <div class="classif-card c2">
        <div class="classif-icon">🥈</div>
        <div class="classif-place">2º Lugar</div>
        <div class="classif-name" id="classif-2">
          <span class="classif-empty">Aguardando final</span>
        </div>
      </div>
      <div class="classif-card c1">
        <div class="classif-icon">🏆</div>
        <div class="classif-place">1º Lugar</div>
        <div class="classif-name" id="classif-1">
          <span class="classif-empty">Aguardando final</span>
        </div>
      </div>
      <div class="classif-card c3">
        <div class="classif-icon">🥉</div>
        <div class="classif-place">3º Lugar</div>
        <div class="classif-name" id="classif-3">
          <span class="classif-empty">Aguardando disputa</span>
        </div>
      </div>
    </div>
  `;
}



/* ===================================================
   INICIALIZAÇÃO
   =================================================== */

// Botão de sorteio + botão admin
document.addEventListener('DOMContentLoaded', () => {
  const btnSortear = document.getElementById('btn-sortear');
  if (btnSortear) btnSortear.addEventListener('click', sortear);

  const btnAdmin = document.getElementById('btn-admin');
  if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
      if (isAdmin) {
        /* Logout */
        isAdmin = false;
        setInputsLocked(true);
        updateAdminButton();
      } else {
        showPasswordModal();
      }
    });
  }

  // Primeiro sorteio automático
  sortear();
});