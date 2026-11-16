/** "Good morning!" before noon, "Good afternoon!" until 5 pm, "Good evening!" after that. */
export function timeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning!';
  if (hour >= 12 && hour < 17) return 'Good afternoon!';
  return 'Good evening!';
}
