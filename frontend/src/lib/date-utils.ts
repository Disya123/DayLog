/** Нормализация к началу UTC-дня */
export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Сегодня — начало UTC-дня */
export function todayUTC(): Date {
  return startOfDayUTC(new Date());
}

/**
 * Просрочка: задача невыполнена И день просрочен.
 * day.date < today (по UTC-дням).
 */
export function isOverdue(done: boolean, dayDate: string | Date): boolean {
  if (done) return false;
  const day = startOfDayUTC(new Date(dayDate));
  const now = todayUTC();
  return day.getTime() < now.getTime();
}

/** Это сегодня */
export function isToday(date: string | Date): boolean {
  return startOfDayUTC(new Date(date)).getTime() === todayUTC().getTime();
}

/** Понедельник текущей недели (UTC) */
export function startOfWeek(date: Date): Date {
  const d = startOfDayUTC(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // понедельник = 1
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** 7 дней недели начиная с понедельника */
export function weekDays(weekStart: Date): Date[] {
  return periodDays(weekStart, 7);
}

/** N дней начиная с указанной даты */
export function periodDays(start: Date, numDays: number): Date[] {
  return [...Array(numDays)].map((_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

/** Сдвиг недели на N недель */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d;
}

/** Форматирование даты для заголовка колонки */
export function formatDayHeader(date: Date): string {
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const months = [
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  ];
  const wd = weekdays[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  return `${wd}, ${day} ${month}`;
}

/** Формат полного диапазона недели для заголовка страницы */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  if (weekStart.getUTCMonth() === end.getUTCMonth()) {
    return `${weekStart.getUTCDate()} — ${end.getUTCDate()} ${months[end.getUTCMonth()]}`;
  }
  return `${weekStart.getUTCDate()} ${months[weekStart.getUTCMonth()]} — ${end.getUTCDate()} ${months[end.getUTCMonth()]}`;
}

/** ISO date string в формате YYYY-MM-DD (для сравнения с API) */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Поиск дня в календаре по дате (сравнение по ISO-дате) */
export function findDayByDate(
  days: { id: string; date: string }[],
  date: Date,
): { id: string; date: string } | undefined {
  const target = toISODate(date);
  return days.find((d) => d.date.startsWith(target));
}
