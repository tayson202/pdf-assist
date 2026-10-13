/**
 * annotate.js — PDF annotation toolbar and drawing canvas
 */

class Annotator {
  constructor() {
    this.wrapper = document.getElementById('annotate-canvas-wrapper');
    this.emptyState = document.getElementById('annotate-empty');
    this.saveBtn = document.getElementById('btn-save-annotations');
    
    this.activeTool = 'highlight'; // highlight, underline, note, erase
    this.activeColor = '#a78bfa';
    this.isDrawing = false;
    this.canvas = null;
    this.ctx = null;
    this.annotations = [];

    this.init();
  }

  init() {
    // Tool buttons
    const toolButtons = {
      'tool-highlight': 'highlight',
      'tool-underline': 'underline',
      'tool-note': 'note',
      'tool-erase': 'erase'
    };

    Object.entries(toolButtons).forEach(([id, tool]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeTool = tool;
        });
      }
    });

    // Default active highlight
    const defaultBtn = document.getElementById('tool-highlight');
    if (defaultBtn) defaultBtn.classList.add('active');

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.activeColor = swatch.getAttribute('data-color') || '#a78bfa';
      });
    });

    // Save button
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => {
        const count = this.annotations.length;
        Utils.showToast(`Saved ${count} annotation${count === 1 ? '' : 's'}!`, 'success');
      });
    }

    // Subscribe to document updates
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf) {
        this.setupCanvas(pdf);
      } else {
        this.clearCanvas();
      }
    });
  }

  setupCanvas(pdf) {
    if (!this.wrapper) return;

    if (this.emptyState) this.emptyState.style.display = 'none';

    // Remove existing canvas if any
    const existing = this.wrapper.querySelector('.annotation-canvas');
    if (existing) existing.remove();

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'annotation-canvas';
    this.canvas.width = 595;
    this.canvas.height = 842;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = 'var(--shadow-lg)';
    this.canvas.style.cursor = 'crosshair';

    this.ctx = this.canvas.getContext('2d');

    // Draw document page representation
    this.renderBaseDocument(pdf);

    // Attach drawing events
    this.attachDrawingEvents();

    this.wrapper.appendChild(this.canvas);
  }

  renderBaseDocument(pdf) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 595, 842);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`${pdf.name} — Annotation View`, 40, 60);

    ctx.fillStyle = '#6b7280';
    ctx.font = '13px Inter, sans-serif';
    const lines = [
      'Click and drag on the text below to create highlights, underlines, or notes.',
      '',
      'High-throughput parsing decomposes documents into localized sections. Each section undergoes',
      'entity extraction, identifying relational dependencies, summary points, and citations.',
      'Key metrics indicate substantial improvements across speed, accuracy, and review fidelity.',
      '',
      'Automated analysis provides actionable intelligence and accelerates document processing workflows.'
    ];

    let y = 100;
    lines.forEach(l => {
      ctx.fillText(l, 40, y);
      y += 24;
    });
  }

  attachDrawingEvents() {
    let startX = 0;
    let startY = 0;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      startX = pos.x;
      startY = pos.y;
      this.isDrawing = true;

      if (this.activeTool === 'note') {
        this.addNote(startX, startY);
        this.isDrawing = false;
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      const pos = getPos(e);

      if (this.activeTool === 'highlight') {
        const width = pos.x - startX;
        const height = 20;
        this.drawHighlight(startX, startY - 14, width, height, this.activeColor);
        this.annotations.push({ type: 'highlight', x: startX, y: startY, width, height });
      } else if (this.activeTool === 'underline') {
        this.drawUnderline(startX, startY, pos.x, startY, this.activeColor);
        this.annotations.push({ type: 'underline', x1: startX, y1: startY, x2: pos.x, y2: startY });
      }
    });
  }

  drawHighlight(x, y, w, h, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  drawUnderline(x1, y1, x2, y2, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  addNote(x, y) {
    const noteText = prompt('Enter annotation note:');
    if (!noteText) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = this.activeColor;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('N', x - 4, y + 4);
    ctx.restore();

    this.annotations.push({ type: 'note', x, y, text: noteText });
    Utils.showToast(`Added note: "${Utils.truncate(noteText, 25)}"`, 'info');
  }

  clearCanvas() {
    if (this.emptyState) this.emptyState.style.display = 'flex';
    if (this.canvas) this.canvas.remove();
    this.canvas = null;
    this.annotations = [];
  }
}

window.annotator = new Annotator();
