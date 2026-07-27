"use client";

import { useEffect, useState } from "react";
import { Printer, PrinterCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  isWebSerialSupported,
  requestPrinterPort,
  hasPairedPrinter,
  printBytes,
} from "@/lib/printer/serial-printer";
import { ReceiptBuilder } from "@/lib/printer/escpos";

export function PrinterConnectButton() {
  const [supported] = useState(() => isWebSerialSupported());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    void hasPairedPrinter().then(setConnected);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    const ok = await requestPrinterPort();
    setConnecting(false);
    setConnected(ok);
    if (ok) {
      toast.success("Impressora conectada! Os pedidos novos vão imprimir sozinhos.");
    } else {
      toast.error("Não conectou. Selecione a impressora na lista do navegador.");
    }
  }

  async function handleTestPrint() {
    const receipt = new ReceiptBuilder()
      .init()
      .align("center")
      .bold(true)
      .text("Teste de impressão")
      .bold(false)
      .text("Nenos Food")
      .cut()
      .build();
    const res = await printBytes(receipt);
    if (!res.ok) toast.error(res.error);
    else toast.success("Enviado para a impressora!");
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        Impressão automática exige Chrome ou Edge (Web Serial não suportado neste navegador).
      </p>
    );
  }

  if (connected) {
    return (
      <Button variant="outline" size="sm" onClick={handleTestPrint}>
        <PrinterCheck className="mr-2 h-4 w-4 text-green-600" />
        Impressora conectada — testar
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleConnect} disabled={connecting}>
      {connecting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      Conectar impressora
    </Button>
  );
}
