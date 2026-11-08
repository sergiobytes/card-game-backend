import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it('separa por comas, recorta espacios y quita la diagonal final', () => {
    expect(
      parseCorsOrigins(' http://localhost:3001 , https://ana.github.io/ ,'),
    ).toEqual(['http://localhost:3001', 'https://ana.github.io']);
  });

  it('sin la variable no permite ningún origen', () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
  });
});
