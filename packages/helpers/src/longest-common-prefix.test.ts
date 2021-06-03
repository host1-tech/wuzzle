import { longestCommonPrefix } from './longest-common-prefix';

describe('longestCommonPrefix', () => {
  it('calculates longest common prefix from input strings', () => {
    const strs = ['path/to/pdf', 'path/to/log'];
    expect(longestCommonPrefix(strs)).toBe('path/to/');
  });

  it('outputs empty string when zero length input strings', () => {
    expect(longestCommonPrefix([])).toBe('');
  });
});
