import { CATCH_PENALTY } from '../constants';
import { GameState } from '../types/game-state.types';
import { drawCards } from './draw-cards';
import { GameRuleError } from './game-rule.error';
import { Rng, cryptoRng } from './random';
import { findPlayer, pushLog } from './rules';

/** Cantar ¡Última!: se puede con 2 cartas o menos, aunque no sea tu turno. */
export function declareLast(state: GameState, playerId: string): void {
  if (state.status !== 'playing') {
    throw new GameRuleError('La ronda no está en curso.');
  }
  const player = findPlayer(state, playerId);
  if (!player) throw new GameRuleError('No estás jugando esta ronda.');
  if (player.hand.length > 2) {
    throw new GameRuleError(
      'Solo puedes cantar ¡Última! con 2 cartas o menos.',
    );
  }
  if (player.declared) return;

  player.declared = true;
  player.vulnerable = false;
  pushLog(state, `${player.name} cantó ¡Última!`);
}

/** Atrapar a quien se quedó con una carta sin cantar: roba como castigo. */
export function catchPlayer(
  state: GameState,
  catcherId: string,
  targetId: string,
  rng: Rng = cryptoRng,
): void {
  if (state.status !== 'playing') {
    throw new GameRuleError('La ronda ya terminó.');
  }
  const catcher = findPlayer(state, catcherId);
  const target = findPlayer(state, targetId);
  if (!catcher || !target) {
    throw new GameRuleError('Ese jugador no está en la ronda.');
  }
  if (catcher === target) {
    throw new GameRuleError('No puedes atraparte a ti mismo.');
  }
  if (!target.vulnerable) {
    throw new GameRuleError('Demasiado tarde: ya no se puede atrapar.');
  }

  drawCards(state, target, CATCH_PENALTY, rng);
  pushLog(
    state,
    `${catcher.name} atrapó a ${target.name} sin cantar ¡Última!: roba ${CATCH_PENALTY}`,
  );
}
