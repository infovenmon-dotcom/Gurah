import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const out = process.argv[2] || '/tmp/shot.png';
const url = process.argv[3] || 'http://localhost:4321/?lang=eu';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1200);
// ¿hay scroll horizontal? (síntoma del bug)
const metrics = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyW: document.body.scrollWidth,
}));
console.log('scrollWidth', metrics.scrollW, 'clientWidth', metrics.clientW, 'overflowX?', metrics.scrollW > metrics.clientW + 1);
await page.screenshot({ path: out, fullPage: false });
console.log('saved', out);
await browser.close();
