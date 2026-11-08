import { GameState } from '../../game/types/game-state.types';

/**
 * Sala en memoria. No hay base de datos: si el servidor se reinicia, las
 * partidas en curso se pierden (para un juego de descanso es suficiente).
 */
export interface Room {
  code: string;
  state: GameState;
  /** Token secreto de cada pestaña → id del jugador. Sirve para reconectar. */
  tokens: Map<string, string>;
  /** Id del jugador → sockets abiertos (puede tener varias pestañas). */
  connections: Map<string, Set<string>>;
  lastActivity: number;
}
