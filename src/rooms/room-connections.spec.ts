import { createGame } from '../game/engine/players';
import { Room } from './entities/room.entity';
import {
  attachSocket,
  detachSocket,
  forgetPlayer,
  onlineIds,
} from './room-connections';

function room(): Room {
  return {
    code: 'ABCD',
    state: createGame('p1', 'Ana'),
    tokens: new Map(),
    connections: new Map(),
    lastActivity: 0,
  };
}

describe('room-connections', () => {
  it('un jugador sigue en línea mientras tenga al menos una pestaña abierta', () => {
    const r = room();
    attachSocket(r, 'p1', 's1');
    attachSocket(r, 'p1', 's2');

    expect(detachSocket(r, 'p1', 's1')).toBe(false);
    expect(onlineIds(r)).toEqual(['p1']);

    expect(detachSocket(r, 'p1', 's2')).toBe(true);
    expect(onlineIds(r)).toEqual([]);
  });

  it('desconectar a alguien desconocido no hace nada', () => {
    expect(detachSocket(room(), 'nadie', 's1')).toBe(false);
  });

  it('forgetPlayer borra sus tokens y conexiones, sin tocar a los demás', () => {
    const r = room();
    r.tokens.set('t1', 'p1');
    r.tokens.set('t2', 'p1');
    r.tokens.set('t3', 'p2');
    attachSocket(r, 'p1', 's1');

    forgetPlayer(r, 'p1');

    expect([...r.tokens.keys()]).toEqual(['t3']);
    expect(onlineIds(r)).toEqual([]);
  });
});
