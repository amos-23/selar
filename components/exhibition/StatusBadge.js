import { STATUS_LABELS } from "@/lib/exhibition/content";

// Internal status label. Only rendered in team preview, never for published items.
export default function StatusBadge({ status, preview }) {
  if (!preview || !status || status === "published") return null;
  return <span className={`status status-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
