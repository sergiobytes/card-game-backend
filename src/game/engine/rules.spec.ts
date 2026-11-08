import { card, playingGame } from '../testing/game.fixtures';
import { canPlay, topCard } from './rules';

describe('topCard', () => {
  it('es la última carta del descarte', () => {
    const state = playingGame();
    const last = card('green', '2');
    state.discard.push(last);

    expect(topCard(state)).toBe(last);
  });
});

describe('canPlay', () => {
  it('permite una carta del mismo color', () => {
    expect(canPlay(playingGame(), card('red', '9'))).toBe(true);
  });

  it('permite el mismo número aunque cambie el color', () => {
    expect(canPlay(playingGame(), card('blue', '5'))).toBe(true);
  });

  it('rechaza una carta que no coincide en color ni en número', () => {
    expect(canPlay(playingGame(), card('blue', '9'))).toBe(false);
  });

  it('permite la misma acción aunque cambie el color', () => {
    const state = playingGame({ top: card('red', 'skip') });

    expect(canPlay(state, card('green', 'skip'))).toBe(true);
    expect(canPlay(state, card('green', 'reverse'))).toBe(false);
  });

  it('los comodines siempre se pueden jugar', () => {
    const state = playingGame();

    expect(canPlay(state, card('black', 'wild'))).toBe(true);
    expect(canPlay(state, card('black', 'wild4'))).toBe(true);
  });

  it('sobre un comodín solo cuenta el color elegido', () => {
    const state = playingGame({ top: card('black', 'wild') });
    state.color = 'green';

    expect(canPlay(state, card('green', '1'))).toBe(true);
    expect(canPlay(state, card('red', '1'))).toBe(false);
  });

  it('con un +2 pendiente solo se puede responder con +2 o +4', () => {
    const state = playingGame({ top: card('red', 'draw2') });
    state.pending = 2;

    expect(canPlay(state, card('blue', 'draw2'))).toBe(true);
    expect(canPlay(state, card('black', 'wild4'))).toBe(true);
    expect(canPlay(state, card('red', '3'))).toBe(false);
    expect(canPlay(state, card('black', 'wild'))).toBe(false);
  });

  it('con un +4 pendiente solo se puede responder con otro +4', () => {
    const state = playingGame({ top: card('black', 'wild4') });
    state.pending = 4;

    expect(canPlay(state, card('red', 'draw2'))).toBe(false);
    expect(canPlay(state, card('black', 'wild4'))).toBe(true);
  });

  it('después de robar solo se puede jugar la carta robada', () => {
    const state = playingGame();
    state.drawnCardId = 'robada';

    expect(canPlay(state, card('red', '1', 'robada'))).toBe(true);
    expect(canPlay(state, card('red', '2'))).toBe(false);
  });

  it('la carta robada también tiene que coincidir con la mesa', () => {
    const state = playingGame();
    state.drawnCardId = 'robada';

    expect(canPlay(state, card('blue', '1', 'robada'))).toBe(false);
  });
});
