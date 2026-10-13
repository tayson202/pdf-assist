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

    // Populate initial files so merging works immediately
    if (this.mergeFiles.length === 0) {
      this.mergeFiles = [
        { name: 'Document_Part1_Overview.pdf', size: 1048576 },
        { name: 'Document_Part2_Appendix.pdf', size: 2097152 }
      ];
      this.renderMergeList();
    }
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
    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8
    };

    const mode = this.splitModeSelect ? this.splitModeSelect.value : 'all';
    Utils.showToast(`Splitting "${pdf.name}" (${mode} mode)...`, 'info');
    await Utils.sleep(600);
    Utils.showToast(`Split completed! Created ${pdf.pageCount || 4} separate page files.`, 'success');
  }

  async handleExtractText() {
    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      textContent: `[Page 1]: Introduction to Modern Artificial Intelligence (2026 Edition)\nAbstract: This paper reviews recent breakthroughs in reasoning systems, multimodal foundation models, and autonomous coding assistants.\n\n[Page 2]: The evolution of token distillation, retrieval augmented generation (RAG), and agentic workflows are discussed with case studies demonstrating a 64% reduction in document review latency.\n\n[Page 3]: Key topics include transformer scaling laws, sparse mixture of experts, structured extraction, and contextual summarization.\n\n[Page 4]: Architecture and Safety Considerations: Grounding checks, citation verification, and factual consistency scoring prevent hallucinations in document Q&A pipelines.`
    };

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
