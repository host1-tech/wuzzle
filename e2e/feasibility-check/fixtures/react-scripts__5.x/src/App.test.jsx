import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

describe('<App />', () => {
  it('Hi, CRA 5.x.', () => {
    const root = ReactDOM.createRoot(document.createElement('div'));
    root.render(<App />);
  });
});
