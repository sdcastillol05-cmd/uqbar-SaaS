/* ════════════════════════════════════════
   UQBAR · script.js — v1.1
   Supabase Auth + Movimientos + Theme
════════════════════════════════════════ */

// ── CONFIG Supabase ──
const SUPABASE_URL = 'https://ufpnpzbhcbgxiptbcmwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wqdLMWHV5iENUclFedGNvw_7eHBi7gO';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ──
let currentUser    = null;
let currentProfile = null;
let allMovs        = [];
let activeType     = 'ingreso';
let activeFilter   = 'todos';

// ════════════════════════════════════════
// BOOT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();   // render all lucide icons
  initTheme();
  setDate();
  bindLogin();
  bindDashboard();

  const { data: { session } } = await db.auth.getSession();
  if (session?.user) await bootDashboard(session.user);

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await bootDashboard(session.user);
    else if (event === 'SIGNED_OUT') showLogin();
  });
});

// ════════════════════════════════════════
// THEME
// ════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('uq-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

document.getElementById('btn-theme')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('uq-theme', next);
  lucide.createIcons();
});

// ════════════════════════════════════════
// DATE / GREETING
// ════════════════════════════════════════
function setDate() {
  const now  = new Date();
  const hour = now.getHours();

  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const greetEl  = document.getElementById('hero-greeting-text');
  if (greetEl) greetEl.textContent = greeting;

  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
function bindLogin() {
  // Toggle forms
  document.getElementById('link-to-register').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form-wrap').classList.add('hidden');
    document.getElementById('register-form-wrap').classList.remove('hidden');
  });
  document.getElementById('link-to-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('register-form-wrap').classList.add('hidden');
    document.getElementById('login-form-wrap').classList.remove('hidden');
  });

  // Show/hide password
  document.getElementById('btn-eye-login')?.addEventListener('click', () => {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('btn-register').addEventListener('click', doRegister);
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  if (!email || !password) return showErr(errEl, 'Completa los dos campos.');

  const btn = document.getElementById('btn-login');
  setLoading(btn, true, 'Entrando…');

  const { error } = await db.auth.signInWithPassword({ email, password });
  setLoading(btn, false, '<span>Entrar</span>');

  if (error) {
    const msg = error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message;
    showErr(errEl, msg);
  }
}

async function doRegister() {
  const biz      = document.getElementById('reg-business').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('reg-error');

  if (!biz || !email || !password) return showErr(errEl, 'Completa todos los campos.');
  if (password.length < 6) return showErr(errEl, 'La contraseña debe tener al menos 6 caracteres.');

  const btn = document.getElementById('btn-register');
  setLoading(btn, true, 'Creando tu espacio…');

  const { data, error } = await db.auth.signUp({ email, password });
  setLoading(btn, false, '<span>Crear mi espacio</span>');

  if (error) return showErr(errEl, error.message);

  if (data?.user) {
    await db.from('perfiles').insert({
      user_id: data.user.id,
      nombre_negocio: biz,
      email
    });
    toast('¡Todo listo! Bienvenido a Uqbar', 'success');
  }
}

async function doLogout() {
  await db.auth.signOut();
  allMovs = [];
  showLogin();
}

// ════════════════════════════════════════
// SCREENS
// ════════════════════════════════════════
function showLogin() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('active');
}
function showDash() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('active');
}

// ════════════════════════════════════════
// BOOT DASHBOARD
// ════════════════════════════════════════
async function bootDashboard(user) {
  currentUser = user;

  const { data: perfil } = await db.from('perfiles')
    .select('*').eq('user_id', user.id).single();

  currentProfile = perfil;

  const bizName = perfil?.nombre_negocio || 'Mi negocio';
  document.getElementById('topbar-biz-name').textContent = bizName;
  document.getElementById('hero-biz-display').textContent = bizName;

  // Default date = today
  document.getElementById('mov-fecha').value = todayStr();

  await loadMovs();
  showDash();
  lucide.createIcons();
}

// ════════════════════════════════════════
// DASHBOARD UI
// ════════════════════════════════════════
function bindDashboard() {
  document.getElementById('btn-logout').addEventListener('click', doLogout);

  // Type tabs
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      const isIngreso = activeType === 'ingreso';
      document.getElementById('label-concepto').textContent = isIngreso ? '¿Qué vendiste?' : '¿En qué gastaste?';
      document.getElementById('mov-concepto').placeholder   = isIngreso ? 'Ej: Corte de cabello' : 'Ej: Proveedor telas';
    });
  });

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      renderMovs();
    });
  });

  document.getElementById('btn-add-mov').addEventListener('click', addMov);
}

// ════════════════════════════════════════
// MOVIMIENTOS
// ════════════════════════════════════════
async function loadMovs() {
  if (!currentUser) return;
  const { data } = await db
    .from('movimientos')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  allMovs = data || [];
  calcStats();
  renderMovs();
}

async function addMov() {
  const concepto = document.getElementById('mov-concepto').value.trim();
  const valor    = parseFloat(document.getElementById('mov-valor').value);
  const nota     = document.getElementById('mov-nota').value.trim();
  const fecha    = document.getElementById('mov-fecha').value;

  if (!concepto)         return toast('Escribe un concepto.', 'error');
  if (!valor || valor <= 0) return toast('Ingresa un valor mayor a cero.', 'error');
  if (!fecha)            return toast('Selecciona una fecha.', 'error');

  const btn = document.getElementById('btn-add-mov');
  setLoading(btn, true, 'Guardando…');

  const { data, error } = await db.from('movimientos').insert({
    user_id: currentUser.id,
    tipo: activeType,
    concepto,
    valor,
    nota: nota || null,
    fecha
  }).select().single();

  setLoading(btn, false, '');
  if (error) return toast('No se pudo guardar. Intenta de nuevo.', 'error');

  // Reset form fields (keep date and type)
  document.getElementById('mov-concepto').value = '';
  document.getElementById('mov-valor').value    = '';
  document.getElementById('mov-nota').value     = '';

  allMovs.unshift(data);
  calcStats();
  renderMovs();

  const label = activeType === 'ingreso' ? 'Entrada registrada' : 'Gasto registrado';
  toast(label, 'success');
  lucide.createIcons();
}

async function deleteMov(id) {
  const { error } = await db.from('movimientos').delete()
    .eq('id', id).eq('user_id', currentUser.id);
  if (error) return toast('No se pudo eliminar.', 'error');

  allMovs = allMovs.filter(m => m.id !== id);
  calcStats();
  renderMovs();
  lucide.createIcons();
}

// ════════════════════════════════════════
// STATS
// ════════════════════════════════════════
function calcStats() {
  const today = todayStr();
  const lunes = weekStartStr();
  const mesI  = monthStartStr();

  let hoy = 0, semana = 0, mes = 0, gastos = 0;

  allMovs.forEach(m => {
    const v = Number(m.valor);
    if (m.tipo === 'ingreso') {
      if (m.fecha === today) hoy    += v;
      if (m.fecha >= lunes)  semana += v;
      if (m.fecha >= mesI)   mes    += v;
    } else {
      if (m.fecha >= mesI) gastos += v;
    }
  });

  const balance = mes - gastos;
  const maxVal  = Math.max(hoy, semana, mes, 1);

  setText('stat-hoy',     fmt(hoy));
  setText('stat-semana',  fmt(semana));
  setText('stat-mes',     fmt(mes));
  setText('stat-gastos',  fmt(gastos));

  const balEl = document.getElementById('stat-balance');
  if (balEl) {
    balEl.textContent = fmt(balance);
    balEl.className   = 'mini-value ' + (balance >= 0 ? 'amber' : 'red');
  }

  // Progress bars (relative to max ingreso)
  setBar('bar-hoy',    hoy / maxVal * 100);
  setBar('bar-semana', semana / maxVal * 100);
  setBar('bar-mes',    mes / maxVal * 100);
}

// ════════════════════════════════════════
// RENDER
// ════════════════════════════════════════
function renderMovs() {
  const list = document.getElementById('mov-list');
  const data = activeFilter === 'todos'
    ? allMovs
    : allMovs.filter(m => m.tipo === activeFilter);

  if (data.length === 0) {
    const labels = { todos: 'movimientos', ingreso: 'entradas', gasto: 'salidas' };
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-wrap"><i data-lucide="inbox"></i></div>
        <p class="empty-title">Sin ${labels[activeFilter]} aún</p>
        <p class="empty-sub">${activeFilter === 'todos' ? 'Registra tu primer movimiento' : 'Cambia el filtro o agrega uno nuevo'}</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  list.innerHTML = data.map(m => {
    const fecha  = new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    const signo  = m.tipo === 'ingreso' ? '+' : '−';
    const icon   = m.tipo === 'ingreso' ? 'arrow-down-left' : 'arrow-up-right';
    return `
    <div class="mov-item">
      <div class="mov-pill ${m.tipo}"><i data-lucide="${icon}"></i></div>
      <div class="mov-info">
        <div class="mov-concepto">${esc(m.concepto)}</div>
        <div class="mov-meta">${fecha}${m.nota ? ' · ' + esc(m.nota) : ''}</div>
      </div>
      <div class="mov-amount ${m.tipo}">${signo} ${fmt(m.valor)}</div>
      <button class="mov-del" onclick="deleteMov('${m.id}')" title="Eliminar">
        <i data-lucide="x"></i>
      </button>
    </div>`;
  }).join('');

  lucide.createIcons();
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function weekStartStr() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().split('T')[0];
}
function monthStartStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
}

function fmt(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, pct) + '%';
}

function showErr(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

let toastTimer;
function toast(msg, type = '') {
  const t   = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  txt.textContent = msg;
  t.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 300);
  }, 2800);
  t.classList.remove('hidden');

  // Update toast icon
  const icon = t.querySelector('.toast-icon');
  if (icon) {
    icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle');
    lucide.createIcons();
  }
}

function setLoading(btn, loading, html) {
  btn.disabled = loading;
  if (!loading && html) btn.innerHTML = html;
  else if (loading) btn.textContent = html;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
