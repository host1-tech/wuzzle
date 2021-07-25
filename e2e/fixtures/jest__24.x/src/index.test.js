const { getGreeting } = require('.');

it('Hi, Jest 24.x.', () => {
  expect(getGreeting()).toBeTruthy();
});
