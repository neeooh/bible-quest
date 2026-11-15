import { describe, expect, it } from 'vitest';
import { timeOfDayGreeting } from './greeting';

const at = (hour: number, minute = 0) => new Date(2026, 10, 15, hour, minute);

describe('timeOfDayGreeting', () => {
  it.each([
    [5, 'Good morning!'],
    [11, 'Good morning!'],
    [12, 'Good afternoon!'],
    [16, 'Good afternoon!'],
    [17, 'Good evening!'],
    [23, 'Good evening!'],
    [2, 'Good evening!'],
  ])('%i:00 → %s', (hour, greeting) => {
    expect(timeOfDayGreeting(at(hour))).toBe(greeting);
  });
});
