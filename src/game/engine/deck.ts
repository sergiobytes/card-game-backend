import {
  ActionValue,
  Card,
  CARD_COLORS,
  CardSuit,
  CardValue,
  NUMBER_VALUES,
} from '../types/card.types';

const ACTIONS: ActionValue[] = ['skip', 'reverse', 'draw2'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let nextId = 0;

  const add = (color: CardSuit, value: CardValue) => {
    deck.push({ id: String(nextId++), color, value });
  };

  for (const color of CARD_COLORS) {
    for (const value of NUMBER_VALUES) {
      add(color, value);
      if (value !== '0') add(color, value);
    }

    for (const action of ACTIONS) {
      add(color, action);
      add(color, action);
    }
  }

  for (let copy = 0; copy < 4; copy++) {
    add('black', 'wild');
    add('black', 'wild4');
  }

  return deck;
}
