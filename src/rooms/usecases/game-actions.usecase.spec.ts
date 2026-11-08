import {
  card,
  filler,
  playingGame,
  zeroRng,
} from '../../game/testing/game.fixtures';
import { createGame, addPlayer } from '../../game/engine/players';
import { RoomsRepository } from '../rooms.repository';
import { seedRoom } from '../testing/rooms.fixtures';
import { CatchPlayerUseCase } from './catch-player.usecase';
import { DeclareLastUseCase } from './declare-last.usecase';
import { DrawCardUseCase } from './draw-card.usecase';
import { PassTurnUseCase } from './pass-turn.usecase';
import { PlayCardUseCase } from './play-card.usecase';
import { SkipTurnUseCase } from './skip-turn.usecase';
import { StartRoundUseCase } from './start-round.usecase';
import { UpdateRulesUseCase } from './update-rules.usecase';

/**
 * Los usecases de juego solo conectan la sala con el motor (que tiene sus
 * propias pruebas detalladas); aquí se comprueba que cada uno llegue a la
 * regla correcta con los datos correctos.
 */
describe('usecases de juego', () => {
  let repository: RoomsRepository;
  const code = 'ABCD';

  beforeEach(() => {
    repository = new RoomsRepository();
  });

  it('StartRoundUseCase reparte la ronda', () => {
    const state = createGame('p0', 'Ana');
    addPlayer(state, 'p1', 'Beto', []);
    const room = seedRoom(repository, state);

    new StartRoundUseCase(repository, zeroRng).execute({
      code,
      playerId: 'p0',
    });

    expect(room.state.status).toBe('playing');
    expect(room.state.players[1].hand).toHaveLength(7);
  });

  it('UpdateRulesUseCase cambia las reglas', () => {
    const room = seedRoom(repository, createGame('p0', 'Ana'));

    new UpdateRulesUseCase(repository).execute({
      code,
      playerId: 'p0',
      rules: { stack: false },
    });

    expect(room.state.rules.stack).toBe(false);
  });

  it('PlayCardUseCase juega la carta con el color elegido', () => {
    const wild = card('black', 'wild');
    const room = seedRoom(
      repository,
      playingGame({ hands: [[wild, ...filler(2)]] }),
    );

    new PlayCardUseCase(repository, zeroRng).execute({
      code,
      playerId: 'p0',
      cardId: wild.id,
      color: 'yellow',
    });

    expect(room.state.color).toBe('yellow');
    expect(room.state.turn).toBe(1);
  });

  it('DrawCardUseCase y PassTurnUseCase roban y pasan', () => {
    const room = seedRoom(
      repository,
      playingGame({ deck: [card('red', '1')] }),
    );

    new DrawCardUseCase(repository, zeroRng).execute({ code, playerId: 'p0' });
    expect(room.state.drawnCardId).not.toBeNull();

    new PassTurnUseCase(repository).execute({ code, playerId: 'p0' });
    expect(room.state.turn).toBe(1);
  });

  it('DeclareLastUseCase y CatchPlayerUseCase manejan el ¡Última!', () => {
    const room = seedRoom(
      repository,
      playingGame({
        hands: [[card('red', '1')], undefined!, [card('red', '2')]],
      }),
    );
    room.state.players[2].vulnerable = true;

    new DeclareLastUseCase(repository).execute({ code, playerId: 'p0' });
    new CatchPlayerUseCase(repository, zeroRng).execute({
      code,
      playerId: 'p1',
      targetId: 'p2',
    });

    expect(room.state.players[0].declared).toBe(true);
    expect(room.state.players[2].hand).toHaveLength(3);
  });

  it('SkipTurnUseCase usa quién está en línea según las conexiones de la sala', () => {
    const room = seedRoom(repository, playingGame(), { offline: ['p0'] });

    new SkipTurnUseCase(repository, zeroRng).execute({
      code,
      playerId: 'p1',
      targetId: 'p0',
    });
    expect(room.state.turn).toBe(1);

    expect(() =>
      new SkipTurnUseCase(repository, zeroRng).execute({
        code,
        playerId: 'p0',
        targetId: 'p1',
      }),
    ).toThrow('Beto sigue conectado.');
  });
});
