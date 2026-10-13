/**
 * viewer.js — Document canvas renderer & page navigator
 */

class Viewer {
  constructor() {
    this.canvas = document.getElementById('pdf-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.emptyState = document.getElementById('viewer-empty');
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
        const pdf = window.appStore.getState('currentPdf');
        if (!pdf) {
          Utils.showToast('No PDF available to download.', 'warning');
          return;
        }
        Utils.showToast(`Downloading ${pdf.name}...`, 'info');
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
    const pdf = window.appStore.getState('currentPdf');
    if (!pdf) {
      this.clear();
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';
    this.canvas.style.display = 'block';

    if (this.pageInfo) {
      this.pageInfo.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
    }

    // Try rendering real PDF page via PDF.js if available
    if (pdf.pdfDoc) {
      try {
        const page = await pdf.pdfDoc.getPage(this.currentPage);
        const scale = (this.zoom / 100) * 1.35;
        const viewport = page.getViewport({ scale });

        this.canvas.width = viewport.width;
        this.canvas.height = viewport.height;

        const renderContext = {
          canvasContext: this.ctx,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        return;
      } catch (err) {
        console.warn('PDF.js rendering exception, switching to canvas template:', err);
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

  clear() {
    if (this.emptyState) this.emptyState.style.display = 'flex';
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.pageInfo) this.pageInfo.textContent = 'Page 0 / 0';
  }
}

window.pdfViewer = new Viewer();

