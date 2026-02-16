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
      ? "bg-surface border-green-500/50 text-green-500"
      : notification.type === "error"
      ? "bg-surface border-red-500/50 text-red-500"
      : "bg-surface border-blue-500/50 text-blue-500";
      
  const Icon =
    notification.type === "success"
      ? CheckCircle
      : notification.type === "error"
      ? XCircle
      : AlertTriangle;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${bg} max-w-sm w-auto animate-in slide-in-from-right-10 fade-in duration-300`}
    >
      <Icon size={20} strokeWidth={2.5} />
      <span className="font-bold text-sm text-text-main">{notification.message}</span>
    </div>
  );
};

export default NotificationToast;
