import { randomInt } from 'node:crypto';

export type Rng = (max: number) => number;

export const cryptoRng: Rng = (max) => randomInt(max);

export function shuffle<T>(items: T[], rng: Rng = cryptoRng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
