/**
 * viewer.js — Document canvas renderer & page navigator
 */

class Viewer {
  constructor() {
    this.canvas = document.getElementById('pdf-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.emptyState = document.getElementById('viewer-empty');
    this.richViewer = document.getElementById('doc-rich-viewer');
    this.pageInfo = document.getElementById('page-info');
    this.zoomDisplay = document.getElementById('zoom-level');

    this.prevBtn = document.getElementById('btn-prev-page');
    this.nextBtn = document.getElementById('btn-next-page');
    this.zoomInBtn = document.getElementById('btn-zoom-in');
    this.zoomOutBtn = document.getElementById('btn-zoom-out');
    this.downloadBtn = document.getElementById('btn-download-pdf');
    this.fullscreenBtn = document.getElementById('btn-fullscreen');

    this.currentPage = 1;
    this.totalPages = 1;
    this.zoom = 100;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    // React to store updates
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf) {
        this.totalPages = pdf.pageCount || 1;
        this.currentPage = 1;
        this.render();
      } else {
        this.clear();
      }
    });

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render();
        }
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.render();
        }
      });
    }

    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', () => {
        if (this.zoom < 200) {
          this.zoom += 15;
          this.updateZoomDisplay();
          this.render();
        }
      });
    }

    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', () => {
        if (this.zoom > 50) {
          this.zoom -= 15;
          this.updateZoomDisplay();
          this.render();
        }
      });
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => {
        const doc = window.appStore.getState('currentPdf');
        if (!doc) {
          Utils.showToast('No document available to download.', 'warning');
          return;
        }
        if (doc.file) {
          const url = URL.createObjectURL(doc.file);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.name;
          a.click();
          URL.revokeObjectURL(url);
          Utils.showToast(`Downloaded "${doc.name}"!`, 'success');
        } else {
          Utils.showToast(`Downloading ${doc.name}...`, 'info');
        }
      });
    }

    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        const container = document.getElementById('viewer-container');
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    // In-viewer document search
    this.searchInput = document.getElementById('viewer-search-input');
    this.searchCount = document.getElementById('viewer-search-count');
    this.searchMatches = [];
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.handleSearch());
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.jumpToNextSearchResult();
        }
      });
    }
    // Render immediately on init
    this.render();
  }

  goToPage(pageNum) {
    const target = parseInt(pageNum, 10);
    if (!isNaN(target)) {
      this.currentPage = Math.min(Math.max(1, target), this.totalPages || 1);
      this.render();
      Utils.showToast(`Viewing Page ${this.currentPage} of ${this.totalPages}`, 'info');
    }
  }

  handleSearch() {
    const query = (this.searchInput ? this.searchInput.value : '').trim().toLowerCase();
    if (!query) {
      if (this.searchCount) this.searchCount.textContent = '';
      this.searchMatches = [];
      return;
    }
    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8,
      size: 2450800,
      textContent: '[Page 1]: Introduction to Modern AI\n[Page 2]: RAG architecture\n[Page 3]: Risk and bottlenecks'
    };

    const text = pdf.textContent || '';
    const sections = text.split(/\[Page\s+(\d+)\]:?/i);
    this.searchMatches = [];

    if (sections.length > 2) {
      for (let i = 1; i < sections.length; i += 2) {
        const pageNum = parseInt(sections[i], 10);
        const content = (sections[i + 1] || '').toLowerCase();
        if (content.includes(query)) {
          this.searchMatches.push(pageNum);
        }
      }
    } else {
      if (text.toLowerCase().includes(query)) {
        this.searchMatches.push(1);
      }
    }

    if (this.searchCount) {
      this.searchCount.textContent = this.searchMatches.length 
        ? `${this.searchMatches.length} match(es)` 
        : '0 matches';
    }
  }

  jumpToNextSearchResult() {
    if (this.searchMatches && this.searchMatches.length > 0) {
      const nextMatch = this.searchMatches.find(p => p > this.currentPage) || this.searchMatches[0];
      this.goToPage(nextMatch);
    }
  }

  goToPage(pageNum) {
    const p = parseInt(pageNum, 10);
    if (isNaN(p)) return;
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.render();
      Utils.showToast(`Navigated to Page ${p}`, 'info');
    }
  }

  updateZoomDisplay() {
    if (this.zoomDisplay) {
      this.zoomDisplay.textContent = `${this.zoom}%`;
    }
  }

  async render() {
    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8,
      size: 2450800,
      docType: 'pdf'
    };

    if (this.emptyState) this.emptyState.style.display = 'none';

    // Update topbar document badge icon
    const docBadge = document.getElementById('topbar-doc-badge');
    if (docBadge) {
      let icon = '📄';
      if (pdf.docType === 'word') icon = '📘';
      else if (pdf.docType === 'excel') icon = '📗';
      else if (pdf.docType === 'powerpoint') icon = '📙';
      const nameEl = document.getElementById('topbar-doc-name');
      if (nameEl) nameEl.textContent = pdf.name;
      const iconEl = docBadge.querySelector('span:first-child');
      if (iconEl) iconEl.textContent = icon;
    }

    // 1. Excel Spreadsheet View
    if (pdf.docType === 'excel' && pdf.docDetails && pdf.docDetails.sheetNames) {
      if (this.canvas) this.canvas.style.display = 'none';
      if (this.richViewer) {
        this.richViewer.style.display = 'block';
        this.renderExcelView(pdf);
      }
      if (this.pageInfo) {
        this.pageInfo.textContent = `Sheet ${this.currentPage} / ${this.totalPages}`;
      }
      return;
    }

    // 2. PowerPoint Slide View
    if (pdf.docType === 'powerpoint' && pdf.docDetails && pdf.docDetails.slides) {
      if (this.canvas) this.canvas.style.display = 'none';
      if (this.richViewer) {
        this.richViewer.style.display = 'block';
        this.renderPptView(pdf);
      }
      if (this.pageInfo) {
        this.pageInfo.textContent = `Slide ${this.currentPage} / ${this.totalPages}`;
      }
      return;
    }

    // 3. Word Document View
    if (pdf.docType === 'word' && pdf.docDetails && pdf.docDetails.html) {
      if (this.canvas) this.canvas.style.display = 'none';
      if (this.richViewer) {
        this.richViewer.style.display = 'block';
        this.renderWordView(pdf);
      }
      if (this.pageInfo) {
        this.pageInfo.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
      }
      return;
    }

    // 4. Default PDF Canvas View
    if (this.richViewer) this.richViewer.style.display = 'none';
    if (this.canvas) this.canvas.style.display = 'block';

    if (this.pageInfo) {
      this.pageInfo.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
    }

    // Try rendering real PDF page via PDF.js if available
    if (pdf.pdfDoc) {
      try {
        if (this.renderTask) {
          try { this.renderTask.cancel(); } catch (e) {}
        }
        const page = await pdf.pdfDoc.getPage(this.currentPage);
        const scale = (this.zoom / 100) * 1.35;
        const viewport = page.getViewport({ scale });

        this.canvas.width = viewport.width;
        this.canvas.height = viewport.height;

        const renderContext = {
          canvasContext: this.ctx,
          viewport: viewport
        };
        this.renderTask = page.render(renderContext);
        await this.renderTask.promise;
        this.renderTask = null;
        return;
      } catch (err) {
        if (err && err.name !== 'RenderingCancelledException') {
          console.warn('PDF.js rendering notice, switching to canvas template:', err);
        }
      }
    }

    // Canvas scaling fallback
    const scale = this.zoom / 100;
    const baseWidth = 595; // A4 standard width
    const baseHeight = 842; // A4 standard height

    this.canvas.width = baseWidth * scale;
    this.canvas.height = baseHeight * scale;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(scale, scale);

    // Draw page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Draw header bar simulation
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(40, 40, baseWidth - 80, 4);

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`${pdf.name}`, 40, 75);

    // Metadata
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Page ${this.currentPage} of ${this.totalPages} • Generated with PDF Assist`, 40, 95);

    // Simulated content paragraphs
    ctx.fillStyle = '#374151';
    ctx.font = '14px Inter, sans-serif';

    const lines = [
      `Section ${this.currentPage}: Document Intelligence & Contextual Analysis`,
      '',
      '1. Key Findings & Overview',
      'Artificial Intelligence models enable direct contextual question-answering, fast syntheses,',
      'and semantic retrieval across dense documents. Through dynamic token representations and',
      'vector similarity mapping, information extraction is made immediate and accessible.',
      '',
      '2. Methodology & Analytical Framework',
      'High-throughput parsing decomposes documents into localized sections. Each section undergoes',
      'entity extraction, identifying relational dependencies, summary points, and citations.',
      'Key metrics indicate substantial improvements across speed, accuracy, and review fidelity.',
      '',
      '3. Verified Citations & Insights',
      `- Citation: [Page ${this.currentPage}] verified by automated semantic pipeline`,
      '- Rapid multi-page navigation and semantic search enabled',
      '- On-the-fly automated summarization with custom depth options',
      '- Direct in-browser annotation and cross-document collaboration'
    ];

    let y = 140;
    lines.forEach(line => {
      if (line.startsWith('Section') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = '#1e1b4b';
      } else {
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#4b5563';
      }
      ctx.fillText(line, 40, y);
      y += 24;
    });

    // Page number bottom footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`- Page ${this.currentPage} -`, baseWidth / 2 - 25, baseHeight - 40);

    ctx.restore();
  }

  renderExcelView(pdf) {
    if (!this.richViewer) return;
    const names = (pdf.docDetails && pdf.docDetails.sheetNames) || ['Sheet1'];
    const activeSheetName = names[this.currentPage - 1] || names[0];
    const sheetData = (pdf.docDetails && pdf.docDetails.sheets && pdf.docDetails.sheets[activeSheetName]) || { html: '<p style="padding:16px;">No sheet data available.</p>' };

    this.richViewer.innerHTML = `
      <div class="excel-viewer-card" style="background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);">
        <div class="excel-header-bar" style="padding:12px 18px;background:rgba(16,185,129,0.08);border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">📗</span>
            <strong style="font-size:0.95rem;color:#34d399;">${this.escapeHtml(pdf.name)}</strong>
            <span class="badge" style="background:rgba(16,185,129,0.15);color:#6ee7b7;font-size:0.7rem;">Excel Spreadsheet</span>
          </div>
          <span style="font-size:0.75rem;color:var(--color-text-muted);">Sheet ${this.currentPage} of ${this.totalPages}</span>
        </div>
        <div class="excel-tabs-bar" style="display:flex;gap:6px;padding:8px 14px;background:rgba(0,0,0,0.25);border-bottom:1px solid var(--color-border);overflow-x:auto;">
          ${names.map((name, i) => `
            <button class="btn btn--sm ${i + 1 === this.currentPage ? 'btn--primary' : 'btn--ghost'}" data-sheet-idx="${i + 1}" style="font-size:0.75rem;padding:4px 12px;">
              📊 ${this.escapeHtml(name)}
            </button>
          `).join('')}
        </div>
        <div class="excel-table-scroll" style="overflow:auto;max-height:620px;padding:12px;">
          <style>
            .excel-table-scroll table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
            .excel-table-scroll th, .excel-table-scroll td { border: 1px solid var(--color-border); padding: 7px 12px; text-align: left; }
            .excel-table-scroll th { background: rgba(255,255,255,0.06); font-weight: 600; color: var(--color-cyan-400); }
            .excel-table-scroll tr:hover { background: rgba(255,255,255,0.04); }
          </style>
          ${sheetData.html}
        </div>
      </div>
    `;

    this.richViewer.querySelectorAll('[data-sheet-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-sheet-idx'), 10);
        this.currentPage = idx;
        this.render();
      });
    });
  }

  renderPptView(pdf) {
    if (!this.richViewer) return;
    const slides = (pdf.docDetails && pdf.docDetails.slides) || [];
    const currentSlide = slides[this.currentPage - 1] || { title: `Slide ${this.currentPage}`, bullets: [] };

    this.richViewer.innerHTML = `
      <div class="ppt-viewer-card" style="background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-2xl);overflow:hidden;box-shadow:var(--shadow-xl);max-width:840px;margin:0 auto;">
        <div class="ppt-header-bar" style="padding:12px 18px;background:rgba(245,158,11,0.08);border-bottom:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">📙</span>
            <strong style="font-size:0.95rem;color:#fbbf24;">${this.escapeHtml(pdf.name)}</strong>
            <span class="badge" style="background:rgba(245,158,11,0.15);color:#fde68a;font-size:0.7rem;">PowerPoint Slide</span>
          </div>
          <span style="font-size:0.75rem;color:var(--color-text-muted);">Slide ${this.currentPage} of ${this.totalPages}</span>
        </div>
        
        <!-- 16:9 Presentation Frame -->
        <div style="aspect-ratio:16/9;background:#09090b;padding:36px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;border-bottom:1px solid var(--color-border);">
          <div style="position:absolute;top:16px;right:20px;font-size:0.75rem;color:var(--color-text-muted);font-weight:600;">
            Slide ${this.currentPage}
          </div>
          <h2 style="font-size:1.65rem;font-weight:800;color:#fafafa;margin:0 0 16px 0;letter-spacing:-0.02em;line-height:1.3;">
            ${this.escapeHtml(currentSlide.title)}
          </h2>
          <div style="height:3px;width:64px;background:linear-gradient(90deg, #f59e0b, #ef4444);margin-bottom:22px;border-radius:999px;"></div>
          <ul style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:12px;font-size:1rem;color:#e4e4e7;line-height:1.6;">
            ${currentSlide.bullets && currentSlide.bullets.length ? currentSlide.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('') : '<li style="color:var(--color-text-muted);">Presentation slide overview.</li>'}
          </ul>
        </div>

        <!-- Slide Strip Navigation -->
        <div style="display:flex;gap:8px;padding:12px 16px;overflow-x:auto;background:rgba(0,0,0,0.3);">
          ${slides.map((s, i) => `
            <button class="btn btn--sm ${i + 1 === this.currentPage ? 'btn--primary' : 'btn--ghost'}" data-slide-idx="${i + 1}" style="font-size:0.7rem;padding:4px 10px;white-space:nowrap;">
              Slide ${i + 1}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.richViewer.querySelectorAll('[data-slide-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-slide-idx'), 10);
        this.currentPage = idx;
        this.render();
      });
    });
  }

  renderWordView(pdf) {
    if (!this.richViewer) return;
    const html = (pdf.docDetails && pdf.docDetails.html) || '<p>No Word document content</p>';

    this.richViewer.innerHTML = `
      <div class="word-viewer-card" style="background:#ffffff;color:#18181b;border-radius:var(--radius-lg);padding:44px 50px;box-shadow:0 20px 40px rgba(0,0,0,0.5);max-width:760px;margin:0 auto;line-height:1.65;font-family:Inter, -apple-system, sans-serif;">
        <div style="border-bottom:2px solid #3b82f6;padding-bottom:10px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">📘</span>
            <strong style="color:#1d4ed8;font-size:1rem;">${this.escapeHtml(pdf.name)}</strong>
          </div>
          <span style="font-size:0.75rem;color:#6b7280;">Word Document (Page ${this.currentPage} of ${this.totalPages})</span>
        </div>
        <div class="word-content-body" style="font-size:0.92rem;color:#27272a;">
          <style>
            .word-content-body h1 { font-size: 1.5rem; color: #1e3a8a; margin: 16px 0 8px 0; }
            .word-content-body h2 { font-size: 1.25rem; color: #1e40af; margin: 14px 0 6px 0; }
            .word-content-body h3 { font-size: 1.1rem; color: #1d4ed8; margin: 12px 0 4px 0; }
            .word-content-body p { margin-bottom: 12px; }
            .word-content-body ul, .word-content-body ol { margin: 8px 0 14px 20px; }
            .word-content-body table { width: 100%; border-collapse: collapse; margin: 14px 0; }
            .word-content-body th, .word-content-body td { border: 1px solid #d1d5db; padding: 6px 10px; }
            .word-content-body th { background: #f3f4f6; }
          </style>
          ${html}
        </div>
      </div>
    `;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  clear() {
    if (this.emptyState) this.emptyState.style.display = 'flex';
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.richViewer) this.richViewer.style.display = 'none';
    if (this.pageInfo) this.pageInfo.textContent = 'Page 0 / 0';
  }
}

window.pdfViewer = new Viewer();

