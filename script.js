/* ══════════════════════════════════════════
   UQBAR · FINANZAS — script.js
   Supabase Auth + Movimientos por cliente
══════════════════════════════════════════ */

// ── CONFIG: reemplaza con tus credenciales de Supabase ──
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── STATE ──
let currentUser = null;
let currentProfile = null;
let allMovimientos = [];
let activeType = 'ingreso';
let activeFilter = 'todos';

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  setDate();
  bindLoginUI();
  bindDashboardUI();

  // Verificar sesión activa
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    await handleAuth(session.user);
  }

  // Escuchar cambios de auth
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await handleAuth(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLogin();
    }
  });
});

// ── FECHA ──
function setDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
function bindLoginUI() {
  // Cambio de pantallas
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

  // Login
  document.getElementById('btn-login').addEventListener('click', handleLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Registro
  document.getElementById('btn-register').addEventListener('click', handleRegister);
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (!email || !password) return showErr(errEl, 'Completa todos los campos.');

  const btn = document.getElementById('btn-login');
  btn.textContent = 'Ingresando…';
  btn.disabled = true;

  const { error } = await db.auth.signInWithPassword({ email, password });
  btn.textContent = 'Entrar';
  btn.disabled = false;

  if (error) {
    const msg = error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message;
    showErr(errEl, msg);
  }
}

async function handleRegister() {
  const biz     = document.getElementById('reg-business').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl   = document.getElementById('reg-error');

  if (!biz || !email || !password) return showErr(errEl, 'Completa todos los campos.');
  if (password.length < 6) return showErr(errEl, 'La contraseña debe tener al menos 6 caracteres.');

  const btn = document.getElementById('btn-register');
  btn.textContent = 'Creando…';
  btn.disabled = true;

  const { data, error } = await db.auth.signUp({ email, password });
  btn.textContent = 'Crear cuenta';
  btn.disabled = false;

  if (error) return showErr(errEl, error.message);

  // Crear perfil del negocio
  if (data?.user) {
    await db.from('perfiles').insert({
      user_id: data.user.id,
      nombre_negocio: biz,
      email
    });
    showToast('¡Cuenta creada! Bienvenido a Uqbar.', 'success');
  }
}

async function handleAuth(user) {
  currentUser = user;

  // Cargar perfil
  const { data: perfil } = await db.from('perfiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  currentProfile = perfil;

  if (perfil?.nombre_negocio) {
    document.getElementById('topbar-biz-name').textContent = perfil.nombre_negocio;
  }

  // Setear fecha por defecto en el formulario
  document.getElementById('mov-fecha').value = new Date().toISOString().split('T')[0];

  await loadMovimientos();
  showDashboard();
}

async function logout() {
  await db.auth.signOut();
  allMovimientos = [];
  showLogin();
}

// ══════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════
function showLogin() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('active');
}

function showDashboard() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('screen-dashboard').classList.remove('hidden');
}

// ══════════════════════════════════════════
// DASHBOARD UI
// ══════════════════════════════════════════
function bindDashboardUI() {
  // Logout
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Tabs de tipo (ingreso / gasto)
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeType = tab.dataset.type;
      document.getElementById('label-concepto').textContent =
        activeType === 'ingreso' ? 'Producto / servicio' : 'Concepto del gasto';
      document.getElementById('mov-concepto').placeholder =
        activeType === 'ingreso' ? 'Ej: Corte de cabello' : 'Ej: Proveedor telas';
    });
  });

  // Filtros de historial
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderMovimientos();
    });
  });

  // Guardar movimiento
  document.getElementById('btn-add-mov').addEventListener('click', addMovimiento);
}

// ══════════════════════════════════════════
// MOVIMIENTOS — CRUD
// ══════════════════════════════════════════
async function loadMovimientos() {
  if (!currentUser) return;

  const { data, error } = await db
    .from('movimientos')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  allMovimientos = data || [];
  calcStats();
  renderMovimientos();
}

async function addMovimiento() {
  const concepto = document.getElementById('mov-concepto').value.trim();
  const valor    = parseFloat(document.getElementById('mov-valor').value);
  const nota     = document.getElementById('mov-nota').value.trim();
  const fecha    = document.getElementById('mov-fecha').value;

  if (!concepto) return showToast('Escribe un concepto.', 'error');
  if (!valor || valor <= 0) return showToast('Ingresa un valor válido.', 'error');
  if (!fecha) return showToast('Selecciona una fecha.', 'error');

  const btn = document.getElementById('btn-add-mov');
  btn.textContent = 'Guardando…';
  btn.disabled = true;

  const { data, error } = await db.from('movimientos').insert({
    user_id: currentUser.id,
    tipo: activeType,
    concepto,
    valor,
    nota: nota || null,
    fecha
  }).select().single();

  btn.textContent = 'Guardar';
  btn.disabled = false;

  if (error) return showToast('Error al guardar. Intenta de nuevo.', 'error');

  // Limpiar form
  document.getElementById('mov-concepto').value = '';
  document.getElementById('mov-valor').value = '';
  document.getElementById('mov-nota').value = '';

  allMovimientos.unshift(data);
  calcStats();
  renderMovimientos();

  const emoji = activeType === 'ingreso' ? '✅' : '🔴';
  showToast(`${emoji} ${activeType === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado`, 'success');
}

async function deleteMovimiento(id) {
  const { error } = await db.from('movimientos').delete().eq('id', id).eq('user_id', currentUser.id);
  if (error) return showToast('Error al eliminar.', 'error');

  allMovimientos = allMovimientos.filter(m => m.id !== id);
  calcStats();
  renderMovimientos();
  showToast('Movimiento eliminado', '');
}

// ══════════════════════════════════════════
// STATS
// ══════════════════════════════════════════
function calcStats() {
  const now     = new Date();
  const todayStr  = now.toISOString().split('T')[0];

  // Inicio de semana (lunes)
  const day     = now.getDay();
  const diffLun = (day === 0 ? -6 : 1 - day);
  const lunes   = new Date(now);
  lunes.setDate(now.getDate() + diffLun);
  const lunesStr = lunes.toISOString().split('T')[0];

  // Inicio de mes
  const mesStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  let hoy = 0, semana = 0, mes = 0, gastosMes = 0;

  allMovimientos.forEach(m => {
    const f = m.fecha;
    const v = Number(m.valor);
    if (m.tipo === 'ingreso') {
      if (f === todayStr) hoy += v;
      if (f >= lunesStr)  semana += v;
      if (f >= mesStr)    mes += v;
    } else {
      if (f >= mesStr) gastosMes += v;
    }
  });

  const balance = mes - gastosMes;

  document.getElementById('stat-hoy').textContent    = fmt(hoy);
  document.getElementById('stat-semana').textContent = fmt(semana);
  document.getElementById('stat-mes').textContent    = fmt(mes);
  document.getElementById('stat-gastos').textContent = fmt(gastosMes);

  const balEl = document.getElementById('stat-balance');
  balEl.textContent = fmt(balance);
  balEl.style.color = balance >= 0 ? 'var(--amber)' : 'var(--red)';
}

function fmt(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n);
}

// ══════════════════════════════════════════
// RENDER MOVIMIENTOS
// ══════════════════════════════════════════
function renderMovimientos() {
  const list = document.getElementById('mov-list');
  const filtered = activeFilter === 'todos'
    ? allMovimientos
    : allMovimientos.filter(m => m.tipo === activeFilter);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${activeFilter === 'ingreso' ? '💚' : activeFilter === 'gasto' ? '🔴' : '💳'}</span>
        <p>No hay ${activeFilter === 'todos' ? 'movimientos' : activeFilter + 's'} aún.<br/>Registra el primero arriba.</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(m => {
    const fecha = new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const signo = m.tipo === 'ingreso' ? '+' : '−';
    const icon  = m.tipo === 'ingreso' ? '↑' : '↓';
    return `
      <div class="mov-item">
        <div class="mov-pill ${m.tipo}">${icon}</div>
        <div class="mov-info">
          <div class="mov-concepto">${esc(m.concepto)}</div>
          <div class="mov-meta">${fecha}${m.nota ? ' · ' + esc(m.nota) : ''}</div>
        </div>
        <div class="mov-valor ${m.tipo}">${signo} ${fmt(m.valor)}</div>
        <button class="mov-delete" onclick="deleteMovimiento('${m.id}')" title="Eliminar">×</button>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function showErr(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2800);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
