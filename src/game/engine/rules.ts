import { Card } from '../types/card.types';
import { GameState } from '../types/game-state.types';

export const isWild = (card: Card): boolean => card.color === 'black';

export function topCard(state: GameState): Card {
  return state.discard[state.discard.length - 1];
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
