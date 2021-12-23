import { mocked } from 'ts-jest/utils';
import { inspect } from 'util';
import { stringify } from './stringify';

const inspectOutput = 'inspectOutput';

jest.mock('util');

mocked(inspect).mockReturnValue(inspectOutput);

describe('stringify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with preset options', () => {
    const input = { regular: /expression/ };
    const output = stringify(input);
    expect(output).toBe(inspectOutput);
    expect(inspect).toBeCalledWith(input, { depth: Infinity });
  });

  it('works with custom options', () => {
    const input = { regular: /expression/ };
    const output = stringify(input, { depth: 2, colors: true });
    expect(output).toBe(inspectOutput);
    expect(inspect).toBeCalledWith(input, { depth: 2, colors: true });
  });
});
