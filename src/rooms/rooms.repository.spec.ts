import { createGame } from '../game/engine/players';
import { RoomsRepository } from './rooms.repository';

describe('RoomsRepository', () => {
  let repository: RoomsRepository;

  beforeEach(() => {
    repository = new RoomsRepository();
  });

  it('crea, encuentra, cuenta y borra salas', () => {
    const room = repository.create('ABCD', createGame('p1', 'Ana'), 123);

    expect(room.lastActivity).toBe(123);
    expect(repository.exists('ABCD')).toBe(true);
    expect(repository.findByCode('ABCD')).toBe(room);
    expect(repository.count()).toBe(1);
    expect(repository.all()).toEqual([room]);

    repository.delete('ABCD');
    expect(repository.exists('ABCD')).toBe(false);
  });

  it('avisa cuando el código no existe', () => {
    expect(() => repository.findByCode('ZZZZ')).toThrow(
      'No existe una sala con ese código.',
    );
  });
});
