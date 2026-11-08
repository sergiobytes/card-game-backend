import type { z } from 'zod';
import { GameRuleError } from '../../game/engine/game-rule.error';

/**
 * Valida el cuerpo de un mensaje de WebSocket. Si algo no cuadra, lanza un
 * GameRuleError con el primer problema, para devolvérselo al jugador.
 */
export function parseMessage<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.output<T> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const first = result.error.issues[0];
    throw new GameRuleError(first?.message ?? 'Los datos no son válidos.');
  }
  return result.data;
}
