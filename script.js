/* ════════════════════════════════════════
   UQBAR · script.js v1.4
════════════════════════════════════════ */

const SUPABASE_URL = 'https://ufpnpzbhcbgxiptbcmwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wqdLMWHV5iENUclFedGNvw_7eHBi7gO';

const AI_ADVICE_URL = `${SUPABASE_URL}/functions/v1/ai-advice`;
const AI_CACHE_KEY = 'uq-ai-advice-cache';
const AI_CACHE_HOURS = 6;

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser    = null;
let currentProfile = null;
let allMovs        = [];
let activeType     = 'ingreso';
let activeFilter   = 'todos';
let isFiado        = false;
let weeklyChart    = null;

/* ════════════════════════════════════════
   BOOT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  initTheme();
  bindLogin();
  bindDashboard();
  bindBizEdit();
  bindAddTxToggle();

  const { data: { session } } = await db.auth.getSession();
  if (session?.user) await bootUser(session.user);

  db.auth.onAuthStateChange(async (ev, session) => {
    if (ev === 'SIGNED_IN' && session?.user) await bootUser(session.user);
    else if (ev === 'SIGNED_OUT') goLogin();
  });
});

/* ════════════════════════════════════════
   THEME
════════════════════════ */
function initTheme() {
  const t = localStorage.getItem('uq-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
}
document.getElementById('btn-theme').addEventListener('click', () => {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('uq-theme', next);
  lucide.createIcons();
  if (weeklyChart) rebuildChart();
});

/* ════════════════════════════════════════
   LOGIN
════════════════════════ */
function bindLogin() {
  document.getElementById('to-register').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form-wrap').classList.add('hidden');
    document.getElementById('register-form-wrap').classList.remove('hidden');
  });
  document.getElementById('to-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('register-form-wrap').classList.add('hidden');
    document.getElementById('login-form-wrap').classList.remove('hidden');
  });
  document.getElementById('eye-login')?.addEventListener('click', () => {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('btn-register').addEventListener('click', doRegister);
}

async function doLogin() {
  const email = v('login-email').trim(), password = v('login-password');
  const errEl = document.getElementById('login-error');
  if (!email || !password) return showErr(errEl, 'Completa los dos campos.');
  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Ingresando…';
  const { error } = await db.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.innerHTML = '<span>Entrar</span>';
  lucide.createIcons();
  if (error) showErr(errEl, error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message);
}

async function doRegister() {
  const biz = v('reg-business').trim(), email = v('reg-email').trim(), pw = v('reg-password');
  const errEl = document.getElementById('reg-error');
  if (!biz || !email || !pw) return showErr(errEl, 'Completa todos los campos.');
  if (pw.length < 6)         return showErr(errEl, 'La contraseña necesita al menos 6 caracteres.');
  const btn = document.getElementById('btn-register');
  btn.disabled = true; btn.textContent = 'Creando cuenta…';
  const { data, error } = await db.auth.signUp({ email, password: pw });
  btn.disabled = false; btn.innerHTML = '<span>Crear cuenta</span>';
  lucide.createIcons();
  if (error) return showErr(errEl, error.message);
  if (data?.user) {
    await db.from('perfiles').insert({ user_id: data.user.id, nombre_negocio: biz, email });
    toast('¡Cuenta creada! Bienvenido a Uqbar', 'success');
  }
}

async function doLogout() {
  await db.auth.signOut();
  allMovs = [];
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  goLogin();
}

/* ════════════════════════════════════════
   SCREENS
════════════════════════ */
function goLogin() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('active');
}
function goDash() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('active');
}

/* ════════════════════════════════════════
   BOOT USER
════════════════════════ */
async function bootUser(user) {
  currentUser = user;
  const { data: perfil } = await db.from('perfiles').select('*').eq('user_id', user.id).single();
  currentProfile = perfil;
  const biz = perfil?.nombre_negocio || 'Mi negocio';

  setText('topbar-biz-name', biz);
  setText('page-title', `${biz} · Resumen`);

  // Avatar con la inicial del negocio
  const initial = biz.trim().charAt(0).toUpperCase() || 'U';
  setText('nav-avatar-user', initial);

  document.getElementById('mov-fecha').value = todayStr();
  await loadMovs();
  goDash();
  lucide.createIcons();
  loadAIAdvice(false);
}

/* ════════════════════════════════════════
   EDITAR NOMBRE DEL NEGOCIO
════════════════════════ */
function bindBizEdit() {
  const nameEl  = document.getElementById('topbar-biz-name');
  const inputEl = document.getElementById('biz-edit-input');
  const btnEl   = document.getElementById('biz-edit-btn');

  function enterEditMode() {
    inputEl.value = nameEl.textContent;
    nameEl.classList.add('hidden');
    inputEl.classList.remove('hidden');
    inputEl.focus();
    inputEl.select();
  }

  async function saveEdit() {
    const newName = inputEl.value.trim();
    inputEl.classList.add('hidden');
    nameEl.classList.remove('hidden');
    if (!newName || newName === nameEl.textContent) return;

    nameEl.textContent = newName;
    setText('page-title', `${newName} · Resumen`);
    setText('nav-avatar-user', newName.trim().charAt(0).toUpperCase() || 'U');

    if (!currentUser) return;
    const { error } = await db.from('perfiles').update({ nombre_negocio: newName }).eq('user_id', currentUser.id);
    toast(error ? 'No se pudo guardar el nombre. Intenta de nuevo.' : 'Nombre del negocio actualizado', error ? 'error' : 'success');
  }

  btnEl.addEventListener('click', enterEditMode);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') inputEl.blur();
    if (e.key === 'Escape') { inputEl.classList.add('hidden'); nameEl.classList.remove('hidden'); }
  });
  inputEl.addEventListener('blur', saveEdit);
}

/* ════════════════════════════════════════
   ADD TRANSACTION — collapsible toggle
════════════════════════ */
function bindAddTxToggle() {
  const trigger = document.getElementById('add-tx-trigger');
  const form = document.getElementById('add-tx-form');
  const chevron = document.getElementById('add-tx-chevron');

  trigger.addEventListener('click', () => {
    const isHidden = form.classList.contains('hidden');
    form.classList.toggle('hidden');
    chevron.classList.toggle('open', isHidden);
  });
}

/* ════════════════════════════════════════
   DASHBOARD BIND
════════════════════════ */
function bindDashboard() {
  document.getElementById('btn-logout').addEventListener('click', doLogout);

  document.querySelectorAll('.tseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      const isIn = activeType === 'ingreso';
      setText('label-concepto', isIn ? '¿Qué ingresó?' : '¿En qué se gastó?');
      document.getElementById('mov-concepto').placeholder = isIn ? 'Ej: Servicio de consultoría' : 'Ej: Insumos de producción';
      document.getElementById('fiado-row').style.display = isIn ? 'block' : 'none';
      if (!isIn) setFiado(false);
    });
  });

  document.querySelectorAll('.fseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderMovs();
    });
  });

  document.getElementById('fiado-toggle').addEventListener('click', () => setFiado(!isFiado));
  document.getElementById('btn-add-mov').addEventListener('click', addMov);
  document.getElementById('btn-ai-refresh').addEventListener('click', () => loadAIAdvice(true));
}

function setFiado(val) {
  isFiado = val;
  document.getElementById('fiado-toggle').classList.toggle('active', val);
}

/* ════════════════════════════════════════
   MOVIMIENTOS CRUD
════════════════════════ */
async function loadMovs() {
  if (!currentUser) return;
  const { data } = await db
    .from('movimientos').select('*')
    .eq('user_id', currentUser.id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  allMovs = data || [];
  calcStats();
  renderMovs();
  buildChart();
}

async function addMov() {
  const concepto  = v('mov-concepto').trim();
  const valor     = parseFloat(v('mov-valor'));
  const nota      = v('mov-nota').trim();
  const fecha     = v('mov-fecha');
  const medioPago = v('mov-medio-pago');
  const cliente   = v('mov-cliente').trim();

  if (!concepto)          return toast('Escribe un concepto.', 'error');
  if (!valor || valor<=0) return toast('Ingresa un valor mayor a cero.', 'error');
  if (!fecha)             return toast('Selecciona una fecha.', 'error');

  const btn = document.getElementById('btn-add-mov');
  btn.disabled = true; btn.innerHTML = '<span>Guardando…</span>';

  const { data, error } = await db.from('movimientos').insert({
    user_id: currentUser.id,
    tipo: activeType,
    concepto,
    valor,
    nota: nota || null,
    fecha,
    medio_pago: medioPago,
    cliente: cliente || null,
    es_fiado: activeType === 'ingreso' ? isFiado : false
  }).select().single();

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="check"></i><span>Guardar</span>';
  lucide.createIcons();

  if (error) return toast('No se pudo guardar. Intenta de nuevo.', 'error');

  document.getElementById('mov-concepto').value = '';
  document.getElementById('mov-valor').value    = '';
  document.getElementById('mov-nota').value     = '';
  document.getElementById('mov-cliente').value  = '';
  setFiado(false);

  allMovs.unshift(data);
  calcStats();
  renderMovs();
  buildChart();
  toast(activeType === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado', 'success');
}

async function deleteMov(id) {
  const { error } = await db.from('movimientos').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) return toast('No se pudo eliminar.', 'error');
  allMovs = allMovs.filter(m => m.id !== id);
  calcStats();
  renderMovs();
  buildChart();
  lucide.createIcons();
}

/* ════════════════════════════════════════
   STATS
════════════════════════ */
function calcStats() {
  const today = todayStr(), lun = weekStartStr(), mesI = monthStartStr();
  let hoy = 0, semana = 0, mes = 0, gastos = 0, fiadoTotal = 0, totalIngHist = 0, totalGastoHist = 0;

  allMovs.forEach(m => {
    const vv = Number(m.valor);
    if (m.tipo === 'ingreso') {
      if (m.fecha === today) hoy    += vv;
      if (m.fecha >= lun)    semana += vv;
      if (m.fecha >= mesI)   mes    += vv;
      if (m.es_fiado) fiadoTotal += vv;
      totalIngHist += vv;
    } else {
      if (m.fecha >= mesI) gastos += vv;
      totalGastoHist += vv;
    }
  });

  const balanceMes  = mes - gastos;
  const balanceHist = totalIngHist - totalGastoHist;
  const margen = mes > 0 ? Math.round((balanceMes / mes) * 100) : null;

  setText('stat-balance', fmt(balanceHist));
  setText('stat-hoy',     fmt(hoy));
  setText('stat-semana',  fmt(semana));
  setText('stat-mes',     fmt(mes));
  setText('stat-gastos',  fmt(gastos));
  setText('stat-total-count', String(allMovs.length));
  setText('stat-margen',  margen !== null ? `${margen}%` : '—');

  // Badges
  const marginBadge = document.getElementById('kpi-margin-badge');
  if (marginBadge) {
    marginBadge.innerHTML = `<i data-lucide="trending-up"></i>${margen !== null ? margen + '% margen' : 'Sin datos'}`;
  }
  const healthBadge = document.getElementById('kpi-health-badge');
  if (healthBadge) {
    let label = 'Sin datos', cls = '';
    if (margen !== null) {
      if (margen >= 30) { label = 'Saludable'; cls=''; }
      else if (margen >= 10) { label = 'Estable'; cls='warn'; }
      else { label = 'Ajustado'; cls='alert'; }
    }
    healthBadge.innerHTML = `<i data-lucide="trending-up"></i>${label}`;
  }

  // Cash flow legend totals (last 7 days)
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenStr = sevenDaysAgo.toISOString().split('T')[0];
  const incomeWeek  = allMovs.filter(m => m.tipo==='ingreso' && m.fecha >= sevenStr).reduce((s,m)=>s+Number(m.valor),0);
  const expenseWeek = allMovs.filter(m => m.tipo==='gasto'   && m.fecha >= sevenStr).reduce((s,m)=>s+Number(m.valor),0);
  setText('cf-income-total', fmt(incomeWeek));
  setText('cf-expense-total', fmt(expenseWeek));

  setText('tx-count-label', `${allMovs.length} registro${allMovs.length !== 1 ? 's' : ''}`);

  lucide.createIcons();
}

/* ════════════════════════════════════════
   RENDER LIST
════════════════════════ */
const MEDIO_PAGO_LABELS = { efectivo:'Efectivo', transferencia:'Transferencia', tarjeta:'Tarjeta', otro:'Otro' };

function renderMovs() {
  const list = document.getElementById('mov-list');
  let data;
  if (activeFilter === 'todos')      data = allMovs;
  else if (activeFilter === 'fiado') data = allMovs.filter(m => m.es_fiado);
  else data = allMovs.filter(m => m.tipo === activeFilter);

  if (data.length === 0) {
    const labels = { todos:'movimientos', ingreso:'ingresos', gasto:'egresos', fiado:'fiados' };
    list.innerHTML = `
      <div class="empty-st">
        <div class="empty-ico-wrap"><i data-lucide="inbox"></i></div>
        <p class="empty-title">Sin ${labels[activeFilter]} aún</p>
        <p class="empty-sub">Registra el primero con el botón inferior</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  list.innerHTML = data.map(m => {
    const fd = new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' });
    const sg = m.tipo === 'ingreso' ? '+' : '−';
    const ic = m.tipo === 'ingreso' ? 'arrow-down-left' : 'arrow-up-right';
    const fiadoBadge = m.es_fiado ? `<span class="badge badge-fiado"><i data-lucide="clock-3"></i>Fiado</span>` : '';
    const pagoBadge  = m.medio_pago ? `<span class="badge badge-pago">${esc(MEDIO_PAGO_LABELS[m.medio_pago] || m.medio_pago)}</span>` : '';
    const clienteTxt = m.cliente ? ` · ${esc(m.cliente)}` : '';

    return `<div class="mov-item">
      <div class="mov-pill ${m.tipo}"><i data-lucide="${ic}"></i></div>
      <div class="mov-info">
        <div class="mov-concept-row">
          <span class="mov-concept">${esc(m.concepto)}</span>
          ${fiadoBadge}${pagoBadge}
        </div>
        <div class="mov-meta">${fd}${clienteTxt}${m.nota ? ' · ' + esc(m.nota) : ''}</div>
      </div>
      <div class="mov-amt ${m.tipo}">${sg} ${fmt(m.valor)}</div>
      <button class="mov-del" onclick="deleteMov('${m.id}')" title="Eliminar"><i data-lucide="x"></i></button>
    </div>`;
  }).join('');

  lucide.createIcons();
}

/* ════════════════════════════════════════
   CHART — last 7 days, area style like mockup
════════════════════════ */
function buildChart() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(180,150,255,0.07)' : 'rgba(45,28,127,0.06)';
  const tickColor = isDark ? 'rgba(180,150,255,0.38)' : 'rgba(45,28,127,0.45)';

  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); }
  const labels = days.map(d => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'short' }));

  const inData  = days.map(d => allMovs.filter(m => m.tipo==='ingreso' && m.fecha===d).reduce((s,m)=>s+Number(m.valor),0));
  const outData = days.map(d => allMovs.filter(m => m.tipo==='gasto'   && m.fecha===d).reduce((s,m)=>s+Number(m.valor),0));

  const ctx = document.getElementById('chart-weekly');
  if (!ctx) return;
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }

  const accentSolid = isDark ? '#9163ff' : '#6536d8';
  const accentFillTop = isDark ? 'rgba(145,99,255,0.28)' : 'rgba(101,54,216,0.18)';
  const accentFillBottom = isDark ? 'rgba(145,99,255,0)' : 'rgba(101,54,216,0)';
  const amberSolid = isDark ? '#FFB020' : '#b45309';

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 190);
  gradient.addColorStop(0, accentFillTop);
  gradient.addColorStop(1, accentFillBottom);

  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [
      {
        label:'Ingresos', data:inData,
        borderColor:accentSolid, backgroundColor:gradient,
        borderWidth:2.5, fill:true, tension:.4,
        pointRadius:3, pointBackgroundColor:accentSolid, pointBorderColor:isDark?'#181229':'#fff', pointBorderWidth:2,
        pointHoverRadius:5,
      },
      {
        label:'Egresos', data:outData,
        borderColor:amberSolid, backgroundColor:'transparent',
        borderWidth:2, borderDash:[5,4], fill:false, tension:.4,
        pointRadius:2.5, pointBackgroundColor:amberSolid, pointBorderColor:isDark?'#181229':'#fff', pointBorderWidth:1.5,
        pointHoverRadius:4,
      }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{ display:false },
        tooltip: {
          backgroundColor: isDark ? '#211836' : '#fff',
          titleColor: isDark ? '#c4b0ff' : '#5226c4',
          bodyColor:  isDark ? '#f1ecff' : '#160f30',
          borderColor: isDark ? 'rgba(180,150,255,0.18)' : 'rgba(45,28,127,0.12)',
          borderWidth:1, cornerRadius:11, padding:11,
          titleFont:{ family:"'Bricolage Grotesque',sans-serif", weight:'700', size:12 },
          bodyFont:{ family:"'Plus Jakarta Sans',sans-serif", size:12 },
          callbacks: { label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` }
        }
      },
      scales: {
        x: { grid:{ display:false }, ticks:{ color:tickColor, font:{ family:"'Plus Jakarta Sans',sans-serif", size:10, weight:'600' } }, border:{ display:false } },
        y: { grid:{ color:gridColor, drawBorder:false },
             ticks:{ color:tickColor, font:{ family:"'Plus Jakarta Sans',sans-serif", size:10 },
                     callback: val => val===0?'0': val>=1000000?(val/1000000).toFixed(1)+'M': val>=1000?(val/1000).toFixed(0)+'k': val },
             border:{ display:false } }
      },
      interaction:{ mode:'index', intersect:false },
      animation:{ duration:600, easing:'easeInOutQuart' }
    }
  });
}
function rebuildChart() { if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; } buildChart(); }

/* ════════════════════════════════════════
   AI ADVICE — Gemini via Supabase Edge Function
════════════════════════ */
async function loadAIAdvice(forceRefresh) {
  const bodyEl = document.getElementById('ai-body');
  const refreshBtn = document.getElementById('btn-ai-refresh');

  if (!forceRefresh) {
    const cached = getAICache();
    if (cached) { renderAdvice(cached.advice); return; }
  }

  bodyEl.innerHTML = `
    <div class="ai-loading">
      <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
      <span class="ai-loading-text">Analizando tu negocio…</span>
    </div>`;
  refreshBtn.classList.add('spinning');

  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) throw new Error('Sin sesión activa');

    const res = await fetch(AI_ADVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}`, 'apikey': SUPABASE_KEY }
    });

    const data = await res.json();
    refreshBtn.classList.remove('spinning');

    if (!res.ok || data.error) {
      bodyEl.innerHTML = `<p class="ai-error">No se pudieron generar consejos en este momento. Intenta de nuevo más tarde.</p>`;
      return;
    }

    renderAdvice(data.advice);
    setAICache(data.advice);

  } catch (err) {
    refreshBtn.classList.remove('spinning');
    bodyEl.innerHTML = `<p class="ai-error">No se pudo conectar con el asistente de IA. Verifica tu conexión.</p>`;
  }
}

function renderAdvice(text) {
  const bodyEl = document.getElementById('ai-body');
  const lines = parseAdviceLines(text);
  if (lines.length === 0) { bodyEl.innerHTML = `<p class="ai-empty">${esc(text)}</p>`; return; }

  bodyEl.innerHTML = `<div class="ai-advice-list">${
    lines.map((line, i) => `
      <div class="ai-advice-item" style="animation-delay:${i * 0.08}s">
        <span class="ai-advice-num">${i + 1}</span>
        <span>${esc(line)}</span>
      </div>`).join('')
  }</div>`;
}

const AI_INTRO_PATTERNS = [
  /^aqu[ií]\s+(tienes|est[aá]n|van)/i, /^claro[,.]?/i, /^estos?\s+son/i,
  /^te\s+(comparto|dejo|doy)/i, /^basad[oa]\s+en/i, /^con\s+gusto/i,
  /^perfecto[,.]?/i, /^espero\s+que/i, /^¡?listo[,!.]?/i,
];

function parseAdviceLines(text) {
  let raw = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  if (raw.length <= 1 && raw[0]) {
    const split = raw[0].split(/(?=\d+\.\s)/g).map(s => s.trim()).filter(Boolean);
    if (split.length > 1) raw = split;
  }
  const cleaned = raw.map(l => l.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, '').trim());
  return cleaned.filter(l => l && l.length >= 8 && !AI_INTRO_PATTERNS.some(rx => rx.test(l)));
}

function getAICache() {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY + '-' + (currentUser?.id || ''));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if ((Date.now() - parsed.timestamp) / 36e5 > AI_CACHE_HOURS) return null;
    return parsed;
  } catch { return null; }
}
function setAICache(advice) {
  try { localStorage.setItem(AI_CACHE_KEY + '-' + (currentUser?.id || ''), JSON.stringify({ advice, timestamp: Date.now() })); } catch {}
}

/* ════════════════════════════════════════
   HELPERS
════════════════════════ */
function todayStr()     { return new Date().toISOString().split('T')[0]; }
function weekStartStr() { const now=new Date(), day=now.getDay(); const d=new Date(now); d.setDate(now.getDate()+(day===0?-6:1-day)); return d.toISOString().split('T')[0]; }
function monthStartStr(){ const now=new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`; }
function fmt(n) { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0}).format(n); }
function v(id) { return (document.getElementById(id)?.value || ''); }
function setText(id,txt) { const el=document.getElementById(id); if (el) el.textContent = txt; }
function showErr(el,msg) { el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),4000); }

let _toastT;
function toast(msg, type='') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.className = `toast ${type} show`;
  t.classList.remove('hidden');
  clearTimeout(_toastT);
  _toastT = setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.classList.add('hidden'),300); }, 2800);
  const ico = t.querySelector('.t-ico');
  if (ico) { ico.setAttribute('data-lucide', type==='error'?'alert-circle':'check-circle'); lucide.createIcons(); }
}
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
