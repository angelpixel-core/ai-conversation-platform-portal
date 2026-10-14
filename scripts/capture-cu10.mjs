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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1200'],
    defaultViewport: { width: 1280, height: 1200, deviceScaleFactor: 2 },
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    // Ensure we are on CU-10 tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tabBtn = btns.find((b) => b.textContent && b.textContent.includes('CU-10: Guardrails & Observabilidad'));
      if (tabBtn) tabBtn.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // 1. Capture Overview
    const overviewPath = path.join(ASSETS_DIR, 'cu10_guardrails_console_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log('📸 Captured:', overviewPath);

    // 2. Click "Simular Prompt Injection" to trigger the alert banner
    console.log('Triggering Prompt Injection simulation...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const simBtn = btns.find((b) => b.textContent && b.textContent.includes('Simular Prompt Injection'));
      if (simBtn) simBtn.click();
    });

    await page.waitForSelector('[role="alert"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    const alertPath = path.join(ASSETS_DIR, 'cu10_guardrails_attack_interception_banner.png');
    await page.screenshot({ path: alertPath, fullPage: false });
    console.log('📸 Captured:', alertPath);

    // 3. Open OpenTelemetry Trace Modal by clicking the row button
    console.log('Opening OpenTelemetry Trace Modal via table action...');
    await page.evaluate(() => {
      // Find the button in the first table body row with text 'Traza'
      const rowBtn = document.querySelector('tbody tr button:last-child');
      if (rowBtn) rowBtn.click();
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    const modalPath = path.join(ASSETS_DIR, 'cu10_opentelemetry_trace_modal.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('📸 Captured:', modalPath);

    console.log('✅ All screenshots captured successfully for CU-10!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
