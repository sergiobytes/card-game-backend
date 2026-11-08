import { MAX_PLAYERS, MIN_PLAYERS } from '../constants';
import { GameState, PlayerState, Rules } from '../types/game-state.types';
import { GameRuleError } from './game-rule.error';
import { findMember, pushLog, requireHost } from './rules';

export function newPlayer(id: string, name: string): PlayerState {
  return { id, name, hand: [], score: 0, declared: false, vulnerable: false };
}

/** Sala nueva en espera, con quien la creó como anfitrión y único jugador. */
export function createGame(hostId: string, hostName: string): GameState {
  return {
    status: 'lobby',
    hostId,
    players: [newPlayer(hostId, hostName)],
    waiting: [],
    rules: { stack: true, drawUntilPlayable: false },
    turn: 0,
    direction: 1,
    deck: [],
    discard: [],
    color: null,
    pending: 0,
    drawnCardId: null,
    log: [`${hostName} creó la sala`],
    round: 0,
    dealer: -1,
    winner: null,
  };
}

const members = (state: GameState) => [...state.players, ...state.waiting];

/**
 * Suma a alguien a la sala y devuelve el id con el que quedó. Si ya había
 * un jugador con ese nombre y está desconectado, recupera su lugar y su mano.
 */
export function addPlayer(
  state: GameState,
  playerId: string,
  name: string,
  onlineIds: readonly string[],
): string {
  const sameName = members(state).find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  if (sameName) {
    if (onlineIds.includes(sameName.id)) {
      throw new GameRuleError(
        `Ya hay alguien llamado ${name} en la sala. Usa otro nombre.`,
      );
    }
    pushLog(state, `${sameName.name} regresó a la mesa`);
    return sameName.id;
  }

  if (members(state).length >= MAX_PLAYERS) {
    throw new GameRuleError(
      `La sala está llena (máximo ${MAX_PLAYERS} jugadores).`,
    );
  }

  if (state.status === 'playing') {
    state.waiting.push(newPlayer(playerId, name));
    pushLog(state, `${name} entrará en la próxima ronda`);
  } else {
    state.players.push(newPlayer(playerId, name));
    pushLog(state, `${name} se unió`);
  }
  return playerId;
}

/**
 * Saca a alguien de la sala. Con la ronda en curso, sus cartas vuelven al
 * mazo y el turno se ajusta para no saltarse a nadie.
 */
export function removePlayer(state: GameState, playerId: string): PlayerState {
  const member = findMember(state, playerId);
  if (!member) throw new GameRuleError('Ese jugador ya no está en la sala.');

  state.waiting = state.waiting.filter((p) => p.id !== playerId);
  const index = state.players.indexOf(member);

  if (index >= 0) {
    state.players.splice(index, 1);
    if (state.status === 'playing') {
      state.deck.unshift(...member.hand);
      fixTurnAfterRemoving(state, index);
      if (state.players.length < MIN_PLAYERS) {
        state.status = 'lobby';
        state.pending = 0;
        state.drawnCardId = null;
        state.players.push(...state.waiting);
        state.waiting = [];
        pushLog(state, 'La ronda terminó: quedan menos de 2 jugadores');
      }
    }
  }

  if (state.hostId === playerId) {
    state.hostId = members(state)[0]?.id ?? null;
  }
  return member;
}

/** Después de quitar al jugador en `removed`, que el turno siga bien. */
function fixTurnAfterRemoving(state: GameState, removed: number): void {
  if (removed < state.turn) {
    state.turn--; // todos se recorrieron un lugar
  } else if (removed === state.turn) {
    state.drawnCardId = null;
    if (state.direction === -1) state.turn--; // sigue el de antes
  }
  const n = state.players.length;
  if (n > 0) state.turn = ((state.turn % n) + n) % n;
}

export function leaveGame(state: GameState, playerId: string): void {
  const member = removePlayer(state, playerId);
  pushLog(state, `${member.name} salió de la sala`);
}

export function kickPlayer(
  state: GameState,
  hostId: string,
  targetId: string,
): void {
  requireHost(state, hostId, 'sacar jugadores');
  if (hostId === targetId) {
    throw new GameRuleError('Para irte usa "Salir de la sala".');
  }
  const member = removePlayer(state, targetId);
  pushLog(state, `${member.name} fue retirado de la sala`);
}

export function updateRules(
  state: GameState,
  hostId: string,
  changes: Partial<Rules>,
): void {
  requireHost(state, hostId, 'cambiar las reglas');
  if (state.status === 'playing') {
    throw new GameRuleError('Las reglas se cambian entre rondas.');
  }
  state.rules = { ...state.rules, ...changes };
}

export const isEmpty = (state: GameState): boolean =>
  members(state).length === 0;
