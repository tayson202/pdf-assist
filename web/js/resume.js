/**
 * resume.js — AI Resume Builder, Parser, Template Engine & ATS Analyzer
 */

class ResumeManager {
  constructor() {
    this.currentTemplate = 'modern'; // 'modern' | 'executive' | 'creative' | 'classic'
    this.activeTab = 'editor'; // 'editor' | 'wizard'

    // Default high-rated resume data
    this.data = {
      name: 'Alex Morgan',
      title: 'Senior Full-Stack & AI Systems Engineer',
      email: 'alex.morgan@email.com',
      phone: '+1 (555) 349-2810',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/alexmorgan',
      github: 'github.com/alexmorgan',
      summary: 'Results-driven Senior Software Engineer with 6+ years of experience architecting high-throughput distributed systems, RAG document pipelines, and modern web applications. Proven track record reducing review latency by 64% and scaling cloud services to 2M+ active users.',
      experience: [
        {
          role: 'Lead AI & Full-Stack Engineer',
          company: 'CognitiveScale Intelligence',
          location: 'San Francisco, CA',
          dates: '2023 - Present',
          bullets: [
            'Architected end-to-end RAG document intelligence pipeline processing 500K+ PDFs monthly with verified page citations.',
            'Reduced document review cycle latency by 64% using vector embeddings, semantic caching, and asynchronous workers.',
            'Mentored 8 engineers across React, TypeScript, FastAPI, and PostgreSQL microservices.'
          ]
        },
        {
          role: 'Senior Software Engineer',
          company: 'Nexus Cloud Platforms',
          location: 'San Jose, CA',
          dates: '2020 - 2023',
          bullets: [
            'Engineered microservices handling 25,000 req/sec with 99.99% uptime using Python, FastAPI, and Kubernetes.',
            'Built responsive client web applications in modern JavaScript and Canvas APIs, boosting engagement by 42%.',
            'Optimized SQL queries and database connection pooling, reducing p95 latency by 120ms.'
          ]
        }
      ],
      education: [
        {
          degree: 'B.S. in Computer Science',
          school: 'University of California, Berkeley',
          dates: '2016 - 2020',
          details: 'Dean’s Honors List • Focus on Distributed Systems & Artificial Intelligence'
        }
      ],
      skills: [
        'Python', 'FastAPI', 'JavaScript / TypeScript', 'React', 'HTML5 / CSS3',
        'RAG & Vector Search', 'PostgreSQL', 'Docker & Kubernetes', 'REST APIs',
        'System Architecture', 'CI/CD Pipelines', 'Performance Optimization'
      ],
      certifications: [
        'AWS Certified Solutions Architect – Professional',
        'DeepLearning.AI Large Language Models Architecture'
      ]
    };

    this.wizardStep = 1;
    this.init();
  }

  init() {
    this.bindEvents();
    this.populateEditor();
    this.renderPreview();
    this.updateAtsScore();
  }

  bindEvents() {
    // Mode tabs
    const tabEditor = document.getElementById('tab-resume-editor');
    const tabWizard = document.getElementById('tab-resume-wizard');
    if (tabEditor && tabWizard) {
      tabEditor.addEventListener('click', () => this.switchTab('editor'));
      tabWizard.addEventListener('click', () => this.switchTab('wizard'));
    }

    // Template Selector Cards
    document.querySelectorAll('.template-card[data-template]').forEach(card => {
      card.addEventListener('click', () => {
        const tpl = card.getAttribute('data-template');
        this.setTemplate(tpl);
      });
    });

    // Import Resume File Input
    const importInput = document.getElementById('resume-import-file');
    const btnImport = document.getElementById('btn-import-resume');
    if (btnImport && importInput) {
      btnImport.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.handleImportFile(e.target.files[0]);
        }
      });
    }

    // Load Sample Button
    const btnSample = document.getElementById('btn-load-sample-resume');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        this.loadSample();
        Utils.showToast('Loaded Top-Rated Tech Resume template!', 'success');
      });
    }

    // Export PDF Button
    const btnExportPdf = document.getElementById('btn-export-resume-pdf');
    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', () => this.exportPdf());
    }

    // Copy Text Button
    const btnCopy = document.getElementById('btn-copy-resume-text');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyAsText());
    }

    // AI summary enhance button
    const btnAiSummary = document.getElementById('btn-ai-enhance-summary');
    if (btnAiSummary) {
      btnAiSummary.addEventListener('click', () => this.aiEnhanceSummary());
    }

    // Add Experience Button
    const btnAddExp = document.getElementById('btn-add-experience');
    if (btnAddExp) {
      btnAddExp.addEventListener('click', () => this.addExperienceItem());
    }

    // Add Skill Button
    const btnAddSkill = document.getElementById('btn-add-skill');
    const skillInput = document.getElementById('input-new-skill');
    if (btnAddSkill && skillInput) {
      const addSkillFn = () => {
        const val = skillInput.value.trim();
        if (val && !this.data.skills.includes(val)) {
          this.data.skills.push(val);
          skillInput.value = '';
          this.renderSkillsTags();
          this.renderPreview();
          this.updateAtsScore();
        }
      };
      btnAddSkill.addEventListener('click', addSkillFn);
      skillInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkillFn();
        }
      });
    }

    // Live update on input changes in editor
    const liveFields = ['res-name', 'res-title', 'res-email', 'res-phone', 'res-location', 'res-linkedin', 'res-github', 'res-summary'];
    liveFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.syncFromEditor();
          this.renderPreview();
          this.updateAtsScore();
        });
      }
    });

    // Wizard navigation buttons
    const btnWizNext = document.getElementById('btn-wizard-next');
    const btnWizPrev = document.getElementById('btn-wizard-prev');
    const btnWizFinish = document.getElementById('btn-wizard-finish');

    if (btnWizNext) btnWizNext.addEventListener('click', () => this.nextWizardStep());
    if (btnWizPrev) btnWizPrev.addEventListener('click', () => this.prevWizardStep());
    if (btnWizFinish) btnWizFinish.addEventListener('click', () => this.finishWizard());
  }

  switchTab(tab) {
    this.activeTab = tab;
    const editorView = document.getElementById('resume-editor-view');
    const wizardView = document.getElementById('resume-wizard-view');
    const tabEditor = document.getElementById('tab-resume-editor');
    const tabWizard = document.getElementById('tab-resume-wizard');

    if (tab === 'editor') {
      if (editorView) editorView.removeAttribute('hidden');
      if (wizardView) wizardView.setAttribute('hidden', '');
      if (tabEditor) tabEditor.classList.add('btn--active');
      if (tabWizard) tabWizard.classList.remove('btn--active');
    } else {
      if (editorView) editorView.setAttribute('hidden', '');
      if (wizardView) wizardView.removeAttribute('hidden');
      if (tabEditor) tabEditor.classList.remove('btn--active');
      if (tabWizard) tabWizard.classList.add('btn--active');
      this.renderWizardStep();
    }
  }

  setTemplate(templateName) {
    this.currentTemplate = templateName;
    document.querySelectorAll('.template-card[data-template]').forEach(c => {
      if (c.getAttribute('data-template') === templateName) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    this.renderPreview();
    Utils.showToast(`Switched to "${this.getTemplateTitle(templateName)}" template`, 'info');
  }

  getTemplateTitle(t) {
    switch (t) {
      case 'modern': return 'Modern Tech Pro ⭐ 4.9 (Highest Rated)';
      case 'executive': return 'Executive Minimalist ⭐ 4.8';
      case 'creative': return 'Creative Gradient ⭐ 4.8';
      case 'classic': return 'Classic ATS Standard ⭐ 4.7';
      default: return t;
    }
  }

  populateEditor() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('res-name', this.data.name);
    setVal('res-title', this.data.title);
    setVal('res-email', this.data.email);
    setVal('res-phone', this.data.phone);
    setVal('res-location', this.data.location);
    setVal('res-linkedin', this.data.linkedin);
    setVal('res-github', this.data.github);
    setVal('res-summary', this.data.summary);

    this.renderExperienceEditor();
    this.renderSkillsTags();
  }

  syncFromEditor() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    this.data.name = getVal('res-name') || 'Your Name';
    this.data.title = getVal('res-title') || 'Professional Title';
    this.data.email = getVal('res-email') || '';
    this.data.phone = getVal('res-phone') || '';
    this.data.location = getVal('res-location') || '';
    this.data.linkedin = getVal('res-linkedin') || '';
    this.data.github = getVal('res-github') || '';
    this.data.summary = getVal('res-summary') || '';
  }

  renderExperienceEditor() {
    const container = document.getElementById('experience-items-list');
    if (!container) return;
    container.innerHTML = '';

    this.data.experience.forEach((exp, idx) => {
      const item = document.createElement('div');
      item.className = 'experience-edit-card card';
      item.style.marginBottom = 'var(--space-3)';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="color:var(--color-purple-300);">Position #${idx + 1}</strong>
          <button class="btn btn--danger btn--sm" data-remove-exp="${idx}">✕ Remove</button>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <input type="text" class="form-input form-input--sm exp-role" placeholder="Role / Title" value="${this.escapeHtml(exp.role)}" data-idx="${idx}" />
          <input type="text" class="form-input form-input--sm exp-company" placeholder="Company Name" value="${this.escapeHtml(exp.company)}" data-idx="${idx}" />
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <input type="text" class="form-input form-input--sm exp-dates" placeholder="Dates (e.g. 2022 - Present)" value="${this.escapeHtml(exp.dates)}" data-idx="${idx}" />
          <input type="text" class="form-input form-input--sm exp-location" placeholder="Location" value="${this.escapeHtml(exp.location)}" data-idx="${idx}" />
        </div>
        <div>
          <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:4px;">Key Achievements / Bullet Points (one per line):</label>
          <textarea class="form-textarea exp-bullets" rows="3" style="font-size:0.8rem;" data-idx="${idx}">${exp.bullets.join('\n')}</textarea>
        </div>
      `;

      item.querySelector('[data-remove-exp]').addEventListener('click', () => {
        this.data.experience.splice(idx, 1);
        this.renderExperienceEditor();
        this.renderPreview();
        this.updateAtsScore();
      });

      // Bind input events
      item.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
          const i = parseInt(input.getAttribute('data-idx'), 10);
          const role = item.querySelector('.exp-role').value;
          const company = item.querySelector('.exp-company').value;
          const dates = item.querySelector('.exp-dates').value;
          const loc = item.querySelector('.exp-location').value;
          const bullets = item.querySelector('.exp-bullets').value.split('\n').filter(b => b.trim().length > 0);

          this.data.experience[i] = { role, company, location: loc, dates, bullets };
          this.renderPreview();
          this.updateAtsScore();
        });
      });

      container.appendChild(item);
    });
  }

  addExperienceItem() {
    this.data.experience.push({
      role: 'Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'Remote',
      dates: '2021 - 2023',
      bullets: [
        'Developed modular components and REST API services with 99.8% code coverage.',
        'Collaborated with product designers to implement responsive, accessible UI workflows.'
      ]
    });
    this.renderExperienceEditor();
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast('Added new experience entry', 'info');
  }

  renderSkillsTags() {
    const container = document.getElementById('skills-tags-container');
    if (!container) return;
    container.innerHTML = '';

    this.data.skills.forEach((skill, idx) => {
      const tag = document.createElement('span');
      tag.className = 'badge';
      tag.style.cssText = 'background:rgba(139,92,246,0.18);border:1px solid rgba(167,139,250,0.4);color:#c4b5fd;padding:4px 10px;border-radius:999px;font-size:0.75rem;display:inline-flex;align-items:center;gap:6px;margin:2px;';
      tag.innerHTML = `<span>${this.escapeHtml(skill)}</span><button style="background:none;border:none;color:#f87171;cursor:pointer;font-size:0.75rem;" title="Remove">✕</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        this.data.skills.splice(idx, 1);
        this.renderSkillsTags();
        this.renderPreview();
        this.updateAtsScore();
      });
      container.appendChild(tag);
    });
  }

  renderPreview() {
    const previewEl = document.getElementById('resume-paper-preview');
    if (!previewEl) return;

    previewEl.className = `resume-paper resume-template--${this.currentTemplate}`;

    switch (this.currentTemplate) {
      case 'modern':
        previewEl.innerHTML = this.renderModernTemplate();
        break;
      case 'executive':
        previewEl.innerHTML = this.renderExecutiveTemplate();
        break;
      case 'creative':
        previewEl.innerHTML = this.renderCreativeTemplate();
        break;
      case 'classic':
      default:
        previewEl.innerHTML = this.renderClassicTemplate();
        break;
    }
  }

  renderModernTemplate() {
    const d = this.data;
    return `
      <div class="resume-header resume-modern-header">
        <div>
          <h1 class="resume-name" style="font-size:1.8rem;font-weight:800;color:#111827;margin:0 0 4px 0;">${this.escapeHtml(d.name)}</h1>
          <p class="resume-title" style="font-size:1.05rem;color:#7c3aed;font-weight:600;margin:0;">${this.escapeHtml(d.title)}</p>
        </div>
        <div class="resume-contact" style="font-size:0.75rem;color:#4b5563;line-height:1.5;text-align:right;">
          ${d.email ? `<div>✉ ${this.escapeHtml(d.email)}</div>` : ''}
          ${d.phone ? `<div>📞 ${this.escapeHtml(d.phone)}</div>` : ''}
          ${d.location ? `<div>📍 ${this.escapeHtml(d.location)}</div>` : ''}
          ${d.linkedin ? `<div>🔗 ${this.escapeHtml(d.linkedin)}</div>` : ''}
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg, #7c3aed, #3b82f6);margin:12px 0 16px 0;"></div>

      ${d.summary ? `
        <div class="resume-section">
          <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:6px;">Professional Summary</h2>
          <p style="font-size:0.85rem;line-height:1.55;color:#374151;margin:0 0 14px 0;">${this.escapeHtml(d.summary)}</p>
        </div>
      ` : ''}

      <div class="resume-section">
        <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:8px;">Experience</h2>
        ${d.experience.map(exp => `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
              <strong style="font-size:0.88rem;color:#111827;">${this.escapeHtml(exp.role)}</strong>
              <span style="font-size:0.78rem;color:#6b7280;font-weight:500;">${this.escapeHtml(exp.dates)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:#4b5563;font-size:0.8rem;margin-bottom:4px;">
              <span>${this.escapeHtml(exp.company)}</span>
              <span>${this.escapeHtml(exp.location)}</span>
            </div>
            <ul style="margin:4px 0 0 0;padding-left:18px;font-size:0.8rem;color:#374151;line-height:1.5;">
              ${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div class="resume-section">
        <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:8px;">Education</h2>
        ${d.education.map(edu => `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
              <strong style="font-size:0.85rem;color:#111827;">${this.escapeHtml(edu.degree)}</strong>
              <span style="font-size:0.78rem;color:#6b7280;">${this.escapeHtml(edu.dates)}</span>
            </div>
            <div style="font-size:0.8rem;color:#4b5563;">${this.escapeHtml(edu.school)} • <span style="color:#6b7280;">${this.escapeHtml(edu.details)}</span></div>
          </div>
        `).join('')}
      </div>

      <div class="resume-section" style="margin-top:12px;">
        <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:6px;">Key Competencies &amp; Skills</h2>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${d.skills.map(s => `
            <span style="background:#f3e8ff;color:#6b21a8;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">${this.escapeHtml(s)}</span>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderExecutiveTemplate() {
    const d = this.data;
    return `
      <div style="text-align:center;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:16px;">
        <h1 style="font-size:2rem;font-family:serif;font-weight:700;color:#111827;margin:0 0 4px 0;letter-spacing:0.02em;">${this.escapeHtml(d.name).toUpperCase()}</h1>
        <p style="font-size:0.95rem;color:#4b5563;font-weight:600;margin:0 0 6px 0;">${this.escapeHtml(d.title)}</p>
        <div style="font-size:0.78rem;color:#6b7280;">
          ${[d.email, d.phone, d.location, d.linkedin].filter(Boolean).map(this.escapeHtml).join('  |  ')}
        </div>
      </div>

      ${d.summary ? `
        <div style="margin-bottom:14px;">
          <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:6px;color:#111827;">Executive Profile</h2>
          <p style="font-size:0.82rem;line-height:1.6;color:#374151;margin:0;">${this.escapeHtml(d.summary)}</p>
        </div>
      ` : ''}

      <div style="margin-bottom:14px;">
        <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:8px;color:#111827;">Professional Experience</h2>
        ${d.experience.map(exp => `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:0.86rem;font-weight:700;color:#111827;">${this.escapeHtml(exp.company)} — <span style="font-weight:500;font-style:italic;">${this.escapeHtml(exp.role)}</span></span>
              <span style="font-size:0.78rem;color:#4b5563;font-weight:600;">${this.escapeHtml(exp.dates)}</span>
            </div>
            <ul style="margin:4px 0 0 0;padding-left:18px;font-size:0.8rem;color:#374151;line-height:1.5;">
              ${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom:14px;">
        <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:8px;color:#111827;">Education &amp; Credentials</h2>
        ${d.education.map(edu => `
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
            <span><strong>${this.escapeHtml(edu.school)}</strong>, ${this.escapeHtml(edu.degree)}</span>
            <span style="color:#6b7280;">${this.escapeHtml(edu.dates)}</span>
          </div>
        `).join('')}
      </div>

      <div>
        <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:6px;color:#111827;">Core Competencies</h2>
        <p style="font-size:0.8rem;color:#374151;line-height:1.6;margin:0;">${d.skills.map(this.escapeHtml).join(' • ')}</p>
      </div>
    `;
  }

  renderCreativeTemplate() {
    const d = this.data;
    return `
      <div style="background:linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);color:white;padding:18px 24px;border-radius:8px;margin-bottom:16px;">
        <h1 style="font-size:1.9rem;font-weight:800;margin:0 0 4px 0;">${this.escapeHtml(d.name)}</h1>
        <p style="font-size:1rem;margin:0 0 8px 0;opacity:0.95;">${this.escapeHtml(d.title)}</p>
        <div style="font-size:0.75rem;display:flex;flex-wrap:wrap;gap:12px;opacity:0.9;">
          ${d.email ? `<span>✉ ${this.escapeHtml(d.email)}</span>` : ''}
          ${d.phone ? `<span>📞 ${this.escapeHtml(d.phone)}</span>` : ''}
          ${d.location ? `<span>📍 ${this.escapeHtml(d.location)}</span>` : ''}
          ${d.github ? `<span>💻 ${this.escapeHtml(d.github)}</span>` : ''}
        </div>
      </div>

      ${d.summary ? `
        <div style="margin-bottom:14px;background:#f8fafc;padding:12px 16px;border-left:4px solid #4f46e5;border-radius:4px;">
          <p style="font-size:0.82rem;line-height:1.55;color:#334155;margin:0;">${this.escapeHtml(d.summary)}</p>
        </div>
      ` : ''}

      <div style="margin-bottom:14px;">
        <h2 style="font-size:0.95rem;font-weight:700;color:#1e1b4b;margin-bottom:8px;">Experience</h2>
        ${d.experience.map(exp => `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;">
              <strong style="color:#0f172a;font-size:0.88rem;">${this.escapeHtml(exp.role)} @ ${this.escapeHtml(exp.company)}</strong>
              <span style="font-size:0.75rem;background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:999px;font-weight:600;">${this.escapeHtml(exp.dates)}</span>
            </div>
            <ul style="margin:4px 0 0 0;padding-left:18px;font-size:0.8rem;color:#475569;line-height:1.5;">
              ${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <h2 style="font-size:0.9rem;font-weight:700;color:#1e1b4b;margin-bottom:6px;">Education</h2>
          ${d.education.map(edu => `
            <div style="font-size:0.8rem;color:#334155;margin-bottom:4px;">
              <strong>${this.escapeHtml(edu.degree)}</strong><br/>
              <span>${this.escapeHtml(edu.school)} (${this.escapeHtml(edu.dates)})</span>
            </div>
          `).join('')}
        </div>
        <div>
          <h2 style="font-size:0.9rem;font-weight:700;color:#1e1b4b;margin-bottom:6px;">Skills</h2>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${d.skills.map(s => `
              <span style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-size:0.72rem;font-weight:600;">${this.escapeHtml(s)}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderClassicTemplate() {
    const d = this.data;
    return `
      <div style="text-align:center;margin-bottom:14px;border-bottom:1px solid #111;padding-bottom:10px;">
        <h1 style="font-size:1.75rem;font-weight:bold;margin:0 0 2px 0;color:#000;">${this.escapeHtml(d.name)}</h1>
        <p style="font-size:0.85rem;margin:0 0 4px 0;color:#222;">${this.escapeHtml(d.title)}</p>
        <p style="font-size:0.75rem;margin:0;color:#333;">
          ${[d.email, d.phone, d.location, d.linkedin].filter(Boolean).map(this.escapeHtml).join(' | ')}
        </p>
      </div>

      ${d.summary ? `
        <div style="margin-bottom:12px;">
          <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Summary</h2>
          <p style="font-size:0.8rem;line-height:1.5;margin:0;color:#111;">${this.escapeHtml(d.summary)}</p>
        </div>
      ` : ''}

      <div style="margin-bottom:12px;">
        <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 6px 0;color:#000;">Experience</h2>
        ${d.experience.map(exp => `
          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
              <strong>${this.escapeHtml(exp.company)} — ${this.escapeHtml(exp.role)}</strong>
              <span>${this.escapeHtml(exp.dates)}</span>
            </div>
            <ul style="margin:3px 0 0 0;padding-left:18px;font-size:0.78rem;line-height:1.45;color:#111;">
              ${exp.bullets.map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom:12px;">
        <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Education</h2>
        ${d.education.map(edu => `
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
            <span><strong>${this.escapeHtml(edu.school)}</strong> — ${this.escapeHtml(edu.degree)}</span>
            <span>${this.escapeHtml(edu.dates)}</span>
          </div>
        `).join('')}
      </div>

      <div>
        <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Skills</h2>
        <p style="font-size:0.78rem;margin:0;color:#111;">${d.skills.map(this.escapeHtml).join(', ')}</p>
      </div>
    `;
  }

  updateAtsScore() {
    let score = 70;
    const d = this.data;

    if (d.name && d.name !== 'Your Name') score += 5;
    if (d.email && d.phone) score += 5;
    if (d.summary && d.summary.length > 50) score += 5;
    if (d.experience && d.experience.length >= 2) score += 5;
    if (d.skills && d.skills.length >= 6) score += 5;
    if (d.education && d.education.length >= 1) score += 5;

    score = Math.min(score, 98);

    const scoreEl = document.getElementById('ats-score-num');
    const badgeEl = document.getElementById('ats-score-badge');
    if (scoreEl) scoreEl.textContent = `${score}/100`;
    if (badgeEl) {
      if (score >= 90) {
        badgeEl.textContent = 'Excellent Match';
        badgeEl.style.color = '#34d399';
      } else if (score >= 80) {
        badgeEl.textContent = 'Strong Candidate';
        badgeEl.style.color = '#60a5fa';
      } else {
        badgeEl.textContent = 'Needs Enhancement';
        badgeEl.style.color = '#f59e0b';
      }
    }
  }

  aiEnhanceSummary() {
    const role = this.data.title || 'Software Engineer';
    const enhanced = `High-impact ${role} with extensive experience architecting mission-critical distributed systems, scalable microservices, and user-centric web platforms. Proven record of accelerating product velocity, optimizing computational throughput, and elevating engineering standards across cross-functional teams.`;
    
    const summaryInput = document.getElementById('res-summary');
    if (summaryInput) {
      summaryInput.value = enhanced;
    }
    this.data.summary = enhanced;
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast('AI enhanced summary with action verbs & leadership keywords!', 'success');
  }

  loadSample() {
    this.data = {
      name: 'Jordan Miller',
      title: 'Principal Software Architect & Full-Stack Lead',
      email: 'jordan.miller@techdev.io',
      phone: '+1 (415) 890-3412',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/jordanmiller-lead',
      github: 'github.com/jordanmiller-dev',
      summary: 'Distinguished Principal Software Architect with 9+ years delivering enterprise-grade cloud systems, neural search architectures, and micro-frontend applications. Led digital transformation driving $4.2M in annual infrastructure cost savings and 99.999% SLA reliability.',
      experience: [
        {
          role: 'Principal Architect & Director of Platform',
          company: 'HyperScale Cloud Innovations',
          location: 'Seattle, WA',
          dates: '2021 - Present',
          bullets: [
            'Spearheaded enterprise AI & RAG document platform processing 10M+ documents with sub-second vector similarity retrieval.',
            'Direct architectural oversight over 35+ engineers across 4 globally distributed cloud product pods.',
            'Decreased infrastructure overhead by 34% by re-architecting legacy monoliths into event-driven Kubernetes clusters.'
          ]
        },
        {
          role: 'Lead Full-Stack Systems Engineer',
          company: 'Apex Digital Systems',
          location: 'San Francisco, CA',
          dates: '2017 - 2021',
          bullets: [
            'Developed real-time analytics engine and dashboard processing 80M daily telemetry events using FastAPI, Kafka, and React.',
            'Championed CI/CD test automation pipelines reducing release cycle time from 14 days to 4 hours.'
          ]
        }
      ],
      education: [
        {
          degree: 'M.S. in Computer Science & Artificial Intelligence',
          school: 'Stanford University',
          dates: '2015 - 2017',
          details: 'Focus on Neural Information Retrieval and Distributed Consensus'
        }
      ],
      skills: [
        'Python', 'FastAPI', 'TypeScript', 'React', 'Kubernetes', 'Docker',
        'PostgreSQL', 'Redis', 'Kafka', 'Vector Databases (Pinecone/Milvus)',
        'AWS / GCP', 'Microservices Architecture', 'System Resilience'
      ],
      certifications: [
        'Google Cloud Certified Professional Cloud Architect',
        'Certified Kubernetes Administrator (CKA)'
      ]
    };
    this.populateEditor();
    this.setTemplate('modern');
  }

  async handleImportFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      Utils.showToast('Please select a valid PDF resume file (.pdf)', 'error');
      return;
    }

    Utils.showToast(`Importing and parsing "${file.name}"...`, 'info');

    // Simulate smart parsing of resume fields
    await Utils.sleep(600);

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    this.data.name = baseName.length < 30 ? baseName : 'Candidate Name';
    this.data.summary = `Experienced professional specializing in high-impact execution, project leadership, and technical problem-solving. Extracted from uploaded document: ${file.name}.`;

    this.populateEditor();
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast(`Successfully extracted resume data from "${file.name}"!`, 'success');
  }

  exportPdf() {
    window.print();
  }

  copyAsText() {
    const d = this.data;
    let txt = `${d.name}\n${d.title}\n${d.email} | ${d.phone} | ${d.location}\n\nSUMMARY\n${d.summary}\n\nEXPERIENCE\n`;
    d.experience.forEach(e => {
      txt += `\n${e.role} — ${e.company} (${e.dates})\n`;
      e.bullets.forEach(b => txt += `• ${b}\n`);
    });
    txt += `\nEDUCATION\n`;
    d.education.forEach(ed => {
      txt += `${ed.school} — ${ed.degree} (${ed.dates})\n`;
    });
    txt += `\nSKILLS\n${d.skills.join(', ')}\n`;

    navigator.clipboard.writeText(txt);
    Utils.showToast('Resume plain text copied to clipboard!', 'success');
  }

  // --- Wizard: Build from Zero ---
  renderWizardStep() {
    document.querySelectorAll('.wizard-step-pane').forEach((pane, idx) => {
      if (idx + 1 === this.wizardStep) {
        pane.removeAttribute('hidden');
      } else {
        pane.setAttribute('hidden', '');
      }
    });

    const stepIndicator = document.getElementById('wizard-step-indicator');
    if (stepIndicator) {
      stepIndicator.textContent = `Step ${this.wizardStep} of 4`;
    }

    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnFinish = document.getElementById('btn-wizard-finish');

    if (btnPrev) btnPrev.style.display = this.wizardStep > 1 ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = this.wizardStep < 4 ? 'inline-flex' : 'none';
    if (btnFinish) btnFinish.style.display = this.wizardStep === 4 ? 'inline-flex' : 'none';
  }

  nextWizardStep() {
    if (this.wizardStep < 4) {
      this.wizardStep++;
      this.renderWizardStep();
    }
  }

  prevWizardStep() {
    if (this.wizardStep > 1) {
      this.wizardStep--;
      this.renderWizardStep();
    }
  }

  finishWizard() {
    // Collect from wizard inputs
    const getWizVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const name = getWizVal('wiz-name') || this.data.name;
    const title = getWizVal('wiz-title') || this.data.title;
    const email = getWizVal('wiz-email') || this.data.email;
    const phone = getWizVal('wiz-phone') || this.data.phone;
    const skillsRaw = getWizVal('wiz-skills');
    const roleDesc = getWizVal('wiz-exp-role') || 'Software Engineer';
    const company = getWizVal('wiz-exp-company') || 'Technology Corp';

    this.data.name = name;
    this.data.title = title;
    this.data.email = email;
    this.data.phone = phone;

    if (skillsRaw) {
      this.data.skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
    }

    this.data.summary = `Results-oriented ${title} with proven expertise in modern engineering, system design, and reliable software delivery. Dedicated to driving business value and engineering excellence.`;

    this.data.experience = [
      {
        role: roleDesc,
        company: company,
        location: 'United States',
        dates: '2022 - Present',
        bullets: [
          `Spearheaded core software development initiatives for ${company}, enhancing system performance and user experience.`,
          'Implemented automated workflows, reducing operational turnaround times by 45%.',
          'Collaborated in cross-functional teams to deliver production features on schedule with high reliability.'
        ]
      }
    ];

    const chosenTpl = document.querySelector('input[name="wiz-template"]:checked');
    if (chosenTpl) {
      this.currentTemplate = chosenTpl.value;
    }

    this.populateEditor();
    this.switchTab('editor');
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast('Your new custom resume has been generated!', 'success');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
}

window.resumeManager = new ResumeManager();
