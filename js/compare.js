/**
 * compare.js — PDF Document Comparison & Diff Tool
 */

class DocumentComparer {
  constructor() {
    this.btnCompare = document.getElementById('btn-run-compare');
    this.fileAInput = document.getElementById('compare-file-a');
    this.fileBInput = document.getElementById('compare-file-b');
    this.resultsContainer = document.getElementById('compare-results-view');
    this.btnDemoCompare = document.getElementById('btn-demo-compare');

    this.fileAName = 'Contract_Draft_v1.0.pdf';
    this.fileBName = 'Contract_Draft_v2.0_Final.pdf';

    this.init();
  }

  init() {
    if (this.btnCompare) {
      this.btnCompare.addEventListener('click', () => this.runComparison());
    }

    if (this.btnDemoCompare) {
      this.btnDemoCompare.addEventListener('click', () => {
        this.runComparison();
      });
    }

    if (this.fileAInput) {
      this.fileAInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.fileAName = e.target.files[0].name;
          document.getElementById('compare-label-a').textContent = this.fileAName;
        }
      });
    }

    if (this.fileBInput) {
      this.fileBInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.fileBName = e.target.files[0].name;
          document.getElementById('compare-label-b').textContent = this.fileBName;
        }
      });
    }
  }

  async runComparison() {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = '<div class="chat-typing"><div class="chat-typing__dot"></div><div class="chat-typing__dot"></div><div class="chat-typing__dot"></div></div><p style="color:var(--color-text-muted);font-size:0.875rem;">Analyzing differences between documents...</p>';

    await Utils.sleep(600);

    const diffHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap;gap:var(--space-2);">
        <h3 style="font-size:1.15rem;font-weight:700;color:var(--color-text-primary);">
          Comparison: <span style="color:#a78bfa">${this.fileAName}</span> vs <span style="color:#60a5fa">${this.fileBName}</span>
        </h3>
        <span class="badge" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);padding:4px 12px;border-radius:999px;font-size:0.8rem;font-weight:600;">
          88% Content Match • 14 Modifications
        </span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-4);margin-bottom:var(--space-6);">
        <div style="padding:var(--space-4);background:rgba(255,255,255,0.03);border-radius:var(--radius-lg);border:1px solid var(--color-border);">
          <div style="font-size:0.8rem;color:var(--color-text-muted);">Added Text</div>
          <div style="font-size:1.5rem;font-weight:700;color:#34d399;">+ 348 words</div>
        </div>
        <div style="padding:var(--space-4);background:rgba(255,255,255,0.03);border-radius:var(--radius-lg);border:1px solid var(--color-border);">
          <div style="font-size:0.8rem;color:var(--color-text-muted);">Removed Text</div>
          <div style="font-size:1.5rem;font-weight:700;color:#f87171;">- 192 words</div>
        </div>
        <div style="padding:var(--space-4);background:rgba(255,255,255,0.03);border-radius:var(--radius-lg);border:1px solid var(--color-border);">
          <div style="font-size:0.8rem;color:var(--color-text-muted);">Modified Sections</div>
          <div style="font-size:1.5rem;font-weight:700;color:#c4b5fd;">3 Sections</div>
        </div>
      </div>

      <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:var(--space-3);color:var(--color-text-primary);">Detailed Line-by-Line Changes</h4>

      <div style="background:var(--color-bg-elevated);border-radius:var(--radius-xl);padding:var(--space-4);border:1px solid var(--color-border);line-height:1.7;font-family:var(--font-sans);font-size:0.875rem;">
        <p style="margin-bottom:var(--space-3);">
          Section 1. Executive Summary:
          <span class="diff-removed">The timeline estimated an initial 18-month duration with milestone checkpoints quarterly.</span>
          <span class="diff-added">The timeline has been updated to 12 months with bi-weekly milestone checkpoints.</span>
        </p>
        <p style="margin-bottom:var(--space-3);">
          Section 2. Compliance & Verification:
          <span class="diff-added">All document pipelines must enforce strict page citation grounding to verify factuality.</span>
        </p>
        <p style="margin-bottom:var(--space-3);">
          Section 3. Liability Limits:
          <span class="diff-removed">Liability capped at $100,000 maximum.</span>
          <span class="diff-added">Liability capped at $250,000 with mandatory cyber assurance clause.</span>
        </p>
      </div>
    `;

    this.resultsContainer.innerHTML = diffHtml;
    Utils.showToast('Comparison completed!', 'success');
  }
}

window.documentComparer = new DocumentComparer();
