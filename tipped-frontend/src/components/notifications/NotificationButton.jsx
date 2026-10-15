import { Button } from "../common/UI";
export default function NotificationButton({ unread = 0, onClick }) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <span>Notifications</span>
      {unread > 0 && (
        <span className="rounded bg-burgundy px-1.5 text-xs text-white">
          {unread}
        </span>
      )}
    </Button>
  );
}
