import { Card } from '../types/card.types';
import { GameState } from '../types/game-state.types';
import { drawCards } from './draw-cards';
import { GameRuleError } from './game-rule.error';
import { Rng, cryptoRng } from './random';
import { canPlay, pushLog, requireTurn, stepIndex } from './rules';

export function drawCard(
  state: GameState,
  playerId: string,
  rng: Rng = cryptoRng,
): void {
  const player = requireTurn(state, playerId);
  if (state.drawnCardId !== null) {
    throw new GameRuleError('Ya robaste: juega esa carta o pasa.');
  }

  if (state.pending > 0) {
    const given = drawCards(state, player, state.pending, rng);
    state.pending = 0;
    state.turn = stepIndex(state);
    pushLog(state, `${player.name} robó ${given} y pierde el turno`);
    return;
  }

  let last: Card | undefined;
  let given = 0;
  while (drawCards(state, player, 1, rng) > 0) {
    given++;
    last = player.hand[player.hand.length - 1];
    if (!state.rules.drawUntilPlayable || canPlay(state, last)) break;
  }

  if (!last) {
    state.turn = stepIndex(state);
    pushLog(state, `${player.name} no pudo robar (no quedan cartas) y pasa`);
    return;
  }

  const what = given === 1 ? 'una carta' : `${given} cartas`;
  if (canPlay(state, last)) {
    state.drawnCardId = last.id;
    pushLog(state, `${player.name} robó ${what}`);
  } else {
    state.turn = stepIndex(state);
    pushLog(state, `${player.name} robó ${what} y pasa`);
  }
}

export function passTurn(state: GameState, playerId: string): void {
  const player = requireTurn(state, playerId);
  if (state.drawnCardId === null) {
    throw new GameRuleError('Primero roba una carta.');
  }
  state.drawnCardId = null;
  state.turn = stepIndex(state);
  pushLog(state, `${player.name} pasó`);
}
