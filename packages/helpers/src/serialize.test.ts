import { cloneDeep } from 'lodash';
import serializeJavascript from 'serialize-javascript';
import { serialize, purifiedNative } from './serialize';

describe('serialize', () => {
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
