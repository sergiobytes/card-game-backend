import { card, playingGame } from '../testing/game.fixtures';
import { drawCard, passTurn } from './turn';

describe('drawCard', () => {
  it('si la carta robada no sirve, pasa el turno solo', () => {
    const state = playingGame({ deck: [card('blue', '9')] });

    drawCard(state, 'p0');

    expect(state.players[0].hand).toHaveLength(4);
    expect(state.turn).toBe(1);
    expect(state.log).toEqual(['Ana robó una carta y pasa']);
  });

  it('si la carta robada sirve, la deja lista para jugar', () => {
    const good = card('red', '2');
    const state = playingGame({ deck: [good] });

    drawCard(state, 'p0');

    expect(state.drawnCardId).toBe(good.id);
    expect(state.turn).toBe(0);
    expect(() => drawCard(state, 'p0')).toThrow(
      'Ya robaste: juega esa carta o pasa.',
    );
  });

  it('con "robar hasta poder jugar" sigue robando hasta encontrar una', () => {
    const good = card('red', '2');
    const state = playingGame({
      deck: [good, card('blue', '9'), card('blue', '8')],
    });
    state.rules.drawUntilPlayable = true;

    drawCard(state, 'p0');

    expect(state.players[0].hand).toHaveLength(6);
    expect(state.drawnCardId).toBe(good.id);
    expect(state.log).toEqual(['Ana robó 3 cartas']);
  });

  it('con castigo pendiente roba todo y pierde el turno', () => {
    const state = playingGame();
    state.pending = 4;

    drawCard(state, 'p0');

    expect(state.players[0].hand).toHaveLength(7);
    expect(state.pending).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.log).toEqual(['Ana robó 4 y pierde el turno']);
  });

  it('si no queda ninguna carta, pasa', () => {
    const state = playingGame({ deck: [] });

    drawCard(state, 'p0');

    expect(state.turn).toBe(1);
    expect(state.log[0]).toContain('no pudo robar');
  });

  it('no deja robar fuera de turno', () => {
    expect(() => drawCard(playingGame(), 'p1')).toThrow('Espera tu turno.');
  });
});

describe('passTurn', () => {
  it('solo se puede pasar después de robar', () => {
    const state = playingGame({ deck: [card('red', '2')] });

    expect(() => passTurn(state, 'p0')).toThrow('Primero roba una carta.');

    drawCard(state, 'p0');
    passTurn(state, 'p0');

    expect(state.turn).toBe(1);
    expect(state.drawnCardId).toBeNull();
    expect(state.log.at(-1)).toBe('Ana pasó');
  });
});

describe('drawCard y ¡Última!', () => {
  it('robar cierra la ventana para atrapar a otros', () => {
    const state = playingGame();
    state.players[2].vulnerable = true;

    drawCard(state, 'p0');

    expect(state.players[2].vulnerable).toBe(false);
  });
});
