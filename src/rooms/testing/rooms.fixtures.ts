import { GameState } from '../../game/types/game-state.types';
import { Room } from '../entities/room.entity';
import { attachSocket } from '../room-connections';
import { RoomsRepository } from '../rooms.repository';

/**
 * Guarda una sala con el estado dado. Todos los jugadores quedan en línea
 * salvo los que se indiquen en `offline`.
 */
export function seedRoom(
  repository: RoomsRepository,
  state: GameState,
  { code = 'ABCD', offline = [] as string[], now = 0 } = {},
): Room {
  const room = repository.create(code, state, now);
  for (const p of [...state.players, ...state.waiting]) {
    room.tokens.set(`token-de-${p.id}-0123456789`, p.id);
    if (!offline.includes(p.id)) attachSocket(room, p.id, `socket-${p.id}`);
  }
  return room;
}
