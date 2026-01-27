import React from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { Toast } from "../../types";

interface NotificationToastProps {
  notification: Toast | null;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
}) => {
  if (!notification) return null;

  const bg =
    notification.type === "success"
      ? "bg-green-500"
      : notification.type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  const Icon =
    notification.type === "success"
      ? CheckCircle
      : notification.type === "error"
      ? XCircle
      : AlertTriangle;

  return (
    <div
      className={`fixed top-4 right-4 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce`}
    >
      <Icon size={24} />
      <span className="font-semibold">{notification.message}</span>
    </div>
  );
};

export default NotificationToast;
