import { describe, expect, it } from 'vitest';
import { bestScore, calculate, convert, fuzzyScore, parseCommand } from './searchEngine';

describe('fuzzy matching', () => {
  it('ranks exact > prefix > word start > inside > letters in order', () => {
    const exact = fuzzyScore('clock', 'Clock');
    const prefix = fuzzyScore('cal', 'Calculator');
    const word = fuzzyScore('in', 'Lock In');
    const inside = fuzzyScore('ock', 'Clock');
    const order = fuzzyScore('clc', 'Calculator');
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(order);
    expect(order).toBeGreaterThan(0);
  });
  it('forgives one typo in longer words', () => {
    expect(fuzzyScore('calandar', 'Calendar')).toBeGreaterThan(0);
    expect(fuzzyScore('zzz', 'Calendar')).toBe(0);
  });
  it('uses keywords', () => {
    expect(bestScore('alarm', 'Clock', ['alarm', 'timer'])).toBeGreaterThan(0);
  });
});

describe('math', () => {
  it('calculates', () => {
    expect(calculate('12*7')).toBe(84);
    expect(calculate('12 x 7')).toBe(84);
    expect(calculate('2+3*4')).toBe(14);
    expect(calculate('(2+3)*4')).toBe(20);
    expect(calculate('2^10')).toBe(1024);
    expect(calculate('50%*80')).toBe(40);
    expect(calculate('-3+5')).toBe(2);
    expect(calculate('10/4')).toBe(2.5);
  });
  it('ignores what is not math', () => {
    expect(calculate('12')).toBeNull();
    expect(calculate('clock')).toBeNull();
    expect(calculate('2+')).toBeNull();
    expect(calculate('1/0')).toBeNull();
  });
});

describe('unit conversion', () => {
  it('converts length, mass, temperature, speed', () => {
    expect(convert('5 km in mi')).toBe('5 km = 3.10686 mi');
    expect(convert('10kg to lb')).toBe('10 kg = 22.0462 lb');
    expect(convert('100 f in c')).toBe('100 °F = 37.7778 °C');
    expect(convert('0 c to f')).toBe('0 °C = 32 °F');
    expect(convert('100 km/h in mph')).toBe('100 km/h = 62.1371 mph');
  });
  it('refuses mixed kinds', () => {
    expect(convert('5 km in kg')).toBeNull();
    expect(convert('hello in mi')).toBeNull();
  });
});

describe('commands', () => {
  it('understands focus, timer, alarm, note, reminder, theme', () => {
    expect(parseCommand('start 25 min focus')).toEqual({ type: 'focus', minutes: 25 });
    expect(parseCommand('focus 50')).toEqual({ type: 'focus', minutes: 50 });
    expect(parseCommand('lock in')).toEqual({ type: 'focus', minutes: 25 });
    expect(parseCommand('timer 10')).toEqual({ type: 'timer', minutes: 10 });
    expect(parseCommand('5 min timer')).toEqual({ type: 'timer', minutes: 5 });
    expect(parseCommand('alarm 7:30')).toEqual({ type: 'alarm', hour: 7, minute: 30 });
    expect(parseCommand('alarm at 7pm')).toEqual({ type: 'alarm', hour: 19, minute: 0 });
    expect(parseCommand('note buy milk')).toEqual({ type: 'note', text: 'buy milk' });
    expect(parseCommand('remind me to call mum')).toEqual({ type: 'reminder', text: 'call mum' });
    expect(parseCommand('ocean theme', ['ocean'])).toEqual({ type: 'theme', id: 'ocean' });
    expect(parseCommand('weather')).toBeNull();
  });
});

describe('Netrunner commands', () => {
  it('opens the right tool with the right target', () => {
    expect(parseCommand('ping apple.com')).toMatchObject({ type: 'net', tool: 'ping', target: 'apple.com' });
    expect(parseCommand('traceroute 1.1.1.1')).toMatchObject({ type: 'net', tool: 'ping', target: '1.1.1.1', action: 'trace' });
    expect(parseCommand('whois example.com')).toMatchObject({ type: 'net', tool: 'dns', target: 'example.com', action: 'whois' });
    expect(parseCommand("what's my ip")).toMatchObject({ type: 'net', tool: 'connection' });
    expect(parseCommand("who's on my wifi")).toMatchObject({ type: 'net', tool: 'map' });
    expect(parseCommand('speed test')).toMatchObject({ type: 'net', tool: 'speed' });
    expect(parseCommand('ping')).toBeNull();
  });
});
