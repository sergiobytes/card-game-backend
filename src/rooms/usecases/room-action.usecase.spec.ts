import { GameRuleError } from '../../game/engine/game-rule.error';
import { playingGame } from '../../game/testing/game.fixtures';
import { GameState } from '../../game/types/game-state.types';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { RoomActionUseCase } from './room-action.usecase';

class RenameUseCase extends RoomActionUseCase {
  protected apply(state: GameState): void {
    state.players[0].name = 'Cambiado';
    if (state.players.length > 2) throw new GameRuleError('Falla a medias');
  }
}

describe('RoomActionUseCase', () => {
  it('guarda el cambio y actualiza la actividad cuando la regla pasa', () => {
    const repository = new RoomsRepository();
    const room = seedRoom(repository, playingGame({ names: ['A', 'B'] }));

    new RenameUseCase(repository).execute({ code: 'ABCD', playerId: 'p0' }, 7);

    expect(room.state.players[0].name).toBe('Cambiado');
    expect(room.lastActivity).toBe(7);
  });

  it('si la regla falla a medias, la sala queda como estaba', () => {
    const repository = new RoomsRepository();
    const room = seedRoom(repository, playingGame());

    expect(() =>
      new RenameUseCase(repository).execute({ code: 'ABCD', playerId: 'p0' }),
    ).toThrow('Falla a medias');
    expect(room.state.players[0].name).toBe('Ana');
    expect(room.lastActivity).toBe(0);
  });
});
