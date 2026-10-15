import { createContext, useContext } from "react";
import { useReports } from "./ReportContext";
import { useAuth } from "./AuthContext";
const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth(),
    { notifications, act } = useReports();
  const mine = notifications.filter((n) => n.recipientId === user?.id);
  return (
    <NotificationContext.Provider
      value={{
        notifications: mine,
        unread: mine.filter((n) => !n.read).length,
        markRead: () => act("READ_NOTIFICATIONS"),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
export const useNotifications = () => useContext(NotificationContext);
