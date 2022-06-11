import { load } from 'cheerio';
import express from 'express';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import * as appPaths from 'react-scripts/config/paths';

import { App } from '../App';

const port = process.env.PORT ?? '5000';
const basePath = new URL(appPaths.publicUrlOrPath, 'https://stub.domain').pathname;
const builtIndexHtml = path.join(appPaths.appBuild, 'index.html');
const clientHtml = fs.existsSync(builtIndexHtml) && fs.readFileSync(builtIndexHtml, 'utf8');

const server = express();
const router = express.Router();

router.use(express.static(appPaths.appBuild, { index: false }));

router.get('/api/ping', (req, res) => {
  setTimeout(() => res.send({ timestamp: Date.now() }), 2000);
});

router.get('*', (req, res) => {
  if (!clientHtml) {
    res.status(404).send('App html not built yet.');
    return;
  }

  const $ = load(clientHtml);
  $('#root').html(renderToString(<App />));
  res.send($.html());
});

server.use(basePath, router);
server.listen(port, () => console.log(`> Started on port ${port}`));
