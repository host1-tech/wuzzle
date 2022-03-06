import React, { FC } from 'react';
import reactLogoUrl, { ReactComponent as ReactLogo } from '../assets/react-logo.svg';

export const Svg: FC = () => {
  return (
    <div>
      <h2>Svg rendering</h2>
      <h3>- as react component</h3>
      <ReactLogo id="component-svg-as-rc" style={{ width: '256px' }} />
      <h3>- as URL</h3>
      <img
        id="component-svg-as-url"
        style={{ width: '256px' }}
        alt="react logo"
        src={reactLogoUrl}
      />
    </div>
  );
};
