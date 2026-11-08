import { RoomsRepository } from '../rooms.repository';
import { CreateRoomUseCase } from './create-room.usecase';

describe('CreateRoomUseCase', () => {
  let repository: RoomsRepository;

  beforeEach(() => {
    repository = new RoomsRepository();
  });

  it('crea la sala con un código de 4 letras y deja al creador como anfitrión', () => {
    const useCase = new CreateRoomUseCase(repository, () => 0);

    const { room, playerId, token } = useCase.execute({ name: 'Ana' }, 42);

    expect(room.code).toBe('AAAA');
    expect(room.lastActivity).toBe(42);
    expect(room.state.hostId).toBe(playerId);
    expect(room.state.players[0].name).toBe('Ana');
    expect(room.tokens.get(token)).toBe(playerId);
    expect(token.length).toBeGreaterThanOrEqual(16);
  });

  it('busca otro código si el primero ya está ocupado', () => {
    const rolls = [0, 0, 0, 0, 1, 1, 1, 1];
    const useCase = new CreateRoomUseCase(repository, () => rolls.shift() ?? 0);
    repository.create('AAAA', {} as never);

    expect(useCase.execute({ name: 'Ana' }).room.code).toBe('BBBB');
  });

  it('se rinde después de muchos intentos ocupados', () => {
    const useCase = new CreateRoomUseCase(repository, () => 0);
    repository.create('AAAA', {} as never);

    expect(() => useCase.execute({ name: 'Ana' })).toThrow(
      'No se pudo crear la sala. Intenta otra vez.',
    );
  });
});
