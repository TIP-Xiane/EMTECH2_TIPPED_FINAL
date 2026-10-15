import ConfirmDialog from "../common/ConfirmDialog";
import { Button, EmptyState } from "../common/UI";
import { useNotifications } from "../../context/NotificationContext";
import { timeLabel } from "../../utils/format";
import { useState } from "react";
export default function NotificationsDialog({ onClose, onOpen }) {
  const { notifications, markRead } = useNotifications(),
    [error, setError] = useState("");
  return (
    <ConfirmDialog title="Notifications" onClose={onClose}>
      {notifications.length ? (
        <>
          <ul className="divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id} className="py-4">
                <p className="break-words leading-6">
                  {!n.read && (
                    <strong className="text-burgundy">Unread · </strong>
                  )}
                  {n.message}
                </p>
                <p className="mt-2 text-xs text-muted">{timeLabel(n.at)}</p>
                {n.reportId && (
                  <Button variant="text" onClick={() => onOpen(n.reportId)}>
                    Open report →
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                markRead();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Mark all as read
          </Button>
        </>
      ) : (
        <EmptyState title="No notifications yet">
          Submissions and OSA decisions will appear here.
        </EmptyState>
      )}
      {error && (
        <p role="alert" className="text-rose-800">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
