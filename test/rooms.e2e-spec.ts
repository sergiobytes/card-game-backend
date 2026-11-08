import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CorsIoAdapter } from '../src/common/adapters/cors-io.adapter';
import type { PlayerView } from '../src/game/views/player-view';
import type { Ack, JoinedResponse } from '../src/rooms/rooms.events';

interface Client {
  socket: Socket;
  view: PlayerView | null;
  kicked: boolean;
}

describe('Descarte (e2e)', () => {
  let app: INestApplication;
  let url: string;
  const clients: Client[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new CorsIoAdapter(app, ['http://localhost']));
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    clients.forEach((c) => c.socket.disconnect());
    await app.close();
  });

  async function connect(): Promise<Client> {
    const socket = io(url, { transports: ['websocket'], forceNew: true });
    const client: Client = { socket, view: null, kicked: false };
    socket.on('room:state', (view: PlayerView) => (client.view = view));
    socket.on('room:kicked', () => (client.kicked = true));
    await new Promise<void>((resolve) => socket.on('connect', resolve));
    clients.push(client);
    return client;
  }

  function send<T = null>(client: Client, event: string, body: object = {}) {
    return client.socket.emitWithAck(event, body) as Promise<Ack<T>>;
  }

  function data<T>(ack: Ack<T>): T {
    if (!ack.ok) throw new Error(ack.error);
    return ack.data;
  }

  /** Espera a que llegue el mensaje que hace cierta la condición. */
  async function until(check: () => boolean, ms = 2000) {
    const start = Date.now();
    while (!check()) {
      if (Date.now() - start > ms) throw new Error('Tiempo agotado');
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  it('responde el health check', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toEqual({ status: 'ok', rooms: 0 });
  });

  it('juega una partida en la que cada quien ve solo su mano', async () => {
    const ana = await connect();
    const beto = await connect();

    const room = data(
      await send<JoinedResponse>(ana, 'room:create', { name: 'Ana' }),
    );
    expect(room.code).toMatch(/^[A-Z]{4}$/);

    const joined = data(
      await send<JoinedResponse>(beto, 'room:join', {
        code: room.code.toLowerCase(),
        name: 'Beto',
      }),
    );
    await until(() => ana.view?.players.length === 2);

    data(await send(ana, 'game:start'));
    await until(
      () => ana.view?.status === 'playing' && beto.view?.status === 'playing',
    );

    // Cada quien tiene 7 cartas y no recibe las del otro.
    expect(ana.view!.me.hand).toHaveLength(7);
    expect(beto.view!.me.hand).toHaveLength(7);
    const betoSees = JSON.stringify(beto.view);
    for (const { id } of ana.view!.me.hand) {
      expect(betoSees).not.toContain(`"id":"${id}"`);
    }

    // Si Beto cierra la pestaña, Ana lo ve desconectado…
    beto.socket.disconnect();
    await until(
      () =>
        ana.view!.players.find((p) => p.id === joined.playerId)?.online ===
        false,
    );

    // …y al recargar vuelve con su token y su mano.
    const beto2 = await connect();
    data(
      await send<JoinedResponse>(beto2, 'room:rejoin', {
        code: room.code,
        token: joined.token,
      }),
    );
    await until(() => beto2.view?.me.id === joined.playerId);
    expect(beto2.view!.me.hand).toHaveLength(7);

    // Ana lo saca de la sala y luego sale ella: la sala desaparece.
    data(await send(ana, 'room:kick', { playerId: joined.playerId }));
    await until(() => beto2.kicked);
    data(await send(ana, 'room:leave'));

    const res = await request(app.getHttpServer()).get('/health');
    expect(res.body.rooms).toBe(0);
  });
});
