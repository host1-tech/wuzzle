import { diff } from './diff';

describe('diff', () => {
  it('prints differences between inputs line by line', () => {
    const oldStr =
      'Odit voluptatem saepe porro veritatis sed minima.\n' +
      'Facere soluta et quo aut est nemo suscipit ut.\n' +
      'Magnam voluptas sed consequatur quo ad.';

    const newStr =
      'Odit voluptatem saepe porro veritatis sed minima.\n' +
      'Expedita vero ipsum.\n' +
      'Magnam voluptas sed consequatur quo ad.';

    const result = diff(oldStr, newStr);

    expect(result).toBe(
      'Odit voluptatem saepe porro veritatis sed minima.\n' +
        '-Facere soluta et quo aut est nemo suscipit ut.\n' +
        '+Expedita vero ipsum.\n' +
        'Magnam voluptas sed consequatur quo ad.'
    );
  });
});
