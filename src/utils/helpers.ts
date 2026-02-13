import type { DocumentData } from "firebase/firestore";
import type { AppUser } from "../types";
export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const getRecipeCost = (_category?: string): number => {
  return 0; // Legacy cost removed
};

export const normalizeUser = (u: DocumentData & { id: string }): AppUser => {
  const commissionPct =
    typeof u.commissionPct === "number"
      ? clamp(u.commissionPct, 0, 100)
      : u.commissionPct != null
        ? clamp(parseFloat(u.commissionPct) || 0, 0, 100)
        : u.role === "owner"
          ? 0
          : 35;

  return {
    ...u, // Include everything else from Firestore (phoneNumber, birthDate, etc.)
    id: u.id,
    name: u.name ?? "Sin nombre",
    pin: String(u.pin ?? ""),
    role: u.role ?? "staff",
    color: u.color ?? "from-teal-500 to-emerald-600",
    ow: u.ow ?? "",
    icon: u.icon ?? "user",
    commissionPct,
    active: u.active !== false,
  } as AppUser;
};

export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
): boolean => {
  if (!data || data.length === 0) {
    return false;
  }
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(",")).join("\n");
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return true;
};
