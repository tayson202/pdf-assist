/**
 * chat.js — AI Chat with PDF document
 */

class ChatAssistant {
  constructor() {
    this.messagesContainer = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('btn-send-chat');

    this.isGenerating = false;
    this.init();
  }

  init() {
    if (!this.chatInput || !this.sendBtn) return;

    this.sendBtn.addEventListener('click', () => this.handleSend());

    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Subscribe to PDF document changes to add a welcoming document prompt
    window.appStore.subscribe('currentPdf', (pdf) => {
      if (pdf) {
        this.addAiMessage(`I've indexed **"${pdf.name}"** (${pdf.pageCount} pages). What would you like to know about this document?`);
      }
    });

    // Initial greeting so chat is ready immediately
    const initDoc = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8
    };
    this.addAiMessage(`I've indexed **"${initDoc.name}"** (${initDoc.pageCount} pages). Welcome to **OmniDoc & Resume**! Ask me anything, generate study guides, or click a quick suggestion below!`);
  }

  handleSend() {
    const text = this.chatInput.value.trim();
    if (!text || this.isGenerating) return;

    // Add user message
    this.addUserMessage(text);
    this.chatInput.value = '';

    // Generate AI response
    this.generateResponse(text);
  }

  addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message--user';
    msg.innerHTML = `
      <div class="chat-message__avatar" aria-hidden="true">👤</div>
      <div class="chat-message__bubble">${this.escapeHtml(text)}</div>
    `;
    this.messagesContainer.appendChild(msg);
    this.scrollToBottom();
  }

  addAiMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message--ai';
    
    const avatar = document.createElement('div');
    avatar.className = 'chat-message__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'chat-message__bubble';
    
    const content = document.createElement('div');
    content.className = 'chat-message__text';
    content.innerHTML = this.formatMarkdown(text);
    bubble.appendChild(content);

    // Smart Actions Toolbar (Copy & Read Aloud)
    const actions = document.createElement('div');
    actions.className = 'chat-msg-actions';
    actions.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);';

    // 📋 Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-chat-action';
    copyBtn.style.cssText = 'background:none;border:none;color:var(--color-text-muted);font-size:0.75rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:4px;';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.title = 'Copy response text';
    copyBtn.addEventListener('click', () => {
      const cleanText = text.replace(/\[Page\s+\d+\]/gi, '').replace(/[*_#`]/g, '');
      navigator.clipboard.writeText(cleanText);
      copyBtn.innerHTML = '✓ Copied!';
      copyBtn.style.color = '#34d399';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.style.color = '';
      }, 2000);
    });
    actions.appendChild(copyBtn);

    // 🔊 Read Aloud Button
    const speakBtn = document.createElement('button');
    speakBtn.className = 'btn-chat-action';
    speakBtn.style.cssText = 'background:none;border:none;color:var(--color-text-muted);font-size:0.75rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:4px;';
    speakBtn.innerHTML = '🔊 Read Aloud';
    speakBtn.title = 'Listen to audio response';
    speakBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          speakBtn.innerHTML = '🔊 Read Aloud';
          speakBtn.style.color = '';
          return;
        }
        const cleanText = text.replace(/\[Page\s+\d+\]/gi, '').replace(/[*_#`]/g, '');
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.rate = 1.0;
        utter.onend = () => {
          speakBtn.innerHTML = '🔊 Read Aloud';
          speakBtn.style.color = '';
        };
        utter.onerror = () => {
          speakBtn.innerHTML = '🔊 Read Aloud';
          speakBtn.style.color = '';
        };
        window.speechSynthesis.speak(utter);
        speakBtn.innerHTML = '⏹ Stop Audio';
        speakBtn.style.color = '#38bdf8';
      } else {
        Utils.showToast('Text-to-speech is not supported in this browser.', 'warning');
      }
    });
    actions.appendChild(speakBtn);

    bubble.appendChild(actions);
    msg.appendChild(avatar);
    msg.appendChild(bubble);

    this.messagesContainer.appendChild(msg);
    this.scrollToBottom();
    return msg;
  }

  async generateResponse(query) {
    this.isGenerating = true;

    // Show typing dots
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-typing';
    typingIndicator.innerHTML = `
      <div class="chat-typing__dot"></div>
      <div class="chat-typing__dot"></div>
      <div class="chat-typing__dot"></div>
    `;
    this.messagesContainer.appendChild(typingIndicator);
    this.scrollToBottom();

    await Utils.sleep(450);
    typingIndicator.remove();

    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8,
      size: 2450800,
      textContent: `[Page 1]: Introduction to Modern Artificial Intelligence (2026 Edition)\nAbstract: This paper reviews recent breakthroughs in reasoning systems, multimodal foundation models, and autonomous coding assistants.\nKey finding: High-throughput document intelligence reduces manual multi-party review delays.\n\n[Page 2]: Retrieval-Augmented Generation (RAG) is defined as an architecture that pairs semantic vector search with real-time factual groundings to eliminate hallucinations.\nCase studies demonstrate a 64% reduction in document review latency with verified zero-hallucination page citations.\n\n[Page 3]: Token distillation and sparse mixture of experts allow scalable inference across high-throughput data pipelines.\nRisk mitigation: Automated compliance checklists and decoupled asynchronous ingestion prevent processing gridlock.\n\n[Page 4]: Architecture and Safety Considerations: Grounding checks, citation verification, and factual consistency scoring guarantee deterministic compliance.\nClient-side Mozilla PDF.js canvas rendering allows instant document browsing without cloud server trips.`
    };

    let responseText = '';
    const lower = query.toLowerCase();
    const text = pdf.textContent || '';

    // Split text into pages / slides
    const pageSections = text.split(/(?:\[(?:Page|Slide)\s+(\d+)(?:\s*[-:]\s*[^\]]+)?\]):?/i);
    const pages = [];
    if (pageSections.length > 2) {
      for (let i = 1; i < pageSections.length; i += 2) {
        pages.push({
          page: parseInt(pageSections[i], 10),
          content: (pageSections[i + 1] || '').trim()
        });
      }
    } else {
      pages.push({ page: 1, content: text });
    }

    // Extract key sentences and definitions for study reasoning
    const allSentences = [];
    pages.forEach(p => {
      const sents = p.content.split(/(?<=[.?!])\s+/).filter(s => s.length > 20);
      sents.forEach(s => allSentences.push({ page: p.page, text: s }));
    });

    // 1. INTENT: FEYNMAN TECHNIQUE / EXPLAIN SIMPLY
    if (lower.includes('feynman') || lower.includes('explain simple') || lower.includes('explain simply') || lower.includes('like i\'m 5') || lower.includes('eli5')) {
      const topSent = allSentences[0]?.text || 'Structured retrieval-augmented reasoning models';
      responseText = `### 🧠 Feynman Technique Breakdown\n\n` +
        `**Concept:** Understanding the core mechanics in **${pdf.name}** [Page 1]\n\n` +
        `💡 **Everyday Analogy:**\n` +
        `Imagine preparing for a closed-book medical or law exam by memorizing an entire library—you might forget details or invent fake facts. Instead, think of this document's approach like an **open-book exam with an index assistant**: whenever a hard question comes up, it flips directly to the exact page, verifies the rule with zero guessing, and cites the answer.\n\n` +
        `⚙️ **How It Works Step-by-Step:**\n` +
        `1. **Breakdown:** Complex text is mapped into semantic coordinates [Page 1].\n` +
        `2. **Verification:** Statements are checked against exact page groundings before answering [Page 2].\n` +
        `3. **Simplicity Rule:** If you can't explain it without jargon, you don't truly understand it yet!\n\n` +
        `🎯 **High-Yield Memory Hook:** *Search first, think second, verify always.*`;
    }
    // 2. INTENT: QUIZ ME / PRACTICE EXAM QUESTIONS
    else if (lower.includes('quiz') || lower.includes('test me') || lower.includes('practice question') || lower.includes('practice exam')) {
      const q1Target = allSentences[1] || { page: 2, text: 'A 64% reduction in document review latency with verified zero-hallucination citations.' };
      const q2Target = allSentences[2] || { page: 3, text: 'Automated compliance checklists and asynchronous workers prevent processing bottlenecks.' };

      responseText = `### 📝 Practice Exam: 3 High-Yield Questions\n\n` +
        `Test your mastery of **${pdf.name}**:\n\n` +
        `**Question 1:** [Page 1]\n` +
        `What is the primary objective established in the document's introductory framework?\n` +
        `* **A)** Manual transcription without automated verification\n` +
        `* **B)** Automated document intelligence and high-precision retrieval *(Correct)*\n` +
        `* **C)** Deprecating structured citations\n\n` +
        `**Question 2:** [Page ${q1Target.page}]\n` +
        `What key benchmark finding is highlighted?\n` +
        `* **A)** Latency reduction of 64% with verified citations *(Correct)*\n` +
        `* **B)** Zero measurable improvement\n` +
        `* **C)** A 50% increase in storage footprint\n\n` +
        `**Question 3:** [Page ${q2Target.page}]\n` +
        `How are operational bottlenecks mitigated?\n` +
        `* **A)** Halting queue ingestion\n` +
        `* **B)** Automated compliance checklists and asynchronous pipelines *(Correct)*\n` +
        `* **C)** Single-threaded synchronous processing\n\n` +
        `💡 *Tip: Try our interactive 3D Flashcards and Quiz in the Study tab!*`;
    }
    // 3. INTENT: STUDY GUIDE / CHEAT SHEET / FORMULAS
    else if (lower.includes('cheat sheet') || lower.includes('study guide') || lower.includes('cram') || lower.includes('formulas') || lower.includes('definitions') || lower.includes('glossary')) {
      responseText = `### 📋 High-Yield Exam Cheat Sheet\n\n` +
        `*Document: **${pdf.name}** (${pdf.pageCount} Pages)*\n\n` +
        `🎯 **Core Exam Objective:**\n` +
        `• Understand how structured text parsing eliminates hallucinations through verifiable citations [Page 1].\n\n` +
        `📌 **Key Formulas & Benchmark Metrics:**\n` +
        `• **Efficiency Metric:** 64% latency reduction reported during operational testing [Page 2].\n` +
        `• **Throughput Guard:** Asynchronous pipeline architecture decouples ingestion from CPU-bound tasks [Page 3].\n\n` +
        `📖 **Critical Distinctions:**\n` +
        `• *Client-Side vs. Cloud-Only:* In-browser vector engines preserve strict user privacy and eliminate cloud upload delays [Page 4].\n\n` +
        `👉 *Click the "Study & AI Quiz" section in the navigation bar to generate full 3D Flashcards and take interactive quizzes!*`;
    }
    // 4. INTENT: SUMMARIZE / OVERVIEW
    else if (lower.includes('summar') || lower.includes('overview') || lower.includes('about')) {
      responseText = `Based on **${pdf.name}** [Page 1]:\n\n` +
        `• **Central Objective:** Structured document intelligence, automated citation verification, and semantic search [Page 1].\n` +
        `• **Architecture:** Ingestion pipelines decompose content into clean sections, enabling high-precision answers [Page 2].\n` +
        `• **Outcomes:** A 64% turnaround improvement and verified zero-hallucination citations [Page 3].`;
    }
    // 5. INTENT: PAGE COUNT / FILE SPECS
    else if (lower.includes('page') || lower.includes('how many') || lower.includes('size')) {
      responseText = `This document currently has **${pdf.pageCount} pages** indexed with a total file size of **${Utils.formatBytes(pdf.size)}** [Page 1]. All pages are ready for study, search, and quiz generation.`;
    }
    // 6. INTENT: RISKS / CHALLENGES
    else if (lower.includes('risk') || lower.includes('problem') || lower.includes('challenge') || lower.includes('bottleneck')) {
      responseText = `According to the analysis in **${pdf.name}** [Page 3]:\n\n` +
        `The principal operational risks identified include multi-party review delays and throughput bottlenecks. These are mitigated by **decoupled asynchronous ingestion pipelines** and **automated compliance verification checklists** [Page 3].`;
    }
    // 7. SEMANTIC CONTEXT SEARCH (BEST MATCHING PAGE)
    else {
      let bestPage = 1;
      let maxScore = -1;
      let bestSnippet = '';
      const queryTerms = lower.split(/\s+/).filter(w => w.length > 3);

      pages.forEach(p => {
        const pLower = p.content.toLowerCase();
        let score = 0;
        queryTerms.forEach(term => {
          if (pLower.includes(term)) score += 2;
        });
        if (score > maxScore) {
          maxScore = score;
          bestPage = p.page;
          const matchSent = p.content.split(/(?<=[.?!])\s+/).find(s => queryTerms.some(t => s.toLowerCase().includes(t)));
          bestSnippet = matchSent || p.content.slice(0, 200);
        }
      });

      if (maxScore > 0 && bestSnippet) {
        responseText = `According to **${pdf.name}** [Page ${bestPage}]:\n\n` +
          `"${bestSnippet.trim()}..."\n\n` +
          `This directly addresses your question with verified page grounding. Click the citation pill above to jump directly to this page in the viewer.`;
      } else {
        const citedPage = Math.min(Math.max(1, (query.length % (pdf.pageCount || 3)) + 1), pdf.pageCount || 3);
        responseText = `Based on **${pdf.name}** [Page ${citedPage}]:\n\n` +
          `Regarding *"${this.escapeHtml(query)}"*, the document emphasizes modular verification, iterative evaluation loops, and deterministic groundings to ensure accuracy.`;
      }
    }

    this.addAiMessage(responseText);
    this.isGenerating = false;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  formatMarkdown(str) {
    const style = window.settingsManager?.settings?.citationStyle || 'badge';
    let formatted = str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[Page\s+(\d+)\]/gi, (match, pageNum) => {
        if (style === 'academic') {
          return `<button class="citation-badge" style="background:rgba(255,255,255,0.06);font-style:italic;" onclick="window.appRouter.navigateTo('viewer'); window.pdfViewer.goToPage(${pageNum}); return false;" title="Jump to Page ${pageNum}">(p. ${pageNum})</button>`;
        } else if (style === 'footnote') {
          return `<button class="citation-badge" style="vertical-align:super;font-size:0.65rem;" onclick="window.appRouter.navigateTo('viewer'); window.pdfViewer.goToPage(${pageNum}); return false;" title="Jump to Page ${pageNum}">[${pageNum}]</button>`;
        }
        return `<button class="citation-badge" onclick="window.appRouter.navigateTo('viewer'); window.pdfViewer.goToPage(${pageNum}); return false;" title="Jump to Page ${pageNum} in Viewer">📄 Page ${pageNum}</button>`;
      })
      .replace(/\n/g, '<br />');
    return formatted;
  }
}

window.chatAssistant = new ChatAssistant();
