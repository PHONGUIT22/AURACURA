/**
 * Speech Service: Executive voice feedback for CuraVIP Concierge via:
 * 1. AWS Polly Neural TTS (/api/tts) - High-fidelity executive voice (Matthew)
 * 2. Web Speech API (window.speechSynthesis) - Resilient browser fallback
 */

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_MCP_URL ||
  'http://localhost:3001';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private activeAbortController: AbortController | null = null;
  private playbackId: number = 0;
  private isSpeakingInternal: boolean = false;
  private audioContext: AudioContext | null = null;
  private pollyAnalyser: AnalyserNode | null = null;

  public getPollyAnalyser(): AnalyserNode | null {
    return this.isSpeakingInternal ? this.pollyAnalyser : null;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  public isSpeaking(): boolean {
    if (this.isSpeakingInternal) return true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  /**
   * Plays a discrete luxury executive chime (0ms) via Web Audio API.
   * Subtle champagne ping (660Hz -> 880Hz).
   */
  public playChime(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);

      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 250);
    } catch (err) {
      console.warn('[SpeechService] Executive chime failed:', err);
    }
  }

  public cancel(): void {
    this.playbackId++;

    if (this.activeAbortController) {
      try {
        this.activeAbortController.abort();
      } catch (_) {}
      this.activeAbortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch (_) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    this.isSpeakingInternal = false;
  }

  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.isSupported()) {
      options?.onEnd?.();
      return;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    this.cancel();

    const currentId = ++this.playbackId;
    this.isSpeakingInternal = true;

    // TIER 1: AWS Polly Neural TTS via backend
    try {
      this.activeAbortController = new AbortController();
      const timeoutId = setTimeout(() => {
        this.activeAbortController?.abort();
      }, 2500);

      const response = await fetch(`${API_BASE_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voiceId: options?.voiceId || 'Matthew',
        }),
        signal: this.activeAbortController.signal,
      });

      clearTimeout(timeoutId);

      if (currentId !== this.playbackId) return;

      if (response.ok) {
        const data = await response.json();

        if (currentId !== this.playbackId) return;

        if (data.success && data.audioBase64) {
          const audioUrl = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audioBase64}`;
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              if (!this.audioContext || this.audioContext.state === 'closed') {
                this.audioContext = new AudioCtx();
              }
              if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
              }
              if (!this.pollyAnalyser) {
                this.pollyAnalyser = this.audioContext.createAnalyser();
                this.pollyAnalyser.fftSize = 64;
                this.pollyAnalyser.smoothingTimeConstant = 0.75;
              }
              const source = this.audioContext.createMediaElementSource(audio);
              source.connect(this.pollyAnalyser);
              this.pollyAnalyser.connect(this.audioContext.destination);
            }
          } catch (audioCtxErr) {
            console.debug('[SpeechService] Web Audio pipeline note:', audioCtxErr);
          }

          audio.onended = () => {
            if (currentId === this.playbackId) {
              this.currentAudio = null;
              this.isSpeakingInternal = false;
              options?.onEnd?.();
            }
          };

          audio.onerror = () => {
            if (currentId === this.playbackId) {
              this.currentAudio = null;
              this.fallbackToSpeechSynthesis(cleanText, options, currentId);
            }
          };

          options?.onStart?.();
          await audio.play();
          return;
        }
      }
    } catch (err: unknown) {
      if (currentId !== this.playbackId) return;
    }

    // TIER 2: Fallback to Web Speech API
    if (currentId === this.playbackId) {
      this.fallbackToSpeechSynthesis(cleanText, options, currentId);
    }
  }

  private fallbackToSpeechSynthesis(
    text: string,
    options?: SpeechOptions,
    currentId?: number
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeakingInternal = false;
      options?.onEnd?.();
      return;
    }

    if (currentId !== undefined && currentId !== this.playbackId) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
      utterance.lang = options?.lang ?? 'en-US';

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        if (currentId === undefined || currentId === this.playbackId) {
          this.isSpeakingInternal = false;
          options?.onEnd?.();
        }
      };

      utterance.onerror = () => {
        if (currentId === undefined || currentId === this.playbackId) {
          this.isSpeakingInternal = false;
          options?.onEnd?.();
        }
      };

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Daniel') ||
            v.name.includes('George') ||
            v.name.includes('Natural') ||
            v.name.includes('Google US English'))
      );

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeakingInternal = false;
      options?.onEnd?.();
    }
  }
}

export const speechService = new SpeechService();
