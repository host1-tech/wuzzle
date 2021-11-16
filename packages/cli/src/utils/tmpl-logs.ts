import { grey, yellow } from 'chalk';
import { template } from 'lodash';

export const tmplLogForGlobalResolving = template(
  yellow(`Command '<%= commandName %>' is resolved from globals:`, grey('<%= commandPath %>'))
);
