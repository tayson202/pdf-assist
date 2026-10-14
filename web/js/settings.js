/**
 * settings.js — Comprehensive Enterprise Settings & Preferences Engine
 * Manages Cloud Storage, AI Providers, Theme, RTL/LTR, and Cache
 */

class SettingsManager {
  constructor() {
    this.modal = null;
    this.activeTab = 'ai';
    this.defaultSettings = {
      // Cloud Storage (Supabase)
      supabaseUrl: 'https://tjpvtfxlunlzglucjyih.supabase.co',
      supabaseAnonKey: 'sb_publishable_cN8a54JTBvWY0hMuFiw7vA_56IyEuub',
      supabaseBucket: 'files assist',
      autoCloudSync: true,

      // AI & Model Engine
      aiProvider: 'fastapi-rag', // 'fastapi-rag' | 'gemini' | 'openai' | 'claude'
      apiKey: '',
      aiTemperature: 0.3,
      citationStyle: 'badge', // 'badge' | 'academic' | 'footnote'
      maxTokens: 1024,

      // UI & Typography
      theme: 'cyber', // 'cyber' | 'ocean' | 'emerald' | 'light'
      fontFamily: 'lexend', // 'lexend' | 'plex' | 'inter' | 'mono'
      language: 'en', // 'en' | 'ar'
      highContrast: false,
      enableAnimations: true
    };

    this.settings = this.loadSettings();
    this.init();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('pdf_assist_enterprise_settings');
      if (saved) {
        return { ...this.defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[Settings] Failed to parse saved settings:', e);
    }
    return { ...this.defaultSettings };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('pdf_assist_enterprise_settings', JSON.stringify(this.settings));
      this.applySettings();
      Utils.showToast('Settings saved and applied successfully!', 'success');
    } catch (e) {
      Utils.showToast('Failed to save settings: ' + e.message, 'error');
    }
  }

  init() {
    this.modal = document.getElementById('settings-modal');
    this.bindEvents();
    this.applySettings();
  }

  bindEvents() {
    // Open settings button in sidebar and topbar
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => this.open());
    }

    // Modal close button
    const btnClose = document.getElementById('btn-close-settings');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    // Click outside modal
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }

    // Tab buttons in settings
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Save button
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSaveFromForm());
    }

    // Reset Defaults button
    const btnReset = document.getElementById('btn-reset-settings');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset all settings to default enterprise configuration?')) {
          this.settings = { ...this.defaultSettings };
          this.saveSettings(this.defaultSettings);
          this.populateForm();
          Utils.showToast('All settings reset to defaults.', 'info');
        }
      });
    }

    // Clear Document Cache button
    const btnClearCache = document.getElementById('btn-clear-cache');
    if (btnClearCache) {
      btnClearCache.addEventListener('click', () => {
        window.appStore.setState('currentPdf', null);
        localStorage.removeItem('currentPdf');
        Utils.showToast('Document cache and stored state cleared.', 'info');
      });
    }

    // Export Session Data
    const btnExportData = document.getElementById('btn-export-session');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const data = {
          settings: this.settings,
          pdf: window.appStore.getState('currentPdf'),
          resume: window.resumeManager ? window.resumeManager.data : null,
          exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdf_assist_session_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Session data exported as JSON.', 'success');
      });
    }

    // Keyboard ESC closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.hasAttribute('hidden')) {
        this.close();
      }
    });
  }

  open() {
    if (!this.modal) return;
    this.populateForm();
    this.modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modal) return;
    this.modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.settings-pane').forEach(pane => {
      if (pane.getAttribute('data-pane') === tabName) {
        pane.removeAttribute('hidden');
      } else {
        pane.setAttribute('hidden', '');
      }
    });
  }

  populateForm() {
    const s = this.settings;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };
    const setChecked = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!val;
    };

    setVal('setting-ai-provider', s.aiProvider);
    setVal('setting-api-key', s.apiKey);
    setVal('setting-temperature', s.aiTemperature);
    const tempValEl = document.getElementById('temp-val-display');
    if (tempValEl) tempValEl.textContent = s.aiTemperature;

    setVal('setting-citation-style', s.citationStyle);
    setVal('setting-theme', s.theme);
    setVal('setting-font', s.fontFamily);
    setVal('setting-language', s.language);
    setChecked('setting-high-contrast', s.highContrast);
  }

  handleSaveFromForm() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const getChecked = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

    const newSettings = {
      supabaseUrl: this.settings.supabaseUrl,
      supabaseAnonKey: this.settings.supabaseAnonKey,
      supabaseBucket: this.settings.supabaseBucket,
      autoCloudSync: this.settings.autoCloudSync,

      aiProvider: getVal('setting-ai-provider') || 'fastapi-rag',
      apiKey: getVal('setting-api-key'),
      aiTemperature: parseFloat(getVal('setting-temperature')) || 0.3,
      citationStyle: getVal('setting-citation-style') || 'badge',

      theme: getVal('setting-theme') || 'cyber',
      fontFamily: getVal('setting-font') || 'lexend',
      language: getVal('setting-language') || 'en',
      highContrast: getChecked('setting-high-contrast')
    };

    this.saveSettings(newSettings);
    this.close();
  }

  applySettings() {
    const s = this.settings;

    // Apply Theme
    if (s.theme === 'cyber') {
      document.body.removeAttribute('data-theme');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    } else if (s.theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.setAttribute('data-theme', s.theme);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    }

    // Sync theme select dropdown in topbar
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = s.theme;

    // Apply Font Family
    document.documentElement.setAttribute('data-font', s.fontFamily);

    // Apply Language / RTL
    document.documentElement.setAttribute('lang', s.language);
    document.documentElement.setAttribute('dir', s.language === 'ar' ? 'rtl' : 'ltr');

    // High Contrast
    if (s.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }

  async testSupabaseConnection() {
    const statusBox = document.getElementById('supa-test-result');
    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.innerHTML = '<span style="color:#06b6d4;">⏳ Testing connection to Supabase storage...</span>';
    }

    const startTime = performance.now();
    try {
      if (window.supabaseService) {
        const ok = await window.supabaseService.checkConnection();
        const latency = Math.round(performance.now() - startTime);
        if (statusBox) {
          statusBox.innerHTML = `
            <div style="background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#6ee7b7;padding:10px 14px;border-radius:8px;font-size:0.85rem;">
              ✅ <strong>Connection Successful!</strong><br />
              • Bucket: <strong>${this.settings.supabaseBucket}</strong><br />
              • Endpoint Latency: <strong>${latency}ms</strong><br />
              • Status: Ready for authenticated cloud uploads.
            </div>
          `;
        }
        Utils.showToast(`Supabase connected (${latency}ms)!`, 'success');
      }
    } catch (e) {
      if (statusBox) {
        statusBox.innerHTML = `
          <div style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:0.85rem;">
            ❌ <strong>Connection Notice:</strong> ${e.message}
          </div>
        `;
      }
    }
  }
}

window.settingsManager = new SettingsManager();
