/* ===================================================
   APP.JS — AutoSystem Core Application Logic
   Version: v3 — complete rewrite
   =================================================== */

'use strict';

// ─── STATE ──────────────────────────────────────────
let currentPage        = 'dashboard';
let currentReservaDate = new Date();   // always a proper Date object
let currentShift       = 'comida';     // 'comida' | 'cena'
let editingReservaId   = null;
let editingMesaId      = null;
let detalleReservaId   = null;

// ─── LOCAL STORAGE ──────────────────────────────────
const store = {
  get:      (key)      => JSON.parse(localStorage.getItem('as_' + key) || '[]'),
  set:      (key, val) => localStorage.setItem('as_' + key, JSON.stringify(val)),
  mesas:    ()         => store.get('mesas'),
  clientes: ()         => store.get('clientes'),
  reservas: ()         => store.get('reservas'),
};

// ─── DATE HELPERS ────────────────────────────────────
// ALL date strings in this app are LOCAL "YYYY-MM-DD".
// We never use .toISOString() for date comparisons because
// it returns UTC which can differ from local time at night.

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as "YYYY-MM-DD" in local timezone */
function todayStr() {
  return localDateStr(new Date());
}

/** The currently viewed reservation date as "YYYY-MM-DD" in local timezone */
function currentDateStr() {
  return localDateStr(currentReservaDate);
}

/** Parse "YYYY-MM-DD" into a local Date (NOT UTC) */
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── UTILITIES ──────────────────────────────────────
function uid() {
  return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateFull(str) {
  if (!str) return '';
  return parseLocalDate(str).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function clienteCategoria(visitas) {
  if (visitas >= 10) return '<span class="badge badge-vip">⭐ VIP</span>';
  if (visitas >= 5)  return '<span class="badge badge-info">Habitual</span>';
  return '<span class="badge badge-gray">Nuevo</span>';
}

function toast(msg, type = '') {
  const icons = { success: '✓', danger: '✕', warning: '⚠' };
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast${type ? ' toast-' + type : ''}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  tc.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 3200);
}

// ─── NAVIGATION ─────────────────────────────────────
function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-'  + page)?.classList.add('active');
  document.getElementById('page-title').textContent = {
    dashboard:    'Dashboard',
    reservas:     'Reservas',
    clientes:     'Clientes (CRM)',
    mesas:        'Mesas',
    estadisticas: 'Estadísticas',
  }[page] || page;
  currentPage = page;
  renderPage(page);
  document.getElementById('sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
}

function renderPage(page) {
  switch (page) {
    case 'dashboard':    renderDashboard();    break;
    case 'reservas':     renderReservas();     break;
    case 'clientes':     renderClientes();     break;
    case 'mesas':        renderMesas();        break;
    case 'estadisticas': renderEstadisticas(); break;
  }
}

// ─── DASHBOARD ──────────────────────────────────────
function renderDashboard() {
  const today    = todayStr();
  const reservas = store.reservas();
  const mesas    = store.mesas();
  const clientes = store.clientes();

  const hoyConfirmadas  = reservas.filter(r => r.fecha === today && r.estado === 'confirmada');
  const mesasOcupadasSet = new Set(hoyConfirmadas.map(r => r.mesaId));
  const nOcupadas = mesasOcupadasSet.size;
  const nLibres   = Math.max(0, mesas.length - nOcupadas);

  document.getElementById('stat-reservas-hoy').textContent  = hoyConfirmadas.length;
  document.getElementById('stat-mesas-ocupadas').textContent = nOcupadas;
  document.getElementById('stat-mesas-libres').textContent   = nLibres;
  document.getElementById('stat-clientes-total').textContent  = clientes.length;
  document.getElementById('badge-reservas').textContent       = hoyConfirmadas.length;

  const pct = mesas.length > 0 ? Math.round((nOcupadas / mesas.length) * 100) : 0;
  document.getElementById('occupancy-label').textContent = pct + '%';
  document.getElementById('occupancy-bar').style.width   = pct + '%';
  document.getElementById('occupancy-text').textContent  =
    `${nOcupadas} de ${mesas.length} mesas ocupadas hoy`;

  // Próximas reservas table
  const sorted = [...hoyConfirmadas].sort((a, b) => {
    const shiftOrder = { 'comida': 0, 'cena': 1 };
    const turnoA = a.turno || 'comida';
    const turnoB = b.turno || 'comida';
    if (turnoA !== turnoB) return shiftOrder[turnoA] - shiftOrder[turnoB];
    return a.hora.localeCompare(b.hora);
  });
  const tbody  = document.getElementById('tbody-proximas');
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay reservas confirmadas para hoy</td></tr>`;
  } else {
    tbody.innerHTML = sorted.map(r => `
      <tr>
        <td><span class="badge ${r.turno === 'comida' ? 'badge-warning' : 'badge-purple'}">${r.turno === 'comida' ? 'Comida' : 'Cena'}</span></td>
        <td><strong>${r.hora}</strong></td>
        <td>
          <div class="flex" style="gap:6px">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;font-weight:700;flex-shrink:0">${r.clienteNombre.charAt(0).toUpperCase()}</div>
            <span>${r.clienteNombre}</span>
          </div>
        </td>
        <td><span class="badge badge-info">${r.personas} pax</span></td>
        <td>${r.mesaNombre}</td>
        <td><span class="badge badge-success">Confirmada</span></td>
      </tr>`).join('');
  }

  drawHorasChart(hoyConfirmadas);
}

// ─── CHART ──────────────────────────────────────────
function drawHorasChart(reservas) {
  const canvas = document.getElementById('chart-horas');
  if (!canvas) return;
  const horas  = ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','20:00','20:30','21:00','21:30','22:00'];
  const counts = horas.map(h => reservas.filter(r => r.hora === h).length);
  _drawBarChart(canvas, horas.map(h => h.slice(0, 5)), counts, '#3B82F6', 'rgba(59,130,246,0.12)');
}

function _drawBarChart(canvas, labels, data, color, bgColor) {
  const W   = canvas.offsetWidth || 420;
  const H   = canvas.height      || 160;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const pad = { top: 16, bottom: 32, left: 28, right: 12 };
  const maxV = Math.max(...data, 1);
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;
  const gap    = chartW / labels.length;
  const barW   = Math.max(8, gap * 0.45);

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  }

  labels.forEach((label, i) => {
    const x    = pad.left + gap * i + gap / 2;
    const barH = (data[i] / maxV) * chartH;
    const y    = pad.top + chartH - barH;

    ctx.fillStyle = bgColor;
    ctx.beginPath(); ctx.roundRect(x - barW/2, pad.top, barW, chartH, 4); ctx.fill();

    if (data[i] > 0) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x - barW/2, y, barW, barH, 4); ctx.fill();
      ctx.font = 'bold 9px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data[i], x, y - 4);
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels.length > 8 ? label.slice(0,2)+'h' : label, x, H - 8);
  });
}

// ─── RESERVAS PAGE ──────────────────────────────────
function renderReservas() {
  const dateStr = currentDateStr();
  document.getElementById('reservas-date-label').textContent = formatDateFull(dateStr);
  document.getElementById('reservas-date-picker').value      = dateStr;
  
  // Sync the date filter input as well
  const filterFechaInput = document.getElementById('filter-fecha');
  if (filterFechaInput) filterFechaInput.value = dateStr;

  renderCalendarGrid(dateStr);
  renderReservasList();
}

// ── Calendar grid (per selected day) ────────────────
function renderCalendarGrid(dateStr) {
  const mesas   = store.mesas();
  const head    = document.getElementById('calendar-head');
  const body    = document.getElementById('calendar-body');

  if (mesas.length === 0) {
    head.innerHTML = '';
    body.innerHTML = '<tr><td class="empty-state" style="padding:32px;text-align:center">No hay mesas configuradas. Ve a Mesas para añadir.</td></tr>';
    return;
  }

  // Load only CONFIRMED reservations for this exact date
  const todasReservas = store.reservas().filter(
    r => r.fecha === dateStr && r.estado === 'confirmada'
  );

  const horasComida = ['13:00','13:30','14:00','14:30','15:00','15:30'];
  const horasCena   = ['20:00','20:30','21:00','21:30','22:00','22:30'];
  const horas       = currentShift === 'comida' ? horasComida : horasCena;

  // Filter reservations to only show those that fall into the current shift
  const reservas = todasReservas.filter(r => horas.includes(r.hora));

  head.innerHTML = `<tr>
    <th class="hour-col">Hora</th>
    ${mesas.map(m => `<th>${m.nombre}<br><small style="font-weight:400;opacity:.7">${m.capacidad} pax</small></th>`).join('')}
  </tr>`;

  body.innerHTML = horas.map(hora => {
    const cells = mesas.map(mesa => {
      const r = reservas.find(res => res.hora === hora && res.mesaId === mesa.id);
      if (r) {
        return `<td>
          <div class="cal-cell-reserved" onclick="openDetalle('${r.id}')" title="Ver detalles">
            <span class="cal-reserved-name">${r.clienteNombre.split(' ')[0]}</span>
            <span class="cal-reserved-pax">${r.personas} pax</span>
          </div></td>`;
      }
      return `<td>
        <div class="cal-cell-free"
             onclick="openNuevaReservaWithParams('${dateStr}','${hora}','${mesa.id}')"
             title="Click para reservar">Libre</div></td>`;
    }).join('');
    return `<tr><td class="hour-cell">${hora}</td>${cells}</tr>`;
  }).join('');
}

// ── Reservation list (ALL dates, newest first) ───────
function renderReservasList() {
  let reservas = store.reservas();

  // Filter by estado
  const filterEstado = document.getElementById('filter-estado')?.value || '';
  if (filterEstado) reservas = reservas.filter(r => r.estado === filterEstado);

  // Filter by date
  const filterFecha = document.getElementById('filter-fecha')?.value || '';
  if (filterFecha) reservas = reservas.filter(r => r.fecha === filterFecha);

  // Sync the calendar grid with the active date filter
  const calendarDate = filterFecha || currentDateStr();
  renderCalendarGrid(calendarDate);
  document.getElementById('reservas-date-label').textContent = formatDateFull(calendarDate);
  document.getElementById('reservas-date-picker').value      = calendarDate;


  // Sort: newest date first, then by hour
  reservas.sort((a, b) => {
    const dc = b.fecha.localeCompare(a.fecha);
    return dc !== 0 ? dc : a.hora.localeCompare(b.hora);
  });

  const today = todayStr();
  const tbody = document.getElementById('tbody-reservas');

  if (reservas.length === 0) {
    const msg = filterFecha ? 'No hay reservas para esta fecha.' : 'No hay reservas';
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = reservas.map(r => {
    const esHoy      = r.fecha === today;
    const hoyBadge   = esHoy ? ' <span class="badge badge-info" style="font-size:.65rem;padding:1px 6px">Hoy</span>' : '';
    const estadoBadge = r.estado === 'confirmada'
      ? '<span class="badge badge-success">Confirmada</span>'
      : '<span class="badge badge-danger">Cancelada</span>';
    const acciones = r.estado === 'confirmada'
      ? `<button class="btn btn-sm btn-outline" onclick="openEditReserva('${r.id}')">Editar</button>
         <button class="btn btn-sm btn-danger"  onclick="cancelarReserva('${r.id}')">Cancelar</button>`
      : `<button class="btn btn-sm btn-danger" onclick="eliminarReserva('${r.id}')">Eliminar</button>`;
    return `
      <tr>
        <td><strong>${formatDate(r.fecha)}</strong>${hoyBadge}</td>
        <td><span class="badge ${r.turno === 'comida' ? 'badge-warning' : 'badge-purple'}">${r.turno === 'comida' ? 'Comida' : 'Cena'}</span></td>
        <td><strong>${r.hora}</strong></td>
        <td>${r.clienteNombre}</td>
        <td>${r.clienteTelefono}</td>
        <td>${r.personas}</td>
        <td>${r.mesaNombre}</td>
        <td>${estadoBadge}</td>
        <td>
          <div class="flex" style="gap:6px">
            <button class="btn btn-sm btn-outline" onclick="openDetalle('${r.id}')">Ver</button>
            ${acciones}
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ─── CLIENTES (CRM) ─────────────────────────────────
function renderClientes(query = '') {
  let clientes = store.clientes();
  if (query) {
    const q = query.toLowerCase();
    clientes = clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }
  clientes.sort((a, b) => b.visitas - a.visitas);

  const tbody = document.getElementById('tbody-clientes');
  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No se encontraron clientes</td></tr>`;
    return;
  }
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>
        <div class="flex" style="gap:8px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.8rem;font-weight:700;flex-shrink:0">${c.nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:.875rem">${c.nombre}</div>
            ${c.notas ? `<div class="text-muted text-sm">${c.notas.slice(0,40)}${c.notas.length>40?'...':''}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${c.telefono}</td>
      <td><strong>${c.visitas}</strong></td>
      <td>${formatDate(c.ultimaVisita)}</td>
      <td>${clienteCategoria(c.visitas)}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openClienteModal('${c.id}')">Ver perfil</button></td>
    </tr>`).join('');
}

// ─── MESAS ──────────────────────────────────────────
function renderMesas() {
  const mesas   = store.mesas();
  const ocupados = new Set(
    store.reservas()
      .filter(r => r.fecha === todayStr() && r.estado === 'confirmada')
      .map(r => r.mesaId)
  );
  const total = mesas.length;
  document.getElementById('mesas-count').textContent =
    `${total} mesa${total !== 1 ? 's' : ''} configurada${total !== 1 ? 's' : ''}`;

  const zonas = { interior: '🪑', exterior: '☀️', privada: '🔒' };
  const grid  = document.getElementById('mesas-grid');

  if (total === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gray-400)">No hay mesas. Añade una mesa para empezar.</div>`;
    return;
  }
  grid.innerHTML = mesas.map(m => {
    const oc = ocupados.has(m.id);
    return `
      <div class="mesa-card">
        <div class="mesa-card-header">
          <div class="mesa-icon">${zonas[m.zona] || '🪑'}</div>
          <span class="mesa-status ${oc ? 'ocupada' : 'libre'}">${oc ? 'Ocupada' : 'Libre'}</span>
        </div>
        <div>
          <div class="mesa-name">${m.nombre}</div>
          <div class="mesa-meta">Capacidad: ${m.capacidad} personas · ${m.zona.charAt(0).toUpperCase()+m.zona.slice(1)}</div>
        </div>
        <div class="mesa-actions">
          <button class="btn btn-sm btn-outline" style="flex:1" onclick="openEditMesa('${m.id}')">Editar</button>
          <button class="btn btn-sm btn-danger"              onclick="deleteMesa('${m.id}')">Eliminar</button>
        </div>
      </div>`;
  }).join('');
}

// ─── ESTADÍSTICAS ───────────────────────────────────
function renderEstadisticas() {
  const today    = todayStr();
  const reservas = store.reservas();
  const clientes = store.clientes();
  const mesas    = store.mesas();

  const hoyConf   = reservas.filter(r => r.fecha === today && r.estado === 'confirmada').length;
  const recurrentes = clientes.filter(c => c.visitas >= 3).length;
  const totalConf    = reservas.filter(r => r.estado === 'confirmada').length;

  // Semana actual (lunes a hoy)
  const inicioSemana = new Date();
  inicioSemana.setHours(0,0,0,0);
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
  const semanaConf = reservas.filter(r => {
    return r.estado === 'confirmada' && parseLocalDate(r.fecha) >= inicioSemana;
  }).length;

  document.getElementById('est-hoy').textContent        = hoyConf;
  document.getElementById('est-semana').textContent     = semanaConf;
  document.getElementById('est-recurrentes').textContent = recurrentes;
  document.getElementById('est-total').textContent       = totalConf;

  // Weekly bar chart (last 7 days)
  const dias   = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    dias.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
    counts.push(reservas.filter(r => r.fecha === ds && r.estado === 'confirmada').length);
  }
  const c2 = document.getElementById('chart-semana');
  if (c2) _drawBarChart(c2, dias, counts, '#10B981', 'rgba(16,185,129,0.1)');

  // Mesa ranking
  const mesaUso = {};
  mesas.forEach(m => { mesaUso[m.id] = { nombre: m.nombre, count: 0 }; });
  reservas.filter(r => r.estado === 'confirmada').forEach(r => {
    if (mesaUso[r.mesaId]) mesaUso[r.mesaId].count++;
  });
  const topMesas = Object.values(mesaUso).sort((a, b) => b.count - a.count);
  const maxC = topMesas[0]?.count || 1;
  document.getElementById('mesas-ranking').innerHTML = topMesas.map(m => `
    <div class="ranking-item">
      <span class="ranking-label">${m.nombre}</span>
      <div class="ranking-bar-wrap"><div class="ranking-bar" style="width:${Math.round(m.count/maxC*100)}%"></div></div>
      <span class="ranking-count">${m.count}</span>
    </div>`).join('') || '<div class="empty-state">Sin datos</div>';

  // VIP table
  const vips = [...clientes].sort((a, b) => b.visitas - a.visitas).slice(0, 5);
  document.getElementById('tbody-vip').innerHTML = vips.length > 0
    ? vips.map((c, i) => `
        <tr>
          <td><strong>#${i+1}</strong></td>
          <td>
            <div class="flex" style="gap:6px">
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#FBBF24,#F59E0B);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.7rem;font-weight:700;flex-shrink:0">${c.nombre.charAt(0)}</div>
              ${c.nombre}
            </div>
          </td>
          <td>${c.visitas} visitas</td>
          <td>${formatDate(c.ultimaVisita)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="empty-state">Sin datos</td></tr>`;
}

// ─── MODAL: NUEVA / EDITAR RESERVA ──────────────────
function openNuevaReserva() {
  editingReservaId = null;
  document.getElementById('modal-reserva-title').textContent  = 'Nueva Reserva';
  document.getElementById('btn-save-reserva').textContent     = 'Guardar Reserva';
  document.getElementById('form-reserva').reset();
  document.getElementById('reserva-id').value    = '';
  document.getElementById('reserva-fecha').value = todayStr();
  document.getElementById('reserva-turno').value = currentShift;
  _populateHoraSelect(currentShift, '');
  _populateMesaSelect('');
  openModal('modal-reserva');
}

function openNuevaReservaWithParams(fecha, hora, mesaId) {
  openNuevaReserva();
  // These must be set AFTER openNuevaReserva() resets the form
  document.getElementById('reserva-fecha').value = fecha;
  document.getElementById('reserva-turno').value = currentShift;
  _populateHoraSelect(currentShift, hora);
  document.getElementById('reserva-mesa').value  = mesaId;
}

function openEditReserva(id) {
  const r = store.reservas().find(x => x.id === id);
  if (!r) return;
  editingReservaId = id;
  document.getElementById('modal-reserva-title').textContent  = 'Editar Reserva';
  document.getElementById('btn-save-reserva').textContent     = 'Actualizar Reserva';
  document.getElementById('reserva-id').value       = r.id;
  document.getElementById('reserva-cliente').value  = r.clienteNombre;
  document.getElementById('reserva-telefono').value = r.clienteTelefono;
  document.getElementById('reserva-personas').value = r.personas;
  document.getElementById('reserva-fecha').value    = r.fecha;
  
  // Set shift & hours based on what was saved
  const turno = r.turno || 'comida';
  document.getElementById('reserva-turno').value = turno;
  _populateHoraSelect(turno, r.hora);
  
  document.getElementById('reserva-notas').value    = r.notas || '';
  _populateMesaSelect(r.mesaId);
  closeModal('modal-detalle');
  openModal('modal-reserva');
}

function _populateHoraSelect(turno, selectedHora) {
  const horasComida = ['13:00','13:30','14:00','14:30','15:00','15:30'];
  const horasCena   = ['20:00','20:30','21:00','21:30','22:00','22:30'];
  const horas = turno === 'comida' ? horasComida : horasCena;
  
  const sel = document.getElementById('reserva-hora');
  sel.innerHTML = '<option value="">Selecciona una hora</option>' + 
    horas.map(h => `<option value="${h}" ${h === selectedHora ? 'selected' : ''}>${h}</option>`).join('');
}

function _populateMesaSelect(selectedId) {
  const sel = document.getElementById('reserva-mesa');
  sel.innerHTML = '<option value="">Selecciona una mesa</option>' +
    store.mesas().map(m =>
      `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${m.nombre} (${m.capacidad} pax)</option>`
    ).join('');
}

function saveReserva() {
  const form = document.getElementById('form-reserva');

  // ── Phone validation ──
  const telefonoInput = document.getElementById('reserva-telefono');
  const errorTel      = document.getElementById('error-telefono');
  const telVal        = telefonoInput.value.trim();
  const telValid      = /^[0-9]{9}$/.test(telVal);
  if (!telValid) {
    telefonoInput.classList.add('input-error');
    errorTel.style.display = '';
    telefonoInput.focus();
    return;
  }
  telefonoInput.classList.remove('input-error');
  errorTel.style.display = 'none';

  if (!form.checkValidity()) { form.reportValidity(); return; }

  const nombre   = document.getElementById('reserva-cliente').value.trim();
  const telefono = document.getElementById('reserva-telefono').value.trim();
  const personas = parseInt(document.getElementById('reserva-personas').value, 10);
  const fecha    = document.getElementById('reserva-fecha').value;     // "YYYY-MM-DD"
  const turno    = document.getElementById('reserva-turno').value;
  const hora     = document.getElementById('reserva-hora').value;
  const mesaId   = document.getElementById('reserva-mesa').value;
  const notas    = document.getElementById('reserva-notas').value.trim();

  const mesa = store.mesas().find(m => m.id === mesaId);
  if (!mesa) { toast('Selecciona una mesa válida', 'danger'); return; }

  // ── Read existing reservations via push, never overwrite ──
  let reservas = store.reservas();

  // Conflict check: same date + hour + table + confirmed, not the one being edited
  const conflicto = reservas.find(r =>
    r.fecha    === fecha   &&
    r.hora     === hora    &&
    r.mesaId   === mesaId  &&
    r.estado   === 'confirmada' &&
    r.id       !== editingReservaId
  );
  if (conflicto) {
    toast(`⚠ ${mesa.nombre} ya está reservada el ${formatDate(fecha)} a las ${hora}`, 'danger');
    return;
  }

  // ── CRM: update or create client ──
  let clientes = store.clientes();
  let cliente  = clientes.find(c => c.telefono === telefono);
  if (cliente) {
    if (!editingReservaId) cliente.visitas = (cliente.visitas || 0) + 1;
    cliente.nombre      = nombre;
    cliente.ultimaVisita = fecha;
  } else {
    cliente = { id: uid(), nombre, telefono, visitas: 1, ultimaVisita: fecha, notas };
    clientes.push(cliente);
  }
  store.set('clientes', clientes);

  // Save reservation (push or update — never full overwrite) ──
  if (editingReservaId) {
    // Map to update just the one record
    reservas = reservas.map(r => r.id === editingReservaId
      ? { ...r, clienteNombre: nombre, clienteTelefono: telefono, personas, fecha, turno, hora, mesaId, mesaNombre: mesa.nombre, notas, estado: 'confirmada' }
      : r
    );
    toast('Reserva actualizada ✓', 'success');
  } else {
    // Push new reservation — ID is unique per slot
    const newId = `${mesaId}_${fecha}_${hora}_${Date.now()}`;
    reservas.push({
      id:              newId,
      fecha,
      turno,
      hora,
      clienteId:       cliente.id,
      clienteNombre:   nombre,
      clienteTelefono: telefono,
      mesaId,
      mesaNombre:      mesa.nombre,
      personas,
      notas,
      estado:          'confirmada',
    });
    toast('Reserva creada ✓', 'success');
  }

  store.set('reservas', reservas);  // persist updated list
  closeModal('modal-reserva');
  renderPage(currentPage);
}

// ─── MODAL: DETALLE RESERVA ─────────────────────────
function openDetalle(id) {
  const r = store.reservas().find(x => x.id === id);
  if (!r) return;
  detalleReservaId = id;

  const badge = r.estado === 'confirmada'
    ? '<span class="badge badge-success">Confirmada</span>'
    : '<span class="badge badge-danger">Cancelada</span>';
    
  const turnoBadge = r.turno === 'comida' 
    ? '<span class="badge badge-warning">Comida</span>' 
    : '<span class="badge badge-purple">Cena</span>';

  document.getElementById('modal-detalle-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">Cliente</span><span class="detail-value">${r.clienteNombre}</span></div>
      <div class="detail-item"><span class="detail-label">Teléfono</span><span class="detail-value">${r.clienteTelefono}</span></div>
      <div class="detail-item"><span class="detail-label">Fecha</span><span class="detail-value">${formatDate(r.fecha)}</span></div>
      <div class="detail-item"><span class="detail-label">Turno</span><span class="detail-value">${turnoBadge}</span></div>
      <div class="detail-item"><span class="detail-label">Hora</span><span class="detail-value">${r.hora}</span></div>
      <div class="detail-item"><span class="detail-label">Mesa</span><span class="detail-value">${r.mesaNombre}</span></div>
      <div class="detail-item"><span class="detail-label">Personas</span><span class="detail-value">${r.personas}</span></div>
      <div class="detail-item"><span class="detail-label">Estado</span><span class="detail-value">${badge}</span></div>
      ${r.notas ? `<div class="detail-item detail-full"><span class="detail-label">Notas</span><div class="detail-notes">${r.notas}</div></div>` : ''}
    </div>`;

  const isConfirmada = r.estado === 'confirmada';
  const isCancelada  = r.estado === 'cancelada';
  
  document.getElementById('btn-cancel-reserva-detalle').style.display = isConfirmada ? '' : 'none';
  document.getElementById('btn-edit-reserva-detalle').style.display   = isConfirmada ? '' : 'none';
  
  const deleteBtn = document.getElementById('btn-delete-reserva-detalle');
  if (deleteBtn) deleteBtn.style.display = isCancelada ? '' : 'none';
  
  openModal('modal-detalle');
}

function eliminarReserva(id) {
  if (!confirm('¿Eliminar esta reserva definitivamente?')) return;
  const reservas = store.reservas().filter(r => r.id !== id);
  store.set('reservas', reservas);
  toast('Reserva eliminada', 'warning');
  closeModal('modal-detalle');
  renderPage(currentPage);
}

function cancelarReserva(id) {
  if (!confirm('¿Cancelar esta reserva?')) return;
  const reservas = store.reservas().map(r =>
    r.id === id ? { ...r, estado: 'cancelada' } : r
  );
  store.set('reservas', reservas);
  toast('Reserva cancelada', 'warning');
  closeModal('modal-detalle');
  renderPage(currentPage);
}

// ─── MODAL: CLIENTE ─────────────────────────────────
function openClienteModal(id) {
  const c = store.clientes().find(x => x.id === id);
  if (!c) return;

  const historial = store.reservas()
    .filter(r => r.clienteTelefono === c.telefono && r.estado === 'confirmada')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  document.getElementById('modal-cliente-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;font-weight:800;flex-shrink:0">${c.nombre.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:800">${c.nombre}</div>
        <div style="font-size:.85rem;color:#64748B">${c.telefono}</div>
        <div style="margin-top:4px">${clienteCategoria(c.visitas)}</div>
      </div>
    </div>
    <div class="detail-grid" style="margin-bottom:16px">
      <div class="detail-item"><span class="detail-label">Total visitas</span><span class="detail-value">${c.visitas}</span></div>
      <div class="detail-item"><span class="detail-label">Última visita</span><span class="detail-value">${formatDate(c.ultimaVisita)}</span></div>
      ${c.notas ? `<div class="detail-item detail-full"><span class="detail-label">Notas</span><div class="detail-notes">${c.notas}</div></div>` : ''}
    </div>
    ${historial.length > 0 ? `
    <div style="font-size:.75rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Historial reciente</div>
    <table class="table" style="font-size:.8rem">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Mesa</th><th>Pax</th></tr></thead>
      <tbody>${historial.map(r => `<tr><td>${formatDate(r.fecha)}</td><td>${r.hora}</td><td>${r.mesaNombre}</td><td>${r.personas}</td></tr>`).join('')}</tbody>
    </table>` : ''}`;
  openModal('modal-cliente');
}

// ─── MODAL: MESAS ────────────────────────────────────
function openAddMesa() {
  editingMesaId = null;
  document.getElementById('modal-mesa-title').textContent = 'Añadir Mesa';
  document.getElementById('form-mesa').reset();
  document.getElementById('mesa-id').value = '';
  openModal('modal-mesa');
}

function openEditMesa(id) {
  const m = store.mesas().find(x => x.id === id);
  if (!m) return;
  editingMesaId = id;
  document.getElementById('modal-mesa-title').textContent = 'Editar Mesa';
  document.getElementById('mesa-id').value       = m.id;
  document.getElementById('mesa-nombre').value   = m.nombre;
  document.getElementById('mesa-capacidad').value = m.capacidad;
  document.getElementById('mesa-zona').value     = m.zona;
  openModal('modal-mesa');
}

function saveMesa() {
  const form = document.getElementById('form-mesa');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const nombre    = document.getElementById('mesa-nombre').value.trim();
  const capacidad = parseInt(document.getElementById('mesa-capacidad').value, 10);
  const zona      = document.getElementById('mesa-zona').value;
  let mesas       = store.mesas();

  if (editingMesaId) {
    mesas = mesas.map(m => m.id === editingMesaId ? { ...m, nombre, capacidad, zona } : m);
    toast('Mesa actualizada', 'success');
  } else {
    mesas.push({ id: 'mesa_' + Date.now(), nombre, capacidad, zona });
    toast('Mesa añadida', 'success');
  }
  store.set('mesas', mesas);
  closeModal('modal-mesa');
  renderMesas();
}

function deleteMesa(id) {
  if (!confirm('¿Eliminar esta mesa?')) return;
  store.set('mesas', store.mesas().filter(m => m.id !== id));
  toast('Mesa eliminada', 'warning');
  renderMesas();
}

// ─── MODAL HELPERS ──────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ─── TOPBAR DATE ────────────────────────────────────
function updateTopbarDate() {
  document.getElementById('topbar-date').textContent =
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
}

// ─── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateTopbarDate();

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', () => goTo(item.dataset.page))
  );

  // Mobile hamburger
  const sidebar = document.getElementById('sidebar');
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // "Nueva Reserva" buttons (topbar + reservas page)
  document.getElementById('btn-nueva-reserva').addEventListener('click',   openNuevaReserva);
  document.getElementById('btn-nueva-reserva-2').addEventListener('click', openNuevaReserva);
  document.getElementById('dash-ver-todas').addEventListener('click', () => goTo('reservas'));

  // Modal: Reserva
  document.getElementById('modal-reserva-close').addEventListener('click', () => closeModal('modal-reserva'));
  document.getElementById('btn-cancel-reserva').addEventListener('click',  () => closeModal('modal-reserva'));
  document.getElementById('btn-save-reserva').addEventListener('click', saveReserva);
  document.getElementById('modal-reserva').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-reserva'); });

  // Modal: Detalle
  document.getElementById('modal-detalle-close').addEventListener('click',         () => closeModal('modal-detalle'));
  document.getElementById('btn-close-detalle').addEventListener('click',           () => closeModal('modal-detalle'));
  document.getElementById('btn-cancel-reserva-detalle').addEventListener('click',  () => cancelarReserva(detalleReservaId));
  const btnDeleteDetalle = document.getElementById('btn-delete-reserva-detalle');
  if (btnDeleteDetalle) btnDeleteDetalle.addEventListener('click', () => eliminarReserva(detalleReservaId));
  document.getElementById('btn-edit-reserva-detalle').addEventListener('click',    () => openEditReserva(detalleReservaId));
  document.getElementById('modal-detalle').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-detalle'); });

  // Modal: Cliente
  document.getElementById('modal-cliente-close').addEventListener('click', () => closeModal('modal-cliente'));
  document.getElementById('btn-close-cliente').addEventListener('click',   () => closeModal('modal-cliente'));
  document.getElementById('modal-cliente').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-cliente'); });

  // Modal: Mesa
  document.getElementById('modal-mesa-close').addEventListener('click',  () => closeModal('modal-mesa'));
  document.getElementById('btn-cancel-mesa').addEventListener('click',   () => closeModal('modal-mesa'));
  document.getElementById('btn-save-mesa').addEventListener('click', saveMesa);
  document.getElementById('btn-add-mesa').addEventListener('click', openAddMesa);
  document.getElementById('modal-mesa').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-mesa'); });

  // Shift Toggles (Reservas page)
  const btnComida = document.getElementById('btn-turno-comida');
  const btnCena   = document.getElementById('btn-turno-cena');
  
  if (btnComida && btnCena) {
    btnComida.addEventListener('click', () => {
      currentShift = 'comida';
      btnComida.classList.add('active');
      btnCena.classList.remove('active');
      renderReservas();
    });
    btnCena.addEventListener('click', () => {
      currentShift = 'cena';
      btnCena.classList.add('active');
      btnComida.classList.remove('active');
      renderReservas();
    });
  }

  // Shift Change inside Modal
  const turnoSelect = document.getElementById('reserva-turno');
  if (turnoSelect) {
    turnoSelect.addEventListener('change', (e) => {
      _populateHoraSelect(e.target.value, '');
    });
  }
  document.getElementById('btn-prev-day').addEventListener('click', () => {
    currentReservaDate.setDate(currentReservaDate.getDate() - 1);
    renderReservas();
  });
  document.getElementById('btn-next-day').addEventListener('click', () => {
    currentReservaDate.setDate(currentReservaDate.getDate() + 1);
    renderReservas();
  });
  document.getElementById('reservas-date-picker').addEventListener('change', e => {
    // Parse as local date — NOT new Date(string) which uses UTC
    const [y, m, d] = e.target.value.split('-').map(Number);
    currentReservaDate = new Date(y, m - 1, d);
    renderReservas();
  });

  // Filter by estado
  document.getElementById('filter-estado').addEventListener('change', renderReservasList);

  // Filter by fecha + reset button (Syncs with the main calendar date)
  document.getElementById('filter-fecha').addEventListener('change', e => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      currentReservaDate = new Date(y, m - 1, d);
      renderReservas();
    } else {
      renderReservasList();
    }
  });
  
  document.getElementById('btn-mostrar-todas').addEventListener('click', () => {
    document.getElementById('filter-fecha').value = '';
    renderReservasList();
  });

  // Clear phone error on input
  document.getElementById('reserva-telefono').addEventListener('input', () => {
    document.getElementById('reserva-telefono').classList.remove('input-error');
    document.getElementById('error-telefono').style.display = 'none';
  });

  // CRM search
  document.getElementById('search-clientes').addEventListener('input', e => renderClientes(e.target.value));

  // ESC closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['modal-reserva','modal-detalle','modal-cliente','modal-mesa'].forEach(closeModal);
    }
  });

  // Set date picker to today
  document.getElementById('reservas-date-picker').value = todayStr();

  // Boot
  goTo('dashboard');
});
