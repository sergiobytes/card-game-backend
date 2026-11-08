import { playingGame } from '../../game/testing/game.fixtures';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { KickPlayerUseCase } from './kick-player.usecase';

describe('KickPlayerUseCase', () => {
  it('el anfitrión saca a alguien y se borran sus tokens', () => {
    const repository = new RoomsRepository();
    const room = seedRoom(repository, playingGame());

    new KickPlayerUseCase(repository).execute({
      code: 'ABCD',
      playerId: 'p0',
      targetId: 'p2',
    });

    expect(room.state.players.map((p) => p.id)).toEqual(['p0', 'p1']);
    expect([...room.tokens.values()]).not.toContain('p2');
  });

  it('nadie más que el anfitrión puede sacar jugadores', () => {
    const repository = new RoomsRepository();
    seedRoom(repository, playingGame());

    expect(() =>
      new KickPlayerUseCase(repository).execute({
        code: 'ABCD',
        playerId: 'p1',
        targetId: 'p2',
      }),
    ).toThrow('Solo quien creó la sala puede sacar jugadores.');
  });
});
