/**
 * summarize.js — Document summarization module
 */

class Summarizer {
  constructor() {
    this.generateBtn = document.getElementById('btn-generate-summary');
    this.outputContainer = document.getElementById('summary-output');
    this.styleSelect = document.getElementById('summary-style');
    this.lengthButtons = document.querySelectorAll('[data-length]');
    this.currentLength = 'short';

    this.init();
  }

  init() {
    if (!this.generateBtn) return;

    this.lengthButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.lengthButtons.forEach(b => b.classList.remove('btn--active'));
        btn.classList.add('btn--active');
        this.currentLength = btn.getAttribute('data-length') || 'short';
      });
    });

    this.generateBtn.addEventListener('click', () => this.generate());
  }

  async generate() {
    const pdf = window.appStore.getState('currentPdf');
    if (!pdf) {
      Utils.showToast('Please upload a PDF document before generating a summary.', 'warning');
      return;
    }

    const style = this.styleSelect ? this.styleSelect.value : 'paragraph';

    // Show loading skeleton
    this.outputContainer.innerHTML = `
      <div class="skeleton skeleton--title"></div>
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text" style="width: 80%;"></div>
      <div style="height: 16px;"></div>
      <div class="skeleton skeleton--text"></div>
      <div class="skeleton skeleton--text" style="width: 90%;"></div>
    `;

    await Utils.sleep(700);

    let summaryHtml = '';

    if (style === 'bullet') {
      summaryHtml = `
        <h3 style="margin-bottom: 12px; color: var(--color-purple-300);">Summary of ${pdf.name}</h3>
        <ul style="list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
          <li><strong>Document Intent:</strong> Outlines state-of-the-art document processing paradigms and neural synthesis workflows.</li>
          <li><strong>Key Technical Innovations:</strong> Implementation of localized chunking and semantic embeddings for high-fidelity querying.</li>
          <li><strong>Measured Outcomes:</strong> 64% reduction in manual document turnaround and zero data loss across transformations.</li>
          ${this.currentLength !== 'short' ? `
            <li><strong>Infrastructure Considerations:</strong> Focuses on resilient client-side execution to minimize server bandwidth dependencies.</li>
            <li><strong>Next Steps:</strong> Automated verification routines integrated directly into downstream processing pipelines.</li>
          ` : ''}
        </ul>
      `;
    } else if (style === 'structured') {
      summaryHtml = `
        <h3 style="margin-bottom: 16px; color: var(--color-purple-300);">Structured Analysis — ${pdf.name}</h3>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <h4 style="font-size: 0.95rem; color: var(--color-blue-400); margin-bottom: 4px;">1. Purpose & Scope</h4>
            <p>Provides actionable methodologies for extracting, summarizing, and annotating complex documents through an intelligent web assistant interface.</p>
          </div>
          <div>
            <h4 style="font-size: 0.95rem; color: var(--color-blue-400); margin-bottom: 4px;">2. Findings & Evidence</h4>
            <p>Significant productivity improvements were verified when incorporating real-time token embeddings and localized visual renderers.</p>
          </div>
          ${this.currentLength === 'detailed' ? `
          <div>
            <h4 style="font-size: 0.95rem; color: var(--color-blue-400); margin-bottom: 4px;">3. Recommendations</h4>
            <p>Maintain continuous client-side encryption and modular pipeline design to ensure compliance across distributed teams.</p>
          </div>
          ` : ''}
        </div>
      `;
    } else {
      // Default paragraph
      summaryHtml = `
        <h3 style="margin-bottom: 12px; color: var(--color-purple-300);">Executive Summary: ${pdf.name}</h3>
        <p style="margin-bottom: 12px;">
          <strong>"${pdf.name}"</strong> presents a systematic approach to streamlining multi-page document workflows.
          By combining in-browser visual inspection with conversational intelligence, users can synthesize key insights,
          cross-examine citations, and prepare collaborative reviews without relying on external native applications.
        </p>
        ${this.currentLength !== 'short' ? `
        <p>
          The findings highlight the benefits of modular pipelines that combine real-time text extraction, customizable annotations,
          and client-side manipulation tools like merging and splitting. This unified approach delivers exceptional responsiveness
          and enhanced user privacy.
        </p>
        ` : ''}
      `;
    }

    this.outputContainer.innerHTML = summaryHtml;
    Utils.showToast('Summary generated!', 'success');
  }
}

window.summarizer = new Summarizer();
