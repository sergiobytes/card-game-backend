import { Card, CardColor } from './card.types';

export type GameStatus = 'lobby' | 'playing' | 'roundover';

export type Direction = 1 | -1;

export interface Rules {
  stack: boolean;
  drawUntilPlayable: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  declared: boolean;
  vulnerable: boolean;
}

export interface GameState {
  status: GameStatus;
  hostId: string | null;
  players: PlayerState[];
  waiting: PlayerState[];
  rules: Rules;
  turn: number;
  direction: Direction;
  deck: Card[];
  discard: Card[];
  color: CardColor | null;
  pending: number;
  drawnCardId: string | null;
  log: string[];
}
