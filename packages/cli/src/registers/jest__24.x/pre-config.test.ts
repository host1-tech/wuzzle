import { get } from 'lodash';
import { EK_COMMAND_NAME } from '../../constants';
import preConfig from './pre-config';

describe('preConfig', () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
    delete process.env[EK_COMMAND_NAME];
  });

  it('returns empty on unknown command name given', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    expect(preConfig()).toEqual(undefined);
  });

  it('returns testing config with default NODE_ENV on command given and NODE_ENV not set', () => {
    process.env[EK_COMMAND_NAME] = 'jest';
    const webpackConfig = preConfig();
    expect(get(webpackConfig, 'plugins.0.definitions')).toMatchObject({
      'process.env.NODE_ENV': '"test"',
    });
  });

  it('returns testing config with specified NODE_ENV on command given and NODE_ENV set', () => {
    const nodeEnv = 'testing';
    process.env.NODE_ENV = nodeEnv;
    process.env[EK_COMMAND_NAME] = 'jest';
    const webpackConfig = preConfig();
    expect(get(webpackConfig, 'plugins.0.definitions')).toMatchObject({
      'process.env.NODE_ENV': `"${nodeEnv}"`,
    });
  });
});
