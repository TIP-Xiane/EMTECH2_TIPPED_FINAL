import ConfirmDialog from "../common/ConfirmDialog";
import { Button, EmptyState } from "../common/UI";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { timeLabel } from "../../utils/format";
import { useState } from "react";
export default function NotificationsDialog({ onClose, onOpen }) {
  const { notifications, markRead } = useNotifications(),
    { actor } = useAuth(),
    isOSA = actor?.role === "osa",
    [error, setError] = useState("");
  return (
    <ConfirmDialog
      title={isOSA ? "Work alerts" : "Notifications"}
      onClose={onClose}
      className="notifications-dialog"
    >
      {notifications.length ? (
        <>
          <p className="mb-4 text-sm leading-6 text-muted">
            {isOSA
              ? "New reports and ownership claims appear here. Open the relevant queue to review and take action."
              : "Updates about your report, item receipt, and ownership claims appear here."}
          </p>
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${n.read ? "is-read" : "is-unread"}`}
              >
                <div className="notification-copy">
                  <span
                    className="notification-state"
                    aria-label={n.read ? "Read" : "Unread"}
                    title={n.read ? "Read" : "Unread"}
                  >
                    {n.read ? "✓" : "●"}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words leading-6">{n.message}</p>
                    <p className="mt-2 text-xs text-muted">{timeLabel(n.at)}</p>
                  </div>
                </div>
                {n.reportId && (
                  <Button
                    variant="secondary"
                    className="notification-open-report"
                    onClick={() => onOpen(n)}
                  >
                    {isOSA
                      ? n.type === "claim_review" ||
                        n.message.startsWith("Ownership claim")
                        ? "Open claims queue →"
                        : "Open report queue →"
                      : "View report →"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await markRead();
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
          {isOSA
            ? "New reports and claims that need attention will appear here."
            : "Report decisions and claim updates will appear here."}
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
