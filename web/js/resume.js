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
      portfolio: 'https://alexmorgan.dev',
      customLink: 'https://medium.com/@alexmorgan',
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
      projects: [
        {
          name: 'OmniDoc AI Document Intelligence Platform',
          link: 'https://github.com/alexmorgan/omnidoc-ai',
          tools: 'Python, FastAPI, Vector Search, React, WebSockets',
          description: 'Production document intelligence platform with multi-format parsing (PDF, Word, Excel, PPT) and verified page citations across 100K+ enterprise documents.'
        },
        {
          name: 'Distributed High-Throughput Task Queue',
          link: 'https://github.com/alexmorgan/distributed-task-worker',
          tools: 'Go, Redis, Kubernetes, Docker, gRPC, PostgreSQL',
          description: 'Fault-tolerant asynchronous job queue processing 50,000 tasks/second with automatic failover, health monitoring, and sub-10ms delivery latency.'
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
    this.analyzeJobMatch();
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

    // Import Resume File Input & Drag/Drop Card
    const importInput = document.getElementById('resume-import-file');
    const btnImport = document.getElementById('btn-import-resume');
    if (btnImport && importInput) {
      btnImport.addEventListener('click', () => importInput.click());
    }

    const btnUploadHero = document.getElementById('btn-upload-cv-hero');
    if (btnUploadHero && importInput) {
      btnUploadHero.addEventListener('click', (e) => {
        e.stopPropagation();
        importInput.click();
      });
    }

    const dropCard = document.getElementById('resume-upload-dropcard');
    if (dropCard && importInput) {
      dropCard.addEventListener('click', (e) => {
        if (!e.target.closest('#btn-upload-cv-hero')) {
          importInput.click();
        }
      });
      ['dragenter', 'dragover'].forEach(name => {
        dropCard.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropCard.style.borderColor = 'var(--color-purple-400)';
          dropCard.style.background = 'rgba(139, 92, 246, 0.18)';
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dropCard.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropCard.style.borderColor = 'var(--color-purple-500)';
          dropCard.style.background = 'rgba(139, 92, 246, 0.08)';
        });
      });
      dropCard.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          this.handleImportFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.handleImportFile(e.target.files[0]);
          e.target.value = '';
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

    // Export PDF Buttons
    const btnExportPdf = document.getElementById('btn-export-resume-pdf');
    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', () => this.exportPdf());
    }

    const btnDownloadPreview = document.getElementById('btn-download-preview');
    if (btnDownloadPreview) {
      btnDownloadPreview.addEventListener('click', () => this.exportPdf());
    }

    // Copy Text Button
    const btnCopy = document.getElementById('btn-copy-resume-text');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyAsText());
    }

    // Read Resume Aloud Button
    const btnAudioResume = document.getElementById('btn-audio-resume');
    if (btnAudioResume) {
      btnAudioResume.addEventListener('click', () => {
        if (window.audioReader) {
          window.audioReader.play();
        }
      });
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

    // Add Project Button
    const btnAddProj = document.getElementById('btn-add-project');
    if (btnAddProj) {
      btnAddProj.addEventListener('click', () => this.addProjectItem());
    }

    // Add Education Button
    const btnAddEdu = document.getElementById('btn-add-education');
    if (btnAddEdu) {
      btnAddEdu.addEventListener('click', () => this.addEducationItem());
    }

    // Add Certification Button
    const btnAddCert = document.getElementById('btn-add-cert');
    const certInput = document.getElementById('input-new-cert');
    if (btnAddCert && certInput) {
      btnAddCert.addEventListener('click', () => this.addCertificationItem());
      certInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addCertificationItem();
        }
      });
    }

    // Add Skill Button (supports comma-separated skills)
    const btnAddSkill = document.getElementById('btn-add-skill');
    const skillInput = document.getElementById('input-new-skill');
    if (btnAddSkill && skillInput) {
      const addSkillFn = () => {
        const raw = skillInput.value.trim();
        if (!raw) return;
        if (!this.data.skills) this.data.skills = [];
        const skillsToAdd = raw.split(/[,]+/).map(s => s.trim()).filter(Boolean);
        let addedCount = 0;
        skillsToAdd.forEach(s => {
          if (!this.data.skills.includes(s)) {
            this.data.skills.push(s);
            addedCount++;
          }
        });
        skillInput.value = '';
        this.renderSkillsTags();
        this.renderPreview();
        this.updateAtsScore();
        if (addedCount > 0) {
          Utils.showToast(`Added ${addedCount} skill${addedCount > 1 ? 's' : ''}!`, 'info');
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
    const liveFields = ['res-name', 'res-title', 'res-email', 'res-phone', 'res-location', 'res-linkedin', 'res-github', 'res-portfolio', 'res-customlink', 'res-summary'];
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

    // Page navigation hook
    window.addEventListener('pageChange', (e) => {
      if (e.detail && e.detail.page === 'resume') {
        this.populateEditor();
        this.renderPreview();
        this.updateAtsScore();
      }
    });

    // Wizard Summary Presets
    document.querySelectorAll('.wiz-summary-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const txt = btn.getAttribute('data-text');
        const summaryEl = document.getElementById('wiz-summary');
        if (summaryEl && txt) {
          summaryEl.value = txt;
          Utils.showToast('Applied summary preset!', 'info');
        }
      });
    });

    // ATS Target Job Matcher Scan
    const btnScanJob = document.getElementById('btn-analyze-job-match');
    if (btnScanJob) {
      btnScanJob.addEventListener('click', () => this.analyzeJobMatch());
    }

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
    setVal('res-portfolio', this.data.portfolio);
    setVal('res-customlink', this.data.customLink);
    setVal('res-summary', this.data.summary);

    this.renderExperienceEditor();
    this.renderProjectsEditor();
    this.renderEducationEditor();
    this.renderCertificationsEditor();
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
    this.data.portfolio = getVal('res-portfolio') || '';
    this.data.customLink = getVal('res-customlink') || '';
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

  renderProjectsEditor() {
    const container = document.getElementById('projects-items-list');
    if (!container) return;
    container.innerHTML = '';

    (this.data.projects || []).forEach((proj, idx) => {
      const item = document.createElement('div');
      item.className = 'project-edit-card card';
      item.style.marginBottom = 'var(--space-3)';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="color:var(--color-purple-300);font-size:0.85rem;">🚀 Project #${idx + 1}</strong>
          <button class="btn btn--danger btn--sm" data-remove-proj="${idx}">✕ Remove</button>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Project Title</label>
            <input type="text" class="form-input form-input--sm proj-name" placeholder="Project Title" value="${this.escapeHtml(proj.name)}" data-idx="${idx}" />
          </div>
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Live Demo / GitHub Link</label>
            <input type="text" class="form-input form-input--sm proj-link" placeholder="https://github.com/..." value="${this.escapeHtml(proj.link || '')}" data-idx="${idx}" />
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Technologies / Stack Used</label>
          <input type="text" class="form-input form-input--sm proj-tools" placeholder="Python, FastAPI, React, PostgreSQL" value="${this.escapeHtml(proj.tools || '')}" data-idx="${idx}" />
        </div>
        <div>
          <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Project Description &amp; Impact</label>
          <textarea class="form-textarea proj-desc" rows="2" style="font-size:0.8rem;" data-idx="${idx}">${this.escapeHtml(proj.description || '')}</textarea>
        </div>
      `;

      item.querySelector('[data-remove-proj]').addEventListener('click', () => {
        this.data.projects.splice(idx, 1);
        this.renderProjectsEditor();
        this.renderPreview();
        this.updateAtsScore();
      });

      item.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
          const i = parseInt(input.getAttribute('data-idx'), 10);
          const name = item.querySelector('.proj-name').value;
          const link = item.querySelector('.proj-link').value;
          const tools = item.querySelector('.proj-tools').value;
          const description = item.querySelector('.proj-desc').value;

          this.data.projects[i] = { name, link, tools, description };
          this.renderPreview();
          this.updateAtsScore();
        });
      });

      container.appendChild(item);
    });
  }

  addProjectItem() {
    if (!this.data.projects) this.data.projects = [];
    this.data.projects.push({
      name: 'High-Performance Distributed Cloud Architecture',
      link: 'https://github.com/myname/cloud-architecture',
      tools: 'Python, Docker, Kubernetes, Redis, PostgreSQL',
      description: 'Engineered fault-tolerant distributed processing engine with real-time stream caching and sub-15ms throughput.'
    });
    this.renderProjectsEditor();
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast('Added new project entry', 'info');
  }

  renderEducationEditor() {
    const container = document.getElementById('education-items-list');
    if (!container) return;
    container.innerHTML = '';

    (this.data.education || []).forEach((edu, idx) => {
      const item = document.createElement('div');
      item.className = 'education-edit-card card';
      item.style.marginBottom = 'var(--space-3)';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="color:var(--color-purple-300);font-size:0.85rem;">🎓 Degree #${idx + 1}</strong>
          <button class="btn btn--danger btn--sm" data-remove-edu="${idx}">✕ Remove</button>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Degree &amp; Major</label>
            <input type="text" class="form-input form-input--sm edu-degree" placeholder="B.S. in Computer Science" value="${this.escapeHtml(edu.degree)}" data-idx="${idx}" />
          </div>
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">University / Institution</label>
            <input type="text" class="form-input form-input--sm edu-school" placeholder="University Name" value="${this.escapeHtml(edu.school)}" data-idx="${idx}" />
          </div>
        </div>
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Dates / Graduation Year</label>
            <input type="text" class="form-input form-input--sm edu-dates" placeholder="2018 - 2022" value="${this.escapeHtml(edu.dates)}" data-idx="${idx}" />
          </div>
          <div>
            <label style="font-size:0.75rem;color:var(--color-text-muted);display:block;margin-bottom:2px;">Honors / GPA / Highlights</label>
            <input type="text" class="form-input form-input--sm edu-details" placeholder="Dean's List • Focus on Systems" value="${this.escapeHtml(edu.details || '')}" data-idx="${idx}" />
          </div>
        </div>
      `;

      item.querySelector('[data-remove-edu]').addEventListener('click', () => {
        this.data.education.splice(idx, 1);
        this.renderEducationEditor();
        this.renderPreview();
        this.updateAtsScore();
      });

      item.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
          const i = parseInt(input.getAttribute('data-idx'), 10);
          const degree = item.querySelector('.edu-degree').value;
          const school = item.querySelector('.edu-school').value;
          const dates = item.querySelector('.edu-dates').value;
          const details = item.querySelector('.edu-details').value;

          this.data.education[i] = { degree, school, dates, details };
          this.renderPreview();
          this.updateAtsScore();
        });
      });

      container.appendChild(item);
    });
  }

  addEducationItem() {
    if (!this.data.education) this.data.education = [];
    this.data.education.push({
      degree: 'B.S. in Computer Science',
      school: 'University of Technology',
      dates: '2018 - 2022',
      details: 'Dean’s Honors List • Focus on Software Engineering & AI'
    });
    this.renderEducationEditor();
    this.renderPreview();
    this.updateAtsScore();
    Utils.showToast('Added education entry', 'info');
  }

  renderCertificationsEditor() {
    const container = document.getElementById('certifications-tags-container');
    if (!container) return;
    container.innerHTML = '';

    (this.data.certifications || []).forEach((cert, idx) => {
      const tag = document.createElement('span');
      tag.className = 'badge';
      tag.style.cssText = 'background:rgba(6,182,212,0.18);border:1px solid rgba(6,182,212,0.4);color:#67e8f9;padding:4px 10px;border-radius:999px;font-size:0.75rem;display:inline-flex;align-items:center;gap:6px;margin:2px;';
      tag.innerHTML = `<span>${this.escapeHtml(cert)}</span><button style="background:none;border:none;color:#f87171;cursor:pointer;font-size:0.75rem;" title="Remove">✕</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        this.data.certifications.splice(idx, 1);
        this.renderCertificationsEditor();
        this.renderPreview();
        this.updateAtsScore();
      });
      container.appendChild(tag);
    });
  }

  addCertificationItem() {
    const input = document.getElementById('input-new-cert');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;
    if (!this.data.certifications) this.data.certifications = [];
    const certsToAdd = raw.split(/[,]+/).map(c => c.trim()).filter(Boolean);
    let addedCount = 0;
    certsToAdd.forEach(val => {
      if (!this.data.certifications.includes(val)) {
        this.data.certifications.push(val);
        addedCount++;
      }
    });
    input.value = '';
    this.renderCertificationsEditor();
    this.renderPreview();
    this.updateAtsScore();
    if (addedCount > 0) {
      Utils.showToast(`Added ${addedCount} certification${addedCount > 1 ? 's' : ''}!`, 'info');
    }
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

  getTemplateHtml() {
    switch (this.currentTemplate) {
      case 'modern':
        return this.renderModernTemplate();
      case 'executive':
        return this.renderExecutiveTemplate();
      case 'creative':
        return this.renderCreativeTemplate();
      case 'classic':
      default:
        return this.renderClassicTemplate();
    }
  }

  renderPreview() {
    const previewEl = document.getElementById('resume-paper-preview');
    if (!previewEl) return;

    previewEl.className = `resume-paper resume-template--${this.currentTemplate}`;
    previewEl.innerHTML = this.getTemplateHtml();
  }

  renderModernTemplate() {
    const d = this.data;
    return `
      <div class="resume-header resume-modern-header">
        <div>
          <h1 class="resume-name" style="font-size:1.8rem;font-weight:800;color:#111827;margin:0 0 4px 0;">${this.escapeHtml(d.name)}</h1>
          <p class="resume-title" style="font-size:1.05rem;color:#7c3aed;font-weight:600;margin:0;">${this.escapeHtml(d.title)}</p>
        </div>
        <div class="resume-contact" style="font-size:0.75rem;color:#4b5563;line-height:1.55;text-align:right;">
          ${d.email ? `<div>✉ ${this.escapeHtml(d.email)}</div>` : ''}
          ${d.phone ? `<div>📞 ${this.escapeHtml(d.phone)}</div>` : ''}
          ${d.location ? `<div>📍 ${this.escapeHtml(d.location)}</div>` : ''}
          ${d.portfolio ? `<div>🌐 <a href="${this.escapeHtml(d.portfolio.startsWith('http') ? d.portfolio : 'https://' + d.portfolio)}" target="_blank" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(d.portfolio.replace(/^https?:\/\//, ''))}</a></div>` : ''}
          ${d.linkedin ? `<div>💼 <a href="${this.escapeHtml(d.linkedin.startsWith('http') ? d.linkedin : 'https://' + d.linkedin)}" target="_blank" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(d.linkedin.replace(/^https?:\/\//, ''))}</a></div>` : ''}
          ${d.github ? `<div>💻 <a href="${this.escapeHtml(d.github.startsWith('http') ? d.github : 'https://' + d.github)}" target="_blank" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(d.github.replace(/^https?:\/\//, ''))}</a></div>` : ''}
          ${d.customLink ? `<div>🔗 <a href="${this.escapeHtml(d.customLink.startsWith('http') ? d.customLink : 'https://' + d.customLink)}" target="_blank" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(d.customLink.replace(/^https?:\/\//, ''))}</a></div>` : ''}
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

      ${(d.projects && d.projects.length > 0) ? `
        <div class="resume-section">
          <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:8px;">Featured Projects</h2>
          ${d.projects.map(p => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <strong style="font-size:0.86rem;color:#111827;">${this.escapeHtml(p.name)}</strong>
                ${p.link ? `<a href="${this.escapeHtml(p.link.startsWith('http') ? p.link : 'https://' + p.link)}" target="_blank" style="font-size:0.75rem;color:#2563eb;text-decoration:none;font-weight:500;">${this.escapeHtml(p.link.replace(/^https?:\/\//, ''))} ↗</a>` : ''}
              </div>
              ${p.tools ? `<div style="font-size:0.75rem;color:#6b21a8;font-weight:600;margin:1px 0 3px 0;">Technologies: ${this.escapeHtml(p.tools)}</div>` : ''}
              <p style="font-size:0.8rem;color:#374151;line-height:1.45;margin:0;">${this.escapeHtml(p.description)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

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

      ${(d.certifications && d.certifications.length > 0) ? `
        <div class="resume-section" style="margin-top:10px;">
          <h2 class="resume-sec-title" style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:#7c3aed;font-weight:700;margin-bottom:6px;">Certifications &amp; Credentials</h2>
          <ul style="margin:0;padding-left:18px;font-size:0.8rem;color:#374151;line-height:1.5;">
            ${d.certifications.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

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
    const linksRow = [d.email, d.phone, d.location, d.portfolio, d.linkedin, d.github, d.customLink].filter(Boolean).map(this.escapeHtml).join('  |  ');
    return `
      <div style="text-align:center;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:16px;">
        <h1 style="font-size:2rem;font-family:serif;font-weight:700;color:#111827;margin:0 0 4px 0;letter-spacing:0.02em;">${this.escapeHtml(d.name).toUpperCase()}</h1>
        <p style="font-size:0.95rem;color:#4b5563;font-weight:600;margin:0 0 6px 0;">${this.escapeHtml(d.title)}</p>
        <div style="font-size:0.78rem;color:#6b7280;line-height:1.5;">
          ${linksRow}
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

      ${(d.projects && d.projects.length > 0) ? `
        <div style="margin-bottom:14px;">
          <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:8px;color:#111827;">Key Projects &amp; Systems Architecture</h2>
          ${d.projects.map(p => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:0.84rem;">
                <strong style="color:#111827;">${this.escapeHtml(p.name)}</strong>
                ${p.link ? `<span style="font-size:0.75rem;color:#4b5563;">${this.escapeHtml(p.link.replace(/^https?:\/\//, ''))}</span>` : ''}
              </div>
              ${p.tools ? `<div style="font-size:0.75rem;color:#4b5563;font-style:italic;">Stack: ${this.escapeHtml(p.tools)}</div>` : ''}
              <p style="font-size:0.8rem;color:#374151;line-height:1.45;margin:2px 0 0 0;">${this.escapeHtml(p.description)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="margin-bottom:14px;">
        <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:8px;color:#111827;">Education &amp; Credentials</h2>
        ${d.education.map(edu => `
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
            <span><strong>${this.escapeHtml(edu.school)}</strong>, ${this.escapeHtml(edu.degree)}</span>
            <span style="color:#6b7280;">${this.escapeHtml(edu.dates)}</span>
          </div>
        `).join('')}
      </div>

      ${(d.certifications && d.certifications.length > 0) ? `
        <div style="margin-bottom:14px;">
          <h2 style="font-size:0.85rem;font-family:serif;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #d1d5db;padding-bottom:3px;margin-bottom:6px;color:#111827;">Honors &amp; Certifications</h2>
          <p style="font-size:0.8rem;color:#374151;line-height:1.5;margin:0;">${d.certifications.map(this.escapeHtml).join('  •  ')}</p>
        </div>
      ` : ''}

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
        <div style="font-size:0.75rem;display:flex;flex-wrap:wrap;gap:12px;opacity:0.95;">
          ${d.email ? `<span>✉ ${this.escapeHtml(d.email)}</span>` : ''}
          ${d.phone ? `<span>📞 ${this.escapeHtml(d.phone)}</span>` : ''}
          ${d.location ? `<span>📍 ${this.escapeHtml(d.location)}</span>` : ''}
          ${d.portfolio ? `<span>🌐 ${this.escapeHtml(d.portfolio.replace(/^https?:\/\//, ''))}</span>` : ''}
          ${d.linkedin ? `<span>💼 ${this.escapeHtml(d.linkedin.replace(/^https?:\/\//, ''))}</span>` : ''}
          ${d.github ? `<span>💻 ${this.escapeHtml(d.github.replace(/^https?:\/\//, ''))}</span>` : ''}
          ${d.customLink ? `<span>🔗 ${this.escapeHtml(d.customLink.replace(/^https?:\/\//, ''))}</span>` : ''}
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

      ${(d.projects && d.projects.length > 0) ? `
        <div style="margin-bottom:14px;">
          <h2 style="font-size:0.95rem;font-weight:700;color:#1e1b4b;margin-bottom:8px;">Featured Projects &amp; Products</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${d.projects.map(p => `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px 12px;border-radius:6px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <strong style="font-size:0.82rem;color:#0f172a;">${this.escapeHtml(p.name)}</strong>
                </div>
                ${p.tools ? `<div style="font-size:0.72rem;color:#4f46e5;font-weight:600;margin:2px 0;">${this.escapeHtml(p.tools)}</div>` : ''}
                <p style="font-size:0.75rem;color:#475569;line-height:1.4;margin:2px 0;">${this.escapeHtml(p.description)}</p>
                ${p.link ? `<a href="${this.escapeHtml(p.link.startsWith('http') ? p.link : 'https://' + p.link)}" target="_blank" style="font-size:0.72rem;color:#0284c7;text-decoration:none;">${this.escapeHtml(p.link.replace(/^https?:\/\//, ''))} ↗</a>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <h2 style="font-size:0.9rem;font-weight:700;color:#1e1b4b;margin-bottom:6px;">Education</h2>
          ${d.education.map(edu => `
            <div style="font-size:0.8rem;color:#334155;margin-bottom:4px;">
              <strong>${this.escapeHtml(edu.degree)}</strong><br/>
              <span>${this.escapeHtml(edu.school)} (${this.escapeHtml(edu.dates)})</span>
            </div>
          `).join('')}
          ${(d.certifications && d.certifications.length > 0) ? `
            <div style="margin-top:8px;">
              <strong style="font-size:0.78rem;color:#1e1b4b;">Certifications:</strong>
              <div style="font-size:0.75rem;color:#475569;">${d.certifications.map(this.escapeHtml).join(', ')}</div>
            </div>
          ` : ''}
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
    const linksRow = [d.email, d.phone, d.location, d.portfolio, d.linkedin, d.github, d.customLink].filter(Boolean).map(this.escapeHtml).join(' | ');
    return `
      <div style="text-align:center;margin-bottom:14px;border-bottom:1px solid #111;padding-bottom:10px;">
        <h1 style="font-size:1.75rem;font-weight:bold;margin:0 0 2px 0;color:#000;">${this.escapeHtml(d.name)}</h1>
        <p style="font-size:0.85rem;margin:0 0 4px 0;color:#222;">${this.escapeHtml(d.title)}</p>
        <p style="font-size:0.75rem;margin:0;color:#333;line-height:1.45;">
          ${linksRow}
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

      ${(d.projects && d.projects.length > 0) ? `
        <div style="margin-bottom:12px;">
          <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 6px 0;color:#000;">Key Projects</h2>
          ${d.projects.map(p => `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;">
                <strong>${this.escapeHtml(p.name)}${p.tools ? ` <span style="font-weight:normal;color:#444;">(${this.escapeHtml(p.tools)})</span>` : ''}</strong>
                ${p.link ? `<span style="font-size:0.75rem;color:#333;">${this.escapeHtml(p.link.replace(/^https?:\/\//, ''))}</span>` : ''}
              </div>
              <p style="font-size:0.78rem;line-height:1.4;margin:2px 0 0 0;color:#111;">• ${this.escapeHtml(p.description)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="margin-bottom:12px;">
        <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Education</h2>
        ${d.education.map(edu => `
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
            <span><strong>${this.escapeHtml(edu.school)}</strong> — ${this.escapeHtml(edu.degree)}</span>
            <span>${this.escapeHtml(edu.dates)}</span>
          </div>
        `).join('')}
      </div>

      ${(d.certifications && d.certifications.length > 0) ? `
        <div style="margin-bottom:12px;">
          <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Certifications</h2>
          <p style="font-size:0.78rem;margin:0;color:#111;">${d.certifications.map(this.escapeHtml).join(' • ')}</p>
        </div>
      ` : ''}

      <div>
        <h2 style="font-size:0.85rem;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #666;margin:0 0 4px 0;color:#000;">Skills</h2>
        <p style="font-size:0.78rem;margin:0;color:#111;">${d.skills.map(this.escapeHtml).join(', ')}</p>
      </div>
    `;
  }

  updateAtsScore() {
    let score = 0;
    const tips = [];
    const d = this.data;

    // 1. Contact Info check (up to 20 pts)
    const hasContact = d.name && d.name !== 'Your Name' && d.email && d.phone;
    if (hasContact) {
      score += 20;
    } else {
      tips.push('Add full name, verified email, and phone number');
    }

    // 2. Summary check (up to 15 pts)
    const summaryWords = (d.summary || '').trim().split(/\s+/).filter(Boolean).length;
    if (summaryWords >= 30) {
      score += 15;
    } else if (summaryWords >= 10) {
      score += 8;
      tips.push('Expand summary to 35+ words emphasizing core domain expertise');
    } else {
      tips.push('Add an impactful professional career summary');
    }

    // 3. Experience check (up to 25 pts)
    if (d.experience && d.experience.length > 0) {
      let totalBullets = 0;
      d.experience.forEach(exp => {
        totalBullets += (exp.bullets || []).length;
      });
      if (totalBullets >= 4) {
        score += 25;
      } else if (totalBullets >= 2) {
        score += 15;
        tips.push('Add more detail bullets to your work experience');
      } else {
        score += 8;
        tips.push('Add bullet points to experience entries');
      }
    } else {
      tips.push('Add at least one relevant work position');
    }

    // 4. Skills count check (up to 20 pts)
    const skillsCount = (d.skills || []).length;
    if (skillsCount >= 8) {
      score += 20;
    } else if (skillsCount >= 4) {
      score += 12;
      tips.push('List 8+ specific technical skills for higher ATS ranking');
    } else {
      score += 5;
      tips.push('Add key skills to pass automated parser screening');
    }

    // 5. Action Verbs check (up to 10 pts)
    const actionVerbs = ['architected', 'engineered', 'built', 'reduced', 'spearheaded', 'optimized', 'scaled', 'led', 'developed', 'designed', 'managed', 'deployed', 'implemented', 'accelerated'];
    const allText = ((d.summary || '') + ' ' + (d.experience || []).map(e => (e.bullets || []).join(' ')).join(' ')).toLowerCase();
    const matchedVerbs = actionVerbs.filter(v => allText.includes(v));
    if (matchedVerbs.length >= 3) {
      score += 10;
    } else if (matchedVerbs.length >= 1) {
      score += 5;
      tips.push('Use high-impact action verbs (Architected, Scaled, Spearheaded)');
    } else {
      tips.push('Start experience bullets with strong action verbs');
    }

    // 6. Metrics & quantifiable results check (up to 10 pts)
    const hasMetrics = /\d+[%kKmM]?|\$\d+/.test(allText);
    if (hasMetrics) {
      score += 10;
    } else {
      tips.push('Include quantifiable metrics (e.g. 45%, $2M, 50K+)');
    }

    // Cap at 100
    score = Math.min(100, Math.max(0, score));

    // Update UI elements
    const scoreValEl = document.getElementById('ats-score-val');
    const scoreRatingEl = document.getElementById('ats-score-rating');
    const scoreFillEl = document.getElementById('ats-score-fill');
    const scoreTipsEl = document.getElementById('ats-score-tips');

    if (scoreValEl) scoreValEl.textContent = `${score}/100`;
    if (scoreFillEl) scoreFillEl.style.width = `${score}%`;

    let ratingText = 'NEEDS WORK';
    let ratingClass = 'badge--danger';
    let fillColor = '#ef4444';

    if (score >= 85) {
      ratingText = 'EXCELLENT';
      ratingClass = 'badge--success';
      fillColor = '#10b981';
    } else if (score >= 70) {
      ratingText = 'STRONG';
      ratingClass = 'badge--info';
      fillColor = '#06b6d4';
    } else if (score >= 50) {
      ratingText = 'AVERAGE';
      ratingClass = 'badge--warning';
      fillColor = '#f59e0b';
    }

    if (scoreRatingEl) {
      scoreRatingEl.textContent = ratingText;
      scoreRatingEl.className = `badge ${ratingClass}`;
    }
    if (scoreFillEl) {
      scoreFillEl.style.background = fillColor;
    }

    if (scoreTipsEl) {
      if (tips.length === 0) {
        scoreTipsEl.innerHTML = '<span style="color:#10b981;">✓ Optimal ATS keyword density, structure, and metric compliance.</span>';
      } else {
        scoreTipsEl.innerHTML = `💡 <em>ATS Tip:</em> ${tips.slice(0, 2).join(' • ')}`;
      }
    }
  }

  analyzeJobMatch() {
    const descInput = document.getElementById('input-job-desc');
    const badgeEl = document.getElementById('job-match-badge');
    const summaryEl = document.getElementById('ats-gap-summary');
    const chipsContainer = document.getElementById('missing-keywords-chips');

    let jobText = descInput ? descInput.value.trim() : '';
    if (!jobText) {
      jobText = 'Looking for a Senior AI & Cloud Systems Engineer with Python, Kubernetes, PostgreSQL, RAG pipelines, FastAPI, CI/CD, Docker, React, TypeScript, Redis, Microservices.';
      if (descInput) descInput.value = jobText;
    }

    // Common technical and domain keywords dictionary
    const dictionary = [
      'Python', 'FastAPI', 'Docker', 'Kubernetes', 'PostgreSQL', 'React', 'TypeScript',
      'JavaScript', 'RAG pipelines', 'CI/CD', 'AWS', 'GCP', 'Redis', 'Kafka',
      'Microservices', 'GraphQL', 'REST APIs', 'System Architecture', 'Git', 'Linux',
      'AI Systems', 'Prompt Engineering', 'Vector Search', 'Machine Learning', 'Next.js'
    ];

    // Find all keywords mentioned in job description
    const lowerJob = jobText.toLowerCase();
    const targetedKeywords = dictionary.filter(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerJob) || lowerJob.includes(kw.toLowerCase());
    });

    // Cross reference with candidate's resume
    const candidateCorpus = [
      this.data.title,
      this.data.summary,
      ...this.data.skills,
      ...this.data.experience.map(e => `${e.role} ${e.company} ${(e.bullets || []).join(' ')}`)
    ].join(' ').toLowerCase();

    const matched = [];
    const missing = [];

    targetedKeywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      if (candidateCorpus.includes(kwLower) || this.data.skills.some(s => s.toLowerCase() === kwLower)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const total = targetedKeywords.length;
    const matchPercent = total > 0 ? Math.round((matched.length / total) * 100) : 95;

    // Update Badge
    if (badgeEl) {
      badgeEl.textContent = `${matchPercent}% Match`;
      badgeEl.style.background = matchPercent >= 80 ? '#10b981' : (matchPercent >= 60 ? '#f59e0b' : '#ef4444');
    }

    // Update Summary
    if (summaryEl) {
      summaryEl.textContent = `${matched.length} matched / ${missing.length} missing keywords found`;
    }

    // Render Chips
    if (chipsContainer) {
      chipsContainer.innerHTML = '';

      // Render matched chips
      matched.forEach(kw => {
        const chip = document.createElement('span');
        chip.style.cssText = 'background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;font-size:0.75rem;padding:3px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;';
        chip.innerHTML = `✓ ${this.escapeHtml(kw)}`;
        chipsContainer.appendChild(chip);
      });

      // Render missing chips with quick + Add to Skills button
      missing.forEach(kw => {
        const chip = document.createElement('button');
        chip.style.cssText = 'background:rgba(239,68,68,0.12);border:1px dashed rgba(239,68,68,0.4);color:#fca5a5;font-size:0.75rem;padding:3px 8px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.2s;';
        chip.title = `Click to add "${kw}" to your skills`;
        chip.innerHTML = `+ Add <strong>${this.escapeHtml(kw)}</strong>`;
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          if (!this.data.skills.includes(kw)) {
            this.data.skills.push(kw);
            this.renderSkillsTags();
            this.renderPreview();
            this.updateAtsScore();
            this.analyzeJobMatch();
            Utils.showToast(`Added "${kw}" to your skills! Match score updated.`, 'success');
          }
        });
        chipsContainer.appendChild(chip);
      });
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
      portfolio: 'https://jordanmiller.tech',
      customLink: 'https://github.com/topics/system-design',
      summary: 'Distinguished Principal Software Architect with 9+ years delivering enterprise-grade cloud systems, neural search architectures, and micro-frontend applications. Led digital transformation driving $4.2M in annual infrastructure cost savings and 99.999% SLA reliability.',
      projects: [
        {
          name: 'HyperScale Enterprise Document Search Mesh',
          link: 'https://github.com/jordanmiller/search-mesh',
          tools: 'Rust, Python, FastAPI, Milvus, Kubernetes',
          description: 'Multi-region distributed neural search index serving 12M vector embeddings with sub-10ms p99 query latency.'
        },
        {
          name: 'Event-Driven Realtime Financial Telemetry',
          link: 'https://github.com/jordanmiller/telemetry-pipeline',
          tools: 'Kafka, Go, ClickHouse, Docker, Grafana',
          description: 'Streaming financial telemetry engine processing 1.2M transactions/sec with zero packet drop and automated circuit breakers.'
        }
      ],
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
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.json'];
    const isValid = validExtensions.some(ext => nameLower.endsWith(ext)) || file.type.includes('pdf') || file.type.includes('word') || file.type.includes('json') || file.type.includes('text');

    if (!isValid) {
      Utils.showToast('Please upload a PDF, Word (.docx), JSON, or TXT resume file.', 'error');
      return;
    }

    Utils.showToast(`Importing and parsing "${file.name}"...`, 'info');

    try {
      let rawText = '';

      if (nameLower.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.resume) Object.assign(this.data, parsed.resume);
        else Object.assign(this.data, parsed);
        this.populateEditor();
        this.renderPreview();
        this.updateAtsScore();
        this.analyzeJobMatch();
        Utils.showToast(`Imported structured resume data from "${file.name}"!`, 'success');
        return;
      }

      if (nameLower.endsWith('.docx') && window.mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        rawText = res.value || '';
      } else if (nameLower.endsWith('.pdf') && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedArray, isEvalSupported: false });
        const pdfDoc = await loadingTask.promise;
        const pageTexts = [];
        for (let i = 1; i <= Math.min(pdfDoc.numPages, 10); i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          pageTexts.push(content.items.map(item => item.str).join(' '));
        }
        rawText = pageTexts.join('\n');
      } else {
        rawText = await file.text();
      }

      if (rawText && rawText.trim().length > 20) {
        this.extractResumeFieldsFromText(rawText, file.name);
      } else {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        this.data.name = baseName.length < 30 ? baseName : 'Candidate Name';
        this.data.summary = `Extracted from uploaded document ${file.name}. Seasoned professional with proven track record of engineering leadership and high performance.`;
      }

      this.populateEditor();
      this.switchTab('editor');
      this.renderPreview();
      this.updateAtsScore();
      this.analyzeJobMatch();
      Utils.showToast(`Successfully extracted resume for "${this.data.name}"!`, 'success');
    } catch (err) {
      console.error('[Resume Parser] Error:', err);
      Utils.showToast(`Notice: Error parsing file: ${err.message}`, 'error');
    }
  }

  extractResumeFieldsFromText(text, filename) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    // 1. Email extraction
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) this.data.email = emailMatch[0];

    // 2. Phone extraction
    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (phoneMatch) this.data.phone = phoneMatch[0];

    // 3. Links
    const linkedinMatch = text.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
    if (linkedinMatch) this.data.linkedin = linkedinMatch[0];
    const githubMatch = text.match(/github\.com\/[A-Za-z0-9_-]+/i);
    if (githubMatch) this.data.github = githubMatch[0];

    // 4. Candidate Name: First line that doesn't contain email or phone or links
    let nameCandidate = '';
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (!line.includes('@') && !line.includes('http') && !line.includes('www') && !/\d{4}/.test(line) && line.length < 40 && line.length > 2) {
        nameCandidate = line;
        break;
      }
    }
    if (nameCandidate) this.data.name = nameCandidate;
    else {
      const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      this.data.name = baseName.length < 30 ? baseName : 'Candidate Name';
    }

    // 5. Title
    const titleCandidates = ['Engineer', 'Developer', 'Architect', 'Manager', 'Lead', 'Designer', 'Scientist', 'Consultant', 'Analyst', 'Specialist', 'Director'];
    for (let i = 1; i < Math.min(lines.length, 7); i++) {
      const line = lines[i];
      if (titleCandidates.some(tc => line.toLowerCase().includes(tc.toLowerCase())) && line.length < 50) {
        this.data.title = line;
        break;
      }
    }

    // 6. Summary: Find paragraph of text between 50 and 600 chars
    const summaryMatch = text.match(/(?:summary|profile|about|professional summary)[\s:]*([^\n]+(?:\n[^\n]+){1,4})/i);
    if (summaryMatch && summaryMatch[1]) {
      this.data.summary = summaryMatch[1].replace(/[\r\n]+/g, ' ').trim();
    } else {
      const longParagraph = lines.find(l => l.length > 80 && l.length < 500 && !l.includes('•') && !l.includes('- '));
      if (longParagraph) this.data.summary = longParagraph;
    }

    // 7. Skills extraction
    const techDictionary = [
      'Python', 'FastAPI', 'Django', 'Flask', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
      'Node.js', 'Next.js', 'HTML5', 'CSS3', 'Tailwind', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB',
      'Redis', 'Kafka', 'GraphQL', 'REST APIs', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
      'Git', 'CI/CD', 'Linux', 'Microservices', 'RAG', 'Machine Learning', 'TensorFlow', 'PyTorch',
      'C++', 'C#', 'Java', 'Golang', 'Rust', 'PHP', 'Swift', 'Kotlin', 'Flutter', 'Figma'
    ];
    const detectedSkills = [];
    techDictionary.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text) && !detectedSkills.includes(skill)) {
        detectedSkills.push(skill);
      }
    });
    if (detectedSkills.length >= 4) {
      this.data.skills = detectedSkills;
    }

    // 8. Experience extraction
    const expRegex = /([A-Za-z0-9\s,&.-]{3,35})\s*(?:[|•–-])\s*([A-Za-z0-9\s,&.-]{3,35})?\s*(?:[|•–-])?\s*(\b(?:20\d\d|19\d\d)\s*(?:-|–|to)\s*(?:Present|Current|20\d\d)\b)/gi;
    let match;
    const extractedExp = [];
    while ((match = expRegex.exec(text)) !== null) {
      const role = match[1].trim();
      const company = match[2] ? match[2].trim() : 'Company';
      const dates = match[3].trim();
      if (role.length < 40 && !role.toLowerCase().includes('university')) {
        extractedExp.push({
          role: role,
          company: company,
          location: 'Remote / US',
          dates: dates,
          bullets: [
            `Accelerated engineering throughput and delivered core system capabilities at ${company}.`,
            'Architected scalable solutions, automated deployment workflows, and collaborated in agile cross-functional pods.'
          ]
        });
      }
      if (extractedExp.length >= 3) break;
    }
    if (extractedExp.length > 0) {
      this.data.experience = extractedExp;
    }

    // 9. Education extraction
    const eduKeywords = ['University', 'College', 'Institute', 'School', 'Polytechnic', 'Academy', 'Bachelor', 'Master', 'Degree', 'B.S.', 'M.S.', 'B.A.', 'M.A.', 'Ph.D.', 'B.Sc', 'M.Sc'];
    const extractedEdu = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (eduKeywords.some(kw => line.includes(kw)) && line.length < 80 && !line.toLowerCase().startsWith('experience')) {
        const dateMatch = line.match(/\b(19\d\d|20\d\d)(?:\s*[-–to]+\s*(19\d\d|20\d\d|Present))?\b/);
        const dates = dateMatch ? dateMatch[0] : '2018 - 2022';
        const cleanLine = line.replace(dates, '').trim();
        let degree = 'B.S. in Computer Science';
        let school = cleanLine || 'University';
        if (cleanLine.includes('—') || cleanLine.includes('-') || cleanLine.includes(',')) {
          const parts = cleanLine.split(/[—\-,]/).map(p => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            degree = parts[0];
            school = parts.slice(1).join(', ');
          }
        }
        extractedEdu.push({
          degree: degree.length > 50 ? degree.slice(0, 50) : degree,
          school: school.length > 60 ? school.slice(0, 60) : school,
          dates: dates,
          details: 'Academic Honors & Focus'
        });
        if (extractedEdu.length >= 2) break;
      }
    }
    if (extractedEdu.length > 0) {
      this.data.education = extractedEdu;
    }

    // 10. Certifications extraction
    const certKeywords = ['Certified', 'AWS', 'GCP', 'Google Cloud', 'Azure', 'Kubernetes', 'CKA', 'CKAD', 'CISSP', 'PMP', 'Scrum', 'CompTIA', 'DeepLearning'];
    const extractedCerts = [];
    lines.forEach(l => {
      if (l.length < 70 && certKeywords.some(ck => l.includes(ck)) && !l.includes('@') && !l.toLowerCase().includes('university')) {
        const clean = l.replace(/^[•\-\*]\s*/, '').trim();
        if (clean && !extractedCerts.includes(clean)) {
          extractedCerts.push(clean);
        }
      }
    });
    if (extractedCerts.length > 0) {
      this.data.certifications = extractedCerts.slice(0, 5);
    }

    // 11. Projects extraction
    const ghMatches = text.match(/github\.com\/[A-Za-z0-9_-]+\/([A-Za-z0-9_-]+)/g);
    if (ghMatches && ghMatches.length > 0) {
      const extractedProjects = [];
      ghMatches.slice(0, 3).forEach(ghUrl => {
        const projName = ghUrl.split('/').pop().replace(/[-_]/g, ' ');
        const capName = projName.charAt(0).toUpperCase() + projName.slice(1);
        extractedProjects.push({
          name: capName,
          link: 'https://' + ghUrl,
          tools: 'Modern Engineering Stack',
          description: 'Production system architecture and open-source project repository.'
        });
      });
      if (extractedProjects.length > 0) {
        this.data.projects = extractedProjects;
      }
    }
  }

  exportPdf() {
    const candidateName = (this.data.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    Utils.showToast('Generating high-resolution PDF download...', 'info');

    // Create a dedicated, clean container attached directly to document.body
    // This resolves all blank PDF causes:
    // 1. html2canvas window scroll offset bug (when page is scrolled down, canvas was blank)
    // 2. Parent sticky / overflow clipping from .resume-paper-wrapper
    // 3. Hidden wizard view state when downloading from wizard tab
    const exportDiv = document.createElement('div');
    exportDiv.id = 'resume-export-clean-container';
    exportDiv.className = `resume-paper resume-template--${this.currentTemplate}`;
    exportDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 794px;
      min-height: 1120px;
      padding: 36px 44px;
      background: #ffffff !important;
      color: #111827 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      box-sizing: border-box;
      box-shadow: none !important;
      border-radius: 0 !important;
      z-index: 9999999;
      pointer-events: none;
      visibility: visible !important;
      display: block !important;
    `;

    exportDiv.innerHTML = this.getTemplateHtml();
    document.body.appendChild(exportDiv);

    const cleanup = () => {
      if (exportDiv.parentNode) {
        exportDiv.parentNode.removeChild(exportDiv);
      }
    };

    if (window.html2pdf) {
      const opt = {
        margin: [6, 6, 6, 6],
        filename: `${candidateName}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf()
        .set(opt)
        .from(exportDiv)
        .save()
        .then(() => {
          cleanup();
          Utils.showToast(`Downloaded "${candidateName}_Resume.pdf"!`, 'success');
        })
        .catch(err => {
          console.warn('html2pdf notice, fallback to print window:', err);
          cleanup();
          this.fallbackPrintDialog();
        });
    } else {
      cleanup();
      this.fallbackPrintDialog();
    }
  }

  fallbackPrintDialog() {
    const candidateName = (this.data.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const printWindow = window.open('', '_blank', 'width=840,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${candidateName} - Resume</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #ffffff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px 36px; }
          @media print {
            body { padding: 0; }
            @page { margin: 10mm; size: A4 portrait; }
          }
        </style>
      </head>
      <body>
        <div class="resume-paper resume-template--${this.currentTemplate}">
          ${this.getTemplateHtml()}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  copyAsText() {
    const d = this.data;
    const linksLine = [d.email, d.phone, d.location, d.portfolio, d.linkedin, d.github, d.customLink].filter(Boolean).join(' | ');
    let txt = `${d.name}\n${d.title}\n${linksLine}\n\n`;
    if (d.summary) txt += `SUMMARY\n${d.summary}\n\n`;
    if (d.experience && d.experience.length) {
      txt += `EXPERIENCE\n`;
      d.experience.forEach(e => {
        txt += `\n${e.role} — ${e.company} (${e.dates}) [${e.location}]\n`;
        (e.bullets || []).forEach(b => txt += `• ${b}\n`);
      });
      txt += '\n';
    }
    if (d.projects && d.projects.length) {
      txt += `PROJECTS\n`;
      d.projects.forEach(p => {
        txt += `\n${p.name}${p.link ? ` (${p.link})` : ''}\n`;
        if (p.tools) txt += `Stack: ${p.tools}\n`;
        if (p.description) txt += `• ${p.description}\n`;
      });
      txt += '\n';
    }
    if (d.education && d.education.length) {
      txt += `EDUCATION\n`;
      d.education.forEach(ed => {
        txt += `${ed.school} — ${ed.degree} (${ed.dates})${ed.details ? ` • ${ed.details}` : ''}\n`;
      });
      txt += '\n';
    }
    if (d.certifications && d.certifications.length) {
      txt += `CERTIFICATIONS\n${d.certifications.join(', ')}\n\n`;
    }
    if (d.skills && d.skills.length) {
      txt += `SKILLS\n${d.skills.join(', ')}\n`;
    }

    navigator.clipboard.writeText(txt);
    Utils.showToast('Resume plain text copied to clipboard!', 'success');
  }

  // --- Wizard: Build from Zero (6 Steps) ---
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
      stepIndicator.textContent = `Step ${this.wizardStep} of 6`;
    }

    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnFinish = document.getElementById('btn-wizard-finish');

    if (btnPrev) btnPrev.style.display = this.wizardStep > 1 ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = this.wizardStep < 6 ? 'inline-flex' : 'none';
    if (btnFinish) btnFinish.style.display = this.wizardStep === 6 ? 'inline-flex' : 'none';
  }

  nextWizardStep() {
    if (this.wizardStep < 6) {
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
    const loc = getWizVal('wiz-location') || this.data.location;
    const portfolio = getWizVal('wiz-portfolio') || this.data.portfolio;
    const linkedin = getWizVal('wiz-linkedin') || this.data.linkedin;
    const github = getWizVal('wiz-github') || this.data.github;
    const customlink = getWizVal('wiz-customlink') || this.data.customLink;

    const summary = getWizVal('wiz-summary') || `Results-oriented ${title} with proven expertise in modern engineering, system design, and reliable software delivery. Dedicated to driving business value and engineering excellence.`;

    const roleDesc = getWizVal('wiz-exp-role') || 'Software Engineer';
    const company = getWizVal('wiz-exp-company') || 'Technology Corp';
    const expDates = getWizVal('wiz-exp-dates') || '2022 - Present';
    const expLoc = getWizVal('wiz-exp-location') || 'San Francisco, CA / Remote';
    const expBulletsRaw = getWizVal('wiz-exp-bullets');
    const bullets = expBulletsRaw ? expBulletsRaw.split('\n').map(b => b.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean) : [
      `Spearheaded core software development initiatives for ${company}, enhancing system performance and user experience.`,
      'Implemented automated workflows, reducing operational turnaround times by 45%.',
      'Collaborated in cross-functional teams to deliver production features on schedule with high reliability.'
    ];

    // Projects
    const newProjects = [];
    const p1Name = getWizVal('wiz-proj1-name');
    if (p1Name) {
      newProjects.push({
        name: p1Name,
        link: getWizVal('wiz-proj1-link'),
        tools: getWizVal('wiz-proj1-tools'),
        description: getWizVal('wiz-proj1-desc') || 'Engineered production system architecture with high availability and verified performance metrics.'
      });
    }
    const p2Name = getWizVal('wiz-proj2-name');
    if (p2Name) {
      newProjects.push({
        name: p2Name,
        link: getWizVal('wiz-proj2-link'),
        tools: getWizVal('wiz-proj2-tools'),
        description: getWizVal('wiz-proj2-desc') || 'Built distributed asynchronous workflows with automated recovery and sub-10ms response.'
      });
    }
    if (newProjects.length > 0) {
      this.data.projects = newProjects;
    }

    // Education
    const eduDegree = getWizVal('wiz-edu-degree');
    const eduSchool = getWizVal('wiz-edu-school');
    if (eduDegree || eduSchool) {
      this.data.education = [{
        degree: eduDegree || 'B.S. in Computer Science',
        school: eduSchool || 'University of California, Berkeley',
        dates: getWizVal('wiz-edu-dates') || '2018 - 2022',
        details: getWizVal('wiz-edu-details') || 'Dean’s Honors List • Focus on Distributed Systems'
      }];
    }

    // Certifications
    const certsRaw = getWizVal('wiz-certs');
    if (certsRaw) {
      this.data.certifications = certsRaw.split(',').map(c => c.trim()).filter(Boolean);
    }

    // Skills
    const skillsRaw = getWizVal('wiz-skills');
    if (skillsRaw) {
      this.data.skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
    }

    this.data.name = name;
    this.data.title = title;
    this.data.email = email;
    this.data.phone = phone;
    this.data.location = loc;
    this.data.portfolio = portfolio;
    this.data.linkedin = linkedin;
    this.data.github = github;
    this.data.customLink = customlink;
    this.data.summary = summary;
    this.data.experience = [{
      role: roleDesc,
      company: company,
      location: expLoc,
      dates: expDates,
      bullets
    }];

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.resumeManager = new ResumeManager();
  });
} else {
  window.resumeManager = new ResumeManager();
}
