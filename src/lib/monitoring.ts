type MonitoringContext = Record<string, unknown>;

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

/** Registra erros no servidor. Integração Sentry opcional via SENTRY_DSN. */
export function captureException(error: unknown, context?: MonitoringContext): void {
  const payload = { ...serializeError(error), context, ts: new Date().toISOString() };
  console.error("[nenos-monitoring]", payload);

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  void reportToSentry(dsn, {
    level: "error",
    message: payload.message,
    extra: context,
  });
}

export function captureMessage(message: string, context?: MonitoringContext): void {
  console.info("[nenos-monitoring]", message, context ?? "");

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  void reportToSentry(dsn, {
    level: "info",
    message,
    extra: context,
  });
}

async function reportToSentry(
  dsn: string,
  event: { level: string; message: string; extra?: MonitoringContext }
): Promise<void> {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace("/", "");
    const host = url.host;
    const key = url.username;
    const endpoint = `https://${host}/api/${projectId}/store/`;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        level: event.level,
        message: { formatted: event.message },
        extra: event.extra,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      }),
    });
  } catch {
    // Falha silenciosa — monitoramento não deve quebrar o fluxo principal
  }
}
