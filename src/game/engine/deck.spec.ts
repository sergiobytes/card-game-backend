import { CARD_COLORS } from '../types/card.types';
import { createDeck } from './deck';

describe('createDeck', () => {
  it('arma una baraja de 108 cartas', () => {
    const deck = createDeck();

    expect(deck).toHaveLength(108);
  });

  it('le da a cada carta un id distinto', () => {
    const ids = createDeck().map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CARD_COLORS)(
    'el color %s tiene un 0, dos de cada numero y dos de cada acción',
    (color) => {
      const cards = createDeck().filter((card) => card.color === color);
      const count = (value: string) =>
        cards.filter((card) => card.value === value).length;

      expect(cards).toHaveLength(25);
      expect(count('0')).toBe(1);
      expect(count('7')).toBe(2);
      expect(count('skip')).toBe(2);
      expect(count('reverse')).toBe(2);
      expect(count('draw2')).toBe(2);
    },
  );

  it('las únicas cartas negras son 4 comodines y 4 comodines +4', () => {
    const black = createDeck().filter((card) => card.color === 'black');

    expect(black).toHaveLength(8);
    expect(black.filter((card) => card.value === 'wild')).toHaveLength(4);
    expect(black.filter((card) => card.value === 'wild4')).toHaveLength(4);
  });
});
