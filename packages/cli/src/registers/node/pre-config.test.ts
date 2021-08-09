import { get } from 'lodash';
import { EK_COMMAND_NAME } from '../../constants';
import preConfig from './pre-config';

describe('preConfig', () => {
  beforeEach(() => {
    delete process.env[EK_COMMAND_NAME];
  });

  it('returns empty on unknown command name given', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    expect(preConfig()).toEqual(undefined);
  });

  it('returns testing config on mocha command given', () => {
    process.env[EK_COMMAND_NAME] = 'mocha';
    const webpackConfig = preConfig();
    expect(get(webpackConfig, 'plugins')).toHaveLength(1);
  });
});
