/**
 * study-quiz.js — AI Study Suite
 * High-yield 3D Flashcards, Dynamic Practice Exams, Smart Study Guide & Feynman Technique
 */

class StudyQuizSuite {
  constructor() {
    this.currentMode = 'flashcards'; // 'flashcards' | 'quiz' | 'cheatsheet' | 'feynman'
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.quizQuestions = [];
    this.filteredQuestions = [];
    this.quizScore = 0;
    this.answeredQuestions = {};
    this.flashcards = [];
    this.extractedData = null;

    this.init();
  }

  init() {
    // 1. Tab switching
    const tabCards = document.getElementById('tab-flashcards');
    const tabQuiz = document.getElementById('tab-quiz');
    const tabCheat = document.getElementById('tab-cheatsheet');
    const tabFeynman = document.getElementById('tab-feynman');

    if (tabCards) tabCards.addEventListener('click', () => this.switchMode('flashcards'));
    if (tabQuiz) tabQuiz.addEventListener('click', () => this.switchMode('quiz'));
    if (tabCheat) tabCheat.addEventListener('click', () => this.switchMode('cheatsheet'));
    if (tabFeynman) tabFeynman.addEventListener('click', () => this.switchMode('feynman'));

    // 2. Flashcards controls
    const cardElement = document.getElementById('flashcard');
    if (cardElement) {
      cardElement.addEventListener('click', () => this.flipCard());
    }

    const btnFlip = document.getElementById('btn-flip-card');
    if (btnFlip) {
      btnFlip.addEventListener('click', () => this.flipCard());
    }

    const btnPrev = document.getElementById('btn-prev-card');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.prevCard());
    }

    const btnNext = document.getElementById('btn-next-card');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextCard());
    }

    const btnShuffle = document.getElementById('btn-shuffle-cards');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => this.shuffleCards());
    }

    const btnRegenFlash = document.getElementById('btn-regen-flashcards');
    if (btnRegenFlash) {
      btnRegenFlash.addEventListener('click', () => {
        const pdf = window.appStore.getState('currentPdf') || this.getDefaultDoc();
        this.generateFlashcards(pdf);
        Utils.showToast('Flashcards regenerated with fresh document insights!', 'success');
      });
    }

    // 3. Quiz controls
    const btnRegenQuiz = document.getElementById('btn-regen-quiz');
    if (btnRegenQuiz) {
      btnRegenQuiz.addEventListener('click', () => {
        const pdf = window.appStore.getState('currentPdf') || this.getDefaultDoc();
        this.generateQuiz(pdf);
        Utils.showToast('Practice exam refreshed!', 'success');
      });
    }

    const difficultySelect = document.getElementById('quiz-difficulty-select');
    if (difficultySelect) {
      difficultySelect.addEventListener('change', (e) => {
        this.filterQuizByDifficulty(e.target.value);
      });
    }

    // 4. Cheat Sheet controls
    const btnCopyCheat = document.getElementById('btn-copy-cheatsheet');
    if (btnCopyCheat) {
      btnCopyCheat.addEventListener('click', () => this.copyCheatSheet());
    }

    const btnDownloadCheat = document.getElementById('btn-download-cheatsheet');
    if (btnDownloadCheat) {
      btnDownloadCheat.addEventListener('click', () => this.downloadCheatSheet());
    }

    const btnRegenCheat = document.getElementById('btn-regen-cheatsheet');
    if (btnRegenCheat) {
      btnRegenCheat.addEventListener('click', () => {
        const pdf = window.appStore.getState('currentPdf') || this.getDefaultDoc();
        this.generateCheatSheet(pdf);
        Utils.showToast('Study Guide & Cheat Sheet updated!', 'success');
      });
    }

    // 5. Feynman Explainer controls
    const btnExplain = document.getElementById('btn-explain-feynman');
    if (btnExplain) {
      btnExplain.addEventListener('click', () => this.handleFeynmanExplain());
    }

    const feynmanInput = document.getElementById('feynman-concept-input');
    if (feynmanInput) {
      feynmanInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleFeynmanExplain();
        }
      });
    }

    // 6. Listen for document changes
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf) {
        this.extractedData = this.extractDocumentData(pdf);
        this.generateFlashcards(pdf);
        this.generateQuiz(pdf);
        this.generateCheatSheet(pdf);
        this.populateFeynmanChips(pdf);
      }
    });

    // Populate initial materials
    const initialPdf = window.appStore.getState('currentPdf') || this.getDefaultDoc();
    this.extractedData = this.extractDocumentData(initialPdf);
    this.generateFlashcards(initialPdf);
    this.generateQuiz(initialPdf);
    this.generateCheatSheet(initialPdf);
    this.populateFeynmanChips(initialPdf);
  }

  getDefaultDoc() {
    return {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8,
      textContent: `[Page 1]: Introduction to Modern Artificial Intelligence (2026 Edition)\nAbstract: This paper reviews recent breakthroughs in reasoning systems, multimodal foundation models, and autonomous coding assistants.\nKey finding: High-throughput document intelligence reduces manual multi-party review delays.\n\n[Page 2]: Retrieval-Augmented Generation (RAG) is defined as an architecture that pairs semantic vector search with real-time factual groundings to eliminate hallucinations.\nCase studies demonstrate a 64% reduction in document review latency with verified zero-hallucination page citations.\n\n[Page 3]: Token distillation and sparse mixture of experts allow scalable inference across high-throughput data pipelines.\nRisk mitigation: Automated compliance checklists and decoupled asynchronous ingestion prevent processing gridlock.\n\n[Page 4]: Architecture and Safety Considerations: Grounding checks, citation verification, and factual consistency scoring guarantee deterministic compliance.\nClient-side Mozilla PDF.js canvas rendering allows instant document browsing without cloud server trips.`
    };
  }

  switchMode(mode) {
    this.currentMode = mode;
    const views = {
      flashcards: document.getElementById('study-flashcards-view'),
      quiz: document.getElementById('study-quiz-view'),
      cheatsheet: document.getElementById('study-cheatsheet-view'),
      feynman: document.getElementById('study-feynman-view')
    };

    const tabs = {
      flashcards: document.getElementById('tab-flashcards'),
      quiz: document.getElementById('tab-quiz'),
      cheatsheet: document.getElementById('tab-cheatsheet'),
      feynman: document.getElementById('tab-feynman')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === mode) {
          views[key].removeAttribute('hidden');
        } else {
          views[key].setAttribute('hidden', '');
        }
      }
      if (tabs[key]) {
        if (key === mode) {
          tabs[key].classList.add('btn--active');
          tabs[key].classList.remove('btn--ghost');
        } else {
          tabs[key].classList.remove('btn--active');
          tabs[key].classList.add('btn--ghost');
        }
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * DOCUMENT TEXT ANALYSIS & EXTRACTION ENGINE
   * ───────────────────────────────────────────────────────────── */
  extractDocumentData(pdf) {
    const rawText = pdf.textContent || '';
    const pages = [];
    const definitions = [];
    const metrics = [];
    const keySentences = [];
    const concepts = new Set();

    // Parse pages or slides
    const pageRegex = /(?:\[(?:Page|Slide)\s+(\d+)(?:\s*[-:]\s*[^\]]+)?\]):?\s*([\s\S]*?)(?=(?:\[(?:Page|Slide)\s+\d+|$))/gi;
    let match;

    while ((match = pageRegex.exec(rawText)) !== null) {
      const pageNum = parseInt(match[1], 10);
      const content = match[2].trim();
      pages.push({ page: pageNum, content });
    }

    if (!pages.length && rawText) {
      pages.push({ page: 1, content: rawText });
    }

    pages.forEach(p => {
      // Split into sentences
      const sentences = p.content
        .replace(/\n+/g, ' ')
        .split(/(?<=[.?!])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && !s.startsWith('#') && !s.startsWith('http'));

      sentences.forEach(sent => {
        keySentences.push({ page: p.page, text: sent });

        // Definitions: "X is defined as...", "X refers to...", "X represents...", "X means..."
        const defMatch = sent.match(/^([A-Z][a-zA-Z0-9\s-]{2,35})\s+(?:is|are|refers to|means|represents|defined as)\s+([^.?!;]{15,250})/i);
        if (defMatch) {
          definitions.push({
            page: p.page,
            term: defMatch[1].trim(),
            definition: defMatch[2].trim()
          });
          concepts.add(defMatch[1].trim());
        }

        // Metrics: sentences with numbers / percentages / stats
        if (/\b\d+(?:\.\d+)?%\b|\b\d+\s*(?:million|billion|users|reduction|increase|seconds|ms|parameters)\b/i.test(sent)) {
          metrics.push({ page: p.page, text: sent });
        }

        // Capitalized multi-word technical concepts
        const termMatches = sent.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);
        if (termMatches) {
          termMatches.forEach(t => {
            if (t.length > 5 && !t.includes('Page') && !t.includes('January') && !t.includes('February')) {
              concepts.add(t);
            }
          });
        }
      });
    });

    return {
      docName: pdf.name || 'Document',
      pageCount: pdf.pageCount || pages.length || 1,
      pages,
      definitions,
      metrics,
      keySentences,
      concepts: Array.from(concepts).slice(0, 15)
    };
  }

  /* ─────────────────────────────────────────────────────────────
   * 1. 3D FLASHCARDS GENERATOR
   * ───────────────────────────────────────────────────────────── */
  generateFlashcards(pdf) {
    const data = this.extractedData || this.extractDocumentData(pdf);
    const cards = [];

    // Card 1: Core Document Purpose
    cards.push({
      tag: `Executive Purpose • Page 1`,
      prompt: `What is the primary subject and central objective of ${data.docName}?`,
      answer: data.keySentences[0]?.text || `Analyzing core principles, operational requirements, and strategic recommendations outlined in ${data.docName}.`,
      page: 1
    });

    // Cards from extracted definitions
    data.definitions.slice(0, 4).forEach((d, idx) => {
      cards.push({
        tag: `Definition • Page ${d.page}`,
        prompt: `How is "${d.term}" defined and applied in this document?`,
        answer: `"${d.term}" is defined as: ${d.definition}.`,
        page: d.page
      });
    });

    // Cards from extracted metrics
    data.metrics.slice(0, 2).forEach((m, idx) => {
      cards.push({
        tag: `Key Finding & Metric • Page ${m.page}`,
        prompt: `What measurable outcome or performance benchmark is emphasized on Page ${m.page}?`,
        answer: m.text,
        page: m.page
      });
    });

    // Key sentences for remaining cards
    data.keySentences.slice(1, 4).forEach((k) => {
      if (cards.length < 7) {
        cards.push({
          tag: `High-Yield Fact • Page ${k.page}`,
          prompt: `What critical insight is established regarding the document's core methodology?`,
          answer: k.text,
          page: k.page
        });
      }
    });

    // Fallback if document text was too short
    if (cards.length < 4) {
      cards.push(
        {
          tag: 'Concept • Page 1',
          prompt: `What methodology drives the core analysis in ${data.docName}?`,
          answer: 'Structured information extraction, contextual synthesis, and deterministic citation verification.',
          page: 1
        },
        {
          tag: 'Key Takeaway • Page 2',
          prompt: 'What mitigation prevents bottlenecks during multi-party reviews?',
          answer: 'Decoupled asynchronous ingestion pipelines and automated compliance verification checklists.',
          page: 2
        }
      );
    }

    this.flashcards = cards;
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.renderCurrentCard();
  }

  renderCurrentCard() {
    const cardEl = document.getElementById('flashcard');
    const tagEl = document.getElementById('card-tag');
    const promptEl = document.getElementById('card-prompt');
    const answerEl = document.getElementById('card-answer');
    const countEl = document.getElementById('card-counter');
    const citeEl = document.getElementById('card-back-citation');

    if (!this.flashcards.length) return;

    const item = this.flashcards[this.currentCardIndex];
    if (cardEl) {
      cardEl.classList.remove('flipped');
      this.isCardFlipped = false;
    }

    if (tagEl) tagEl.textContent = item.tag;
    if (promptEl) promptEl.textContent = item.prompt;
    if (answerEl) answerEl.textContent = item.answer;
    if (countEl) countEl.textContent = `Card ${this.currentCardIndex + 1} of ${this.flashcards.length}`;

    if (citeEl) {
      citeEl.innerHTML = `📄 Page ${item.page || 1} · Click to jump in viewer`;
      citeEl.style.cursor = 'pointer';
      citeEl.onclick = (e) => {
        e.stopPropagation();
        window.appRouter.navigateTo('viewer');
        if (window.pdfViewer && window.pdfViewer.goToPage) {
          window.pdfViewer.goToPage(item.page || 1);
        }
      };
    }
  }

  flipCard() {
    const cardEl = document.getElementById('flashcard');
    if (cardEl) {
      this.isCardFlipped = !this.isCardFlipped;
      cardEl.classList.toggle('flipped', this.isCardFlipped);
    }
  }

  prevCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.renderCurrentCard();
    }
  }

  nextCard() {
    if (this.currentCardIndex < this.flashcards.length - 1) {
      this.currentCardIndex++;
      this.renderCurrentCard();
    }
  }

  shuffleCards() {
    this.flashcards.sort(() => Math.random() - 0.5);
    this.currentCardIndex = 0;
    this.renderCurrentCard();
    Utils.showToast('Flashcards shuffled!', 'info');
  }

  /* ─────────────────────────────────────────────────────────────
   * 2. DYNAMIC PRACTICE EXAM & QUIZ GENERATOR
   * ───────────────────────────────────────────────────────────── */
  generateQuiz(pdf) {
    const data = this.extractedData || this.extractDocumentData(pdf);
    const questions = [];

    // Q1: Based on definitions if available
    if (data.definitions.length > 0) {
      const def = data.definitions[0];
      const otherTerms = data.definitions.slice(1).map(d => d.term);
      const distractors = [
        `An unverified heuristic without validation`,
        `A legacy manual protocol scheduled for deprecation`,
        `A static cache container for unindexed raw text`
      ];

      questions.push({
        difficulty: 'easy',
        question: `According to ${data.docName} [Page ${def.page}], how is "${def.term}" defined?`,
        options: this.shuffleOptions([
          def.definition,
          distractors[0],
          distractors[1],
          distractors[2]
        ], def.definition),
        page: def.page,
        explanation: `As detailed on Page ${def.page}, "${def.term}" is specifically defined as: ${def.definition}`
      });
    }

    // Q2: Based on metrics/benchmarks
    if (data.metrics.length > 0) {
      const metric = data.metrics[0];
      questions.push({
        difficulty: 'hard',
        question: `Which verified operational benchmark or metric is highlighted in ${data.docName} [Page ${metric.page}]?`,
        options: this.shuffleOptions([
          metric.text,
          'A standard 5% variance within normal operational margins',
          'Unchanged historical throughput with zero measurable reduction',
          'A 90% increase in manual audit overhead'
        ], metric.text),
        page: metric.page,
        explanation: `Page ${metric.page} verifies this finding: "${metric.text}"`
      });
    }

    // Q3: Core Methodology
    const sentA = data.keySentences[1]?.text || `Structured verification loops ensure deterministic accuracy across all processing phases.`;
    questions.push({
      difficulty: 'hard',
      question: `What fundamental principle governs the analysis and findings of ${data.docName}?`,
      options: this.shuffleOptions([
        sentA,
        'Relying exclusively on non-deterministic heuristic models without audit trails',
        'Discarding page citations to maximize unverified generation speed',
        'Manual spreadsheet transcription without structured automation'
      ], sentA),
      page: data.keySentences[1]?.page || 2,
      explanation: `Page ${data.keySentences[1]?.page || 2} underscores this key principle: "${sentA}"`
    });

    // Q4: Operational Mitigations
    const sentB = data.keySentences[2]?.text || `Automated compliance checklists and asynchronous workers prevent pipeline bottlenecks.`;
    questions.push({
      difficulty: 'easy',
      question: `How does the framework address review delays and throughput constraints?`,
      options: this.shuffleOptions([
        sentB,
        'By restricting all document analyses to single-page summaries',
        'By disabling error reporting and audit logging',
        'By halting ingestion queues whenever concurrent users connect'
      ], sentB),
      page: data.keySentences[2]?.page || 3,
      explanation: `Page ${data.keySentences[2]?.page || 3} details the operational mitigation: "${sentB}"`
    });

    // Q5: Client-side capabilities
    questions.push({
      difficulty: 'easy',
      question: `Which client-side capability ensures private and instant document access without cloud delays?`,
      options: this.shuffleOptions([
        'In-browser vector rendering with zero external server dependencies',
        'Mandatory third-party cloud uploads for every page viewed',
        'Legacy proprietary desktop plugins',
        'Unencrypted cleartext transmission over public sockets'
      ], 'In-browser vector rendering with zero external server dependencies'),
      page: 1,
      explanation: 'Modern in-browser engines render canvas vectors and parse documents locally without exposing sensitive documents.'
    });

    this.quizQuestions = questions;
    this.filteredQuestions = [...questions];
    this.quizScore = 0;
    this.answeredQuestions = {};
    this.renderQuiz();
  }

  shuffleOptions(optionsArray, correctAnswer) {
    const shuffled = [...optionsArray].sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.indexOf(correctAnswer);
    return {
      list: shuffled,
      correctIndex: correctIdx >= 0 ? correctIdx : 0
    };
  }

  filterQuizByDifficulty(level) {
    if (level === 'all') {
      this.filteredQuestions = [...this.quizQuestions];
    } else {
      this.filteredQuestions = this.quizQuestions.filter(q => q.difficulty === level);
      if (!this.filteredQuestions.length) {
        this.filteredQuestions = [...this.quizQuestions];
      }
    }
    this.answeredQuestions = {};
    this.quizScore = 0;
    this.renderQuiz();
  }

  renderQuiz() {
    const container = document.getElementById('quiz-questions-list');
    if (!container) return;

    container.innerHTML = '';
    this.filteredQuestions.forEach((q, idx) => {
      const qCard = document.createElement('div');
      qCard.className = 'quiz-question-card';
      qCard.id = `quiz-q-${idx}`;

      const title = document.createElement('div');
      title.className = 'quiz-question-title';
      title.innerHTML = `<span style="color:var(--color-purple-400);margin-right:6px;">Q${idx + 1}.</span> ${q.question}`;
      qCard.appendChild(title);

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'quiz-options';

      q.options.list.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${optText}</span><span class="opt-badge"></span>`;
        btn.addEventListener('click', () => this.handleAnswer(idx, optIdx, btn));
        optionsDiv.appendChild(btn);
      });

      qCard.appendChild(optionsDiv);

      const feedback = document.createElement('div');
      feedback.className = 'quiz-feedback';
      feedback.id = `quiz-feedback-${idx}`;
      feedback.style.display = 'none';
      qCard.appendChild(feedback);

      container.appendChild(qCard);
    });

    this.updateQuizScore();
  }

  handleAnswer(questionIdx, selectedIdx, btnElement) {
    if (this.answeredQuestions[questionIdx] !== undefined) return;

    this.answeredQuestions[questionIdx] = selectedIdx;
    const q = this.filteredQuestions[questionIdx];
    const card = document.getElementById(`quiz-q-${questionIdx}`);
    const feedback = document.getElementById(`quiz-feedback-${questionIdx}`);
    const allButtons = card.querySelectorAll('.quiz-option-btn');

    allButtons.forEach(btn => btn.disabled = true);

    const correctIdx = q.options.correctIndex;

    if (selectedIdx === correctIdx) {
      this.quizScore++;
      btnElement.classList.add('correct');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `
          <div style="font-weight:600;color:#34d399;margin-bottom:4px;">✓ Correct! +1 Point</div>
          <div>${q.explanation}</div>
          <button class="citation-badge" style="margin-top:8px;" onclick="window.appRouter.navigateTo('viewer'); window.pdfViewer.goToPage(${q.page}); return false;">
            📄 View Page ${q.page} in Document Viewer
          </button>
        `;
        feedback.style.borderColor = '#10b981';
      }
      Utils.showToast('Correct answer! +1 point', 'success');
    } else {
      btnElement.classList.add('incorrect');
      allButtons[correctIdx].classList.add('correct');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `
          <div style="font-weight:600;color:#f87171;margin-bottom:4px;">✗ Incorrect (Answer: ${String.fromCharCode(65 + correctIdx)})</div>
          <div>${q.explanation}</div>
          <button class="citation-badge" style="margin-top:8px;" onclick="window.appRouter.navigateTo('viewer'); window.pdfViewer.goToPage(${q.page}); return false;">
            📄 Review Source on Page ${q.page}
          </button>
        `;
        feedback.style.borderColor = '#f87171';
      }
    }

    this.updateQuizScore();
  }

  updateQuizScore() {
    const scoreEl = document.getElementById('quiz-score-display');
    const total = this.filteredQuestions.length;
    const answeredCount = Object.keys(this.answeredQuestions).length;
    if (scoreEl) {
      scoreEl.textContent = `Score: ${this.quizScore} / ${total} (${answeredCount} answered)`;
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * 3. SMART STUDY GUIDE & CHEAT SHEET GENERATOR
   * ───────────────────────────────────────────────────────────── */
  generateCheatSheet(pdf) {
    const data = this.extractedData || this.extractDocumentData(pdf);
    const container = document.getElementById('cheatsheet-content');
    const badge = document.getElementById('cheatsheet-doc-badge');

    if (badge) badge.textContent = `${data.docName} (${data.pageCount} Pages)`;
    if (!container) return;

    let html = `
      <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:16px;margin-bottom:20px;">
        <h2 style="font-size:1.4rem;color:var(--color-purple-300);margin-bottom:6px;">📋 Comprehensive High-Yield Study Guide</h2>
        <p style="font-size:0.875rem;color:var(--color-text-secondary);margin:0;">
          Synthesized by AI from <strong>${data.docName}</strong> · Verified page citations included for rapid revision.
        </p>
      </div>

      <!-- I. Executive Summary -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:1.1rem;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span>🎯</span> I. Executive Exam Big-Picture
        </h3>
        <div style="background:var(--color-bg-elevated);border-left:4px solid var(--color-purple-400);padding:14px;border-radius:0 8px 8px 0;font-size:0.95rem;">
          ${data.keySentences[0]?.text || `This document provides systematic coverage of core operational frameworks, methodologies, and quantitative benchmarks.`}
        </div>
      </div>

      <!-- II. High-Yield Definitions & Terminology -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:1.1rem;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span>📖</span> II. Essential Definitions &amp; Terminology
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:12px;">
    `;

    if (data.definitions.length > 0) {
      data.definitions.slice(0, 6).forEach(d => {
        html += `
          <div style="background:var(--color-bg-elevated);padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
            <div style="font-weight:700;color:var(--color-purple-300);margin-bottom:4px;font-size:0.9rem;">${d.term}</div>
            <div style="font-size:0.85rem;color:var(--color-text-secondary);">${d.definition}</div>
            <div style="margin-top:6px;font-size:0.75rem;color:var(--color-text-muted);">📄 Page ${d.page}</div>
          </div>
        `;
      });
    } else {
      html += `
        <div style="background:var(--color-bg-elevated);padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
          <div style="font-weight:700;color:var(--color-purple-300);margin-bottom:4px;">Retrieval-Augmented Generation (RAG)</div>
          <div style="font-size:0.85rem;color:var(--color-text-secondary);">Architecture pairing semantic vector search with real-time groundings to eliminate hallucinations.</div>
        </div>
      `;
    }

    html += `
        </div>
      </div>

      <!-- III. Key Metrics, Formulas & Quantitative Proofs -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:1.1rem;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span>📌</span> III. Key Metrics, Quantifiable Benchmarks &amp; Findings
        </h3>
        <ul style="padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:0.92rem;color:var(--color-text-primary);">
    `;

    if (data.metrics.length > 0) {
      data.metrics.slice(0, 4).forEach(m => {
        html += `<li><strong>[Page ${m.page}]:</strong> ${m.text}</li>`;
      });
    } else {
      html += `
        <li><strong>Latency Reduction:</strong> 64% verified turnaround improvement in document analysis tasks [Page 2].</li>
        <li><strong>Storage Footprint:</strong> Zero server storage footprint required when client-side vector engines execute in-browser [Page 4].</li>
      `;
    }

    html += `
        </ul>
      </div>

      <!-- IV. Pre-Exam Cram Checklist -->
      <div>
        <h3 style="font-size:1.1rem;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span>⚡</span> IV. High-Yield Pre-Exam Cram Checklist
        </h3>
        <div style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.3);border-radius:8px;padding:14px;font-size:0.875rem;color:var(--color-text-primary);">
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div>☑️ Master the definition of <strong>${data.definitions[0]?.term || 'core system architecture'}</strong> on Page ${data.definitions[0]?.page || 1}.</div>
            <div>☑️ Memorize key quantitative findings to support essay and multiple-choice questions.</div>
            <div>☑️ Know how bottlenecks are mitigated: decoupled async pipelines and automated checklists.</div>
            <div>☑️ Review verified citations directly in the document viewer before test day.</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.cheatSheetMarkdown = this.convertHtmlToMarkdown(html, data);
  }

  convertHtmlToMarkdown(html, data) {
    let md = `# Study Guide: ${data.docName}\n\n`;
    md += `*Generated by AI Study Suite (${data.pageCount} Pages)*\n\n`;
    md += `## I. Executive Big Picture\n`;
    md += `${data.keySentences[0]?.text || 'Comprehensive overview of document principles and findings.'}\n\n`;
    md += `## II. Essential Terminology & Definitions\n`;
    data.definitions.forEach(d => {
      md += `- **${d.term}** (Page ${d.page}): ${d.definition}\n`;
    });
    md += `\n## III. Key Metrics & Benchmarks\n`;
    data.metrics.forEach(m => {
      md += `- [Page ${m.page}]: ${m.text}\n`;
    });
    md += `\n## IV. High-Yield Exam Checklist\n`;
    md += `- Master core definitions and system architecture.\n`;
    md += `- Review operational bottlenecks and automated mitigation checklists.\n`;
    return md;
  }

  copyCheatSheet() {
    const text = this.cheatSheetMarkdown || document.getElementById('cheatsheet-content')?.innerText || '';
    navigator.clipboard.writeText(text);
    Utils.showToast('Study Guide copied to clipboard in clean Markdown!', 'success');
  }

  downloadCheatSheet() {
    const text = this.cheatSheetMarkdown || '# Study Guide\n';
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.extractedData?.docName || 'Document').replace(/\.[^/.]+$/, '')}_Study_Guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Utils.showToast('Study Guide downloaded (.md)!', 'success');
  }

  /* ─────────────────────────────────────────────────────────────
   * 4. FEYNMAN CONCEPT EXPLAINER
   * ───────────────────────────────────────────────────────────── */
  populateFeynmanChips(pdf) {
    const data = this.extractedData || this.extractDocumentData(pdf);
    const chipsContainer = document.getElementById('feynman-concept-chips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = '';
    const sampleConcepts = data.concepts.length > 0
      ? data.concepts
      : ['Retrieval-Augmented Generation', 'Token Embeddings', 'Citation Verification', 'Asynchronous Ingestion'];

    sampleConcepts.slice(0, 6).forEach(c => {
      const chip = document.createElement('button');
      chip.className = 'btn btn--ghost btn--sm';
      chip.style.cssText = 'border-radius:999px;padding:3px 12px;font-size:0.75rem;border-color:rgba(167,139,250,0.3);';
      chip.textContent = `💡 ${c}`;
      chip.addEventListener('click', () => {
        const input = document.getElementById('feynman-concept-input');
        if (input) {
          input.value = c;
          this.handleFeynmanExplain();
        }
      });
      chipsContainer.appendChild(chip);
    });
  }

  handleFeynmanExplain() {
    const input = document.getElementById('feynman-concept-input');
    const depthEl = document.getElementById('feynman-depth');
    const resultCard = document.getElementById('feynman-result');

    if (!input || !resultCard) return;

    const concept = input.value.trim() || 'Retrieval-Augmented Generation';
    const style = depthEl ? depthEl.value : 'eli5';

    resultCard.removeAttribute('hidden');
    resultCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;">
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
        <div class="chat-typing__dot"></div>
        <span style="font-size:0.875rem;color:var(--color-text-secondary);">Deconstructing "${concept}" with Feynman technique...</span>
      </div>
    `;

    setTimeout(() => {
      let analogy = '';
      let mechanism = '';
      let realWorld = '';
      let memoryHook = '';

      const lower = concept.toLowerCase();

      if (lower.includes('rag') || lower.includes('retriev') || lower.includes('generation')) {
        analogy = `Imagine taking an open-book exam instead of trying to memorize 1,000 encyclopedia volumes. Whenever a question is asked, your assistant flips straight to the exact page, highlights the paragraph, and writes the answer directly from the text. That is RAG!`;
        mechanism = `1. **Vector Embedding**: Text chunks are converted into numerical coordinates in semantic space.\n2. **Similarity Search**: When a user asks a question, cosine similarity finds the closest matching page chunks.\n3. **Grounded Synthesis**: The LLM is provided the exact source chunk as context and forbidden from guessing without citations.`;
        realWorld = `Used by legal firms to cross-examine 5,000-page contracts in seconds without hallucinating fake clauses.`;
        memoryHook = `Remember: **RAG = Search first, think second, cite always!**`;
      } else if (lower.includes('token') || lower.includes('embed') || lower.includes('vector')) {
        analogy = `Think of words like colors on an artist's palette. Instead of just knowing the word "king", the computer sees it as a mixture of coordinates: [Royal = 0.9, Male = 0.8, Power = 0.95]. "Queen" has almost identical coordinates, just with [Female = 0.8]!`;
        mechanism = `High-dimensional mathematical vectors map semantic meaning so similar concepts sit close together in geometric space.`;
        realWorld = `Powers semantic document search, plagiarism detection, and multi-lingual translation.`;
        memoryHook = `Remember: **Words with similar meanings live in the same numerical neighborhood.**`;
      } else if (lower.includes('bottleneck') || lower.includes('queue') || lower.includes('async')) {
        analogy = `Imagine a restaurant kitchen. If the chef took orders, cooked food, washed dishes, and served tables one by one, customers would wait hours. Instead, the waiter puts tickets on a carousel (queue), and dedicated stations work in parallel without blocking each other.`;
        mechanism = `Decoupling request ingestion from heavy processing tasks using event loops or task queues prevents CPU starvation.`;
        realWorld = `Allows web applications to ingest 100-page PDFs in the background while keeping the user interface snappy.`;
        memoryHook = `Remember: **Don't wait in line—queue it and keep moving!**`;
      } else {
        analogy = `Imagine explaining "${concept}" to a smart 10-year-old: instead of using dense jargon, break it down into things they already know—like building blocks, traffic rules, or kitchen recipes.`;
        mechanism = `It takes raw inputs, applies consistent validation rules step-by-step, and produces verifiable outputs with minimal waste.`;
        realWorld = `Found throughout modern science and engineering to solve complex problems through repeatable, modular steps.`;
        memoryHook = `Remember: **Master the simplest rule first, then stack the complexity!**`;
      }

      resultCard.innerHTML = `
        <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:1.2rem;color:var(--color-purple-300);margin:0;">🧠 Feynman Breakdown: ${concept}</h3>
          <span class="badge badge--primary">${style === 'eli5' ? '👶 ELI5 Analogy' : style === 'college' ? '🎓 Deep Dive' : '⚡ Mechanism'}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <div style="background:linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05));border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:16px;">
            <div style="font-weight:700;color:var(--color-purple-300);font-size:0.95rem;margin-bottom:6px;">💡 The Intuitive Analogy (Plain English)</div>
            <div style="font-size:1rem;line-height:1.6;color:var(--color-text-primary);">${analogy}</div>
          </div>

          <div style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:16px;">
            <div style="font-weight:700;color:#38bdf8;font-size:0.95rem;margin-bottom:6px;">⚙️ How It Actually Works Step-by-Step</div>
            <div style="font-size:0.9rem;line-height:1.6;color:var(--color-text-secondary);white-space:pre-line;">${mechanism}</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:14px;">
              <div style="font-weight:700;color:#34d399;font-size:0.85rem;margin-bottom:4px;">🌍 Practical Application</div>
              <div style="font-size:0.85rem;color:var(--color-text-secondary);line-height:1.5;">${realWorld}</div>
            </div>
            <div style="background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:10px;padding:14px;">
              <div style="font-weight:700;color:#fbbf24;font-size:0.85rem;margin-bottom:4px;">🎯 Memory Hook &amp; Test Tip</div>
              <div style="font-size:0.85rem;color:var(--color-text-secondary);line-height:1.5;">${memoryHook}</div>
            </div>
          </div>
        </div>
      `;
    }, 400);
  }
}

window.studyQuizSuite = new StudyQuizSuite();
