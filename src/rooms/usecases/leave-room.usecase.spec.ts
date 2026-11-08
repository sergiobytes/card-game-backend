import { createGame } from '../../game/engine/players';
import { playingGame } from '../../game/testing/game.fixtures';
import { onlineIds } from '../room-connections';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { LeaveRoomUseCase } from './leave-room.usecase';

describe('LeaveRoomUseCase', () => {
  let repository: RoomsRepository;
  let useCase: LeaveRoomUseCase;

  beforeEach(() => {
    repository = new RoomsRepository();
    useCase = new LeaveRoomUseCase(repository);
  });

  it('saca al jugador y olvida sus tokens y conexiones', () => {
    const room = seedRoom(repository, playingGame());

    useCase.execute({ code: 'ABCD', playerId: 'p1' });

    expect(room.state.players.map((p) => p.id)).toEqual(['p0', 'p2']);
    expect([...room.tokens.values()]).not.toContain('p1');
    expect(onlineIds(room)).not.toContain('p1');
  });

  it('cuando sale el último, la sala se borra', () => {
    seedRoom(repository, createGame('h', 'Ana'));

    useCase.execute({ code: 'ABCD', playerId: 'h' });

    expect(repository.exists('ABCD')).toBe(false);
  });
});
