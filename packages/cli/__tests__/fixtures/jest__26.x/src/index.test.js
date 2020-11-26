const { getGreeting } = require('.');

it('contains greetings', () => {
  expect(getGreeting()).toBeTruthy();
});
