// Render halaman animasi (window.render(t)) menjadi MP4 1080x1920 frame demi frame.
// Pemakaian: node render_reels.js <file.html> <output.mp4> [fps] [--frames t1,t2,...  (PNG pratinjau)]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const [html, out, fpsArg, flag, list] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const durasi = await page.evaluate(() => window.DURASI);

  if (flag === '--frames') {
    for (const t of list.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: `${out}-${String(t).replace('.', '_')}.png` });
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(durasi * fps);
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('selesai:', out);
})();
