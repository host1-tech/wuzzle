import { cloneDeep, repeat, times } from 'lodash';
import { inspect } from 'util';
import { stringify, stringifyDefaultOptions, StringifyOptions } from './stringify';

describe('stringify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with preset options', () => {
    const input = { regular: /expression/ };
    expect(stringify(input)).toBe(inspect(input, stringifyDefaultOptions));
  });

  it('works with custom options', () => {
    const input = { regular: /expression/ };
    const options: StringifyOptions = { depth: 2, colors: true };
    expect(stringify(input, options)).toBe(inspect(input, options));
  });

  it('reduces overlong w/o side effects', () => {
    const { overlongThreshold } = stringifyDefaultOptions;
    const normlong = [
      'lorem ipsum',
      0,
      true,
      null,
      undefined,
      Symbol(),
      () => {},
      {},
      [],
      times(overlongThreshold).map(() => '*'),
    ];
    const input = [
      ...normlong,
      repeat('*', overlongThreshold),
      { [repeat('*', overlongThreshold)]: '' },
    ];
    eval(`input.push(function ${repeat('_', overlongThreshold)}(){})`);
    const inputSnapshot = cloneDeep(input);
    expect(stringify(input)).toBe(
      inspect([...normlong, '...', '...', '...'], stringifyDefaultOptions)
    );
    expect(input).toEqual(inputSnapshot);
  });
});
