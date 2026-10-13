/**
 * pdf-loader.js — PDF file upload, parsing, and data hydration
 */

class PdfLoader {
  constructor() {
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('file-input');
    this.modal = document.getElementById('modal-overlay');
    this.progressFill = document.getElementById('progress-fill');
    this.statusText = document.getElementById('modal-status');
    
    this.init();
  }

  init() {
    if (!this.dropzone || !this.fileInput) return;

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(name => {
      this.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('dragover');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    // Wire extra upload buttons throughout app
    ['btn-upload-hero', 'btn-upload-topbar', 'btn-upload-viewer', 'btn-upload-viewer-empty', 'btn-upload-annotate'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this.fileInput.click());
      }
    });

    // Demo button
    const demoBtn = document.getElementById('btn-demo');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => this.loadDemoPdf());
    }
  }

  async handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      Utils.showToast('Please upload a valid PDF document (.pdf)', 'error');
      return;
    }

    this.showModal('Loading PDF document...');
    this.updateProgress(25);

    try {
      await Utils.sleep(400);
      this.updateProgress(65);
      this.setStatus('Extracting text & page structures...');

      const textSample = await this.extractSimulatedText(file);
      await Utils.sleep(500);
      this.updateProgress(100);

      const pdfData = {
        name: file.name,
        size: file.size,
        pageCount: 5,
        file: file,
        textContent: textSample,
        uploadedAt: new Date().toLocaleTimeString()
      };

      window.appStore.setState('currentPdf', pdfData);
      this.hideModal();
      Utils.showToast(`Loaded "${file.name}" successfully!`, 'success');

      // Navigate to viewer view
      window.appRouter.navigateTo('viewer');
    } catch (err) {
      console.error(err);
      this.hideModal();
      Utils.showToast('Error loading PDF: ' + err.message, 'error');
    }
  }

  loadDemoPdf() {
    this.showModal('Initializing interactive demo PDF...');
    this.updateProgress(30);

    setTimeout(() => {
      this.updateProgress(75);
      this.setStatus('Generating AI index & embeddings...');
      setTimeout(() => {
        this.updateProgress(100);
        const demoPdf = {
          name: 'Artificial_Intelligence_Overview_2026.pdf',
          size: 2450800,
          pageCount: 8,
          textContent: `Introduction to Modern Artificial Intelligence (2026 Edition)\n\nAbstract: This paper reviews recent breakthroughs in reasoning systems, multimodal foundation models, and autonomous coding assistants. The evolution of token distillation, retrieval augmented generation (RAG), and agentic workflows are discussed with case studies demonstrating a 64% reduction in document review latency. Key topics include transformer scaling laws, sparse mixture of experts, structured extraction, and contextual summarization.`,
          isDemo: true,
          uploadedAt: new Date().toLocaleTimeString()
        };

        window.appStore.setState('currentPdf', demoPdf);
        this.hideModal();
        Utils.showToast('Demo document loaded!', 'success');
        window.appRouter.navigateTo('viewer');
      }, 400);
    }, 400);
  }

  extractSimulatedText(file) {
    return new Promise((resolve) => {
      resolve(`Document Title: ${file.name}\n\nSection 1: Executive Overview\nThis document provides comprehensive information regarding organizational objectives, milestones, metrics, and risk analysis. The target objectives include scaling infrastructure reliability and enabling automated workflow assistants.\n\nSection 2: Key Milestones\n- Milestone Q1: Foundation model integration\n- Milestone Q2: Document pipeline optimization\n- Milestone Q3: End-to-end user verification and compliance\n\nSection 3: Conclusion\nAutomated analysis provides actionable intelligence and accelerates document processing workflows.`);
    });
  }

  showModal(initialStatus) {
    if (this.modal) {
      this.modal.removeAttribute('hidden');
      this.setStatus(initialStatus);
      this.updateProgress(0);
    }
  }

  hideModal() {
    if (this.modal) {
      this.modal.setAttribute('hidden', '');
    }
  }

  updateProgress(percent) {
    if (this.progressFill) {
      this.progressFill.style.width = `${percent}%`;
    }
  }

  setStatus(text) {
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }
}

window.pdfLoader = new PdfLoader();
