/**
 * Date helpers. The API uses ISO dates ("2023-06-01") for the profile and
 * "2023-06" for resumes; month pickers use "2023-06". We work with the
 * strings directly to avoid timezone shifts.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2023-06-01" -> "2023-06" (for <input type="month">) */
export function toMonthInput(isoDate) {
  return isoDate ? isoDate.slice(0, 7) : '';
}

/** "2023-06" -> "2023-06-01" (for the API) */
export function fromMonthInput(monthValue) {
  return monthValue ? `${monthValue}-01` : null;
}

/** "2023-06-01" or "2023-06" -> "Jun 2023" */
export function formatMonth(dateString) {
  if (!dateString) return '';
  const [year, month] = dateString.split('-');
  if (!month) return year;
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** Start/end -> "Jun 2023 – Present" */
export function formatRange(start, end, isCurrent) {
  const from = formatMonth(start);
  const to = isCurrent ? 'Present' : formatMonth(end);
  if (!from) return to;
  return to ? `${from} – ${to}` : from;
}

/** "Good morning" / "Good afternoon" / "Good evening" */
export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** ISO timestamp -> "just now", "5 min ago", "3 h ago", "2 days ago", or "12 Mar 2026" */
export function formatRelativeTime(isoTimestamp, now = new Date()) {
  if (!isoTimestamp) return '';
  const date = new Date(isoTimestamp);
  const seconds = Math.round((now - date) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
