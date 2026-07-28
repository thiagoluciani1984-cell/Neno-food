"use client";

/**
 * Ponte com a impressora térmica via Web Serial API (Chrome/Edge only).
 * O navegador guarda a permissão de porta concedida por origem — depois do
 * primeiro "Conectar impressora" (exige clique do usuário), as próximas
 * impressões acontecem sozinhas via getPorts(), sem novo prompt.
 */

let cachedPort: SerialPort | null = null;
let openPromise: Promise<void> | null = null;
// Serializa impressões: dois pedidos chegando quase juntos não podem tentar
// abrir a porta ou pegar o writer ao mesmo tempo (Web Serial não permite).
let printQueue: Promise<unknown> = Promise.resolve();

const BAUD_RATE_KEY = "nenos:printer-baud-rate";
const DEFAULT_BAUD_RATE = 9600;
export const COMMON_BAUD_RATES = [9600, 19200, 38400, 57600, 115200] as const;

export function getBaudRate(): number {
  if (typeof window === "undefined") return DEFAULT_BAUD_RATE;
  try {
    const stored = Number(window.localStorage.getItem(BAUD_RATE_KEY));
    return stored > 0 ? stored : DEFAULT_BAUD_RATE;
  } catch {
    return DEFAULT_BAUD_RATE;
  }
}

/** Muda a velocidade e fecha a porta aberta (se houver) pra reabrir com o novo valor no próximo print. */
export async function setBaudRate(rate: number): Promise<void> {
  try {
    window.localStorage.setItem(BAUD_RATE_KEY, String(rate));
  } catch {
    // storage bloqueado — a escolha só não persiste entre sessões
  }
  if (cachedPort && (cachedPort.readable || cachedPort.writable)) {
    try {
      await cachedPort.close();
    } catch {
      // ignora — porta pode já estar num estado inconsistente
    }
  }
  openPromise = null;
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.serial;
}

/** Deve ser chamado a partir de um clique do usuário (gesto exigido pelo navegador). */
export async function requestPrinterPort(): Promise<boolean> {
  if (!isWebSerialSupported() || !navigator.serial) return false;
  try {
    const port = await navigator.serial.requestPort();
    cachedPort = port;
    return true;
  } catch {
    return false; // usuário cancelou o seletor de dispositivo
  }
}

/** Reconecta silenciosamente numa porta já autorizada antes, sem pedir permissão de novo. */
export async function getSavedPrinterPort(): Promise<SerialPort | null> {
  if (!isWebSerialSupported() || !navigator.serial) return null;
  if (cachedPort) return cachedPort;
  const ports = await navigator.serial.getPorts();
  cachedPort = ports[0] ?? null;
  return cachedPort;
}

export async function hasPairedPrinter(): Promise<boolean> {
  return (await getSavedPrinterPort()) !== null;
}

export async function printBytes(bytes: Uint8Array): Promise<{ ok: true } | { ok: false; error: string }> {
  // Encadeia no fim da fila atual, garantindo que só uma impressão mexe na
  // porta serial por vez (evita "port already open" / writer já travado).
  const result = printQueue.then(() => printBytesInternal(bytes));
  printQueue = result.catch(() => {});
  return result;
}

async function printBytesInternal(
  bytes: Uint8Array
): Promise<{ ok: true } | { ok: false; error: string }> {
  const port = await getSavedPrinterPort();
  if (!port) return { ok: false, error: "Nenhuma impressora conectada." };

  try {
    if (!port.readable && !port.writable) {
      if (!openPromise) openPromise = port.open({ baudRate: getBaudRate() });
      await openPromise;
    }
    const writer = port.writable?.getWriter();
    if (!writer) return { ok: false, error: "Porta da impressora não permite escrita." };
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao imprimir." };
  }
}
