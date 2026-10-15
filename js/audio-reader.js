/**
 * audio-reader.js — Intelligent Web Speech API Document Audio Player
 * Universal Reader supporting Word (.docx/.doc), PowerPoint (.pptx), Excel (.xlsx/.csv),
 * PDF, TXT, Markdown, Resume, and custom text with continuous reading & sentence chunking.
 */

class AudioReader {
  constructor() {
    this.playBtn = document.getElementById('btn-audio-play');
    this.stopBtn = document.getElementById('btn-audio-stop');
    this.modeSelect = document.getElementById('audio-mode');
    this.speedSelect = document.getElementById('audio-speed');
    this.statusPill = document.getElementById('audio-status');
    this.synth = window.speechSynthesis || null;

    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.rate = 1.0;
    this.mode = 'page'; // 'page' | 'all' | 'selected'

    // Queue-based speech for rock-solid sentence-by-sentence reading
    this.queue = [];
    this.currentQueueIndex = 0;
    this.heartbeatTimer = null;
    this.voices = [];
    this.selectedVoice = null;

    this.init();
  }

  init() {
    if (!this.synth) {
      if (this.statusPill) this.statusPill.textContent = 'Speech Not Supported';
      return;
    }

    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => this.stop());
    }

    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        this.mode = e.target.value || 'page';
        if (this.isPlaying) {
          this.stop();
          this.play();
        }
      });
    }

    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.rate = parseFloat(e.target.value) || 1.0;
        if (this.isPlaying && !this.isPaused) {
          const currentIndex = this.currentQueueIndex;
          this.synth.cancel();
          this.playQueue(currentIndex);
        }
      });
    }

    // Stop speaking when user switches or closes the document
    if (window.appStore && typeof window.appStore.subscribe === 'function') {
      window.appStore.subscribe('currentPdf', () => this.stop());
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    if (this.voices.length > 0) {
      // Prefer high quality English voices
      this.selectedVoice = this.voices.find(v => 
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy')))
      ) || this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
    }
  }

  togglePlay() {
    if (this.isPlaying && !this.isPaused) {
      this.pause();
    } else if (this.isPaused) {
      this.resume();
    } else {
      this.play();
    }
  }

  async play() {
    const selectedText = window.getSelection ? window.getSelection().toString().trim() : '';
    
    // Auto-detect if user has highlighted text and selected mode or text is highlighted
    let readMode = this.modeSelect ? this.modeSelect.value : this.mode;
    if (selectedText && (!this.modeSelect || readMode === 'selected')) {
      readMode = 'selected';
    }

    const doc = (window.appStore && window.appStore.getState('currentPdf')) || null;
    
    // Check if on Resume page with active resume data
    const activePage = document.querySelector('.page:not([hidden])');
    const isResumePage = activePage && activePage.id === 'page-resume';

    let chunks = [];

    if (readMode === 'selected' && selectedText) {
      chunks = this.chunkText(selectedText, 1, 'Selection');
    } else if (isResumePage && window.resumeManager && window.resumeManager.data) {
      chunks = this.getResumeChunks();
    } else if (doc) {
      if (readMode === 'all') {
        chunks = await this.extractFullDocumentChunks(doc);
      } else {
        const currentPage = (window.pdfViewer && window.pdfViewer.currentPage) || 1;
        chunks = await this.extractPageChunks(doc, currentPage);
      }
    } else if (selectedText) {
      chunks = this.chunkText(selectedText, 1, 'Selection');
    } else {
      // Fallback demo text if no document is loaded at all
      const demoText = "Welcome to OmniDoc & Resume. Please upload a PDF, Word document, PowerPoint presentation, Excel spreadsheet, or import your CV to read aloud with continuous natural narration.";
      chunks = this.chunkText(demoText, 1, 'System');
    }

    if (!chunks || chunks.length === 0) {
      if (this.statusPill) this.statusPill.textContent = 'No text found to read';
      return;
    }

    this.stop();
    this.queue = chunks;
    this.currentQueueIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;

    if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
    this.playQueue(0);
  }

  async extractPageChunks(doc, pageNum) {
    const text = await this.extractTextForPage(doc, pageNum);
    if (!text || !text.trim()) {
      return this.chunkText(`Page ${pageNum} is empty or contains non-text media.`, pageNum);
    }
    return this.chunkText(text, pageNum);
  }

  async extractFullDocumentChunks(doc) {
    const totalPages = doc.pageCount || 1;
    let allChunks = [];

    for (let p = 1; p <= totalPages; p++) {
      const pageText = await this.extractTextForPage(doc, p);
      if (pageText && pageText.trim()) {
        const unitName = doc.docType === 'powerpoint' ? 'Slide' : (doc.docType === 'excel' ? 'Sheet' : 'Page');
        const header = totalPages > 1 ? `${unitName} ${p}. ` : '';
        const pageChunks = this.chunkText(header + pageText, p);
        allChunks = allChunks.concat(pageChunks);
      }
    }

    if (allChunks.length === 0) {
      // If page-by-page failed, attempt full text fallback
      const rawText = doc.textContent || (doc.docDetails && doc.docDetails.raw) || '';
      if (rawText.trim()) {
        const cleaned = rawText.replace(/\[(?:Page|Slide|Sheet)[^\]]*\]:?/gi, ' ');
        allChunks = this.chunkText(cleaned, 1);
      }
    }

    return allChunks;
  }

  async extractTextForPage(doc, pageNum) {
    if (!doc) return '';

    // 1. PowerPoint (.pptx, .ppt)
    if (doc.docType === 'powerpoint' && doc.docDetails && doc.docDetails.slides) {
      const slide = doc.docDetails.slides[pageNum - 1];
      if (slide) {
        let parts = [];
        if (slide.title) parts.push(`Slide ${pageNum}: ${slide.title}`);
        if (slide.bullets && slide.bullets.length > 0) {
          const cleanBullets = slide.bullets.map(b => b.replace(/^[\s•\-\*]+/, '').trim()).filter(Boolean);
          if (cleanBullets.length > 0) {
            parts.push(cleanBullets.join('. '));
          }
        }
        if (slide.allText && (!slide.bullets || slide.bullets.length === 0)) {
          parts.push(slide.allText);
        }
        return parts.join('. ');
      }
    }

    // 2. Excel Spreadsheet (.xlsx, .xls, .csv)
    if (doc.docType === 'excel' && doc.docDetails && doc.docDetails.sheetNames) {
      const sheetName = doc.docDetails.sheetNames[pageNum - 1] || `Sheet ${pageNum}`;
      const sheetData = doc.docDetails.sheets && doc.docDetails.sheets[sheetName];
      if (sheetData && sheetData.csv) {
        const lines = sheetData.csv.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
          let parts = [`Spreadsheet ${sheetName}.`];
          if (headers.length > 0) {
            parts.push(`Columns: ${headers.join(', ')}.`);
          }
          // Read up to 25 data rows intelligibly
          const rowLimit = Math.min(lines.length, 25);
          for (let r = 1; r < rowLimit; r++) {
            const cells = lines[r].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
            const rowEntries = cells.map((cell, idx) => (cell && headers[idx] ? `${headers[idx]}: ${cell}` : cell)).filter(Boolean);
            if (rowEntries.length > 0) {
              parts.push(`Row ${r}: ${rowEntries.join(', ')}.`);
            }
          }
          return parts.join(' ');
        }
      }
    }

    // 3. Word Document (.docx, .doc)
    if (doc.docType === 'word') {
      const text = doc.textContent || '';
      // Try regex for [Page X]
      const regex = new RegExp(`\\[(?:Page\\s*)?${pageNum}(?:\\s*-[^\\]]+)?\\]:?([\\s\\S]*?)(?=\\[(?:Page\\s*)?\\d+(?:\\s*-[^\\]]+)?\\]:?|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }

      // If no page tags, slice words from raw text
      if (doc.docDetails && doc.docDetails.raw) {
        const words = doc.docDetails.raw.split(/\s+/).filter(Boolean);
        const wordsPerPage = 320;
        const start = (pageNum - 1) * wordsPerPage;
        const end = pageNum * wordsPerPage;
        const slice = words.slice(start, end).join(' ');
        if (slice.trim()) return slice.trim();
      }
    }

    // 4. PDF Document (.pdf)
    if (doc.docType === 'pdf') {
      const text = doc.textContent || '';
      const regex = new RegExp(`\\[(?:Page\\s*)?${pageNum}(?:\\s*-[^\\]]+)?\\]:?([\\s\\S]*?)(?=\\[(?:Page\\s*)?\\d+(?:\\s*-[^\\]]+)?\\]:?|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }

      // Try dynamic on-the-fly extraction via PDF.js if available
      if (doc.pdfDoc && typeof doc.pdfDoc.getPage === 'function') {
        try {
          const page = await doc.pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map(item => item.str).join(' ').trim();
          if (pageStr) return pageStr;
        } catch (pdfErr) {
          console.warn('PDF.js dynamic page extraction notice:', pdfErr);
        }
      }
    }

    // 5. Generic / Text / Markdown / Other Documents
    const text = doc.textContent || '';
    if (text) {
      // Try bracketed page tag
      const regex = new RegExp(`\\[(?:Page\\s*)?${pageNum}(?:\\s*-[^\\]]+)?\\]:?([\\s\\S]*?)(?=\\[(?:Page\\s*)?\\d+(?:\\s*-[^\\]]+)?\\]:?|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }

      // If unpaginated single document
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const wordsPerPage = 320;
        const start = (pageNum - 1) * wordsPerPage;
        const end = pageNum * wordsPerPage;
        const slice = words.slice(start, end).join(' ');
        if (slice.trim()) return slice.trim();
        return text;
      }
    }

    return '';
  }

  getResumeChunks() {
    if (!window.resumeManager || !window.resumeManager.data) return [];
    const r = window.resumeManager.data;
    let parts = [];

    parts.push(`Resume of ${r.name || 'Candidate'}. Professional Title: ${r.title || ''}.`);
    if (r.summary) parts.push(`Executive Summary: ${r.summary}`);

    if (r.experience && r.experience.length > 0) {
      parts.push('Professional Experience.');
      r.experience.forEach((exp, idx) => {
        let expText = `Role ${idx + 1}: ${exp.role || ''} at ${exp.company || ''}, ${exp.dates || ''}.`;
        if (exp.bullets && exp.bullets.length > 0) {
          expText += ' ' + exp.bullets.join('. ');
        }
        parts.push(expText);
      });
    }

    if (r.skills && r.skills.length > 0) {
      parts.push(`Core Competencies and Technical Skills: ${r.skills.join(', ')}.`);
    }

    if (r.education && r.education.length > 0) {
      parts.push('Education.');
      r.education.forEach(edu => {
        parts.push(`${edu.degree || ''} from ${edu.school || ''}, ${edu.dates || ''}.`);
      });
    }

    return this.chunkText(parts.join(' '), 1, 'Resume');
  }

  chunkText(text, pageNum = 1, label = '') {
    if (!text) return [];

    // Clean text: remove markdown tags, URLs, excessive punctuation, repeated underscores/dashes
    let cleaned = text
      .replace(/https?:\/\/\S+/gi, 'web link')
      .replace(/[\*\#\_\`\~\[\]\{\}\<\>]/g, ' ')
      .replace(/[-_]{3,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return [];

    // Split into sentences using natural boundary delimiters
    const rawSentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const chunks = [];

    rawSentences.forEach(s => {
      let sentence = s.trim();
      if (!sentence) return;

      // If a sentence is too long (> 200 chars), split at commas or clauses to prevent SpeechSynthesis freeze
      if (sentence.length > 200) {
        const subParts = sentence.split(/,\s+|;\s+/);
        let currentSub = '';
        subParts.forEach(sub => {
          if ((currentSub + ' ' + sub).length < 180) {
            currentSub = (currentSub ? currentSub + ', ' : '') + sub;
          } else {
            if (currentSub.trim()) chunks.push({ text: currentSub.trim(), pageNum, label });
            currentSub = sub;
          }
        });
        if (currentSub.trim()) chunks.push({ text: currentSub.trim(), pageNum, label });
      } else {
        chunks.push({ text: sentence, pageNum, label });
      }
    });

    return chunks;
  }

  playQueue(index) {
    if (!this.isPlaying) return;

    if (index >= this.queue.length) {
      this.stop();
      if (this.statusPill) {
        this.statusPill.textContent = 'Finished Reading';
        this.statusPill.classList.remove('playing');
      }
      return;
    }

    this.currentQueueIndex = index;
    const chunk = this.queue[index];

    // If reading a multi-page document and chunk belongs to another page, auto-advance viewer
    if (chunk.pageNum && window.pdfViewer && window.pdfViewer.currentPage !== chunk.pageNum) {
      window.pdfViewer.currentPage = chunk.pageNum;
      if (typeof window.pdfViewer.render === 'function') {
        window.pdfViewer.render();
      }
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = this.rate;
    utterance.pitch = 1.0;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.updateUI(chunk, index + 1, this.queue.length);
    };

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        this.playQueue(index + 1);
      }
    };

    utterance.onerror = (err) => {
      console.warn('[AudioReader] Utterance error:', err);
      if (this.isPlaying && !this.isPaused) {
        this.playQueue(index + 1);
      }
    };

    this.currentUtterance = utterance;
    this.startHeartbeat();
    this.synth.speak(utterance);
  }

  updateUI(chunk, current, total) {
    if (this.playBtn) this.playBtn.textContent = '⏸ Pause';
    if (this.statusPill) {
      const pageInfo = chunk.pageNum ? `Page ${chunk.pageNum}` : '';
      this.statusPill.textContent = `▶ Reading ${pageInfo ? pageInfo + ' • ' : ''}(${current}/${total}) ${this.rate}x`;
      this.statusPill.classList.add('playing');
    }
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPaused = true;
      if (this.playBtn) this.playBtn.textContent = '▶ Resume';
      if (this.statusPill) {
        this.statusPill.textContent = '⏸ Paused';
        this.statusPill.classList.remove('playing');
      }
      this.stopHeartbeat();
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      if (this.playBtn) this.playBtn.textContent = '⏸ Pause';
      if (this.statusPill) {
        this.statusPill.textContent = `▶ Reading (${this.rate}x)`;
        this.statusPill.classList.add('playing');
      }
      this.startHeartbeat();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopHeartbeat();
    this.resetState();
  }

  resetState() {
    this.isPlaying = false;
    this.isPaused = false;
    this.queue = [];
    this.currentQueueIndex = 0;
    this.currentUtterance = null;

    if (this.playBtn) this.playBtn.textContent = '▶ Read Aloud';
    if (this.stopBtn) this.stopBtn.style.display = 'none';
    if (this.statusPill) {
      this.statusPill.textContent = 'Audio Ready';
      this.statusPill.classList.remove('playing');
    }
  }

  // Chromium watchdog to prevent speech synthesis silent timeout (> 15 seconds)
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.synth && this.isPlaying && !this.isPaused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Public method for reading arbitrary text (e.g. Chat, Summary, or Resume)
  readText(customText, label = 'Speech') {
    if (!customText || !customText.trim()) return;
    const chunks = this.chunkText(customText, 1, label);
    if (!chunks.length) return;

    this.stop();
    this.queue = chunks;
    this.currentQueueIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;

    if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
    this.playQueue(0);
  }
}

window.audioReader = new AudioReader();
