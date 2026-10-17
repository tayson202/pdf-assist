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


  // Update topbar document badge
  window.appStore.subscribe('currentPdf', (pdf) => {
    const docNameEl = document.getElementById('topbar-doc-name');
    if (docNameEl && pdf) {
      docNameEl.textContent = `${pdf.name} (${pdf.pageCount || 1} pgs)`;
    }
  });

  // Suggestion buttons in Chat
  document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      const input = document.getElementById('chat-input');
      if (input && q) {
        input.value = q;
        if (window.chatAssistant) {
          window.chatAssistant.handleSend();
        }
      }
    });
  });

  // Theme Switcher
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    const savedTheme = localStorage.getItem('pdf_assist_theme') || 'cyber';
    themeSelect.value = savedTheme;
    if (savedTheme !== 'cyber') {
      document.body.setAttribute('data-theme', savedTheme);
    }
    themeSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'cyber') {
        document.body.removeAttribute('data-theme');
      } else {
        document.body.setAttribute('data-theme', val);
      }
      localStorage.setItem('pdf_assist_theme', val);
      Utils.showToast(`Theme switched to ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
  }

  // Settings button
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (window.settingsManager) {
        window.settingsManager.open();
      }
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

  // Probe FastAPI Backend Health
  async function checkBackendHealth() {
    const badge = document.getElementById('backend-status-badge');
    const badgeText = document.getElementById('backend-status-text');
    if (!badge || !badgeText) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        badge.classList.remove('backend-badge--connecting');
        badgeText.textContent = `API: Online (FastAPI RAG)`;
        badge.title = `FastAPI RAG Backend live at http://127.0.0.1:8000 (status: ${data.status})`;
      } else {
        badge.classList.add('backend-badge--connecting');
        badgeText.textContent = 'Web Engine Active';
      }
    } catch (e) {
      badge.classList.add('backend-badge--connecting');
      badgeText.textContent = 'Web Engine Active';
    }
  }
  checkBackendHealth();

  console.log('OmniDoc & Resume initialized successfully.');
});

