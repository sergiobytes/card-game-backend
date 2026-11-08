import { Card, CardSuit, CardValue } from '../types/card.types';
import { GameState, PlayerState } from '../types/game-state.types';

let nextId = 0;

export function card(color: CardSuit, value: CardValue, id?: string): Card {
  return { id: id ?? `t${nextId}`, color, value };
}

export function filler(count: number): Card[] {
  return Array.from({ length: count }, () => card('blue', '9'));
}

interface GameOptions {
  top?: Card;
}

export function playingGame(options: GameOptions = {}): GameState {
  const top = options.top ?? card('red', '5');
  const players = ['Ana', 'Beto', 'Caro'].map((name, i): PlayerState => ({
    id: `p${i}`,
    name,
    hand: filler(3),
    score: 0,
    declared: false,
    vulnerable: false,
  }));

  return {
    status: 'playing',
    hostId: 'p0',
    players,
    waiting: [],
    rules: { stack: true, drawUntilPlayable: false },
    turn: 0,
    direction: 1,
    deck: filler(20),
    discard: [top],
    color: top.color === 'black' ? 'red' : top.color,
    pending: 0,
    drawnCardId: null,
    log: [],
  };
}
