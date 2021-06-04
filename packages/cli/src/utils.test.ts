import { areArgsParsableByFlags } from './utils';

describe('areArgsParsableByFlags', () => {
  it('works with boolean args and flags', () => {
    [
      { args: ['--version'], flags: ['--version'], result: true },
      { args: ['--help'], flags: ['--version'], result: false },
      { args: ['-V'], flags: ['-V,--version'], result: true },
      { args: ['-H'], flags: ['-V,--version'], result: false },
      { args: ['--version'], flags: ['-V,--version'], result: true },
      { args: ['--help'], flags: ['-V,--version'], result: false },
    ].forEach(({ args, flags, result }) => {
      expect(areArgsParsableByFlags({ args, flags })).toBe(result);
    });
  });

  it('works with value-specified args and flags', () => {
    [
      // Space split
      { args: ['--size', 'small'], flags: ['--size <value>'], result: true },
      { args: ['--help', 'small'], flags: ['--size <value>'], result: false },
      { args: ['-S', 'small'], flags: ['-S,--size <value>'], result: true },
      { args: ['-H', 'small'], flags: ['-S,--size <value>'], result: false },
      { args: ['--size', 'small'], flags: ['-S,--size <value>'], result: true },
      { args: ['--help', 'small'], flags: ['-S,--size <value>'], result: false },
      // Equal sign split
      { args: ['--size=small'], flags: ['--size <value>'], result: true },
      { args: ['--help=small'], flags: ['--size <value>'], result: false },
      { args: ['-S=small'], flags: ['-S,--size <value>'], result: true },
      { args: ['-H=small'], flags: ['-S,--size <value>'], result: false },
      { args: ['--size=small'], flags: ['-S,--size <value>'], result: true },
      { args: ['--help=small'], flags: ['-S,--size <value>'], result: false },
      // Omitted value
      { args: ['--size'], flags: ['--size <value>'], result: true },
      { args: ['--help'], flags: ['--size <value>'], result: false },
      { args: ['-S'], flags: ['-S,--size <value>'], result: true },
      { args: ['-H'], flags: ['-S,--size <value>'], result: false },
      { args: ['--size'], flags: ['-S,--size <value>'], result: true },
      { args: ['--help'], flags: ['-S,--size <value>'], result: false },
    ].forEach(({ args, flags, result }) => {
      expect(areArgsParsableByFlags({ args, flags })).toBe(result);
    });
  });

  it('tolerates empty strings in args and flags', () => {
    [
      // Boolean
      { args: ['', '--version'], flags: ['--version'], result: true },
      { args: ['', '--help'], flags: ['--version'], result: false },
      { args: ['--version'], flags: ['', '--version'], result: true },
      { args: ['--help'], flags: ['', '--version'], result: false },
      // Value-specified
      { args: ['', '--size', 'small'], flags: ['--size <value>'], result: true },
      { args: ['', '--help', 'small'], flags: ['--size <value>'], result: false },
      { args: ['--size', 'small'], flags: ['', '--size <value>'], result: true },
      { args: ['--help', 'small'], flags: ['', '--size <value>'], result: false },
    ].forEach(({ args, flags, result }) => {
      expect(areArgsParsableByFlags({ args, flags })).toBe(result);
    });
  });
});
