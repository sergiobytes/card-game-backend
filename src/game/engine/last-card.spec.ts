import { card, filler, playingGame } from '../testing/game.fixtures';
import { catchPlayer, declareLast } from './last-card';

describe('declareLast', () => {
  it('se puede cantar con 2 cartas, aunque no sea tu turno', () => {
    const state = playingGame({
      hands: [filler(3), [card('red', '1'), card('red', '2')]],
    });

    declareLast(state, 'p1');

    expect(state.players[1].declared).toBe(true);
    expect(state.log).toEqual(['Beto cantó ¡Última!']);
  });

  it('cantar antes de que te atrapen te salva', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });
    state.players[0].vulnerable = true;

    declareLast(state, 'p0');

    expect(state.players[0].vulnerable).toBe(false);
  });

  it('no se puede con más de 2 cartas, sin jugar la ronda o fuera de ella', () => {
    const state = playingGame();

    expect(() => declareLast(state, 'p0')).toThrow(
      'Solo puedes cantar ¡Última! con 2 cartas o menos.',
    );
    expect(() => declareLast(state, 'nadie')).toThrow(
      'No estás jugando esta ronda.',
    );

    state.status = 'roundover';
    expect(() => declareLast(state, 'p0')).toThrow(
      'La ronda no está en curso.',
    );
  });

  it('cantar dos veces no repite el mensaje', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });

    declareLast(state, 'p0');
    declareLast(state, 'p0');

    expect(state.log).toEqual(['Ana cantó ¡Última!']);
  });
});

describe('catchPlayer', () => {
  it('quien no cantó y es atrapado roba 2', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });
    state.players[0].vulnerable = true;

    catchPlayer(state, 'p2', 'p0');

    expect(state.players[0].hand).toHaveLength(3);
    expect(state.players[0].vulnerable).toBe(false);
    expect(state.log).toEqual([
      'Caro atrapó a Ana sin cantar ¡Última!: roba 2',
    ]);
  });

  it('no se puede atrapar a quien cantó o ya no está expuesto', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });

    expect(() => catchPlayer(state, 'p1', 'p0')).toThrow(
      'Demasiado tarde: ya no se puede atrapar.',
    );
  });

  it('valida quién atrapa y a quién', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });
    state.players[0].vulnerable = true;

    expect(() => catchPlayer(state, 'p0', 'p0')).toThrow(
      'No puedes atraparte a ti mismo.',
    );
    expect(() => catchPlayer(state, 'nadie', 'p0')).toThrow(
      'Ese jugador no está en la ronda.',
    );

    state.status = 'roundover';
    expect(() => catchPlayer(state, 'p1', 'p0')).toThrow(
      'La ronda ya terminó.',
    );
  });
});
