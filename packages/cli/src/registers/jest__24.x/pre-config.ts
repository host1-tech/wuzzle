import { DefinePlugin } from 'webpack';
import { EK_COMMAND_NAME } from '../../constants';

export default () => {
  const commandName = process.env[EK_COMMAND_NAME]!;

  if (commandName !== 'jest') return;

  return {
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
      }),
    ],
  };
};
