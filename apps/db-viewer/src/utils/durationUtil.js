/**
 * Calculate duration between two times (HH:MM format). Matches report-template.js logic.
 * @param {string} startTime - e.g. "18:00"
 * @param {string} endTime - e.g. "23:30"
 * @returns {string} "H:MM" or "-"
 */
export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime || startTime === '-' || endTime === '-') return '–';
  try {
    const parseTime = (timeStr) => {
      const parts = String(timeStr).trim().split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || 0, 10);
      return hours * 60 + minutes;
    };
    const start = parseTime(startTime);
    let end = parseTime(endTime);
    if (end < start) end += 24 * 60;
    const durationMinutes = end - start;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return '–';
  }
}
