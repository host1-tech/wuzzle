const assert = require('assert');
const { getGreeting } = require('.');

it('contains greetings', () => {
  assert(getGreeting() == 'Hi, Mocha.');
});
