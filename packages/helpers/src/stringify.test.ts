import stringify from './stringify';

describe('stringify', () => {
  it('works with regular expression', () => {
    const result = stringify({ regular: /expression/ });
    expect(result).toContain('"regular": /expression/');
  });

  it('works with function', () => {
    const result = stringify({
      foo: function () {
        return 0;
      },
    });
    expect(result).toContain('"foo": function ()');
    expect(result).toContain('return 0;');
  });

  it('works with space argument', () => {
    const result = stringify({ value: 0 }, 4);
    expect(result).toContain('    ');
  });
});
