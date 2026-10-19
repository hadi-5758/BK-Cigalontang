// Render setiap <section class="slide"> di file HTML desain menjadi PNG 1080x1350.
// Pemakaian: node render_carousel.js <file.html> <folder-output>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [html, outDir] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.body.classList.add('render'));
  await page.evaluate(() => document.fonts.ready);
  const slides = await page.$$('section.slide');
  for (const s of slides) {
    const id = await s.getAttribute('id');
    await s.screenshot({ path: path.join(outDir, `${id}.png`) });
    console.log(id);
  }
  await browser.close();
})();
