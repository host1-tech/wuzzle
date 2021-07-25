const { getGreeting } = require('.');

it('Hi, Jest 26.x.', () => {
  expect(getGreeting()).toBeTruthy();
});
