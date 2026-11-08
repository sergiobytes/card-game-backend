import { CardColor } from './types/card.types';

export const HAND_SIZE = 7;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const LOG_LIMIT = 6;
export const CATCH_PENALTY = 2;

export const COLOR_NAMES: Record<CardColor, string> = {
  blue: 'azul',
  green: 'verde',
  red: 'rojo',
  yellow: 'amarillo',
};
