export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any current speaking to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Adjust pitch/rate if desired, but defaults are usually fine
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Text-to-Speech not supported.");
  }
};

const playTone = (frequency: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle', duration: number, startTime: number, ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Envelope for a softer sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
};

interface IWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
}

export const playStartSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as IWindow).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // "Cute" ascending chime
        playTone(440, 'sine', 0.2, now, ctx);
        playTone(660, 'sine', 0.2, now + 0.1, ctx);
        playTone(880, 'sine', 0.4, now + 0.2, ctx);

        // Clean up context after sound finishes
        setTimeout(() => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
        }, 1000);
    } catch (e) {
        console.error("Error playing start sound:", e);
    }
};

export const playStopSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as IWindow).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Descending "close" sound
        playTone(600, 'sine', 0.2, now, ctx);
        playTone(400, 'sine', 0.3, now + 0.1, ctx);

        // Clean up context after sound finishes
        setTimeout(() => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
        }, 1000);
    } catch (e) {
        console.error("Error playing stop sound:", e);
    }
};
