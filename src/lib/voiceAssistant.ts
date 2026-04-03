import type { PriorityAlert } from './aiEngineService';

let lastSpokenAt = 0;

export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speakPriority(alerts: PriorityAlert[], cooldownMs = 4000) {
  const now = Date.now();
  const highPriority = alerts.find((alert) => alert.level === 'high') ?? alerts[0];

  if (!highPriority || now - lastSpokenAt <= cooldownMs) {
    return false;
  }

  const spoken = speak(highPriority.text);
  if (spoken) {
    lastSpokenAt = now;
  }
  return spoken;
}
