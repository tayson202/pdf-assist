/**
 * app.js — Main Application Bootstrap & Lifecycle
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Toggle
  const hamburger = document.getElementById('btn-hamburger');
  const sidebar = document.getElementById('sidebar');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      sidebar.classList.toggle('open');
    });

    // Close sidebar on click outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Feature cards quick navigation
  document.querySelectorAll('.feature-card[data-page]').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-page');
      if (target && window.appRouter) {
        window.appRouter.navigateTo(target);
      }
    });
  });

  // Settings button
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      Utils.showToast('Settings: Dark Mode and AI Model preferences active.', 'info');
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc closes modal or drawer
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-overlay');
      if (modal && !modal.hasAttribute('hidden')) {
        modal.setAttribute('hidden', '');
      }
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Welcome greeting toast
  setTimeout(() => {
    Utils.showToast('Welcome to PDF Assist! Upload a PDF or click "Try Demo" to get started.', 'info', 4000);
  }, 400);

  console.log('PDF Assist initialized successfully.');
});
