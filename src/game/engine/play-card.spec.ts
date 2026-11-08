import { card, filler, playingGame, zeroRng } from '../testing/game.fixtures';
import { CardColor } from '../types/card.types';
import { drawCard, playCard } from './turn';

describe('playCard', () => {
  it('juega una carta válida y pasa el turno al siguiente', () => {
    const red9 = card('red', '9');
    const state = playingGame({ hands: [[red9, ...filler(2)]] });

    playCard(state, 'p0', red9.id);

    expect(state.discard.at(-1)).toBe(red9);
    expect(state.players[0].hand).toHaveLength(2);
    expect(state.turn).toBe(1);
    expect(state.log).toEqual(['Ana jugó 9 rojo']);
  });

  it('rechaza cartas que no tiene, que no sirven o fuera de turno', () => {
    const blue1 = card('blue', '1');
    const state = playingGame({ hands: [[blue1, ...filler(2)]] });

    expect(() => playCard(state, 'p0', 'otra')).toThrow(
      'Esa carta ya no está en tu mano.',
    );
    expect(() => playCard(state, 'p0', blue1.id)).toThrow(
      'Esa carta no se puede jugar ahora.',
    );
    expect(() => playCard(state, 'p1', blue1.id)).toThrow('Espera tu turno.');
  });

  it('si la jugada no procede, no cambia nada', () => {
    const wild = card('black', 'wild');
    const state = playingGame({ hands: [[wild, ...filler(2)]] });

    expect(() => playCard(state, 'p0', wild.id)).toThrow('Elige un color.');

    expect(state.players[0].hand).toHaveLength(3);
    expect(state.discard).toHaveLength(1);
    expect(state.turn).toBe(0);
  });

  it('Salta brinca al siguiente jugador', () => {
    const skip = card('red', 'skip');
    const state = playingGame({ hands: [[skip, ...filler(2)]] });

    playCard(state, 'p0', skip.id);

    expect(state.turn).toBe(2);
    expect(state.log).toEqual(['Ana jugó Salta rojo y saltó a Beto']);
  });

  it('Reversa cambia el sentido con 3 o más jugadores', () => {
    const reverse = card('red', 'reverse');
    const state = playingGame({ hands: [[reverse, ...filler(2)]] });

    playCard(state, 'p0', reverse.id);

    expect(state.direction).toBe(-1);
    expect(state.turn).toBe(2);
  });

  it('Reversa con 2 jugadores funciona como Salta', () => {
    const reverse = card('red', 'reverse');
    const state = playingGame({
      names: ['Ana', 'Beto'],
      hands: [[reverse, ...filler(2)]],
    });

    playCard(state, 'p0', reverse.id);

    expect(state.turn).toBe(0);
  });

  it('un comodín deja el color elegido', () => {
    const wild = card('black', 'wild');
    const state = playingGame({ hands: [[wild, ...filler(2)]] });

    playCard(state, 'p0', wild.id, 'green');

    expect(state.color).toBe('green');
    expect(state.log).toEqual(['Ana jugó Comodín (eligió verde)']);
  });

  it('rechaza un color que no existe aunque llegue por la red', () => {
    const wild = card('black', 'wild');
    const state = playingGame({ hands: [[wild, ...filler(2)]] });

    expect(() => playCard(state, 'p0', wild.id, 'purple' as CardColor)).toThrow(
      'Elige un color.',
    );
  });

  it('con la regla de acumular, +2 deja el castigo al siguiente', () => {
    const plus2 = card('red', 'draw2');
    const state = playingGame({ hands: [[plus2, ...filler(2)]] });

    playCard(state, 'p0', plus2.id);

    expect(state.pending).toBe(2);
    expect(state.turn).toBe(1);
  });

  it('responder un +2 con un +4 suma el castigo', () => {
    const plus2 = card('red', 'draw2');
    const plus4 = card('black', 'wild4');
    const state = playingGame({
      hands: [
        [plus2, ...filler(2)],
        [plus4, ...filler(2)],
      ],
    });

    playCard(state, 'p0', plus2.id);
    playCard(state, 'p1', plus4.id, 'blue');

    expect(state.pending).toBe(6);
    expect(state.turn).toBe(2);
    expect(state.log.at(-1)).toBe(
      'Beto jugó Comodín +4 (eligió azul) (van +6 acumuladas)',
    );
  });

  it('con castigo pendiente explica qué se puede hacer', () => {
    const red1 = card('red', '1');
    const state = playingGame({
      top: card('red', 'draw2'),
      hands: [[red1, ...filler(2)]],
    });
    state.pending = 2;

    expect(() => playCard(state, 'p0', red1.id)).toThrow(
      'Tienes que acumular otro +2 o un +4, o robar.',
    );
  });

  it('sin acumular, +2 hace robar al siguiente y pierde su turno', () => {
    const plus2 = card('red', 'draw2');
    const state = playingGame({ hands: [[plus2, ...filler(2)]] });
    state.rules.stack = false;

    playCard(state, 'p0', plus2.id, undefined, zeroRng);

    expect(state.players[1].hand).toHaveLength(5);
    expect(state.pending).toBe(0);
    expect(state.turn).toBe(2);
  });

  it('se puede jugar la carta recién robada', () => {
    const red2 = card('red', '2');
    const state = playingGame({ deck: [red2] });
    drawCard(state, 'p0');

    playCard(state, 'p0', red2.id);

    expect(state.drawnCardId).toBeNull();
    expect(state.turn).toBe(1);
  });
});

describe('playCard y ¡Última!', () => {
  it('al quedar con una carta sin cantar, lo pueden atrapar', () => {
    const red1 = card('red', '1');
    const state = playingGame({ hands: [[red1, card('blue', '9')]] });

    playCard(state, 'p0', red1.id);

    expect(state.players[0].vulnerable).toBe(true);
  });

  it('si cantó antes de jugar, no lo pueden atrapar', () => {
    const red1 = card('red', '1');
    const state = playingGame({ hands: [[red1, card('blue', '9')]] });
    state.players[0].declared = true;

    playCard(state, 'p0', red1.id);

    expect(state.players[0].vulnerable).toBe(false);
  });

  it('jugar cierra la ventana para atrapar a otros', () => {
    const red1 = card('red', '1');
    const state = playingGame({ hands: [[red1, ...filler(2)]] });
    state.players[2].vulnerable = true;

    playCard(state, 'p0', red1.id);

    expect(state.players[2].vulnerable).toBe(false);
  });

  it('la última carta gana la ronda y su efecto ya no se aplica', () => {
    const plus2 = card('red', 'draw2');
    const state = playingGame({
      hands: [[plus2], [card('red', '3')], [card('green', '5')]],
    });

    playCard(state, 'p0', plus2.id);

    expect(state.status).toBe('roundover');
    expect(state.winner).toEqual({ playerId: 'p0', points: 8 });
    expect(state.pending).toBe(0);
    expect(state.log.at(-1)).toBe('Ana se quedó sin cartas y gana 8 puntos');
  });
});
