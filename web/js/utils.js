/**
 * utils.js — Helper utilities & toast notification system
 */

const Utils = {
  /**
   * Display a floating toast notification
   * @param {string} message 
   * @param {'success'|'error'|'info'|'warning'} type 
   * @param {number} duration 
   */
  showToast(message, type = 'info', duration = 1000) {
    if (!message) return;

    // Filter to ONLY essential user actions: download, upload, edit, import, save, or errors
    const lower = message.toLowerCase();
    const isEssentialAction = 
      type === 'error' ||
      lower.includes('download') ||
      lower.includes('upload') ||
      lower.includes('import') ||
      lower.includes('export') ||
      lower.includes('saved') ||
      lower.includes('edit') ||
      lower.includes('split') ||
      lower.includes('merge');

    if (!isEssentialAction) {
      // Discard non-essential notifications (e.g. page navigation, shuffle, quiz points, greetings)
      return;
    }

    const container = document.getElementById('toast-container');
    if (!container) return;

    // Remove any previous toast immediately to prevent clutter
    while (container.firstChild) {
      container.firstChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Close notification">×</button>
    `;

    const closeBtn = toast.querySelector('.toast__close');
    let removed = false;
    const removeToast = () => {
      if (removed) return;
      removed = true;
      toast.classList.add('toast--hide');
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.addEventListener('click', removeToast);
    container.appendChild(toast);

    // Auto-dismiss after exactly 1 second (1000ms)
    setTimeout(removeToast, 1000);
  },

  /**
   * Format bytes to readable string
   */
  formatBytes(bytes, decimals = 1) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  /**
   * Truncate string with ellipsis
   */
  truncate(str, max = 30) {
    return str.length > max ? str.slice(0, max) + '...' : str;
  },

  /**
   * Delay promise
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

window.Utils = Utils;
