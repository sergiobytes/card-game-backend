import { createGame } from '../engine/players';
import { card, filler, playingGame } from '../testing/game.fixtures';
import { toPlayerView } from './player-view';

describe('toPlayerView', () => {
  it('muestra tu mano completa y de los demás solo cuántas cartas tienen', () => {
    const mine = [card('red', '1'), card('blue', '2')];
    const state = playingGame({ hands: [mine, filler(4)] });

    const view = toPlayerView(state, 'ABCD', 'p0', ['p0', 'p1']);

    expect(view.me.hand).toEqual(mine);
    expect(view.players[1]).toEqual({
      id: 'p1',
      name: 'Beto',
      cardCount: 4,
      score: 0,
      declared: false,
      vulnerable: false,
      online: true,
    });
    expect(view.players[2].online).toBe(false);
    expect(JSON.stringify(view.players)).not.toContain('"hand"');
  });

  it('el mazo no viaja, solo cuántas cartas quedan', () => {
    const view = toPlayerView(playingGame(), 'ABCD', 'p0', []);

    expect(view.deckCount).toBe(20);
    expect(view).not.toHaveProperty('deck');
  });

  it('la carta recién robada solo la ve quien tiene el turno', () => {
    const state = playingGame();
    state.drawnCardId = 'robada';

    expect(toPlayerView(state, 'ABCD', 'p0', []).drawnCardId).toBe('robada');
    expect(toPlayerView(state, 'ABCD', 'p1', []).drawnCardId).toBeNull();
  });

  it('incluye la carta de arriba, la anterior y de quién es el turno', () => {
    const before = card('red', '3');
    const top = card('red', '4');
    const state = playingGame({ turn: 2 });
    state.discard = [before, top];

    const view = toPlayerView(state, 'ABCD', 'p0', []);

    expect(view.topCard).toBe(top);
    expect(view.previousCard).toBe(before);
    expect(view.turnPlayerId).toBe('p2');
  });

  it('en la sala de espera no hay turno ni cartas en la mesa', () => {
    const view = toPlayerView(createGame('h', 'Ana'), 'ABCD', 'h', ['h']);

    expect(view.turnPlayerId).toBeNull();
    expect(view.topCard).toBeNull();
    expect(view.previousCard).toBeNull();
  });

  it('quien espera la próxima ronda se ve a sí mismo en espera', () => {
    const state = playingGame();
    state.waiting = [{ ...state.players[0], id: 'w1', name: 'Dani', hand: [] }];

    const view = toPlayerView(state, 'ABCD', 'w1', ['w1']);

    expect(view.me.isWaiting).toBe(true);
    expect(view.waiting).toEqual([{ id: 'w1', name: 'Dani', online: true }]);
  });

  it('falla si quien pide la vista no está en la sala', () => {
    expect(() => toPlayerView(playingGame(), 'ABCD', 'nadie', [])).toThrow();
  });
});
