import { z } from 'zod';
import { NAME_MAX_LENGTH } from '../../game/constants';
import { CARD_COLORS } from '../../game/types/card.types';

const name = z
  .string({ error: 'Escribe tu nombre.' })
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Escribe tu nombre.')
      .max(
        NAME_MAX_LENGTH,
        `Tu nombre puede tener hasta ${NAME_MAX_LENGTH} caracteres.`,
      ),
  );

const code = z
  .string({ error: 'Falta el código de la sala.' })
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{4}$/, 'El código de la sala tiene 4 letras.'));

const playerId = z
  .string({ error: 'Falta el jugador.' })
  .min(1, 'Falta el jugador.')
  .max(64, 'Ese jugador no es válido.');

export const CreateRoomSchema = z.object({ name });

export const JoinRoomSchema = z.object({ code, name });

export const RejoinRoomSchema = z.object({
  code,
  token: z
    .string({ error: 'Falta el token de la sesión.' })
    .min(16, 'El token de la sesión no es válido.')
    .max(128, 'El token de la sesión no es válido.'),
});

export const TargetPlayerSchema = z.object({ playerId });

export const UpdateRulesSchema = z.object({
  stack: z.boolean({ error: 'La regla de acumular es sí o no.' }).optional(),
  drawUntilPlayable: z
    .boolean({ error: 'La regla de robar hasta poder jugar es sí o no.' })
    .optional(),
});

export const PlayCardSchema = z.object({
  cardId: z
    .string({ error: 'Falta la carta.' })
    .min(1, 'Falta la carta.')
    .max(12, 'Esa carta no es válida.'),
  color: z.enum(CARD_COLORS, { error: 'Ese color no existe.' }).optional(),
});
