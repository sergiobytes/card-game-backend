import { GameRuleError } from '../../game/engine/game-rule.error';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  PlayCardSchema,
  RejoinRoomSchema,
  UpdateRulesSchema,
} from '../../rooms/schemas/room-messages.schema';
import { parseMessage } from './parse-message';

describe('parseMessage', () => {
  it('limpia el nombre y el código de la sala', () => {
    expect(
      parseMessage(JoinRoomSchema, { code: ' abcd ', name: '  Ana   María ' }),
    ).toEqual({ code: 'ABCD', name: 'Ana María' });
  });

  it('devuelve el primer problema como GameRuleError', () => {
    expect(() => parseMessage(CreateRoomSchema, { name: '   ' })).toThrow(
      new GameRuleError('Escribe tu nombre.'),
    );
    expect(() =>
      parseMessage(JoinRoomSchema, { code: 'AB', name: 'Ana' }),
    ).toThrow('El código de la sala tiene 4 letras.');
    expect(() =>
      parseMessage(CreateRoomSchema, { name: 'x'.repeat(17) }),
    ).toThrow('Tu nombre puede tener hasta 16 caracteres.');
  });

  it('trata un mensaje vacío o de otro tipo como datos faltantes', () => {
    expect(() => parseMessage(CreateRoomSchema, undefined)).toThrow(
      'Escribe tu nombre.',
    );
    expect(() => parseMessage(CreateRoomSchema, { name: 42 })).toThrow(
      'Escribe tu nombre.',
    );
  });

  it('rechaza colores inventados y acepta los reales', () => {
    expect(() =>
      parseMessage(PlayCardSchema, { cardId: '7', color: 'purple' }),
    ).toThrow('Ese color no existe.');
    expect(parseMessage(PlayCardSchema, { cardId: '7', color: 'red' })).toEqual(
      { cardId: '7', color: 'red' },
    );
  });

  it('descarta campos que no pidió', () => {
    expect(
      parseMessage(UpdateRulesSchema, { stack: false, hackeado: true }),
    ).toEqual({ stack: false });
  });

  it('exige un token de sesión con forma de token', () => {
    expect(() =>
      parseMessage(RejoinRoomSchema, { code: 'ABCD', token: 'corto' }),
    ).toThrow('El token de la sesión no es válido.');
  });
});
