import { GameState, PlayerState } from '../types/game-state.types';
import { Rng, cryptoRng, shuffle } from './random';
import { pushLog, topCard } from './rules';

export function drawCards(
  state: GameState,
  player: PlayerState,
  count: number,
  rng: Rng = cryptoRng,
): number {
  let given = 0;
  while (given < count) {
    if (state.deck.length === 0) reshuffleDiscard(state, rng);
    const card = state.deck.pop();
    if (!card) break;
    player.hand.push(card);
    given++;
  }
  return given;
}

function reshuffleDiscard(state: GameState, rng: Rng): void {
  if (state.discard.length < 2) return;
  const top = topCard(state);
  state.deck = shuffle(state.discard.slice(0, -1), rng);
  state.discard = [top];
  pushLog(state, 'Se volvió a barajar el mazo');
}
