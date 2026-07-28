"use client";

import { usePathname } from "next/navigation";
import { Logo } from "./logo";

/** Logo mobile compartilhada pelas páginas de auth — some no login, que já tem a própria marca no card. */
export function MobileAuthLogo() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Logo />;
}
