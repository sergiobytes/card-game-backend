import { COLOR_NAMES, LOG_LIMIT } from '../constants';
import { Card, CardColor } from '../types/card.types';
import { GameState, PlayerState } from '../types/game-state.types';
import { GameRuleError } from './game-rule.error';

export const isWild = (card: Card): boolean => card.color === 'black';

export function topCard(state: GameState): Card {
  const top = state.discard.at(-1);
  if (!top) throw new Error('La pila de descarte está vacía.');
  return top;
}

export function canPlay(state: GameState, card: Card): boolean {
  const top = topCard(state);

  if (state.pending > 0) {
    return (
      card.value === 'wild4' ||
      (card.value === 'draw2' && top.value === 'draw2')
    );
  }

  if (state.drawnCardId !== null && card.id !== state.drawnCardId) return false;

  return isWild(card) || card.color === state.color || card.value === top.value;
}

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.turn];
}

export function stepIndex(state: GameState, steps = 1): number {
  const n = state.players.length;
  return (((state.turn + state.direction * steps) % n) + n) % n;
}

export function requireTurn(state: GameState, playerId: string): PlayerState {
  if (state.status !== 'playing') {
    throw new GameRuleError('La ronda no está en curso.');
  }
  const player = currentPlayer(state);
  if (player.id !== playerId) {
    throw new GameRuleError('Espera tu turno.');
  }
  return player;
}

export function pushLog(state: GameState, message: string): void {
  state.log.push(message);
  if (state.log.length > LOG_LIMIT) state.log.shift();
}

export function describeCard(card: Card, color: CardColor): string {
  const colorName = COLOR_NAMES[color];
  switch (card.value) {
    case 'wild':
      return `Comodín (eligió ${colorName})`;
    case 'wild4':
      return `Comodín +4 (eligió ${colorName})`;
    case 'skip':
      return `Salta ${colorName}`;
    case 'reverse':
      return `Reversa ${colorName}`;
    case 'draw2':
      return `+2 ${colorName}`;
    default:
      return `${card.value} ${colorName}`;
  }
}
