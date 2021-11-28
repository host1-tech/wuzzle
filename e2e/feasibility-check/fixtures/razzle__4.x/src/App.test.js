import React from 'react';
import { render } from 'react-dom';
import App from './App';

describe('<App />', () => {
  test('Hi, Razzle 4.x.', () => {
    render(<App />, document.createElement('div'));
  });
});
