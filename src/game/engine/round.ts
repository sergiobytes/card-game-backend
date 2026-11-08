import { HAND_SIZE, MIN_PLAYERS } from '../constants';
import { GameState, PlayerState } from '../types/game-state.types';
import { createDeck } from './deck';
import { drawCards } from './draw-cards';
import { GameRuleError } from './game-rule.error';
import { Rng, cryptoRng } from './random';
import {
  cardPoints,
  currentPlayer,
  isNumberCard,
  pushLog,
  requireHost,
} from './rules';

/** Reparte una ronda nueva. Quienes esperaban se suman a la mesa. */
export function startRound(
  state: GameState,
  playerId: string,
  rng: Rng = cryptoRng,
): void {
  requireHost(state, playerId, 'repartir');
  if (state.status === 'playing') {
    throw new GameRuleError('La ronda ya está en curso.');
  }
  const players = [...state.players, ...state.waiting];
  if (players.length < MIN_PLAYERS) {
    throw new GameRuleError(`Se necesitan al menos ${MIN_PLAYERS} jugadores.`);
  }

  state.players = players;
  state.waiting = [];
  state.deck = createDeck(rng);
  state.discard = [];
  for (const p of state.players) {
    p.hand = [];
    drawCards(state, p, HAND_SIZE, rng);
  }

  // La primera carta de la mesa siempre es un número.
  const first = state.deck.find(isNumberCard);
  if (!first) throw new Error('La baraja no tiene cartas de número.');
  state.deck.splice(state.deck.indexOf(first), 1);
  state.discard = [first];
  state.color = first.color;

  state.round += 1;
  state.dealer = (state.dealer + 1) % players.length;
  state.turn = (state.dealer + 1) % players.length;
  state.direction = 1;
  state.pending = 0;
  state.drawnCardId = null;
  state.winner = null;
  state.status = 'playing';
  pushLog(state, `Ronda ${state.round}: empieza ${currentPlayer(state).name}`);
}

/** El ganador suma lo que valen las cartas que les quedaron a los demás. */
export function endRound(state: GameState, winner: PlayerState): void {
  const points = state.players
    .flatMap((p) => p.hand)
    .reduce((sum, c) => sum + cardPoints(c), 0);

  winner.score += points;
  state.winner = { playerId: winner.id, points };
  state.status = 'roundover';
  state.pending = 0;
  state.drawnCardId = null;
  pushLog(state, `${winner.name} se quedó sin cartas y gana ${points} puntos`);
}
