/**
 * Gera os comandos ESC/POS de um cupom, sem depender de nenhuma lib externa.
 * Testado para a família Epson TM-T20/TM-T88 (compatível com a maioria das
 * térmicas ESC/POS do mercado, incluindo Elgin/Bematech).
 *
 * Acentos: removidos antes de imprimir. Impressoras térmicas variam na
 * codepage padrão de fábrica (CP437/CP860/CP1252) e configurar isso por
 * modelo está fora do escopo — texto sem acento imprime igual em qualquer uma.
 */
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const ALIGN = { left: 0, center: 1, right: 2 } as const;

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export class ReceiptBuilder {
  private chunks: number[] = [];

  init(): this {
    this.chunks.push(ESC, 0x40);
    return this;
  }

  align(mode: keyof typeof ALIGN): this {
    this.chunks.push(ESC, 0x61, ALIGN[mode]);
    return this;
  }

  bold(on: boolean): this {
    this.chunks.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  doubleSize(on: boolean): this {
    this.chunks.push(GS, 0x21, on ? 0x11 : 0x00);
    return this;
  }

  text(line: string): this {
    const bytes = stripAccents(line)
      .split("")
      .map((c) => c.charCodeAt(0) & 0xff);
    this.chunks.push(...bytes, LF);
    return this;
  }

  /** Linha tracejada do tamanho padrão de bobina 58/80mm (32 colunas). */
  divider(): this {
    return this.text("-".repeat(32));
  }

  /** Coluna esquerda + direita alinhadas numa linha de 32 caracteres. */
  row(left: string, right: string, width = 32): this {
    const cleanLeft = stripAccents(left);
    const cleanRight = stripAccents(right);
    const space = Math.max(1, width - cleanLeft.length - cleanRight.length);
    return this.text(cleanLeft + " ".repeat(space) + cleanRight);
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) this.chunks.push(LF);
    return this;
  }

  cut(): this {
    this.feed(3);
    this.chunks.push(GS, 0x56, 0x01);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.chunks);
  }
}
