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
} from './rules';

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

  player.hand.splice(index, 1);
  state.discard.push(card);
  state.color = color;
  state.drawnCardId = null;

  let message = `${player.name} jugó ${describeCard(card, color)}`;

  // Con dos jugadores, Reversa funciona como Salta: vuelves a tirar.
  switch (card.value) {
    case 'skip': {
      const skipped = state.players[stepIndex(state)];
      state.turn = stepIndex(state, 2);
      message += ` y saltó a ${skipped.name}`;
      break;
    }
    case 'reverse':
      state.direction = state.direction === 1 ? -1 : 1;
      if (state.players.length > 2) state.turn = stepIndex(state);
      message += ' y cambió el sentido';
      break;
    case 'draw2':
    case 'wild4': {
      const amount = card.value === 'draw2' ? 2 : 4;
      if (state.rules.stack) {
        state.pending += amount;
        state.turn = stepIndex(state);
        if (state.pending > amount) {
          message += ` (van +${state.pending} acumuladas)`;
        }
      } else {
        const victim = state.players[stepIndex(state)];
        drawCards(state, victim, amount, rng);
        state.turn = stepIndex(state, 2);
        message += `: ${victim.name} roba ${amount} y pierde el turno`;
      }
      break;
    }
    default:
      state.turn = stepIndex(state);
  }
  pushLog(state, message);
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
    const drawn = player.hand.at(-1);
    if (!drawn) break;
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
