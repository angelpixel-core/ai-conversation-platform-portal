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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950'],
    defaultViewport: { width: 1280, height: 950 },
  });

  try {
    const page = await browser.newPage();
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait until status pill is present
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-label*="Estado del sistema"]');
        return btn && btn.textContent.includes('SISTEMA');
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Capture Dashboard Header with Status Pill in LIVE mode
    console.log('📸 Step 1: Capturing Header with System Status Pill...');
    const pillPath = path.join(ASSETS_DIR, 'cu01_system_status_pill_live.png');
    await page.screenshot({ path: pillPath });
    console.log('✅ Captured:', pillPath);

    // 2. Click Status Pill to open modal
    console.log('📸 Step 2: Clicking status pill to open diagnosis modal...');
    const statusPill = await page.$('button[aria-label*="Estado del sistema"]');
    if (statusPill) {
      await statusPill.click();
      await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 1000));

      const modalPath = path.join(ASSETS_DIR, 'cu01_system_status_modal_live.png');
      await page.screenshot({ path: modalPath });
      console.log('✅ Captured:', modalPath);

      // 3. Expand raw JSON inspector
      console.log('📸 Step 3: Expanding Raw JSON Payload Inspector...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const toggleBtn = buttons.find((b) => b.textContent && b.textContent.includes('Payload HTTP en Vivo'));
        if (toggleBtn) toggleBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      const rawJsonPath = path.join(ASSETS_DIR, 'cu01_system_status_modal_raw_payload.png');
      await page.screenshot({ path: rawJsonPath });
      console.log('✅ Captured:', rawJsonPath);
    }
  } catch (err) {
    console.error('❌ Error during capture:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Browser closed.');
  }
}

run();
