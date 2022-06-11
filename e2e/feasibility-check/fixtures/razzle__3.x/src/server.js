import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();
server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', (req, res) =>
    res.status(200).send(`
<!doctype html>
<html lang="">
  <head>
    <meta charset="utf-8" />
    ${assets.client.css ? `<link rel="stylesheet" href="${assets.client.css}">` : ''}
  </head>
  <body>
    <div id="root">${renderToString(<App />)}</div>
    ${assets.client.js ? `<script src="${assets.client.js}"></script>` : ''}
  </body>
</html>`)
  );

export default server;
