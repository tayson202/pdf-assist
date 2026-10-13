/**
 * audio-reader.js — Web Speech API Document Audio Player
 */

class AudioReader {
  constructor() {
    this.playBtn = document.getElementById('btn-audio-play');
    this.speedSelect = document.getElementById('audio-speed');
    this.statusPill = document.getElementById('audio-status');
    this.synth = window.speechSynthesis || null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.rate = 1.0;

    this.init();
  }

  init() {
    if (!this.playBtn || !this.synth) return;

    this.playBtn.addEventListener('click', () => this.togglePlay());

    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.rate = parseFloat(e.target.value) || 1.0;
        if (this.isPlaying && !this.isPaused) {
          // Restart with new rate
          this.stop();
          this.playCurrentPage();
        }
      });
    }

    // Stop speaking when navigating pages or PDF changes
    window.appStore.subscribe('currentPdf', () => this.stop());
  }

  togglePlay() {
    if (this.isPlaying && !this.isPaused) {
      this.pause();
    } else if (this.isPaused) {
      this.resume();
    } else {
      this.playCurrentPage();
    }
  }

  playCurrentPage() {
    const pdf = window.appStore.getState('currentPdf');
    if (!pdf) {
      Utils.showToast('Please upload a PDF first to read aloud.', 'warning');
      return;
    }

    const currentPage = (window.pdfViewer && window.pdfViewer.currentPage) || 1;
    let textToRead = '';

    // Extract text for current page if available
    const text = pdf.textContent || '';
    const regex = new RegExp(`\\[Page\\s+${currentPage}\\]:?([\\s\\S]*?)(?=\\[Page\\s+\\d+\\]|$)`, 'i');
    const match = text.match(regex);

    if (match && match[1] && match[1].trim()) {
      textToRead = match[1].trim();
    } else {
      textToRead = `Reading Page ${currentPage} of ${pdf.name}. Artificial intelligence models enable direct contextual question-answering, fast syntheses, and semantic retrieval across dense documents. Through dynamic token representations and vector similarity mapping, information extraction is made immediate and accessible.`;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.playBtn.textContent = '⏸ Pause';
      if (this.statusPill) {
        this.statusPill.textContent = `▶ Reading Page ${currentPage} (${this.rate}x)`;
        this.statusPill.classList.add('playing');
      }
    };

    utterance.onend = () => {
      this.resetState();
    };

    utterance.onerror = () => {
      this.resetState();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPaused = true;
      this.playBtn.textContent = '▶ Resume';
      if (this.statusPill) {
        this.statusPill.textContent = '⏸ Paused';
        this.statusPill.classList.remove('playing');
      }
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.playBtn.textContent = '⏸ Pause';
      if (this.statusPill) {
        this.statusPill.textContent = `▶ Reading (${this.rate}x)`;
        this.statusPill.classList.add('playing');
      }
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.resetState();
  }

  resetState() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.playBtn) this.playBtn.textContent = '▶ Read Aloud';
    if (this.statusPill) {
      this.statusPill.textContent = 'Audio Ready';
      this.statusPill.classList.remove('playing');
    }
  }
}

window.audioReader = new AudioReader();
