document.addEventListener("DOMContentLoaded", () => {
  // 1. Prevent default behavior on empty links
  document.querySelectorAll('a[href="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  // 2. Intersection Observer for scroll animations
  const revealElements = document.querySelectorAll("section h2, section h3, section p, .rounded-2xl");
  revealElements.forEach(el => el.classList.add("reveal"));

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));

  // 3. Navbar scroll effect
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('shadow-md');
        header.classList.remove('bg-white/80', 'backdrop-blur-md');
        header.classList.add('bg-white');
      } else {
        header.classList.remove('shadow-md', 'bg-white');
        header.classList.add('bg-white/80', 'backdrop-blur-md');
      }
    });
  }

  // 4. Modal Logic
  const body = document.body;
  // Select both specific modals
  const contactModal = document.getElementById('contactModal');
  const videoModal = document.getElementById('videoModal');
  const openButtons = document.querySelectorAll('[data-modal-target]');
  const closeButtons = document.querySelectorAll('.close-modal, .modal-backdrop');
  const form = document.getElementById('contactForm');

  if (contactModal || videoModal) {
    // Open Modal
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-modal-target');
        const targetModal = document.getElementById(targetId);
        
        if (targetModal) {
          targetModal.classList.remove('hidden');
          // Small delay to allow display block to process before changing opacity/scale
          setTimeout(() => {
            body.classList.add('modal-open');
            targetModal.classList.add('modal-active');
          }, 10);

          // Si es el modal de video, reproducir automáticamente
          if (targetId === 'videoModal') {
            const video = targetModal.querySelector('video');
            if (video) video.play();
          }
        }
      });
    });

    // Close Modal
    const closeModal = (modalToClose) => {
      // By default close contact modal if none provided
      if (!modalToClose || modalToClose instanceof Event) modalToClose = document.getElementById('contactModal');
      if (!modalToClose) return;

      body.classList.remove('modal-open');
      modalToClose.classList.remove('modal-active');
      
      // Si es el modal de video, pausar
      if (modalToClose.id === 'videoModal') {
        const video = modalToClose.querySelector('video');
        if (video) video.pause();
      }
      
      setTimeout(() => modalToClose.classList.add('hidden'), 300); // Wait for transition out
    };

    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.fixed.inset-0.z-\\[100\\]') || document.getElementById('videoModal');
        // Because of Tailwind classes, escaping characters requires care. We use closest or find it explicitly.
        const parentModal = e.target.closest('div[id$="Modal"]');
        if (parentModal) closeModal(parentModal);
      });
    });

    // Cerrar modal con la tecla Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('modal-open')) {
        const activeModal = Array.from(document.querySelectorAll('.fixed.inset-0.z-\\[100\\]')).find(m => !m.classList.contains('hidden'));
        if (activeModal) closeModal(activeModal);
      }
    });

    // Handle Reason Dropdown
    const reasonSelect = document.getElementById('contactReason');
    const otherReasonContainer = document.getElementById('otherReasonContainer');
    const otherReasonInput = document.getElementById('contactOtherReason');

    if (reasonSelect && otherReasonContainer) {
      reasonSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Otro') {
          otherReasonContainer.classList.remove('hidden');
          otherReasonInput.setAttribute('required', 'required');
        } else {
          otherReasonContainer.classList.add('hidden');
          otherReasonInput.removeAttribute('required');
          otherReasonInput.value = ''; // clean up the input
        }
      });
    }

    // Handle Form Submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        btn.textContent = '¡Enviando...!';
        btn.classList.add('opacity-80', 'cursor-not-allowed');
        btn.disabled = true;

        try {
          const formData = new FormData(form);
          const urlEncodedData = new URLSearchParams(formData);
          
          const webhookUrl = "https://automan-project-n8n.zcry4s.easypanel.host/webhook-test/d4ff8a76-f7c6-4c4c-889e-1ed6b5c0d85f";
          
          // Enviamos los datos como application/x-www-form-urlencoded
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: urlEncodedData
          });

          // Al usar mode: 'no-cors', evitamos errores de CORS previniendo validar la respuesta.
          btn.textContent = '¡Solicitud Enviada!';
          btn.classList.remove('bg-primary');
          btn.classList.add('bg-green-500');
          
          setTimeout(() => {
            closeModal();
            form.reset();
            // Reset button
            setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.add('bg-primary');
              btn.classList.remove('bg-green-500', 'opacity-80', 'cursor-not-allowed');
              btn.disabled = false;
            }, 300);
          }, 1500);

        } catch (error) {
          console.error("Error al enviar el formulario:", error);
          btn.textContent = '¡Error al enviar!';
          btn.classList.remove('bg-primary');
          btn.classList.add('bg-red-500');
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.add('bg-primary');
            btn.classList.remove('bg-red-500', 'opacity-80', 'cursor-not-allowed');
            btn.disabled = false;
          }, 3000);
        }
      });
    }
  }
});
