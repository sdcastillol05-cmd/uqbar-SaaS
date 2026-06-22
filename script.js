/* ════════════════════════════════════════
   UQBAR · script.js v1.2
════════════════════════════════════════ */

const SUPABASE_URL = 'https://ufpnpzbhcbgxiptbcmwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wqdLMWHV5iENUclFedGNvw_7eHBi7gO';

// URL de tu Edge Function (despliega supabase-edge-function/index.ts primero)
const AI_ADVICE_URL = `${SUPABASE_URL}/functions/v1/ai-advice`;
const AI_CACHE_KEY = 'uq-ai-advice-cache';
const AI_CACHE_HOURS = 6; // no volver a llamar a Gemini antes de este tiempo

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser    = null;
let currentProfile = null;
let allMovs        = [];
let activeType     = 'ingreso';
let activeFilter   = 'todos';
let weeklyChart    = null;

/* ════════════════════════════════════════
   BOOT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  initTheme();
  setDateGreeting();
  bindLogin();
  bindDashboard();

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
   DATE / GREETING
════════════════════════ */
function setDateGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const gEl = document.getElementById('greeting-time');
  if (gEl) gEl.textContent = greet;

  const dEl = document.getElementById('topbar-date');
  if (dEl) dEl.textContent = now.toLocaleDateString('es-CO', {
    weekday:'short', day:'numeric', month:'short', year:'numeric'
  });

  const mEl = document.getElementById('hb-month-label');
  if (mEl) mEl.textContent = now.toLocaleDateString('es-CO', { month:'long', year:'numeric' });
}

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
    inp.type  = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('btn-register').addEventListener('click', doRegister);
}

async function doLogin() {
  const email    = v('login-email').trim();
  const password = v('login-password');
  const errEl    = document.getElementById('login-error');
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
  setText('greeting-biz', biz);
  document.getElementById('mov-fecha').value = todayStr();
  await loadMovs();
  goDash();
  lucide.createIcons();
  loadAIAdvice(false);
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

  document.getElementById('btn-add-mov').addEventListener('click', addMov);
  document.getElementById('btn-ai-refresh').addEventListener('click', () => loadAIAdvice(true));
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
  const concepto = v('mov-concepto').trim();
  const valor    = parseFloat(v('mov-valor'));
  const nota     = v('mov-nota').trim();
  const fecha    = v('mov-fecha');
  if (!concepto)         return toast('Escribe un concepto.', 'error');
  if (!valor || valor<=0) return toast('Ingresa un valor mayor a cero.', 'error');
  if (!fecha)            return toast('Selecciona una fecha.', 'error');

  const btn = document.getElementById('btn-add-mov');
  btn.disabled = true; btn.innerHTML = '<span>Guardando…</span>';

  const { data, error } = await db.from('movimientos').insert({
    user_id:currentUser.id, tipo:activeType, concepto, valor, nota:nota||null, fecha
  }).select().single();

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="check"></i><span>Guardar</span>';
  lucide.createIcons();

  if (error) return toast('No se pudo guardar. Intenta de nuevo.', 'error');

  document.getElementById('mov-concepto').value = '';
  document.getElementById('mov-valor').value    = '';
  document.getElementById('mov-nota').value     = '';

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
  let hoy = 0, hoyN = 0, semana = 0, semN = 0, mes = 0, mesN = 0, gastos = 0;

  allMovs.forEach(m => {
    const vv = Number(m.valor);
    if (m.tipo === 'ingreso') {
      if (m.fecha === today) { hoy    += vv; hoyN++; }
      if (m.fecha >= lun)    { semana += vv; semN++; }
      if (m.fecha >= mesI)   { mes    += vv; mesN++; }
    } else {
      if (m.fecha >= mesI) gastos += vv;
    }
  });

  const balance = mes - gastos;
  const margen  = mes > 0 ? Math.round((balance / mes) * 100) : null;
  const maxVal  = Math.max(hoy, semana, mes, 1);

  setText('stat-hoy',    fmt(hoy));
  setText('stat-semana', fmt(semana));
  setText('stat-mes',    fmt(mes));
  setText('stat-gastos', fmt(gastos));
  setText('stat-total-count', String(allMovs.length));
  setText('bs-hoy-count',  `${hoyN} ingreso${hoyN !== 1 ? 's' : ''}`);
  setText('bs-sem-count',  `${semN} ingreso${semN !== 1 ? 's' : ''}`);
  setText('bs-mes-count',  `${mesN} ingreso${mesN !== 1 ? 's' : ''}`);

  const balEl = document.getElementById('stat-balance');
  if (balEl) { balEl.textContent = fmt(balance); balEl.className = 'ms-val ' + (balance >= 0 ? 'amber' : 'red'); }

  const mEl = document.getElementById('stat-margen');
  if (mEl)   { mEl.textContent = margen !== null ? `${margen}%` : '—'; }

  setBar('bar-hoy',    hoy    / maxVal * 100);
  setBar('bar-semana', semana / maxVal * 100);
  setBar('bar-mes',    mes    / maxVal * 100);
}

/* ════════════════════════════════════════
   RENDER LIST
════════════════════════ */
function renderMovs() {
  const list = document.getElementById('mov-list');
  const data = activeFilter === 'todos' ? allMovs : allMovs.filter(m => m.tipo === activeFilter);
  if (data.length === 0) {
    const labels = { todos:'movimientos', ingreso:'ingresos', gasto:'egresos' };
    list.innerHTML = `
      <div class="empty-st">
        <div class="empty-ico-wrap"><i data-lucide="inbox"></i></div>
        <p class="empty-title">Sin ${labels[activeFilter]} aún</p>
        <p class="empty-sub">Registra el primero en el panel de la izquierda</p>
      </div>`;
    lucide.createIcons();
    return;
  }
  list.innerHTML = data.map(m => {
    const fd = new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' });
    const sg = m.tipo === 'ingreso' ? '+' : '−';
    const ic = m.tipo === 'ingreso' ? 'arrow-down-left' : 'arrow-up-right';
    return `<div class="mov-item">
      <div class="mov-pill ${m.tipo}"><i data-lucide="${ic}"></i></div>
      <div class="mov-info">
        <div class="mov-concept">${esc(m.concepto)}</div>
        <div class="mov-meta">${fd}${m.nota ? ' · ' + esc(m.nota) : ''}</div>
      </div>
      <div class="mov-amt ${m.tipo}">${sg} ${fmt(m.valor)}</div>
      <button class="mov-del" onclick="deleteMov('${m.id}')" title="Eliminar"><i data-lucide="x"></i></button>
    </div>`;
  }).join('');
  lucide.createIcons();
}

/* ════════════════════════════════════════
   CHART — last 7 days
════════════════════════ */
function buildChart() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.35)';

  // Build last-7-days labels
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  const labels = days.map(d => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'short', day:'numeric' }));

  const inData  = days.map(d => allMovs.filter(m => m.tipo==='ingreso' && m.fecha===d).reduce((s,m)=>s+Number(m.valor),0));
  const outData = days.map(d => allMovs.filter(m => m.tipo==='gasto'   && m.fecha===d).reduce((s,m)=>s+Number(m.valor),0));

  const ctx = document.getElementById('chart-weekly');
  if (!ctx) return;

  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }

  const greenColor  = isDark ? 'rgba(110,231,183,.7)'   : 'rgba(5,150,105,.7)';
  const greenFill   = isDark ? 'rgba(110,231,183,.08)'  : 'rgba(5,150,105,.06)';
  const redColor    = isDark ? 'rgba(252,165,165,.65)'  : 'rgba(220,38,38,.65)';
  const redFill     = isDark ? 'rgba(252,165,165,.06)'  : 'rgba(220,38,38,.05)';

  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:'Ingresos', data:inData,
          backgroundColor: greenFill,
          borderColor: greenColor,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label:'Egresos', data:outData,
          backgroundColor: redFill,
          borderColor: redColor,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1a2a' : '#fff',
          titleColor: isDark ? '#a78bfa' : '#6340e8',
          bodyColor:  isDark ? '#e8e8f4' : '#0a0a14',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 10,
          titleFont: { family: "'Bricolage Grotesque',sans-serif", weight:'700', size:12 },
          bodyFont:  { family: "'Plus Jakarta Sans',sans-serif", size:12 },
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid:  { color: gridColor, drawBorder: false },
          ticks: { color: tickColor, font: { family:"'Plus Jakarta Sans',sans-serif", size:10, weight:'600' } },
          border: { display: false }
        },
        y: {
          grid:  { color: gridColor, drawBorder: false },
          ticks: {
            color: tickColor,
            font: { family:"'Plus Jakarta Sans',sans-serif", size:10 },
            callback: v => v === 0 ? '0' : v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'k' : v
          },
          border: { display: false }
        }
      },
      interaction: { mode: 'index', intersect: false },
      animation:   { duration: 600, easing: 'easeInOutQuart' }
    }
  });
}

function rebuildChart() {
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  buildChart();
}

/* ════════════════════════════════════════
   AI ADVICE — Gemini via Supabase Edge Function
════════════════════════ */
async function loadAIAdvice(forceRefresh) {
  const bodyEl = document.getElementById('ai-body');
  const refreshBtn = document.getElementById('btn-ai-refresh');

  // Revisar caché local (por usuario) si no se fuerza refresh
  if (!forceRefresh) {
    const cached = getAICache();
    if (cached) {
      renderAdvice(cached.advice);
      return;
    }
  }

  // Loading state
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_KEY
      }
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

  if (lines.length === 0) {
    bodyEl.innerHTML = `<p class="ai-empty">${esc(text)}</p>`;
    return;
  }

  bodyEl.innerHTML = `<div class="ai-advice-list">${
    lines.map((line, i) => `
      <div class="ai-advice-item" style="animation-delay:${i * 0.08}s">
        <span class="ai-advice-num">${i + 1}</span>
        <span>${esc(line)}</span>
      </div>`).join('')
  }</div>`;
}

// Frases introductorias/de cierre comunes que Gemini agrega aunque se le pida que no lo haga.
// Si una "línea" empieza así (sin numeración propia), se descarta en vez de mostrarse como consejo.
const AI_INTRO_PATTERNS = [
  /^aqu[ií]\s+(tienes|est[aá]n|van)/i,
  /^claro[,.]?/i,
  /^estos?\s+son/i,
  /^te\s+(comparto|dejo|doy)/i,
  /^basad[oa]\s+en/i,
  /^con\s+gusto/i,
  /^perfecto[,.]?/i,
  /^espero\s+que/i,
  /^¡?listo[,!.]?/i,
];

function parseAdviceLines(text) {
  // 1. Normalizar saltos de línea y dividir
  let raw = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);

  // 2. Si Gemini metió todo en una sola línea (ej: "1. Algo 2. Otra cosa 3. Más"),
  //    separar por el patrón "número + punto" en medio del texto.
  if (raw.length <= 1 && raw[0]) {
    const split = raw[0].split(/(?=\d+\.\s)/g).map(s => s.trim()).filter(Boolean);
    if (split.length > 1) raw = split;
  }

  // 3. Quitar numeración/guiones al inicio de cada línea ("1. ", "1) ", "- ", "• ")
  const cleaned = raw.map(l => l.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, '').trim());

  // 4. Descartar líneas vacías tras limpiar, o que coincidan con frases de intro/cierre
  const finalLines = cleaned.filter(l => {
    if (!l) return false;
    if (l.length < 8) return false; // demasiado corta para ser un consejo real
    return !AI_INTRO_PATTERNS.some(rx => rx.test(l));
  });

  return finalLines;
}

function getAICache() {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY + '-' + (currentUser?.id || ''));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ageHours = (Date.now() - parsed.timestamp) / 36e5;
    if (ageHours > AI_CACHE_HOURS) return null;
    return parsed;
  } catch { return null; }
}

function setAICache(advice) {
  try {
    localStorage.setItem(
      AI_CACHE_KEY + '-' + (currentUser?.id || ''),
      JSON.stringify({ advice, timestamp: Date.now() })
    );
  } catch {}
}

/* ════════════════════════════════════════
   HELPERS
════════════════════════ */
function todayStr()     { return new Date().toISOString().split('T')[0]; }
function weekStartStr() {
  const now = new Date(), day = now.getDay();
  const d   = new Date(now);
  d.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
}
function monthStartStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
}
function fmt(n) {
  return new Intl.NumberFormat('es-CO', {
    style:'currency', currency:'COP',
    minimumFractionDigits:0, maximumFractionDigits:0
  }).format(n);
}
function v(id)           { return (document.getElementById(id)?.value || ''); }
function setText(id,txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setBar(id,pct)  { const el = document.getElementById(id); if (el) el.style.width = Math.min(100,pct)+'%'; }
function showErr(el,msg) {
  el.textContent = msg; el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
let _toastT;
function toast(msg, type='') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.className = `toast ${type} show`;
  t.classList.remove('hidden');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 300);
  }, 2800);
  const ico = t.querySelector('.t-ico');
  if (ico) {
    ico.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
    lucide.createIcons();
  }
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
