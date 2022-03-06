import { Typography } from 'antd';
import React, { FC } from 'react';
import {
  GlobalCss,
  GlobalLess,
  GlobalScss,
  Img,
  ProxiedHttpApi,
  ScopedCss,
  ScopedLess,
  ScopedScss,
  Svg,
} from './components';

export const App: FC = () => {
  return (
    <Typography>
      <h1>Key Configs Verifying</h1>
      <GlobalCss />
      <ScopedCss />
      <GlobalScss />
      <ScopedScss />
      <GlobalLess />
      <ScopedLess />
      <Svg />
      <Img />
      <ProxiedHttpApi />
    </Typography>
  );
};
