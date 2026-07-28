import { getSession } from "@/features/auth/get-session";
import {
  getMyNotifications,
  getUnreadNotificationCount,
} from "@/features/notifications/queries";
import { StoreHeader } from "./store-header";

export async function StoreHeaderShell() {
  const { user } = await getSession();

  if (!user) {
    return <StoreHeader isLoggedIn={false} />;
  }

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <StoreHeader
      isLoggedIn
      showNotifications
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
