import cheerio from 'cheerio';
import execa from 'execa';
import got from 'got';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import shelljs from 'shelljs';
import waitForExpect from 'wait-for-expect';
import { itSection, tKill, waitForStreamText } from '../utils';

const testTimeout = 8 * 60 * 1000;

const clientPort = 3000;
const serverPort = 5000;

describe('realworld use of wuzzle on react-scripts', () => {
  let browser!: Browser;
  beforeAll(async () => {
    shelljs.cd(path.join(__dirname, 'fixtures/react-scripts'));
    process.env.BROWSER = 'none';
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it(
    'works in dev mode',
    async () => {
      const page = await browser.newPage();
      const clientProc = execa('yarn', ['dev:client']);
      const serverProc = execa('yarn', ['dev:server']);

      try {
        await itSection('starts in dev mode', async () => {
          await Promise.all([
            waitForStreamText(clientProc.stdout!, 'Compiled successfully', 0.5 * testTimeout),
            waitForStreamText(serverProc.stdout!, `Started on port`, 0.8 * testTimeout),
          ]);
        });

        await itSection('visits app', async () => {
          await page.goto(`http://localhost:${clientPort}/`);
          await waitForExpect(async () => {
            expect(await page.content()).toEqual(expect.stringContaining('Key Configs Verifying'));
          });
        });

        await verifyComponentsCSR(page);
      } finally {
        await Promise.all([page.close(), tKill(clientProc.pid), tKill(serverProc.pid)]);
      }
    },
    testTimeout
  );

  it(
    'works in prod mode',
    async () => {
      itSection('builds app', () => {
        expect(execa.sync('yarn', ['build']).exitCode).toBe(0);
      });

      const ssrPage = await browser.newPage();
      const staticPage = await browser.newPage();
      const serverProc = execa('yarn', ['start']);
      try {
        await itSection('starts in prod mode', async () => {
          await waitForStreamText(serverProc.stdout!, `Started on port`, 0.1 * testTimeout);
        });

        let ssr$!: cheerio.Root;
        await itSection('visits app', async () => {
          ssr$ = cheerio.load(await got(`http://localhost:${serverPort}/`).text());
          expect(ssr$('#root').text()).toBeTruthy();
          await ssrPage.goto(`http://localhost:${serverPort}/`);
          await waitForExpect(async () => {
            expect(await ssrPage.content()).toEqual(
              expect.stringContaining('Key Configs Verifying')
            );
          });

          const static$ = cheerio.load(
            await got(`http://localhost:${serverPort}/index.html`).text()
          );
          expect(static$('#root').text()).toBeFalsy();
          await staticPage.goto(`http://localhost:${serverPort}/index.html`);
          await waitForExpect(async () => {
            expect(await staticPage.content()).toEqual(
              expect.stringContaining('Key Configs Verifying')
            );
          });
        });

        await verifyComponentsCSR(ssrPage);
        await verifyComponentsSSR(ssr$, staticPage);
      } finally {
        await Promise.all([ssrPage.close(), staticPage.close(), tKill(serverProc.pid)]);
      }
    },
    testTimeout
  );

  it(
    'works with regular testing',
    () => {
      expect(execa.sync('yarn', ['test', '--watchAll=false']).exitCode).toBe(0);
    },
    testTimeout
  );

  it(
    'works with end-to-end testing',
    async () => {
      itSection('builds app', () => {
        expect(execa.sync('yarn', ['build']).exitCode).toBe(0);
      });

      const serverProc = execa('yarn', ['start']);
      try {
        await itSection('starts in prod mode', async () => {
          await waitForStreamText(serverProc.stdout!, `Started on port`, 0.1 * testTimeout);
        });

        itSection('runs e2e specs', () => {
          expect(execa.sync('yarn', ['e2e']).exitCode).toBe(0);
        });
      } finally {
        await tKill(serverProc.pid);
      }
    },
    testTimeout
  );
});

async function verifyComponentsCSR(page: Page) {
  for (const [section, component, background] of [
    ['styles with global css', '#component-global-css', 'static/media/tile-grey'],
    ['styles with scoped css', '#component-scoped-css', 'static/media/tile-grey'],
    ['styles with global scss', '#component-global-scss', 'static/media/tile-red'],
    ['styles with scoped scss', '#component-scoped-scss', 'static/media/tile-red'],
    ['styles with global less', '#component-global-less', 'static/media/tile-blue'],
    ['styles with scoped less', '#component-scoped-less', 'static/media/tile-blue'],
  ]) {
    await itSection(section, async () => {
      const eh = (await page.$(component))!;
      expect(eh).toBeDefined();
      expect(await eh.evaluate(el => window.getComputedStyle(el).background)).toEqual(
        expect.stringContaining(background)
      );
    });
  }

  await itSection('renders svg as react component', async () => {
    const eh = (await page.$('#component-svg-as-rc'))!;
    expect(eh).toBeDefined();
    expect(await eh.evaluate(el => el.tagName)).toEqual('svg');
  });

  for (const [section, component, src] of [
    ['renders svg as url', '#component-svg-as-url', 'static/media/react-logo'],
    ['renders img as url', '#component-img-as-url', 'static/media/gh-octocat'],
  ]) {
    await itSection(section, async () => {
      const eh = (await page.$(component))!;
      expect(eh).toBeDefined();
      expect(await eh.evaluate(el => el.getAttribute('src'))).toEqual(expect.stringContaining(src));
    });
  }

  await itSection('fetches proxied http API', async () => {
    const eh = (await page.$('#component-proxied-http-api-result'))!;
    expect(eh).toBeDefined();
    await waitForExpect(async () => {
      expect(await eh.evaluate(el => el.innerHTML)).toEqual(
        expect.stringContaining('Server side timestamp is')
      );
    });
  });
}

async function verifyComponentsSSR(ssr$: cheerio.Root, staticPage: Page) {
  for (const [section, component, attribute] of [
    ['SSRs scoped css', '#component-scoped-css', 'class'],
    ['SSRs scoped scss', '#component-scoped-scss', 'class'],
    ['SSRs scoped less', '#component-scoped-less', 'class'],
    ['SSRs svg as url', '#component-svg-as-url', 'src'],
    ['SSRs img as url', '#component-img-as-url', 'src'],
  ]) {
    await itSection(section, async () => {
      const staticEh = (await staticPage.$(component))!;
      expect(staticEh).toBeDefined();
      expect(ssr$(component).attr(attribute)).toEqual(
        await staticEh.evaluate((el, attr) => el.getAttribute(attr), attribute)
      );
    });
  }

  await itSection('SSRs svg as react component', async () => {
    const staticEh = (await staticPage.$('#component-svg-as-rc'))!;
    expect(staticEh).toBeDefined();
    expect(ssr$('#component-svg-as-rc').html()).toEqual(
      await staticEh.evaluate(el => el.innerHTML)
    );
  });
}
