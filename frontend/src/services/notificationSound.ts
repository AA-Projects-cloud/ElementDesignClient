/** A short two-tone chime for live notifications while the app is open. */
let ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  const AC: typeof AudioContext | undefined =
    typeof window !== 'undefined' ? window.AudioContext || (window as any).webkitAudioContext : undefined;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
};

/** Browsers only allow sound after a tap: unlock it on the first touch / click. */
export const unlockNotificationSound = () => {
  const unlock = () => {
    const c = getContext();
    if (c && c.state === 'suspended') void c.resume();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
};

export const playNotificationSound = () => {
  try {
    const c = getContext();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    const now = c.currentTime;
    [
      [880, 0],
      [1318.5, 0.16],
    ].forEach(([freq, offset]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.4);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.45);
    });
  } catch {
    /* sound is a nice-to-have, never block the app */
  }
};
