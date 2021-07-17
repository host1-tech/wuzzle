import { areArgsParsableByFlags } from './are-args-parsable-by-flags';

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

  describe('value-specified args and flags', () => {
    it('works with space split value', () => {
      [
        { args: ['--size', 'small'], flags: ['--size <value>'], result: true },
        { args: ['--help', 'small'], flags: ['--size <value>'], result: false },
        { args: ['-S', 'small'], flags: ['-S,--size <value>'], result: true },
        { args: ['-H', 'small'], flags: ['-S,--size <value>'], result: false },
        { args: ['--size', 'small'], flags: ['-S,--size <value>'], result: true },
        { args: ['--help', 'small'], flags: ['-S,--size <value>'], result: false },
      ].forEach(({ args, flags, result }) => {
        expect(areArgsParsableByFlags({ args, flags })).toBe(result);
      });
    });

    it('works with equal sign split value', () => {
      [
        { args: ['--size=small'], flags: ['--size <value>'], result: true },
        { args: ['--help=small'], flags: ['--size <value>'], result: false },
        { args: ['-S=small'], flags: ['-S,--size <value>'], result: true },
        { args: ['-H=small'], flags: ['-S,--size <value>'], result: false },
        { args: ['--size=small'], flags: ['-S,--size <value>'], result: true },
        { args: ['--help=small'], flags: ['-S,--size <value>'], result: false },
      ].forEach(({ args, flags, result }) => {
        expect(areArgsParsableByFlags({ args, flags })).toBe(result);
      });
    });

    it('works with omitted value', () => {
      [
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
  });

  describe('toleration on empty strings', () => {
    it('stil works with boolean args and flags', () => {
      [
        { args: ['', '--version'], flags: ['--version'], result: true },
        { args: ['', '--help'], flags: ['--version'], result: false },
        { args: ['--version'], flags: ['', '--version'], result: true },
        { args: ['--help'], flags: ['', '--version'], result: false },
      ].forEach(({ args, flags, result }) => {
        expect(areArgsParsableByFlags({ args, flags })).toBe(result);
      });
    });

    it('stil works with value-specified args and flags', () => {
      [
        { args: ['', '--size', 'small'], flags: ['--size <value>'], result: true },
        { args: ['', '--help', 'small'], flags: ['--size <value>'], result: false },
        { args: ['--size', 'small'], flags: ['', '--size <value>'], result: true },
        { args: ['--help', 'small'], flags: ['', '--size <value>'], result: false },
      ].forEach(({ args, flags, result }) => {
        expect(areArgsParsableByFlags({ args, flags })).toBe(result);
      });
    });
  });
});
