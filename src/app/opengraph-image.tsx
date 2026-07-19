import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Nenos Food — peça já de Luciani's Di Qualità ou Point da Pizza";

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), "public/brand/logo.png"));
  const logoSrc = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={168}
          height={168}
          style={{
            borderRadius: 36,
            background: "#FFFFFF",
            padding: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          }}
        />
        <div
          style={{
            marginTop: 36,
            fontSize: 72,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: -1,
          }}
        >
          Nenos Food
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            fontWeight: 600,
            color: "#FFF7ED",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span>Luciani&apos;s Di Qualità</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>Point da Pizza</span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "#FFEDD5",
            opacity: 0.9,
          }}
        >
          Peça já pelo app — rápido, fácil e delicioso!
        </div>
      </div>
    ),
    { ...size }
  );
}
