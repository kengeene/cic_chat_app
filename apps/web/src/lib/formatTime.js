import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(calendar);
dayjs.extend(relativeTime);

export const isSameDay = (a, b) => dayjs(a).isSame(b, 'day');

export const formatTime = (date) => dayjs(date).format('HH:mm');

export const formatListTimestamp = (date) => (isSameDay(date, dayjs()) ? formatTime(date) : dayjs(date).format('D MMM'));

export const formatDayLabel = (date) =>
  dayjs(date).calendar(null, { sameDay: '[Today]', lastDay: '[Yesterday]', lastWeek: 'dddd, D MMMM', sameElse: 'dddd, D MMMM' });

export const formatLastSeen = (date) => (date ? `Last seen ${dayjs(date).fromNow()}` : 'Offline');
