import { ShoppingBag, Tag, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/database.types";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  order_update: { icon: ShoppingBag, color: "text-primary",    bg: "bg-primary/10" },
  promotion:    { icon: Tag,         color: "text-[#FFB300]",  bg: "bg-[#FFB300]/10" },
  system:       { icon: Bell,        color: "text-blue-500",   bg: "bg-blue-500/10" },
};

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  onClick?: () => void;
}

export function NotificationItem({
  type,
  title,
  body,
  readAt,
  createdAt,
  onClick,
}: NotificationItemProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;
  const isUnread = !readAt;

  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1)  return "Agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffH < 24)   return `${diffH}h atrás`;
    if (diffD < 7)    return `${diffD}d atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-muted/60 focus-visible:bg-muted/60",
        isUnread && "bg-primary/5"
      )}
    >
      {/* Ícone */}
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            )}
          >
            {title}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatTime(createdAt)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{body}</p>
      </div>

      {/* Indicador não lido + chevron */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 self-center">
        {isUnread && (
          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
    </button>
  );
}

export function NotificationPanel({
  children,
  hasUnread = false,
  onMarkAllRead,
}: {
  children: React.ReactNode;
  hasUnread?: boolean;
  onMarkAllRead?: () => void;
}) {
  return (
    <div className="w-80 overflow-hidden rounded-2xl border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-bold">Notificações</h3>
        {hasUnread && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-primary hover:underline"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>
      <div className="divide-y max-h-96 overflow-y-auto">{children}</div>
    </div>
  );
}
