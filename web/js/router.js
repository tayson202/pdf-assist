/**
 * router.js — Client-side navigation & view switcher
 */

class Router {
  constructor() {
    this.pages = ['home', 'viewer', 'chat', 'summarize', 'study', 'translate', 'annotate', 'tools', 'compare'];
    this.currentPage = 'home';
    this.init();
  }

  init() {
    // Listen for nav button clicks
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        const page = el.getAttribute('data-page');
        if (page) {
          this.navigateTo(page);
        }
      });
    });

    // Handle initial state or hash
    const initialPage = window.location.hash.replace('#', '') || 'home';
    if (this.pages.includes(initialPage)) {
      this.navigateTo(initialPage);
    }
  }

  navigateTo(pageId) {
    if (!this.pages.includes(pageId)) return;

    this.currentPage = pageId;

    // Update URL hash
    window.location.hash = pageId;

    // Toggle pages visibility
    this.pages.forEach(id => {
      const pageEl = document.getElementById(`page-${id}`);
      if (pageEl) {
        if (id === pageId) {
          pageEl.removeAttribute('hidden');
          pageEl.classList.add('page--active');
        } else {
          pageEl.setAttribute('hidden', '');
          pageEl.classList.remove('page--active');
        }
      }
    });

    // Update active nav item in sidebar
    document.querySelectorAll('.sidebar__nav-item').forEach(item => {
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Trigger optional page hooks
    window.dispatchEvent(new CustomEvent('pageChange', { detail: { page: pageId } }));
  }
}

window.appRouter = new Router();
