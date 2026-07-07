"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NotificationItem,
  NotificationPanel,
} from "@/components/shared/notification-item";
import { createClient } from "@/infra/supabase/client";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import type { Notification } from "@/types/database.types";

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [open, setOpen] = useState(false);

  const refreshUnread = useCallback((items: Notification[]) => {
    setUnreadCount(items.filter((n) => !n.read_at).length);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const next = payload.new as Notification;
            setNotifications((prev) => {
              const updated = [next, ...prev].slice(0, 20);
              refreshUnread(updated);
              return updated;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [refreshUnread]);

  async function handleClick(notification: Notification) {
    if (!notification.read_at) {
      await markNotificationReadAction(notification.id);
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notification.id
            ? { ...n, read_at: new Date().toISOString() }
            : n
        );
        refreshUnread(updated);
        return updated;
      });
    }

    const orderId = (notification.payload as { order_id?: string })?.order_id;
    if (orderId) {
      setOpen(false);
      router.push(`/order/${orderId}`);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction();
    const now = new Date().toISOString();
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read_at: n.read_at ?? now }));
      refreshUnread(updated);
      return updated;
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground hover:bg-primary/5 hover:text-primary"
          aria-label="Notificacoes"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-0 bg-transparent p-0 shadow-none">
        <NotificationPanel
          hasUnread={unreadCount > 0}
          onMarkAllRead={handleMarkAllRead}
        >
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </p>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={n.type}
                title={n.title}
                body={n.body ?? ""}
                readAt={n.read_at}
                createdAt={n.created_at}
                onClick={() => handleClick(n)}
              />
            ))
          )}
        </NotificationPanel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
