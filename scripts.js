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
  const modal = document.getElementById('contactModal');
  const openButtons = document.querySelectorAll('[data-modal-target="contactModal"]');
  const closeButtons = document.querySelectorAll('.close-modal, .modal-backdrop');
  const form = document.getElementById('contactForm');

  if (modal) {
    // Open Modal
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
        // Small delay to allow display block to process before changing opacity/scale
        setTimeout(() => body.classList.add('modal-open'), 10);
      });
    });

    // Close Modal
    const closeModal = () => {
      body.classList.remove('modal-open');
      setTimeout(() => modal.classList.add('hidden'), 300); // Wait for transition out
    };

    closeButtons.forEach(btn => {
      btn.addEventListener('click', closeModal);
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
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Here you would typically send the data to a server/webhook
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        
        btn.textContent = '¡Enviando...!';
        btn.classList.add('opacity-80', 'cursor-not-allowed');
        
        // Simulating API call
        setTimeout(() => {
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
            }, 300);
          }, 1500);
        }, 1000);
      });
    }
  }
});
