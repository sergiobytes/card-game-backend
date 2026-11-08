/** Token de inyección del generador aleatorio (se reemplaza en las pruebas). */
export const RNG = Symbol('RNG');

/** Letras para los códigos de sala, sin I ni O para no confundirlas con 1 y 0. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

/** Una sala sin nadie conectado se borra después de este tiempo. */
export const ROOM_IDLE_MS = 30 * 60 * 1000;
export const ROOM_SWEEP_EVERY_MS = 5 * 60 * 1000;
