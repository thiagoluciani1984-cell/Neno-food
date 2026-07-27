const STORAGE_KEY = "nenos:sound-enabled";

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeSoundEnabled(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, gain = 0.16) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Toca um áudio pré-gravado (ElevenLabs) de public/sounds/. Usado junto do bipe para chamar mais atenção no balcão. */
export function playVoiceAlert(fileName: string): void {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;
  try {
    const audio = new Audio(`/sounds/${fileName}`);
    audio.volume = 1;
    void audio.play().catch(() => {
      // autoplay bloqueado pelo navegador até haver interação do usuário — ignora
    });
  } catch {
    // ignora
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "1";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  listeners.forEach((listener) => listener());
}

/** Novo pedido no painel do restaurante (KDS): tons altos e insistentes + aviso falado. */
export function playNewOrderChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    void ctx.resume();
    const now = ctx.currentTime;
    tone(ctx, 880, now, 0.18, 0.9);
    tone(ctx, 1175, now + 0.2, 0.28, 0.95);
    tone(ctx, 880, now + 0.55, 0.18, 0.9);
    tone(ctx, 1175, now + 0.75, 0.32, 0.95);
  } catch {
    // autoplay bloqueado pelo navegador ou API indisponível — ignora
  }
  window.setTimeout(() => playVoiceAlert("novo-pedido.mp3"), 900);
}

/** Pedido cancelado enquanto o restaurante pode estar preparando: alerta urgente + aviso falado. */
export function playOrderCancelledAlert(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    void ctx.resume();
    const now = ctx.currentTime;
    tone(ctx, 660, now, 0.15, 0.9);
    tone(ctx, 440, now + 0.2, 0.25, 0.95);
    tone(ctx, 660, now + 0.55, 0.15, 0.9);
    tone(ctx, 440, now + 0.75, 0.3, 0.95);
  } catch {
    // autoplay bloqueado pelo navegador ou API indisponível — ignora
  }
  window.setTimeout(() => playVoiceAlert("pedido-cancelado.mp3"), 900);
}

/** Nova corrida disponível para o entregador: três beeps curtos e mais urgentes. */
export function playDeliveryAlert(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    void ctx.resume();
    const now = ctx.currentTime;
    tone(ctx, 1046, now, 0.11, 0.18);
    tone(ctx, 1046, now + 0.16, 0.11, 0.18);
    tone(ctx, 1318, now + 0.32, 0.2, 0.2);
  } catch {
    // autoplay bloqueado pelo navegador ou API indisponível — ignora
  }
}
