import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ASSETS_DIR = path.resolve(process.cwd(), 'docs/assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Chrome at:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1150'],
    defaultViewport: { width: 1280, height: 1150, deviceScaleFactor: 2 },
  });

  try {
    const page = await browser.newPage();
    console.log('🌐 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for Streaming panel elements to appear
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('streaming en tiempo real resiliente'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Click "Iniciar Streaming" and capture active typing state in mid-stream
    console.log('Starting stream...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('iniciar streaming'));
      if (startBtn) startBtn.click();
    });

    // Wait ~350ms to be in the middle of streaming
    await new Promise((r) => setTimeout(r, 350));

    const activePath = path.join(ASSETS_DIR, 'cu08_sse_streaming_active_typing.png');
    await page.screenshot({ path: activePath, fullPage: false });
    console.log('📸 Captured:', activePath);

    // Wait for the normal stream to finish
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('flujo completado'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 600));

    // 2. Click "Reiniciar" and then "Simular Corte de Red"
    console.log('Simulating network drop at sequence #4...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const resetBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('reiniciar'));
      if (resetBtn) resetBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dropBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('simular corte de red'));
      if (dropBtn) dropBtn.click();
    });

    // Wait for disconnection alert and Last-Event-ID: 4
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('last-event-id: 4') ||
            document.body.innerText.toLowerCase().includes('desconexión de red'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 800));

    const dropPath = path.join(ASSETS_DIR, 'cu08_sse_stream_disconnection_banner.png');
    await page.screenshot({ path: dropPath, fullPage: false });
    console.log('📸 Captured:', dropPath);

    // 3. Click "Reanudar con Last-Event-ID"
    console.log('Clicking Reanudar con Last-Event-ID button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const resumeBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('reanudar con last-event-id'));
      if (resumeBtn) resumeBtn.click();
    });

    // Wait for resumed stream to finish
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('flujo completado'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 800));

    const resumedPath = path.join(ASSETS_DIR, 'cu08_sse_stream_recovery_resumed.png');
    await page.screenshot({ path: resumedPath, fullPage: false });
    console.log('📸 Captured:', resumedPath);

    console.log('✅ All CU-08 captures completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture error:', err);
  process.exit(1);
});
