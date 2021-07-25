const assert = require('assert');
const { getGreeting } = require('.');

it('Hi, Mocha 8.x.', () => {
  assert(Boolean(getGreeting()));
});
