import { Test } from '@nestjs/testing';
import type { Server } from 'socket.io';
import { zeroRng } from '../game/testing/game.fixtures';
import { RNG } from './rooms.constants';
import { GameSocket, RoomsGateway, playerChannel } from './rooms.gateway';
import { RoomsModule } from './rooms.module';
import { RoomsService } from './rooms.service';

/** Socket falso: solo lo que el gateway usa. */
function fakeSocket(id: string) {
  const join = jest.fn();
  const socket = { id, data: {}, join, leave: jest.fn() };
  return { socket: socket as unknown as GameSocket, join };
}

describe('RoomsGateway', () => {
  let gateway: RoomsGateway;
  let service: RoomsService;
  let emit: jest.Mock;
  let to: jest.Mock;
  let socketsLeave: jest.Mock;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RoomsModule],
    })
      .overrideProvider(RNG)
      .useValue(zeroRng)
      .compile();

    gateway = moduleRef.get(RoomsGateway);
    service = moduleRef.get(RoomsService);
    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    socketsLeave = jest.fn();
    gateway.server = {
      to,
      in: jest.fn(() => ({ socketsLeave })),
    } as unknown as Server;
  });

  async function createRoom() {
    const { socket, join } = fakeSocket('s-ana');
    const ack = await gateway.create(socket, { name: '  Ana  ' });
    if (!ack.ok) throw new Error(ack.error);
    return { socket, join, ...ack.data };
  }

  it('al crear una sala, une el socket al canal privado del jugador', async () => {
    const { socket, join, code, playerId } = await createRoom();

    expect(socket.data).toEqual({ code, playerId });
    expect(join).toHaveBeenCalledWith(playerChannel(code, playerId));
    expect(to).toHaveBeenCalledWith(playerChannel(code, playerId));
    expect(emit).toHaveBeenCalledWith(
      'room:state',
      expect.objectContaining({
        code,
        me: expect.objectContaining({ name: 'Ana' }),
      }),
    );
  });

  it('devuelve los errores de validación como respuesta', async () => {
    const { socket } = fakeSocket('x');

    expect(await gateway.create(socket, { name: '' })).toEqual({
      ok: false,
      error: 'Escribe tu nombre.',
    });
  });

  it('esconde los errores inesperados detrás de un mensaje genérico', async () => {
    jest.spyOn(service, 'create').mockImplementation(() => {
      throw new Error('boom');
    });
    jest.spyOn(gateway['logger'], 'error').mockImplementation(() => undefined);

    expect(
      await gateway.create(fakeSocket('x').socket, { name: 'Ana' }),
    ).toEqual({
      ok: false,
      error: 'Algo salió mal en el servidor. Intenta de nuevo.',
    });
  });

  it('pide entrar a una sala antes de jugar', async () => {
    expect(await gateway.draw(fakeSocket('x').socket)).toEqual({
      ok: false,
      error: 'Primero entra a una sala.',
    });
  });

  it('recorre las acciones entre dos jugadores', async () => {
    const ana = await createRoom();
    const { socket: betoSocket } = fakeSocket('s-beto');
    const joined = await gateway.join(betoSocket, {
      code: ana.code.toLowerCase(),
      name: 'Beto',
    });
    if (!joined.ok) throw new Error(joined.error);
    const beto = joined.data;

    expect(await gateway.updateRules(ana.socket, { stack: false })).toEqual({
      ok: true,
      data: null,
    });
    expect((await gateway.start(ana.socket)).ok).toBe(true);

    // Reparte Ana, así que el turno es de Beto.
    expect(await gateway.pass(betoSocket)).toEqual({
      ok: false,
      error: 'Primero roba una carta.',
    });
    expect((await gateway.draw(betoSocket)).ok).toBe(true);
    await gateway.pass(betoSocket);
    expect((await gateway.declareLast(ana.socket)).ok).toBe(false);
    expect(
      (await gateway.catchPlayer(ana.socket, { playerId: beto.playerId })).ok,
    ).toBe(false);
    expect((await gateway.play(ana.socket, { cardId: 'nada' })).ok).toBe(false);
    expect(
      (await gateway.skipTurn(betoSocket, { playerId: ana.playerId })).ok,
    ).toBe(false);

    // Beto recarga la página y vuelve con su token.
    const { socket: reloaded } = fakeSocket('s-beto-2');
    expect(
      (await gateway.rejoin(reloaded, { code: ana.code, token: beto.token }))
        .ok,
    ).toBe(true);
    gateway.handleDisconnect(betoSocket);

    // Ana lo saca de la sala.
    expect(await gateway.kick(ana.socket, { playerId: beto.playerId })).toEqual(
      { ok: true, data: null },
    );
    const betoChannel = playerChannel(ana.code, beto.playerId);
    expect(to).toHaveBeenCalledWith(betoChannel);
    expect(emit).toHaveBeenCalledWith('room:kicked');
    expect(socketsLeave).toHaveBeenCalledWith(betoChannel);

    expect(await gateway.leave(ana.socket)).toEqual({ ok: true, data: null });
    expect(ana.socket.data).toEqual({});
  });

  it('ignora la desconexión de un socket que nunca entró a una sala', () => {
    expect(() =>
      gateway.handleDisconnect(fakeSocket('x').socket),
    ).not.toThrow();
  });
});
