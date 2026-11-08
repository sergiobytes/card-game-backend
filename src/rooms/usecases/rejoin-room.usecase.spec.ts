import { playingGame } from '../../game/testing/game.fixtures';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { RejoinRoomUseCase } from './rejoin-room.usecase';

describe('RejoinRoomUseCase', () => {
  let repository: RoomsRepository;
  let useCase: RejoinRoomUseCase;

  beforeEach(() => {
    repository = new RoomsRepository();
    useCase = new RejoinRoomUseCase(repository);
    seedRoom(repository, playingGame());
  });

  it('devuelve el jugador asociado al token', () => {
    const token = 'token-de-p1-0123456789';

    expect(useCase.execute({ code: 'ABCD', token })).toMatchObject({
      playerId: 'p1',
      token,
    });
  });

  it('rechaza un token desconocido', () => {
    expect(() => useCase.execute({ code: 'ABCD', token: 'otro' })).toThrow(
      'Ya no estás en esta sala.',
    );
  });

  it('rechaza el token de alguien que ya salió', () => {
    const room = repository.findByCode('ABCD');
    room.state.players.splice(1, 1);

    expect(() =>
      useCase.execute({ code: 'ABCD', token: 'token-de-p1-0123456789' }),
    ).toThrow('Ya no estás en esta sala.');
  });
});
