import { cryptoRng, Rng, shuffle } from './random';

describe('shuffle', () => {
  it('con un rng que siempre da 0, produce un orden predecible', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it('pide un número al azar por posición, incluyendo la actual en el rango', () => {
    const maxes: number[] = [];
    const spy: Rng = (max) => {
      maxes.push(max);
      return 0;
    };

    shuffle([1, 2, 3, 4], spy);
    expect(maxes).toEqual([4, 3, 2]);
  });

  it('no pierde ni duplica elementos', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);

    const result = shuffle([...items]);

    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('revuelve el mismo arreglo que recibe', () => {
    const items = [1, 2, 3];

    expect(shuffle(items)).toBe(items);
  });
});

describe('cryptoRng', () => {
  it('devuelve enteros entre 0 y max - 1', () => {
    for (let i = 0; i < 100; i++) {
      const n = cryptoRng(4);

      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(4);
    }
  });
});
