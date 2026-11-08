import { card, playingGame } from '../testing/game.fixtures';
import { GameRuleError } from './game-rule.error';
import {
  canPlay,
  describeCard,
  pushLog,
  requireTurn,
  stepIndex,
  topCard,
} from './rules';

describe('topCard', () => {
  it('es la última carta del descarte', () => {
    const state = playingGame();
    const last = card('green', '2');
    state.discard.push(last);

    expect(topCard(state)).toBe(last);
  });

  it('falla si no hay cartas en la mesa', () => {
    const state = playingGame();
    state.discard = [];

    expect(() => topCard(state)).toThrow('La pila de descarte está vacía.');
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

describe('stepIndex', () => {
  it('da la vuelta a la mesa en ambos sentidos', () => {
    const state = playingGame({ turn: 2 });

    expect(stepIndex(state)).toBe(0);
    expect(stepIndex(state, 2)).toBe(1);

    state.turn = 0;
    state.direction = -1;
    expect(stepIndex(state)).toBe(2);
  });
});

describe('requireTurn', () => {
  it('devuelve al jugador en turno y rechaza a los demás', () => {
    const state = playingGame({ turn: 1 });

    expect(requireTurn(state, 'p1').name).toBe('Beto');
    expect(() => requireTurn(state, 'p0')).toThrow('Espera tu turno.');
  });

  it('rechaza jugar si la ronda no está en curso', () => {
    const state = playingGame();
    state.status = 'roundover';

    expect(() => requireTurn(state, 'p0')).toThrow(GameRuleError);
  });
});

describe('pushLog', () => {
  it('conserva solo los últimos 6 mensajes', () => {
    const state = playingGame();

    for (let i = 0; i < 8; i++) pushLog(state, `m${i}`);

    expect(state.log).toEqual(['m2', 'm3', 'm4', 'm5', 'm6', 'm7']);
  });
});

describe('describeCard', () => {
  it('nombra cada tipo de carta en español', () => {
    expect(describeCard(card('red', '7'), 'red')).toBe('7 rojo');
    expect(describeCard(card('blue', 'skip'), 'blue')).toBe('Salta azul');
    expect(describeCard(card('green', 'reverse'), 'green')).toBe(
      'Reversa verde',
    );
    expect(describeCard(card('yellow', 'draw2'), 'yellow')).toBe('+2 amarillo');
    expect(describeCard(card('black', 'wild'), 'blue')).toBe(
      'Comodín (eligió azul)',
    );
    expect(describeCard(card('black', 'wild4'), 'red')).toBe(
      'Comodín +4 (eligió rojo)',
    );
  });
});
