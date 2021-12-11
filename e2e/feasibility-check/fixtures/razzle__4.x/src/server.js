import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const cssLinksFromAssets = (assets, entrypoint) => {
  return assets[entrypoint]
    ? assets[entrypoint].css
      ? assets[entrypoint].css.map(asset => `<link rel="stylesheet" href="${asset}">`).join('')
      : ''
    : '';
};

const jsScriptTagsFromAssets = (assets, entrypoint, extra = '') => {
  return assets[entrypoint]
    ? assets[entrypoint].js
      ? assets[entrypoint].js.map(asset => `<script src="${asset}"${extra}></script>`).join('')
      : ''
    : '';
};

export const renderApp = (req, res) => {
  const markup = renderToString(<App />);
  const html = `
<!doctype html>
<html lang="">
  <head>
    <meta charSet='utf-8' />
    ${cssLinksFromAssets(assets, 'client')}
  </head>
  <body>
    <div id="root">${markup}</div>
    ${jsScriptTagsFromAssets(assets, 'client', ' defer crossorigin')}
  </body>
</html>`;
  return { html };
};

const server = express();

server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', (req, res) => {
    const { html } = renderApp(req, res);
    res.send(html);
  });

export default server;
