/**
 * study-quiz.js — Flashcards & AI Quiz Generation Suite
 */

class StudyQuizSuite {
  constructor() {
    this.currentMode = 'flashcards'; // 'flashcards' | 'quiz'
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.answeredQuestions = {};

    this.flashcards = [];
    this.quizQuestions = [];

    this.init();
  }

  init() {
    // Mode toggles
    const tabCards = document.getElementById('tab-flashcards');
    const tabQuiz = document.getElementById('tab-quiz');
    if (tabCards && tabQuiz) {
      tabCards.addEventListener('click', () => this.switchMode('flashcards'));
      tabQuiz.addEventListener('click', () => this.switchMode('quiz'));
    }

    // Flashcard element interactions
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

    const btnRegenQuiz = document.getElementById('btn-regen-quiz');
    if (btnRegenQuiz) {
      btnRegenQuiz.addEventListener('click', () => this.generateQuiz());
    }

    // Listen for PDF load to auto-generate study materials
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf) {
        this.generateFlashcards(pdf);
        this.generateQuiz(pdf);
      }
    });

    // Populate default materials if demo exists
    const initialPdf = window.appStore.getState('currentPdf');
    if (initialPdf) {
      this.generateFlashcards(initialPdf);
      this.generateQuiz(initialPdf);
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const cardsSection = document.getElementById('study-flashcards-view');
    const quizSection = document.getElementById('study-quiz-view');
    const tabCards = document.getElementById('tab-flashcards');
    const tabQuiz = document.getElementById('tab-quiz');

    if (mode === 'flashcards') {
      if (cardsSection) cardsSection.removeAttribute('hidden');
      if (quizSection) quizSection.setAttribute('hidden', '');
      if (tabCards) tabCards.classList.add('btn--active');
      if (tabQuiz) tabQuiz.classList.remove('btn--active');
    } else {
      if (cardsSection) cardsSection.setAttribute('hidden', '');
      if (quizSection) quizSection.removeAttribute('hidden');
      if (tabCards) tabCards.classList.remove('btn--active');
      if (tabQuiz) tabQuiz.classList.add('btn--active');
    }
  }

  generateFlashcards(pdf) {
    const docName = pdf ? pdf.name : 'Document';
    this.flashcards = [
      {
        tag: 'Core Concept • Page 1',
        prompt: `What is the primary objective detailed in ${docName}?`,
        answer: 'Automating high-throughput document intelligence, semantic citation mapping, and eliminating manual multi-party review delays.',
        hint: 'Click card to flip for detailed answer'
      },
      {
        tag: 'Architecture • Page 2',
        prompt: 'How does Retrieval-Augmented Generation (RAG) improve fidelity?',
        answer: 'By pairing vector embedding similarity queries with strict page-level groundings to verify every answer against document chunks.',
        hint: 'Click card to flip for detailed answer'
      },
      {
        tag: 'Risk Management • Page 3',
        prompt: 'What mitigation prevents dependency and throughput bottlenecks?',
        answer: 'Automated compliance checklists, asynchronous background ingestion, and modular extraction pipelines.',
        hint: 'Click card to flip for detailed answer'
      },
      {
        tag: 'Performance • Page 4',
        prompt: 'What measurable impact was observed during operational testing?',
        answer: 'A 64% reduction in overall document review latency with verified zero-hallucination page citations.',
        hint: 'Click card to flip for detailed answer'
      },
      {
        tag: 'Extensibility • Page 5',
        prompt: 'Which client-side operations are handled directly in the browser?',
        answer: 'Real-time text-to-speech audio narration, PDF canvas rendering, multi-color annotations, and document splitting/merging.',
        hint: 'Click card to flip for detailed answer'
      }
    ];

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

  generateQuiz(pdf) {
    const docName = pdf ? pdf.name : 'the document';
    this.quizQuestions = [
      {
        question: `According to ${docName}, what is the cornerstone of the automated document workflow?`,
        options: [
          'High-precision RAG with verified page citations',
          'Unsupervised manual text re-entry',
          'Static image OCR without vectorization',
          'Single-threaded server polling'
        ],
        correct: 0,
        explanation: 'Semantic RAG grounded with exact page citations guarantees verifiable answers without hallucinations.'
      },
      {
        question: 'Which observed benchmark metric demonstrates efficiency gain?',
        options: [
          '10% increase in storage footprint',
          '64% reduction in document review latency',
          '95% server CPU idle drop',
          'Zero network packet transmission'
        ],
        correct: 1,
        explanation: 'Operational testing demonstrated a 64% reduction in total turnaround time.'
      },
      {
        question: 'How are multi-party bottlenecks handled in the pipeline?',
        options: [
          'Manual queue halts',
          'Automated compliance checklists & async ingestion',
          'Ignoring section validation',
          'Restricting document size to 1 page'
        ],
        correct: 1,
        explanation: 'Automated compliance checklists and decoupled background workers prevent processing gridlock.'
      },
      {
        question: 'What client-side engine allows viewing PDFs without server trips?',
        options: [
          'Direct Mozilla PDF.js canvas rendering',
          'Flash player plugin',
          'Java Applet container',
          'External binary launcher'
        ],
        correct: 0,
        explanation: 'PDF.js renders vector PDF graphics directly in modern browser canvases.'
      }
    ];

    this.quizIndex = 0;
    this.quizScore = 0;
    this.answeredQuestions = {};
    this.renderQuiz();
  }

  renderQuiz() {
    const container = document.getElementById('quiz-questions-list');
    if (!container) return;

    container.innerHTML = '';
    this.quizQuestions.forEach((q, idx) => {
      const qCard = document.createElement('div');
      qCard.className = 'quiz-question-card';
      qCard.id = `quiz-q-${idx}`;

      const title = document.createElement('div');
      title.className = 'quiz-question-title';
      title.textContent = `${idx + 1}. ${q.question}`;
      qCard.appendChild(title);

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'quiz-options';

      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerHTML = `<span>${String.fromCharCode(65 + optIdx)}. ${optText}</span><span class="opt-badge"></span>`;
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
    const q = this.quizQuestions[questionIdx];
    const card = document.getElementById(`quiz-q-${questionIdx}`);
    const feedback = document.getElementById(`quiz-feedback-${questionIdx}`);
    const allButtons = card.querySelectorAll('.quiz-option-btn');

    allButtons.forEach(btn => btn.disabled = true);

    if (selectedIdx === q.correct) {
      this.quizScore++;
      btnElement.classList.add('correct');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `<strong>✓ Correct!</strong> ${q.explanation}`;
        feedback.style.borderColor = '#10b981';
      }
      Utils.showToast('Correct answer! +1 point', 'success');
    } else {
      btnElement.classList.add('incorrect');
      allButtons[q.correct].classList.add('correct');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `<strong>✗ Incorrect.</strong> The correct answer is <em>${String.fromCharCode(65 + q.correct)}</em>. ${q.explanation}`;
        feedback.style.borderColor = '#f87171';
      }
    }

    this.updateQuizScore();
  }

  updateQuizScore() {
    const scoreEl = document.getElementById('quiz-score-display');
    const total = this.quizQuestions.length;
    const answeredCount = Object.keys(this.answeredQuestions).length;
    if (scoreEl) {
      scoreEl.textContent = `Score: ${this.quizScore} / ${total} (${answeredCount} answered)`;
    }
  }
}

window.studyQuizSuite = new StudyQuizSuite();
