/**
 * Gera os comandos ESC/POS de um cupom (porta 1:1 de src/lib/printer/escpos.ts
 * pra rodar em Node puro, sem depender do build do Next.js).
 */
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const ALIGN = { left: 0, center: 1, right: 2 };

function stripAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

class ReceiptBuilder {
  constructor() {
    this.chunks = [];
  }

  init() {
    this.chunks.push(ESC, 0x40);
    return this;
  }

  align(mode) {
    this.chunks.push(ESC, 0x61, ALIGN[mode]);
    return this;
  }

  bold(on) {
    this.chunks.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  doubleSize(on) {
    this.chunks.push(GS, 0x21, on ? 0x11 : 0x00);
    return this;
  }

  text(line) {
    const bytes = stripAccents(String(line))
      .split("")
      .map((c) => c.charCodeAt(0) & 0xff);
    this.chunks.push(...bytes, LF);
    return this;
  }

  divider() {
    return this.text("-".repeat(32));
  }

  row(left, right, width = 32) {
    const cleanLeft = stripAccents(left);
    const cleanRight = stripAccents(right);
    const space = Math.max(1, width - cleanLeft.length - cleanRight.length);
    return this.text(cleanLeft + " ".repeat(space) + cleanRight);
  }

  feed(lines = 1) {
    for (let i = 0; i < lines; i++) this.chunks.push(LF);
    return this;
  }

  cut() {
    this.feed(3);
    this.chunks.push(GS, 0x56, 0x01);
    return this;
  }

  build() {
    return Buffer.from(this.chunks);
  }
}

module.exports = { ReceiptBuilder };
