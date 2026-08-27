export function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function shiftLocalDay(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setHours(12, 0, 0, 0);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
