import { cloneDeep } from 'lodash';
import serializeJavascript from 'serialize-javascript';

import { purifiedNative, serialize } from './serialize';

describe('serialize', () => {
  it('works with function input', () => {
    const input = () => '059e';
    expect(serialize(input)).toEqual(expect.stringContaining('059e'));
  });

  it('replaces native functions w/o side effects', () => {
    const input = { log: console.log };
    const inputSnapshot = cloneDeep(input);
    expect(serialize(input)).toEqual(serializeJavascript({ log: purifiedNative }));
    expect(input).toEqual(inputSnapshot);
  });
});

describe('purifiedNative', () => {
  it('works', () => {
    purifiedNative();
  });
});
