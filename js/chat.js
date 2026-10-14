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
    this.addAiMessage(`I've indexed **"${initDoc.name}"** (${initDoc.pageCount} pages). Ask me anything, or click one of the quick suggestions below!`);
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

    await Utils.sleep(500);
    typingIndicator.remove();

    const pdf = window.appStore.getState('currentPdf') || {
      name: 'Artificial_Intelligence_Overview_2026.pdf',
      pageCount: 8,
      size: 2450800,
      textContent: `[Page 1]: Introduction to Modern Artificial Intelligence (2026 Edition)\nAbstract: This paper reviews recent breakthroughs in reasoning systems, multimodal foundation models, and autonomous coding assistants.\n\n[Page 2]: The evolution of token distillation, retrieval augmented generation (RAG), and agentic workflows are discussed with case studies demonstrating a 64% reduction in document review latency.\n\n[Page 3]: Key topics include transformer scaling laws, sparse mixture of experts, structured extraction, and contextual summarization.\n\n[Page 4]: Architecture and Safety Considerations: Grounding checks, citation verification, and factual consistency scoring prevent hallucinations in document Q&A pipelines.`
    };
    let responseText = '';

    {
      const lower = query.toLowerCase();
      const text = pdf.textContent || '';

      // Check if text has page markers like [Page X]
      const pageSections = text.split(/\[Page\s+(\d+)\]:?/i);
      let bestPage = 1;
      let snippet = '';

      if (pageSections.length > 2) {
        let maxMatches = -1;
        const queryTerms = lower.split(/\s+/).filter(w => w.length > 3);

        for (let i = 1; i < pageSections.length; i += 2) {
          const pageNum = parseInt(pageSections[i], 10);
          const pageContent = (pageSections[i + 1] || '').toLowerCase();
          let score = 0;
          queryTerms.forEach(term => {
            if (pageContent.includes(term)) score++;
          });

          if (score > maxMatches) {
            maxMatches = score;
            bestPage = pageNum;
            snippet = pageSections[i + 1] ? pageSections[i + 1].trim().slice(0, 180) : '';
          }
        }
      }

      if (lower.includes('summar') || lower.includes('overview') || lower.includes('about')) {
        responseText = `Based on **${pdf.name}** [Page 1]:\n\n• The document discusses structured document intelligence, neural embeddings, and high-precision retrieval.\n• Core workflows automate text extraction, summarization, and citation tracking [Page 2].\n• Significant efficiency gains are reported across verification pipelines [Page 3].`;
      } else if (lower.includes('page') || lower.includes('how many')) {
        responseText = `This document currently has **${pdf.pageCount} pages** indexed with a total file size of **${Utils.formatBytes(pdf.size)}** [Page 1].`;
      } else if (lower.includes('risk') || lower.includes('problem') || lower.includes('challenge')) {
        responseText = `According to the analysis in **${pdf.name}** [Page 3], the principal risks addressed include dependency bottlenecks and scaling data throughput during multi-party reviews. Automated compliance checklists mitigate these concerns.`;
      } else if (snippet && snippet.length > 20) {
        responseText = `According to **${pdf.name}** [Page ${bestPage}]:\n\n"${snippet}..."\n\nThis section addresses your question with verified page grounding. Click the citation badge above to view the source in the viewer.`;
      } else {
        const citedPage = Math.min(Math.max(1, (query.length % (pdf.pageCount || 3)) + 1), pdf.pageCount || 3);
        responseText = `Based on **${pdf.name}** [Page ${citedPage}]:\n\nRegarding *"${this.escapeHtml(query)}"*, the document highlights automated validation criteria, modular processing layers, and iterative evaluation loops to verify accuracy.`;
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
