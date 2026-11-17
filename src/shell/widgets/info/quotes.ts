/** Short quotes from writers long out of copyright. One a day, in order. */
export const QUOTES: { text: string; by: string }[] = [
  { text: 'Well begun is half done.', by: 'Aristotle' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', by: 'Confucius' },
  { text: 'We suffer more often in imagination than in reality.', by: 'Seneca' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', by: 'Marcus Aurelius' },
  { text: 'Simplicity is the ultimate sophistication.', by: 'Leonardo da Vinci' },
  { text: 'Nothing is particularly hard if you divide it into small jobs.', by: 'Henry Ford' },
  { text: 'Our life is frittered away by detail. Simplify, simplify.', by: 'Henry David Thoreau' },
  { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', by: 'W. B. Yeats' },
  { text: 'What we think, we become.', by: 'The Buddha' },
  { text: 'Luck is what happens when preparation meets opportunity.', by: 'Seneca' },
  { text: 'He who has a why to live can bear almost any how.', by: 'Friedrich Nietzsche' },
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'Knowing is not enough; we must apply.', by: 'Johann Wolfgang von Goethe' },
  { text: 'Waste no more time arguing what a good man should be. Be one.', by: 'Marcus Aurelius' },
  { text: 'A journey of a thousand miles begins with a single step.', by: 'Laozi' },
  { text: 'Energy and persistence conquer all things.', by: 'Benjamin Franklin' },
  { text: 'Be not afraid of going slowly; be afraid only of standing still.', by: 'Chinese proverb' },
  { text: 'Every moment is a fresh beginning.', by: 'T. S. Eliot' },
  { text: 'The best way out is always through.', by: 'Robert Frost' },
  { text: 'Whatever you are, be a good one.', by: 'Abraham Lincoln' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', by: 'Seneca' },
  { text: 'Dwell on the beauty of life. Watch the stars, and see yourself running with them.', by: 'Marcus Aurelius' },
  { text: 'Nature does not hurry, yet everything is accomplished.', by: 'Laozi' },
  { text: 'Quality is not an act, it is a habit.', by: 'Aristotle' },
  { text: 'Go confidently in the direction of your dreams.', by: 'Henry David Thoreau' },
  { text: 'Little by little, one travels far.', by: 'Spanish proverb' },
  { text: 'Do what you can, with what you have, where you are.', by: 'Theodore Roosevelt' },
  { text: 'Patience is bitter, but its fruit is sweet.', by: 'Jean-Jacques Rousseau' },
  { text: 'The mind is everything. What you think you become.', by: 'The Buddha' },
  { text: 'Act as if what you do makes a difference. It does.', by: 'William James' },
  { text: 'You cannot step into the same river twice.', by: 'Heraclitus' },
];

/** The quote for a given day (the same all day, a new one tomorrow). */
export function quoteOfTheDay(date: Date) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return QUOTES[day % QUOTES.length];
}
