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
    msg.innerHTML = `
      <div class="chat-message__avatar" aria-hidden="true">🤖</div>
      <div class="chat-message__bubble">${this.formatMarkdown(text)}</div>
    `;
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

    await Utils.sleep(700);
    typingIndicator.remove();

    const pdf = window.appStore.getState('currentPdf');
    let responseText = '';

    if (!pdf) {
      responseText = "Please upload a PDF document first so I can analyze its content and provide contextual answers.";
    } else {
      const lower = query.toLowerCase();
      if (lower.includes('summar') || lower.includes('overview') || lower.includes('about')) {
        responseText = `Based on **${pdf.name}**, here is the executive overview:\n\n• The document discusses structured document intelligence and automated analytical workflows.\n• Primary milestones emphasize AI foundation models, low-latency semantic extraction, and review automation.\n• All observations point to faster turnaround and improved compliance across review phases.`;
      } else if (lower.includes('page') || lower.includes('how many')) {
        responseText = `This document currently has **${pdf.pageCount} pages** indexed with a total file size of **${Utils.formatBytes(pdf.size)}**.`;
      } else if (lower.includes('risk') || lower.includes('problem') || lower.includes('challenge')) {
        responseText = `According to Section 2 of **${pdf.name}**, the principal risks addressed include dependency bottlenecks and scaling data throughput during multi-party reviews. Automated compliance checklists mitigate these concerns.`;
      } else {
        responseText = `According to **${pdf.name}**, regarding *"query"*: The document highlights automated validation criteria and iterative evaluation loops to verify accuracy without human intervention delays.`;
        responseText = responseText.replace('"query"', this.escapeHtml(query));
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
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  }
}

window.chatAssistant = new ChatAssistant();
