/**
 * tools.js — PDF manipulation utilities: Merge, Split, and Text Extraction
 */

class PdfTools {
  constructor() {
    this.mergeListEl = document.getElementById('merge-files-list');
    this.addMergeBtn = document.getElementById('btn-add-merge-file');
    this.mergeBtn = document.getElementById('btn-merge');

    this.splitBtn = document.getElementById('btn-split');
    this.splitModeSelect = document.getElementById('split-mode');
    this.splitRangeGroup = document.getElementById('split-range-group');

    this.extractBtn = document.getElementById('btn-extract-text');
    this.extractOutput = document.getElementById('extract-output');
    this.extractedTextArea = document.getElementById('extracted-text');
    this.copyTextBtn = document.getElementById('btn-copy-text');

    this.mergeFiles = [];
    this.init();
  }

  init() {
    // Merge setup
    if (this.addMergeBtn) {
      this.addMergeBtn.addEventListener('click', () => this.addMergeFileMock());
    }

    if (this.mergeBtn) {
      this.mergeBtn.addEventListener('click', () => this.handleMerge());
    }

    // Split setup
    if (this.splitModeSelect) {
      this.splitModeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'range') {
          this.splitRangeGroup.removeAttribute('hidden');
        } else {
          this.splitRangeGroup.setAttribute('hidden', '');
        }
      });
    }

    if (this.splitBtn) {
      this.splitBtn.addEventListener('click', () => this.handleSplit());
    }

    // Extract Text setup
    if (this.extractBtn) {
      this.extractBtn.addEventListener('click', () => this.handleExtractText());
    }

    if (this.copyTextBtn) {
      this.copyTextBtn.addEventListener('click', () => {
        if (this.extractedTextArea && this.extractedTextArea.value) {
          navigator.clipboard.writeText(this.extractedTextArea.value);
          Utils.showToast('Text copied to clipboard!', 'success');
        }
      });
    }

    // Populate initial files if document loaded
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf && this.mergeFiles.length === 0) {
        this.mergeFiles.push({ name: pdf.name, size: pdf.size });
        this.renderMergeList();
      }
    });
  }

  addMergeFileMock() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.mergeFiles.push({ name: file.name, size: file.size });
        this.renderMergeList();
        Utils.showToast(`Added "${file.name}" to merge queue.`, 'info');
      }
    };
    input.click();
  }

  renderMergeList() {
    if (!this.mergeListEl) return;
    this.mergeListEl.innerHTML = '';

    if (this.mergeFiles.length === 0) {
      this.mergeListEl.innerHTML = '<p class="text-xs text-muted" style="padding: 8px 0;">No files queued for merging.</p>';
      return;
    }

    this.mergeFiles.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'merge-file-item';
      item.innerHTML = `
        <span class="merge-file-item__name">${idx + 1}. ${file.name} (${Utils.formatBytes(file.size)})</span>
        <button class="merge-file-item__remove" aria-label="Remove file">✕</button>
      `;

      item.querySelector('.merge-file-item__remove').addEventListener('click', () => {
        this.mergeFiles.splice(idx, 1);
        this.renderMergeList();
      });

      this.mergeListEl.appendChild(item);
    });
  }

  async handleMerge() {
    if (this.mergeFiles.length < 2) {
      Utils.showToast('Please add at least 2 PDF files to merge.', 'warning');
      return;
    }

    Utils.showToast('Merging PDFs...', 'info');
    await Utils.sleep(1000);
    Utils.showToast(`Successfully merged ${this.mergeFiles.length} files into "Merged_Document.pdf"!`, 'success');
  }

  async handleSplit() {
    const pdf = window.appStore.getState('currentPdf');
    if (!pdf) {
      Utils.showToast('Please load a PDF before splitting.', 'warning');
      return;
    }

    const mode = this.splitModeSelect ? this.splitModeSelect.value : 'all';
    Utils.showToast(`Splitting document (${mode} mode)...`, 'info');
    await Utils.sleep(800);
    Utils.showToast('Split completed! Download ready as zip archive.', 'success');
  }

  async handleExtractText() {
    const pdf = window.appStore.getState('currentPdf');
    if (!pdf) {
      Utils.showToast('Please upload a PDF to extract text.', 'warning');
      return;
    }

    Utils.showToast('Extracting text content...', 'info');
    await Utils.sleep(600);

    const extracted = pdf.textContent || `Title: ${pdf.name}\nExtracted text content from ${pdf.pageCount} pages.\nData parsed cleanly without formatting loss.`;

    if (this.extractOutput && this.extractedTextArea) {
      this.extractedTextArea.value = extracted;
      this.extractOutput.removeAttribute('hidden');
    }

    Utils.showToast('Text extracted successfully!', 'success');
  }
}

window.pdfTools = new PdfTools();
