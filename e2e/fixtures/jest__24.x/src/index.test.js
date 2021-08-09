const { getGreeting } = require('.');

it('Hi, Jest 24.x.', () => {
  expect(getGreeting()).toBeTruthy();
  expect(process.env.NODE_ENV).toBe('test');
});
