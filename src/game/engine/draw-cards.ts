import { GameState, PlayerState } from '../types/game-state.types';
import { Rng, cryptoRng, shuffle } from './random';
import { pushLog, topCard } from './rules';
import { Card } from '../types/card.types';

/**
 * Pasa hasta `count` cartas del mazo a la mano del jugador y devuelve las que
 * le dio. Si el mazo se acaba, rebaraja el descarte; si aun así no alcanza,
 * devuelve menos de `count`.
 */
export function drawCards(
  state: GameState,
  player: PlayerState,
  count: number,
  rng: Rng = cryptoRng,
): Card[] {
  const drawn: Card[] = [];
  while (drawn.length < count) {
    if (state.deck.length === 0) reshuffleDiscard(state, rng);
    const card = state.deck.pop();
    if (!card) break;
    player.hand.push(card);
    drawn.push(card);
  }

  if (player.hand.length > 1) {
    player.declared = false;
    player.vulnerable = false;
  }
  return drawn;
}

function reshuffleDiscard(state: GameState, rng: Rng): void {
  if (state.discard.length < 2) return;
  const top = topCard(state);
  state.deck = shuffle(state.discard.slice(0, -1), rng);
  state.discard = [top];
  pushLog(state, 'Se volvió a barajar el mazo');
}
