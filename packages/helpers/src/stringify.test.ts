import util from 'util';
import stringify from './stringify';

const mockedInspect = jest.spyOn(util, 'inspect');

const inspectOutput = 'inspectOutput';
mockedInspect.mockReturnValue(inspectOutput);

describe('stringify', () => {
  afterEach(() => mockedInspect.mockClear());

  it('works with preset options', () => {
    const input = { regular: /expression/ };
    const output = stringify(input);
    expect(output).toBe(inspectOutput);
    expect(mockedInspect).toBeCalledWith(input, { colors: true, depth: Infinity });
  });

  it('works with custom options', () => {
    const input = { regular: /expression/ };
    const output = stringify(input, { depth: 2, showHidden: true });
    expect(output).toBe(inspectOutput);
    expect(mockedInspect).toBeCalledWith(input, { colors: true, depth: 2, showHidden: true });
  });
});
