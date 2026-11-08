/** Mensajes que manda el navegador. Todos reciben una respuesta (`Ack`). */
export const ClientEvents = {
  CreateRoom: 'room:create',
  JoinRoom: 'room:join',
  RejoinRoom: 'room:rejoin',
  LeaveRoom: 'room:leave',
  KickPlayer: 'room:kick',
  UpdateRules: 'room:rules',
  StartRound: 'game:start',
  PlayCard: 'game:play',
  DrawCard: 'game:draw',
  PassTurn: 'game:pass',
  DeclareLast: 'game:last',
  CatchPlayer: 'game:catch',
  SkipTurn: 'game:skip',
} as const;

/** Mensajes que manda el servidor por su cuenta. */
export const ServerEvents = {
  State: 'room:state',
  Kicked: 'room:kicked',
} as const;

/** Respuesta a cada mensaje: datos, o un error para mostrarle al jugador. */
export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export interface JoinedResponse {
  code: string;
  playerId: string;
  token: string;
}
