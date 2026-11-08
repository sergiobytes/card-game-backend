import { createGame } from '../../game/engine/players';
import { playingGame } from '../../game/testing/game.fixtures';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { JoinRoomUseCase } from './join-room.usecase';

describe('JoinRoomUseCase', () => {
  let repository: RoomsRepository;
  let useCase: JoinRoomUseCase;

  beforeEach(() => {
    repository = new RoomsRepository();
    useCase = new JoinRoomUseCase(repository);
  });

  it('agrega al jugador y le da un token propio', () => {
    seedRoom(repository, createGame('h', 'Ana'));

    const { room, playerId, token } = useCase.execute(
      { code: 'ABCD', name: 'Beto' },
      99,
    );

    expect(room.state.players.map((p) => p.name)).toEqual(['Ana', 'Beto']);
    expect(room.tokens.get(token)).toBe(playerId);
    expect(room.lastActivity).toBe(99);
  });

  it('si alguien desconectado tenía ese nombre, recupera su lugar', () => {
    seedRoom(repository, playingGame(), { offline: ['p1'] });

    const { playerId } = useCase.execute({ code: 'ABCD', name: 'beto' });

    expect(playerId).toBe('p1');
  });

  it('no cambia la sala si el nombre está en uso por alguien conectado', () => {
    const room = seedRoom(repository, playingGame());
    const before = room.state;

    expect(() => useCase.execute({ code: 'ABCD', name: 'Beto' })).toThrow(
      'Ya hay alguien llamado Beto en la sala. Usa otro nombre.',
    );
    expect(room.state).toBe(before);
  });

  it('avisa si la sala no existe', () => {
    expect(() => useCase.execute({ code: 'ZZZZ', name: 'Ana' })).toThrow(
      'No existe una sala con ese código.',
    );
  });
});
