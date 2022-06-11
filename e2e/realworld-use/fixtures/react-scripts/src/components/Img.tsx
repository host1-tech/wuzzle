import React, { FC } from 'react';

import ghOctocatPng from '../assets/gh-octocat.png';

export const Img: FC = () => {
  return (
    <div>
      <h2>Img rendering as URL</h2>
      <img
        id="component-img-as-url"
        style={{ width: '256px' }}
        alt="gh octocat"
        src={ghOctocatPng}
      />
    </div>
  );
};
