import { HAND_SIZE } from '../constants';
import { card, playingGame, zeroRng } from '../testing/game.fixtures';
import { endRound, startRound } from './round';
import { isNumberCard } from './rules';

/** Sala esperando a que el anfitrión (Ana) reparta. */
function lobby(names?: string[]) {
  const state = playingGame({ names });
  state.status = 'lobby';
  state.round = 0;
  state.dealer = -1;
  return state;
}

describe('startRound', () => {
  it('reparte 7 cartas a cada quien y pone un número en la mesa', () => {
    const state = lobby();

    startRound(state, 'p0');

    expect(state.status).toBe('playing');
    for (const p of state.players) expect(p.hand).toHaveLength(HAND_SIZE);
    expect(state.discard).toHaveLength(1);
    expect(isNumberCard(state.discard[0])).toBe(true);
    expect(state.color).toBe(state.discard[0].color);
    expect(state.deck).toHaveLength(108 - 3 * HAND_SIZE - 1);
  });

  it('empieza quien sigue de quien reparte, y quien reparte rota', () => {
    const state = lobby();

    startRound(state, 'p0', zeroRng);
    expect(state.dealer).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.log.at(-1)).toBe('Ronda 1: empieza Beto');

    state.status = 'roundover';
    startRound(state, 'p0', zeroRng);
    expect(state.round).toBe(2);
    expect(state.dealer).toBe(1);
    expect(state.turn).toBe(2);
  });

  it('limpia lo que quedó de la ronda anterior', () => {
    const state = lobby();
    state.pending = 4;
    state.direction = -1;
    state.drawnCardId = 'vieja';
    state.players[1].declared = true;
    state.players[2].vulnerable = true;

    startRound(state, 'p0');

    expect(state.pending).toBe(0);
    expect(state.direction).toBe(1);
    expect(state.drawnCardId).toBeNull();
    expect(state.players[1].declared).toBe(false);
    expect(state.players[2].vulnerable).toBe(false);
  });

  it('suma a la mesa a quienes estaban esperando', () => {
    const state = lobby();
    state.waiting = [
      {
        id: 'w1',
        name: 'Dani',
        hand: [],
        score: 0,
        declared: false,
        vulnerable: false,
      },
    ];

    startRound(state, 'p0');

    expect(state.players.map((p) => p.name)).toEqual([
      'Ana',
      'Beto',
      'Caro',
      'Dani',
    ]);
    expect(state.waiting).toHaveLength(0);
    expect(state.players[3].hand).toHaveLength(HAND_SIZE);
  });

  it('solo el anfitrión reparte, y no con la ronda en curso', () => {
    const state = lobby();

    expect(() => startRound(state, 'p1')).toThrow(
      'Solo quien creó la sala puede repartir.',
    );

    startRound(state, 'p0');
    expect(() => startRound(state, 'p0')).toThrow('La ronda ya está en curso.');
  });

  it('se necesitan al menos 2 jugadores', () => {
    expect(() => startRound(lobby(['Ana']), 'p0')).toThrow(
      'Se necesitan al menos 2 jugadores.',
    );
  });
});

describe('endRound', () => {
  it('el ganador suma lo que valen las manos de los demás', () => {
    const state = playingGame({
      hands: [
        [],
        [card('red', '7'), card('blue', 'skip')],
        [card('black', 'wild4')],
      ],
    });
    state.pending = 2;

    endRound(state, state.players[0]);

    expect(state.status).toBe('roundover');
    expect(state.players[0].score).toBe(77);
    expect(state.winner).toEqual({ playerId: 'p0', points: 77 });
    expect(state.pending).toBe(0);
    expect(state.log.at(-1)).toBe('Ana se quedó sin cartas y gana 77 puntos');
  });
});
