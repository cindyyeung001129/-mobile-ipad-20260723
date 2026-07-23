// Web Audio API helper for SEN-friendly audio cues and calming sounds.
// Synthesizes soothing tones and interactive feedback fully client-side.

let audioCtx: AudioContext | null = null;
let ambientOscillator: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playClickSound(freq: number = 440, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Warm, rapid decay for a gentle click
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.warn('Audio feedback failed or not supported:', error);
  }
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play a lovely major-triad chime (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.6);
    });
  } catch (e) {
    console.warn(e);
  }
}

// Starts a low-frequency relaxing drone (binaural beat feel)
export function startCalmingDrone() {
  try {
    const ctx = getAudioContext();
    if (ambientOscillator) return; // Already running

    ambientOscillator = ctx.createOscillator();
    ambientGain = ctx.createGain();

    // Earth resonance frequency ~136.1 Hz (Om frequency)
    ambientOscillator.frequency.setValueAtTime(136.1, ctx.currentTime);
    ambientOscillator.type = 'sine';

    // Soft volume
    ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.0); // Gentle fade-in

    // Add a subtle low-frequency LFO to simulate breathing waves
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 0.2 Hz = 5 seconds per cycle
    lfoGain.gain.setValueAtTime(0.02, ctx.currentTime); // amplitude

    lfo.connect(lfoGain);
    lfoGain.connect(ambientGain.gain); // modulates master gain!

    ambientOscillator.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    lfo.start();
    ambientOscillator.start();
  } catch (error) {
    console.warn('Calming drone failed to start:', error);
  }
}

export function stopCalmingDrone() {
  try {
    if (ambientGain && audioCtx) {
      const now = audioCtx.currentTime;
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
      ambientGain.gain.linearRampToValueAtTime(0, now + 1.0); // Smooth fade-out
      setTimeout(() => {
        if (ambientOscillator) {
          ambientOscillator.stop();
          ambientOscillator.disconnect();
          ambientOscillator = null;
        }
        if (ambientGain) {
          ambientGain.disconnect();
          ambientGain = null;
        }
      }, 1000);
    }
  } catch (error) {
    console.warn('Calming drone failed to stop:', error);
  }
}

// Browser Text-To-Speech (TTS) helper optimized for Cantonese (廣東話/粵語 zh-HK) and primary school SEN accessibility
export function speakText(text: string, options?: { lang?: string; rate?: number; pitch?: number }) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech

      const utterance = new SpeechSynthesisUtterance(text);

      // Explicitly set language to Cantonese (zh-HK)
      const targetLang = options?.lang || 'zh-HK';
      utterance.lang = targetLang;

      // Gentle, clear rate (0.85) tailored for primary school students (小學生)
      utterance.rate = options?.rate || 0.85;
      utterance.pitch = options?.pitch || 1.05;

      const pickCantoneseVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // 1. Precise match for Cantonese HK / Yue
        let voice = voices.find(v => 
          /zh-HK|yue-HK|zh-yue/i.test(v.lang) || 
          /cantonese|yue|hong kong|zh-hk|粵語|粤语|香港/i.test(v.name)
        );

        // 2. Fallback to any Traditional Chinese / zh voice if no exact Cantonese voice tag
        if (!voice) {
          voice = voices.find(v => /zh-TW|zh/i.test(v.lang) || /chinese|taiwan/i.test(v.name));
        }

        return voice;
      };

      const matchedVoice = pickCantoneseVoice();
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      // Handle async voice loading in browsers like Chrome
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const asyncVoice = pickCantoneseVoice();
          if (asyncVoice) {
            utterance.voice = asyncVoice;
          }
        };
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.warn('TTS Speech synthesis failed:', error);
  }
}

export function stopSpeaking() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {}
}
