const assert = require('assert');
const { getGreeting } = require('.');

it('Hi, Mocha 7.x.', () => {
  assert(Boolean(getGreeting()));
  assert(process.env.NODE_ENV === 'test');
});
