/* ===================================================
   DATA.JS — Demo data for AutoSystem
   Version: v3 — complete rewrite, no duplicate slots
   =================================================== */

/* ── Local-timezone date helpers ─────────────────────
   NEVER use .toISOString() for date comparisons because
   it returns UTC, which can differ from local time.    */
function _localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function _daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return _localDateStr(d);
}

/* ── Static data ──────────────────────────────────── */
const DEMO_MESAS = [
  { id: 'm1', nombre: 'Mesa 1',    capacidad: 4, zona: 'interior' },
  { id: 'm2', nombre: 'Mesa 2',    capacidad: 2, zona: 'interior' },
  { id: 'm3', nombre: 'Mesa 3',    capacidad: 6, zona: 'interior' },
  { id: 'm4', nombre: 'Mesa 4',    capacidad: 4, zona: 'interior' },
  { id: 'm5', nombre: 'Terraza 1', capacidad: 4, zona: 'exterior' },
  { id: 'm6', nombre: 'Terraza 2', capacidad: 6, zona: 'exterior' },
  { id: 'm7', nombre: 'Sala VIP',  capacidad: 8, zona: 'privada'  },
];

const DEMO_CLIENTES = [
  { id: 'c1', nombre: 'María García',      telefono: '612 345 678', visitas: 8,  ultimaVisita: _daysAgo(1),  notas: 'Alergia al marisco. Prefiere mesa interior.' },
  { id: 'c2', nombre: 'Carlos Martínez',   telefono: '698 765 432', visitas: 12, ultimaVisita: _daysAgo(3),  notas: 'Cliente VIP. Cumpleaños en Agosto.' },
  { id: 'c3', nombre: 'Laura Sánchez',     telefono: '634 987 654', visitas: 3,  ultimaVisita: _daysAgo(7),  notas: 'Vegetariana.' },
  { id: 'c4', nombre: 'José Antonio Ruiz', telefono: '655 234 567', visitas: 5,  ultimaVisita: _daysAgo(10), notas: '' },
  { id: 'c5', nombre: 'Ana López',         telefono: '677 890 123', visitas: 2,  ultimaVisita: _daysAgo(14), notas: 'Intolerante a la lactosa.' },
  { id: 'c6', nombre: 'Pedro Fernández',   telefono: '616 543 210', visitas: 15, ultimaVisita: _daysAgo(2),  notas: 'Le gusta la terraza. Amigo del chef.' },
  { id: 'c7', nombre: 'Isabel Moreno',     telefono: '633 111 222', visitas: 1,  ultimaVisita: _daysAgo(20), notas: '' },
  { id: 'c8', nombre: 'David Torres',      telefono: '644 333 444', visitas: 6,  ultimaVisita: _daysAgo(5),  notas: 'Prefiere mesa VIP. Viene con clientes de empresa.' },
];

/* ── Build demo reservations ─────────────────────────
   Key rule: each (fecha + hora + mesaId) must be unique.
   We enforce this with a Set of used slot keys.         */
function _buildDemoReservas() {
  const reservas  = [];
  const usedSlots = new Set(); // "fecha|hora|mesaId"

  function addReserva(id, fecha, hora, mesaId, clienteIdx, personas, notas, estado) {
    const key = `${fecha}|${hora}|${mesaId}`;
    if (usedSlots.has(key)) return false; // skip if slot taken
    usedSlots.add(key);
    const c = DEMO_CLIENTES[clienteIdx];
    const m = DEMO_MESAS.find(x => x.id === mesaId);
    
    // Calculate turno based on hour
    const horaNum = parseInt(hora.split(':')[0], 10);
    const turno = horaNum < 17 ? 'comida' : 'cena';
    
    reservas.push({
      id,
      fecha,
      turno,
      hora,
      clienteId:       c.id,
      clienteNombre:   c.nombre,
      clienteTelefono: c.telefono,
      mesaId:          m.id,
      mesaNombre:      m.nombre,
      personas,
      notas,
      estado,
    });
    return true;
  }

  const today = _localDateStr(new Date());

  // ── TODAY — hand-crafted, guaranteed no conflicts ──
  addReserva('d_hoy_0', today, '13:00', 'm1', 0, 4, 'Cumpleaños',        'confirmada');
  addReserva('d_hoy_1', today, '13:30', 'm5', 5, 3, 'Terraza preferida', 'confirmada');
  addReserva('d_hoy_2', today, '14:00', 'm3', 1, 6, '',                  'confirmada');
  addReserva('d_hoy_3', today, '14:30', 'm2', 3, 2, '',                  'confirmada');
  addReserva('d_hoy_4', today, '20:00', 'm4', 2, 2, 'Cena romántica',    'confirmada');
  addReserva('d_hoy_5', today, '21:00', 'm7', 7, 8, 'Cena de empresa',   'confirmada');
  addReserva('d_hoy_6', today, '21:00', 'm1', 4, 3, '',                  'confirmada');
  addReserva('d_hoy_7', today, '21:30', 'm6', 6, 4, '',                  'confirmada');

  // ── LAST 7 DAYS — random, deduplicated via usedSlots Set ──
  const horas = ['13:00','13:30','14:00','14:30','20:00','20:30','21:00','21:30'];

  for (let day = 1; day <= 7; day++) {
    const fecha = _daysAgo(day);

    // Build all possible slots for this day and shuffle them
    const slots = [];
    DEMO_MESAS.forEach(m => horas.forEach(h => slots.push({ mesaId: m.id, hora: h })));
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    // Pick 6–10 unique slots
    const pick = Math.floor(Math.random() * 5) + 6;
    slots.slice(0, pick).forEach((slot, i) => {
      const cIdx    = Math.floor(Math.random() * DEMO_CLIENTES.length);
      const pax     = Math.floor(Math.random() * 5) + 1;
      const estado  = Math.random() > 0.15 ? 'confirmada' : 'cancelada';
      addReserva(`d_day${day}_${i}`, fecha, slot.hora, slot.mesaId, cIdx, pax, '', estado);
    });
  }

  return reservas;
}

/* ── Init: bump version key to force a clean reload ──
   Change 'as_v' value whenever demo data must reset.   */
function initDemoData() {
  const CURRENT_VERSION = 'v4';
  if (localStorage.getItem('as_version') !== CURRENT_VERSION) {
    // Wipe everything from previous versions
    ['as_mesas', 'as_clientes', 'as_reservas',
     'as_initialized', 'as_initialized_v2'].forEach(k => localStorage.removeItem(k));

    localStorage.setItem('as_mesas',    JSON.stringify(DEMO_MESAS));
    localStorage.setItem('as_clientes', JSON.stringify(DEMO_CLIENTES));
    localStorage.setItem('as_reservas', JSON.stringify(_buildDemoReservas()));
    localStorage.setItem('as_version',  CURRENT_VERSION);
  }
}

initDemoData();
