import { createRuleSetConditionTest, doesLoaderMatch } from './common-tools';

describe('createRuleSetConditionTest', () => {
  it('creates workable tester on valid fields', () => {
    const test = createRuleSetConditionTest({ test: /\.x$/ });
    expect(test('index.x')).toBe(true);
  });

  it('creates fallback tester on bad fields', () => {
    const test = createRuleSetConditionTest({});
    expect(test('index.x')).toBe(false);
  });
});

describe('doesLoaderMatch', () => {
  it('matches none on any param absence', () => {
    expect(doesLoaderMatch()).toBe(false);
    expect(doesLoaderMatch('/path/to/a-loader')).toBe(false);
  });

  it('returns true on loader matched', () => {
    expect(doesLoaderMatch('/path/to/a-loader', 'a-loader')).toBe(true);
  });

  it('returns false on loader partially matched', () => {
    expect(doesLoaderMatch('/path/to/a-loader', 'loader')).toBe(false);
  });

  it('works with win path input', () => {
    expect(doesLoaderMatch('\\path\\to\\a-loader', 'a-loader')).toBe(true);
  });

  it('works with bang mark', () => {
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader')).toBe(true);
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader!b-loader')).toBe(true);
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader!b-loader!c-loader')).toBe(false);
  });

  it('works with question mark', () => {
    expect(doesLoaderMatch('a-loader?foo', 'a-loader')).toBe(true);
  });
});
