/**
 * Gera ícones PWA (192 e 512) a partir de public/brand/logo.png
 * Uso: node scripts/generate-pwa-icons.js
 */
const fs = require("fs");
const path = require("path");

const input = path.join(__dirname, "..", "public", "brand", "logo.png");
const outDir = path.join(__dirname, "..", "public", "icons");

async function main() {
  if (!fs.existsSync(input)) {
    console.error("Logo não encontrado:", input);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Instale sharp: npm install --save-dev sharp");
    process.exit(1);
  }

  const sizes = [192, 512];
  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}.png`);
    await sharp(input)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 249, b: 242, alpha: 1 },
      })
      .png()
      .toFile(out);
    console.log("✓", out);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
