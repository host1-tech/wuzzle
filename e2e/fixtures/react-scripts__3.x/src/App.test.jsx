import React from 'react';
import { render } from 'react-dom';
import App from './App';

describe('<App />', () => {
  it('Hi, CRA 3.x.', () => {
    render(<App />, document.createElement('div'));
  });
});
