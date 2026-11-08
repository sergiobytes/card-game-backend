import { Room } from './entities/room.entity';

export function attachSocket(room: Room, playerId: string, socketId: string) {
  const sockets = room.connections.get(playerId) ?? new Set<string>();
  sockets.add(socketId);
  room.connections.set(playerId, sockets);
}

/** Devuelve true si el jugador se quedó sin ninguna conexión abierta. */
export function detachSocket(
  room: Room,
  playerId: string,
  socketId: string,
): boolean {
  const sockets = room.connections.get(playerId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size) return false;
  room.connections.delete(playerId);
  return true;
}

export function onlineIds(room: Room): string[] {
  return [...room.connections.entries()]
    .filter(([, sockets]) => sockets.size > 0)
    .map(([id]) => id);
}

/** Borra tokens y conexiones de alguien que ya no está en la sala. */
export function forgetPlayer(room: Room, playerId: string): void {
  for (const [token, id] of room.tokens) {
    if (id === playerId) room.tokens.delete(token);
  }
  room.connections.delete(playerId);
}
