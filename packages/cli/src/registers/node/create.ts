import ejs from 'ejs';
import glob from 'glob';
import pFilter from 'p-filter';
import pMap from 'p-map';
import path from 'path';
import pify from 'pify';
import { v4 as uuidv4 } from 'uuid';
import shelljs from 'shelljs';

const fs = pify(require('fs'));

const nodeRegisterBasePath = path.resolve(__dirname, 'index');

const tmplString = `
const { addHook } = require('pirates');
const { transform } = require('../transform');

const piratesOptions = {
  exts: [
    <% exts.forEach(ext => { %>'<%=ext%>', <% }); %>
  ],
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);
`;

let tmplRender: ejs.TemplateFunction;

export default async function createNodeRegister(exts: string[]): Promise<string> {
  ensureTmplRender();
  cleanOldRegisterFiles();
  shelljs.mkdir('-p', nodeRegisterBasePath);

  const registerString = tmplRender({ exts });
  const registerPath = path.resolve(nodeRegisterBasePath, `${uuidv4()}.js`);
  await fs.writeFile(registerPath, registerString);

  return registerPath;
}

function ensureTmplRender() {
  if (!tmplRender) {
    tmplRender = ejs.compile(tmplString);
  }
  return tmplRender;
}

async function cleanOldRegisterFiles() {
  const oldRegisterFiles: string[] = await pify(glob)(
    path.resolve(nodeRegisterBasePath, '**/*.js')
  );

  const oldRegisterFilesToClean = await pFilter(oldRegisterFiles, async p => {
    const s = await fs.stat(p);
    return Date.now() - s.birthtime.getTime() > 30 * 1000;
  });

  await pMap(oldRegisterFilesToClean, p => fs.unlink(p));
}
