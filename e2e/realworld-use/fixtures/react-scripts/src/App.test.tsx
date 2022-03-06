import { render } from '@testing-library/react';
import React from 'react';
import { App } from './App';

test('does not explode', () => {
  expect(() => render(<App />)).not.toThrow();
});
