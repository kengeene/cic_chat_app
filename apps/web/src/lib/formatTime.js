const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const shortDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const longDateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const startOfDay = (date) => new Date(date).setHours(0, 0, 0, 0);

const calendarDaysAgo = (date) => Math.round((startOfDay(Date.now()) - startOfDay(date)) / MS_PER_DAY);

export const isSameDay = (a, b) => startOfDay(a) === startOfDay(b);

export const formatTime = (date) => timeFormat.format(new Date(date));

export const formatListTimestamp = (date) =>
  calendarDaysAgo(date) === 0 ? formatTime(date) : shortDateFormat.format(new Date(date));

export const formatDayLabel = (date) => {
  const daysAgo = calendarDaysAgo(date);
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return longDateFormat.format(new Date(date));
};

export const formatLastSeen = (date) => {
  if (!date) return 'Offline';
  const minutesAgo = Math.round((Date.now() - new Date(date)) / MS_PER_MINUTE);
  if (minutesAgo < 1) return 'Last seen just now';
  if (minutesAgo < 60) return `Last seen ${relativeFormat.format(-minutesAgo, 'minute')}`;
  if (calendarDaysAgo(date) === 0) return `Last seen today at ${formatTime(date)}`;
  return `Last seen ${shortDateFormat.format(new Date(date))}`;
};
