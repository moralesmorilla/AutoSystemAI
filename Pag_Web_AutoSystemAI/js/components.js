// ============================================================
// AM System AI — Shared Components
// Header, Footer and Cookie Banner
// ============================================================

(function () {
  // Detect current page
  const page = window.location.pathname.split('/').pop() || 'index.html';

  function isActive(href) {
    return page === href || (page === '' && href === 'index.html');
  }

  const navLinks = [
    { href: 'index.html', label: 'Inicio' },
    { href: 'servicios.html', label: 'Servicios' },
    { href: 'demos.html', label: 'Demostraciones' },
    { href: 'proceso.html', label: 'Proceso' },
    { href: 'nosotros.html', label: 'Por qué elegirnos' },
  ];

  function buildNavItems(mobile = false) {
    return navLinks.map(link => {
      const active = isActive(link.href);
      const base = mobile
        ? 'px-4 py-3 text-sm font-semibold rounded-xl transition-all block'
        : 'px-4 py-2.5 text-sm font-semibold rounded-xl transition-all';
      const state = active
        ? 'text-white bg-white/10'
        : 'text-slate-300 hover:text-white hover:bg-white/5';
      return `<a class="${base} ${state}" href="${link.href}">${link.label}</a>`;
    }).join('');
  }

  // ── RENDER HEADER ────────────────────────────────────────
  function renderHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.className = 'sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-lg border-b border-white/5';
    el.innerHTML = `
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="index.html" class="flex items-center gap-3 flex-shrink-0">
          <img src="assets/images/FotoPerfil.png" alt="AM System AI"
            class="h-10 w-10 object-cover rounded-full shadow-md border-2 border-accent/30" />
          <span class="text-lg font-black tracking-tight text-white uppercase hidden sm:block">AM System AI</span>
        </a>
        <nav class="hidden md:flex items-center gap-1">
          ${buildNavItems()}
        </nav>
        <div class="flex items-center gap-3">
          <button
            class="hidden sm:flex items-center gap-2 justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/30 hover:scale-105 hover:bg-green-500 transition-all"
            data-modal-target="contactModal">
            <span class="material-symbols-outlined text-base">rocket_launch</span>
            Empezar
          </button>
          <button id="mobileMenuBtn" class="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-all">
            <span class="material-symbols-outlined" id="menuIcon">menu</span>
          </button>
        </div>
      </div>
      <div id="mobileMenu" class="hidden md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-white/5 px-6 py-4">
        <nav class="flex flex-col gap-1">
          ${buildNavItems(true)}
          <button
            class="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white"
            data-modal-target="contactModal">
            <span class="material-symbols-outlined text-base">rocket_launch</span>
            Empezar
          </button>
        </nav>
      </div>
    `;

    // Mobile toggle
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuIcon');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        if (icon) icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
      });
    }
  }

  // ── RENDER FOOTER ────────────────────────────────────────
  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <footer class="bg-slate-950 border-t border-white/5">
        <div class="mx-auto max-w-7xl px-6 py-16">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <!-- Brand -->
            <div class="space-y-4">
              <a href="index.html" class="flex items-center gap-3">
                <img src="assets/images/FotoPerfil.png" alt="AM System AI" class="h-10 w-10 object-cover rounded-full border-2 border-accent/30" />
                <span class="text-lg font-black text-white uppercase">AM System AI</span>
              </a>
              <p class="text-slate-400 text-sm leading-relaxed max-w-xs">
                Automatizamos tu negocio con Inteligencia Artificial para que puedas crecer sin límites.
              </p>
              <div class="flex gap-3">
                <a href="#" class="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-accent hover:border-accent/40 transition-all" aria-label="Instagram">
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" class="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-accent hover:border-accent/40 transition-all" aria-label="LinkedIn">
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                </a>
              </div>
            </div>

            <!-- Links -->
            <div class="grid grid-cols-2 gap-8">
              <div>
                <h4 class="text-white font-bold text-sm mb-4 uppercase tracking-widest">Navegación</h4>
                <ul class="space-y-3 text-sm text-slate-400">
                  <li><a href="index.html" class="hover:text-accent transition-colors">Inicio</a></li>
                  <li><a href="servicios.html" class="hover:text-accent transition-colors">Servicios</a></li>
                  <li><a href="demos.html" class="hover:text-accent transition-colors">Demostraciones</a></li>
                  <li><a href="proceso.html" class="hover:text-accent transition-colors">Proceso</a></li>
                  <li><a href="nosotros.html" class="hover:text-accent transition-colors">Por qué elegirnos</a></li>
                </ul>
              </div>
              <div>
                <h4 class="text-white font-bold text-sm mb-4 uppercase tracking-widest">Legal</h4>
                <ul class="space-y-3 text-sm text-slate-400">
                  <li><a href="privacidad.html" class="hover:text-accent transition-colors">Política de Privacidad</a></li>
                  <li><a href="cookies.html" class="hover:text-accent transition-colors">Política de Cookies</a></li>
                  <li><a href="#" class="hover:text-accent transition-colors">Aviso Legal</a></li>
                </ul>
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h4 class="text-white font-bold text-sm mb-4 uppercase tracking-widest">Contacto</h4>
              <ul class="space-y-4 text-sm text-slate-400">
                <li class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-accent text-lg">mail</span>
                  automan.systemai@gmail.com
                </li>
                <li class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-accent text-lg">location_on</span>
                  Sevilla, España
                </li>
                <li class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-accent text-lg">schedule</span>
                  L–V: 9:00 – 18:00
                </li>
              </ul>
            </div>
          </div>

          <!-- Bottom bar -->
          <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 AM System AI. Todos los derechos reservados.</p>
            <div class="flex gap-6">
              <a href="privacidad.html" class="hover:text-accent transition-colors">Privacidad</a>
              <a href="cookies.html" class="hover:text-accent transition-colors">Cookies</a>
              <a href="#" class="hover:text-accent transition-colors">Aviso Legal</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // ── COOKIE BANNER ────────────────────────────────────────
  function renderCookieBanner() {
    if (localStorage.getItem('am_cookies_accepted')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6';
    banner.innerHTML = `
      <div class="mx-auto max-w-5xl bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div class="flex-1">
          <p class="text-sm text-white font-semibold mb-1">🍪 Usamos cookies</p>
          <p class="text-xs text-slate-400 leading-relaxed">
            Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación. Puedes aceptar todas las cookies o configurar cuáles admites.
            Más información en nuestra <a href="cookies.html" class="text-accent underline hover:text-green-400">Política de Cookies</a> y
            <a href="privacidad.html" class="text-accent underline hover:text-green-400">Política de Privacidad</a>.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 flex-shrink-0">
          <button id="cookieReject" class="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-all">Solo esenciales</button>
          <button id="cookieAccept" class="px-6 py-2.5 rounded-xl bg-accent text-xs font-black text-white hover:bg-green-500 hover:scale-105 transition-all shadow-lg shadow-accent/30">Aceptar todas</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    function dismiss(value) {
      localStorage.setItem('am_cookies_accepted', value);
      banner.style.transition = 'opacity 0.4s, transform 0.4s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(() => banner.remove(), 400);
    }

    document.getElementById('cookieAccept').addEventListener('click', () => dismiss('all'));
    document.getElementById('cookieReject').addEventListener('click', () => dismiss('essential'));
  }

  // ── INIT ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    renderCookieBanner();
  });
})();
