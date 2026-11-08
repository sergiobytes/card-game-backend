import { CARD_COLORS, Card, CardColor } from '../types/card.types';
import { GameState } from '../types/game-state.types';
import { drawCards } from './draw-cards';
import { GameRuleError } from './game-rule.error';
import { Rng, cryptoRng } from './random';
import {
  canPlay,
  describeCard,
  pushLog,
  requireTurn,
  stepIndex,
  topCard,
  clearVulnerable,
  currentPlayer,
  findPlayer,
} from './rules';
import { endRound } from './round';

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  chosenColor?: CardColor,
  rng: Rng = cryptoRng,
): void {
  const player = requireTurn(state, playerId);
  const index = player.hand.findIndex((c) => c.id === cardId);

  // Validar todo antes de modificar el estado.
  if (index < 0) {
    throw new GameRuleError('Esa carta ya no está en tu mano.');
  }
  const card = player.hand[index];
  if (!canPlay(state, card)) {
    throw new GameRuleError(whyNotPlayable(state));
  }
  const color = colorAfter(card, chosenColor);

  clearVulnerable(state);
  player.hand.splice(index, 1);
  state.discard.push(card);
  state.color = color;
  state.drawnCardId = null;

  if (player.hand.length === 1) player.vulnerable = !player.declared;

  const message = `${player.name} jugó ${describeCard(card, color)}`;

  if (player.hand.length === 0) {
    pushLog(state, message);
    endRound(state, player);
    return;
  }

  pushLog(state, message + applyCardEffect(state, card, rng));
}

/**
 * Aplica el efecto de la carta recién jugada y avanza el turno.
 * Devuelve el texto que se añade al mensaje del registro.
 */
function applyCardEffect(state: GameState, card: Card, rng: Rng): string {
  // Con dos jugadores, Reversa funciona como Salta: vuelves a tirar.
  switch (card.value) {
    case 'skip': {
      const skipped = state.players[stepIndex(state)];
      state.turn = stepIndex(state, 2);
      return ` y saltó a ${skipped.name}`;
    }
    case 'reverse':
      state.direction = state.direction === 1 ? -1 : 1;
      if (state.players.length > 2) state.turn = stepIndex(state);
      return ' y cambió el sentido';
    case 'draw2':
      return applyDrawPenalty(state, 2, rng);
    case 'wild4':
      return applyDrawPenalty(state, 4, rng);
    default:
      state.turn = stepIndex(state);
      return '';
  }
}

function applyDrawPenalty(state: GameState, amount: number, rng: Rng): string {
  if (state.rules.stack) {
    state.pending += amount;
    state.turn = stepIndex(state);
    return state.pending > amount ? ` (van +${state.pending} acumuladas)` : '';
  }
  const victim = state.players[stepIndex(state)];
  drawCards(state, victim, amount, rng);
  state.turn = stepIndex(state, 2);
  return `: ${victim.name} roba ${amount} y pierde el turno`;
}

// El color llega por la red: aunque el tipo diga CardColor, hay que revisarlo.
function colorAfter(card: Card, chosen?: CardColor): CardColor {
  if (card.color !== 'black') return card.color;
  if (!chosen || !CARD_COLORS.includes(chosen)) {
    throw new GameRuleError('Elige un color.');
  }
  return chosen;
}

function whyNotPlayable(state: GameState): string {
  if (state.pending === 0) return 'Esa carta no se puede jugar ahora.';
  return topCard(state).value === 'draw2'
    ? 'Tienes que acumular otro +2 o un +4, o robar.'
    : 'Tienes que acumular otro +4, o robar.';
}

export function drawCard(
  state: GameState,
  playerId: string,
  rng: Rng = cryptoRng,
): void {
  const player = requireTurn(state, playerId);
  if (state.drawnCardId !== null) {
    throw new GameRuleError('Ya robaste: juega esa carta o pasa.');
  }

  clearVulnerable(state);

  if (state.pending > 0) {
    const given = drawCards(state, player, state.pending, rng).length;
    state.pending = 0;
    state.turn = stepIndex(state);
    pushLog(state, `${player.name} robó ${given} y pierde el turno`);
    return;
  }

  let last: Card | undefined;
  let given = 0;
  for (;;) {
    const [drawn] = drawCards(state, player, 1, rng);
    if (!drawn) break; // ya no quedan cartas
    given++;
    last = drawn;
    if (!state.rules.drawUntilPlayable || canPlay(state, drawn)) break;
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

/**
 * Salta el turno de alguien desconectado para que la mesa no se quede
 * esperando. Si tenía un castigo acumulado, lo roba.
 */
export function skipTurn(
  state: GameState,
  playerId: string,
  targetId: string,
  onlineIds: readonly string[],
  rng: Rng = cryptoRng,
): void {
  if (state.status !== 'playing') {
    throw new GameRuleError('La ronda no está en curso.');
  }
  if (!findPlayer(state, playerId)) {
    throw new GameRuleError('Solo quien juega la ronda puede saltar turnos.');
  }
  const target = currentPlayer(state);
  if (target.id !== targetId) return; // el turno ya avanzó
  if (onlineIds.includes(targetId)) {
    throw new GameRuleError(`${target.name} sigue conectado.`);
  }

  if (state.pending > 0) {
    drawCards(state, target, state.pending, rng);
    state.pending = 0;
  }
  state.drawnCardId = null;
  state.turn = stepIndex(state);
  pushLog(state, `Se saltó el turno de ${target.name} (desconectado)`);
}
