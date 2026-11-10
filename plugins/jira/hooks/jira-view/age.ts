/**
 * How long ago an ISO timestamp was, in the pane's coarse units: minutes
 * under an hour, hours under a day, days under a week, then weeks. An
 * absent timestamp is `never`; one in the future or unreadable is `0m`.
 */
export function age(iso: string | undefined, now: number): string {
  if (iso === undefined) return 'never';
  const ms = now - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return '0m';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
