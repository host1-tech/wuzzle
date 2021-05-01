import stringify from './stringify';

describe('stringify', () => {
  it('works with regular expression', () => {
    const result = stringify({ regular: /expression/ });
    expect(result).toContain('"regular": /expression/');
  });

  it('works with plain function', () => {
    const result = stringify({
      foo: function () {
        return 0;
      },
    });
    expect(result).toContain('"foo": [Function: foo]');
  });

  it('works with named function', () => {
    const result = stringify({
      foo: function bar() {
        return 0;
      },
    });
    expect(result).toContain('"foo": [Function: bar]');
  });

  it('works with arrow function', () => {
    const result = stringify({
      foo: () => {
        return 0;
      },
    });
    expect(result).toContain('"foo": [Function: foo]');
  });

  it('works with member function', () => {
    const result = stringify({
      foo() {
        return 0;
      },
    });
    expect(result).toContain('"foo": [Function: foo]');
  });

  it('works with class', () => {
    const result = stringify({
      foo: class bar {},
    });

    expect(result).toContain('"foo": [Function: bar]');
  });

  it('works with space argument', () => {
    const result = stringify({ value: 0 }, 4);
    expect(result).toContain('    ');
  });
});
