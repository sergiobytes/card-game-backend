import { card, playingGame } from '../testing/game.fixtures';
import {
  addPlayer,
  createGame,
  isEmpty,
  kickPlayer,
  leaveGame,
  removePlayer,
  updateRules,
} from './players';

describe('createGame', () => {
  it('crea la sala en espera con quien la creó como anfitrión', () => {
    const state = createGame('h1', 'Ana');

    expect(state.status).toBe('lobby');
    expect(state.hostId).toBe('h1');
    expect(state.players.map((p) => p.name)).toEqual(['Ana']);
    expect(state.round).toBe(0);
    expect(state.dealer).toBe(-1);
    expect(state.log).toEqual(['Ana creó la sala']);
  });
});

describe('addPlayer', () => {
  it('en la sala de espera se suma directo a la mesa', () => {
    const state = createGame('h1', 'Ana');

    expect(addPlayer(state, 'p2', 'Beto', ['h1'])).toBe('p2');
    expect(state.players.map((p) => p.name)).toEqual(['Ana', 'Beto']);
    expect(state.log.at(-1)).toBe('Beto se unió');
  });

  it('con la ronda en curso espera a la siguiente', () => {
    const state = playingGame();

    addPlayer(state, 'w1', 'Dani', []);

    expect(state.players).toHaveLength(3);
    expect(state.waiting.map((p) => p.name)).toEqual(['Dani']);
    expect(state.log.at(-1)).toBe('Dani entrará en la próxima ronda');
  });

  it('rechaza un nombre repetido si esa persona sigue conectada', () => {
    const state = createGame('h1', 'Ana');

    expect(() => addPlayer(state, 'p2', 'ana', ['h1'])).toThrow(
      'Ya hay alguien llamado ana en la sala. Usa otro nombre.',
    );
  });

  it('quien se desconectó recupera su lugar y su mano con el mismo nombre', () => {
    const state = playingGame();
    const hand = [...state.players[1].hand];

    expect(addPlayer(state, 'otro-id', 'BETO', ['p0', 'p2'])).toBe('p1');
    expect(state.players[1].hand).toEqual(hand);
    expect(state.log.at(-1)).toBe('Beto regresó a la mesa');
  });

  it('no deja pasar de 10 jugadores', () => {
    const names = Array.from({ length: 10 }, (_, i) => `J${i}`);
    const state = playingGame({ names });

    expect(() => addPlayer(state, 'x', 'Once', [])).toThrow(
      'La sala está llena (máximo 10 jugadores).',
    );
  });
});

describe('removePlayer', () => {
  const four = ['Ana', 'Beto', 'Caro', 'Dani'];

  it('si sale alguien antes del turno, el turno sigue con la misma persona', () => {
    const state = playingGame({ names: four, turn: 2 });

    removePlayer(state, 'p0');

    expect(state.players[state.turn].name).toBe('Caro');
  });

  it('si sale quien tiene el turno, sigue el siguiente', () => {
    const state = playingGame({ names: four, turn: 1 });
    state.drawnCardId = 'robada';

    removePlayer(state, 'p1');

    expect(state.players[state.turn].name).toBe('Caro');
    expect(state.drawnCardId).toBeNull();
  });

  it('en sentido contrario, si sale quien tiene el turno sigue el anterior', () => {
    const state = playingGame({ names: four, turn: 1 });
    state.direction = -1;

    removePlayer(state, 'p1');

    expect(state.players[state.turn].name).toBe('Ana');
  });

  it('si sale el último de la lista en su turno, sigue el primero', () => {
    const state = playingGame({ names: four, turn: 3 });

    removePlayer(state, 'p3');

    expect(state.players[state.turn].name).toBe('Ana');
  });

  it('sus cartas regresan al fondo del mazo', () => {
    const hand = [card('red', '1'), card('red', '2')];
    const state = playingGame({ hands: [[card('red', '3')], hand] });
    const deckSize = state.deck.length;

    removePlayer(state, 'p1');

    expect(state.deck).toHaveLength(deckSize + 2);
    expect(state.deck.slice(0, 2)).toEqual(hand);
  });

  it('si quedan menos de 2, la ronda se cancela y entran quienes esperaban', () => {
    const state = playingGame({ names: ['Ana', 'Beto'] });
    state.pending = 4;
    addPlayer(state, 'w1', 'Dani', []);

    removePlayer(state, 'p1');

    expect(state.status).toBe('lobby');
    expect(state.pending).toBe(0);
    expect(state.players.map((p) => p.name)).toEqual(['Ana', 'Dani']);
    expect(state.waiting).toHaveLength(0);
  });

  it('si sale el anfitrión, el siguiente toma su lugar', () => {
    const state = playingGame();

    removePlayer(state, 'p0');

    expect(state.hostId).toBe('p1');
  });

  it('también saca a quien estaba esperando', () => {
    const state = playingGame();
    addPlayer(state, 'w1', 'Dani', []);

    removePlayer(state, 'w1');

    expect(state.waiting).toHaveLength(0);
    expect(state.players).toHaveLength(3);
  });

  it('avisa si ese jugador ya no está', () => {
    expect(() => removePlayer(playingGame(), 'nadie')).toThrow(
      'Ese jugador ya no está en la sala.',
    );
  });
});

describe('leaveGame y kickPlayer', () => {
  it('salir deja el mensaje en el historial', () => {
    const state = playingGame();

    leaveGame(state, 'p1');

    expect(state.log.at(-1)).toBe('Beto salió de la sala');
  });

  it('solo el anfitrión saca jugadores, y no a sí mismo', () => {
    const state = playingGame();

    expect(() => kickPlayer(state, 'p1', 'p2')).toThrow(
      'Solo quien creó la sala puede sacar jugadores.',
    );
    expect(() => kickPlayer(state, 'p0', 'p0')).toThrow(
      'Para irte usa "Salir de la sala".',
    );

    kickPlayer(state, 'p0', 'p2');
    expect(state.players.map((p) => p.name)).toEqual(['Ana', 'Beto']);
    expect(state.log.at(-1)).toBe('Caro fue retirado de la sala');
  });

  it('cuando sale el último, la sala queda vacía y sin anfitrión', () => {
    const state = createGame('h1', 'Ana');

    leaveGame(state, 'h1');

    expect(isEmpty(state)).toBe(true);
    expect(state.hostId).toBeNull();
  });
});

describe('updateRules', () => {
  it('el anfitrión cambia solo las reglas que manda', () => {
    const state = createGame('h1', 'Ana');

    updateRules(state, 'h1', { drawUntilPlayable: true });

    expect(state.rules).toEqual({ stack: true, drawUntilPlayable: true });
  });

  it('nadie más las cambia, y nunca a media ronda', () => {
    const state = playingGame();

    expect(() => updateRules(state, 'p1', { stack: false })).toThrow(
      'Solo quien creó la sala puede cambiar las reglas.',
    );
    expect(() => updateRules(state, 'p0', { stack: false })).toThrow(
      'Las reglas se cambian entre rondas.',
    );
  });
});
