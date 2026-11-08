import { currentPlayer, findMember } from '../engine/rules';
import { Card, CardColor } from '../types/card.types';
import {
  Direction,
  GameState,
  GameStatus,
  RoundWinner,
  Rules,
} from '../types/game-state.types';

export interface PublicPlayer {
  id: string;
  name: string;
  cardCount: number;
  score: number;
  declared: boolean;
  vulnerable: boolean;
  online: boolean;
}

export interface WaitingPlayer {
  id: string;
  name: string;
  online: boolean;
}

export interface SelfView {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  declared: boolean;
  vulnerable: boolean;
  isWaiting: boolean;
}

/**
 * Lo que ve un jugador: su mano completa y, de los demás, solo cuántas
 * cartas tienen. El mazo tampoco viaja: solo su tamaño.
 */
export interface PlayerView {
  code: string;
  status: GameStatus;
  hostId: string | null;
  me: SelfView;
  players: PublicPlayer[];
  waiting: WaitingPlayer[];
  rules: Rules;
  round: number;
  turnPlayerId: string | null;
  direction: Direction;
  topCard: Card | null;
  previousCard: Card | null;
  deckCount: number;
  color: CardColor | null;
  pending: number;
  /** Solo lo recibe quien tiene el turno. */
  drawnCardId: string | null;
  winner: RoundWinner | null;
  log: string[];
}

export function toPlayerView(
  state: GameState,
  code: string,
  viewerId: string,
  onlineIds: readonly string[],
): PlayerView {
  const me = findMember(state, viewerId);
  if (!me) throw new Error(`El jugador ${viewerId} no está en la sala ${code}`);

  const turnPlayerId =
    state.status === 'playing' ? currentPlayer(state).id : null;

  return {
    code,
    status: state.status,
    hostId: state.hostId,
    me: {
      id: me.id,
      name: me.name,
      hand: [...me.hand],
      score: me.score,
      declared: me.declared,
      vulnerable: me.vulnerable,
      isWaiting: state.waiting.includes(me),
    },
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      cardCount: p.hand.length,
      score: p.score,
      declared: p.declared,
      vulnerable: p.vulnerable,
      online: onlineIds.includes(p.id),
    })),
    waiting: state.waiting.map((p) => ({
      id: p.id,
      name: p.name,
      online: onlineIds.includes(p.id),
    })),
    rules: { ...state.rules },
    round: state.round,
    turnPlayerId,
    direction: state.direction,
    topCard: state.discard.at(-1) ?? null,
    previousCard: state.discard.at(-2) ?? null,
    deckCount: state.deck.length,
    color: state.color,
    pending: state.pending,
    drawnCardId: turnPlayerId === viewerId ? state.drawnCardId : null,
    winner: state.winner,
    log: [...state.log],
  };
}
