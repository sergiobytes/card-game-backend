import { createGame } from '../../game/engine/players';
import { ROOM_IDLE_MS } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { RemoveIdleRoomsUseCase } from './remove-idle-rooms.usecase';

describe('RemoveIdleRoomsUseCase', () => {
  it('borra solo salas vacías de conexiones y sin actividad reciente', () => {
    const repository = new RoomsRepository();
    seedRoom(repository, createGame('a', 'Ana'), {
      code: 'VIEJ',
      offline: ['a'],
    });
    seedRoom(repository, createGame('b', 'Beto'), { code: 'CONE' });
    seedRoom(repository, createGame('c', 'Caro'), {
      code: 'NUEV',
      offline: ['c'],
      now: ROOM_IDLE_MS,
    });

    const removed = new RemoveIdleRoomsUseCase(repository).execute(
      ROOM_IDLE_MS + 1,
    );

    expect(removed).toBe(1);
    expect(repository.all().map((r) => r.code)).toEqual(['CONE', 'NUEV']);
  });

  it('no hace nada si no hay salas inactivas', () => {
    expect(new RemoveIdleRoomsUseCase(new RoomsRepository()).execute()).toBe(0);
  });
});
