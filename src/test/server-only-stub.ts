// Stub for the "server-only" package, used only by Vitest (see vitest.config.ts).
// Next's webpack/turbopack build resolves the real package's poison-pill
// "browser" field; Vite's resolver doesn't, so tests alias it to this no-op.
export {};
