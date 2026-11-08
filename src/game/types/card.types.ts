export const CARD_COLORS = ['red', 'yellow', 'green', 'blue'] as const;
export type CardColor = (typeof CARD_COLORS)[number];

export type CardSuit = CardColor | 'black';

export const NUMBER_VALUES = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
] as const;
export type NumberValue = (typeof NUMBER_VALUES)[number];

export type ActionValue = 'skip' | 'reverse' | 'draw2';
export type WildValue = 'wild' | 'wild4';

export type CardValue = NumberValue | ActionValue | WildValue;

export interface Card {
  id: string;
  color: CardSuit;
  value: CardValue;
}
