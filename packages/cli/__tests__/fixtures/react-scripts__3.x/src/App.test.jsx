import React from 'react';
import { render } from 'react-dom';
import App from './App';

describe('<App />', () => {
  it('renders without exploding', () => {
    render(<App />, document.createElement('div'));
  });
});
