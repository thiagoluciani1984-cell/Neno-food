"use client";

/**
 * Ponte com a impressora térmica via Web Serial API (Chrome/Edge only).
 * O navegador guarda a permissão de porta concedida por origem — depois do
 * primeiro "Conectar impressora" (exige clique do usuário), as próximas
 * impressões acontecem sozinhas via getPorts(), sem novo prompt.
 */

let cachedPort: SerialPort | null = null;

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
  const port = await getSavedPrinterPort();
  if (!port) return { ok: false, error: "Nenhuma impressora conectada." };

  try {
    if (!port.readable && !port.writable) {
      await port.open({ baudRate: 9600 });
    }
    const writer = port.writable?.getWriter();
    if (!writer) return { ok: false, error: "Porta da impressora não permite escrita." };
    await writer.write(bytes);
    writer.releaseLock();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao imprimir." };
  }
}
