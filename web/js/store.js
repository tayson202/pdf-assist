/**
 * store.js — Central state manager
 */

class Store {
  constructor() {
    this.state = {
      currentPdf: null, // { name, size, pageCount, dataUrl, textContent }
      currentPage: 1,
      zoomLevel: 100,
      activeTool: 'highlight', // 'highlight' | 'underline' | 'note' | 'erase'
      activeColor: '#a78bfa',
      annotations: [], // Array of { id, page, type, color, x, y, width, height, text }
      chatHistory: [], // Array of { id, sender, text, timestamp }
      mergeFiles: []   // Array of { file, name, size }
    };

    this.listeners = new Map();
  }

  /**
   * Subscribe to state slice changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    return () => {
      const arr = this.listeners.get(key).filter(cb => cb !== callback);
      this.listeners.set(key, arr);
    };
  }

  /**
   * Set state and notify listeners
   */
  setState(key, value) {
    this.state[key] = value;
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(value));
    }
  }

  /**
   * Get current state
   */
  getState(key) {
    return key ? this.state[key] : this.state;
  }
}

window.appStore = new Store();
