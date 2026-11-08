import { card, playingGame, zeroRng } from '../testing/game.fixtures';
import { drawCards } from './draw-cards';

describe('drawCards', () => {
  it('toma las cartas del final del mazo', () => {
    const a = card('red', '1');
    const b = card('red', '2');
    const state = playingGame({ deck: [a, b], hands: [[]] });
    const ana = state.players[0];

    expect(drawCards(state, ana, 2, zeroRng)).toEqual([b, a]);
    expect(ana.hand).toEqual([b, a]);
    expect(state.deck).toHaveLength(0);
  });

  it('si se acaba el mazo, rebaraja el descarte sin la carta de arriba', () => {
    const top = card('red', '5');
    const state = playingGame({ deck: [], top, hands: [[]] });
    state.discard = [card('green', '1'), card('green', '2'), top];

    expect(drawCards(state, state.players[0], 2, zeroRng)).toHaveLength(2);
    expect(state.discard).toEqual([top]);
    expect(state.log).toContain('Se volvió a barajar el mazo');
  });

  it('se detiene si ya no quedan cartas en ningún lado', () => {
    const state = playingGame({ deck: [], hands: [[]] });

    expect(drawCards(state, state.players[0], 3, zeroRng)).toEqual([]);
    expect(state.players[0].hand).toHaveLength(0);
  });
});

describe('drawCards y ¡Última!', () => {
  it('al tener más de una carta, se reinicia el ¡Última!', () => {
    const state = playingGame({ hands: [[card('red', '1')]] });
    const ana = state.players[0];
    ana.declared = true;
    ana.vulnerable = true;

    drawCards(state, ana, 1, zeroRng);

    expect(ana.declared).toBe(false);
    expect(ana.vulnerable).toBe(false);
  });
});
