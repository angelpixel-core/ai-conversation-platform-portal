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

    // Ensure we are on CU-09 tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tabBtn = btns.find((b) => b.textContent && b.textContent.includes('CU-09: Workflows Multi-Agente'));
      if (tabBtn) tabBtn.click();
    });

    // Wait for the panel to load
    await page.waitForSelector('[data-testid="workflows-dashboard-panel"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1200));

    // 1. Capture Overview (Paused at Auditor, with Resume Controls and Checkpoints Timeline)
    const overviewPath = path.join(ASSETS_DIR, 'cu09_multi_agent_graph_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log('📸 Captured:', overviewPath);

    // 2. Open Time-Travel Snapshot Modal
    console.log('Opening Snapshot Inspector Modal via selector...');
    await page.waitForSelector('[data-testid^="checkpoint-item-"] button', { timeout: 10000 });
    await page.click('[data-testid^="checkpoint-item-"] button');

    await page.waitForSelector('[data-testid="snapshot-inspector-modal"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    const modalPath = path.join(ASSETS_DIR, 'cu09_time_travel_snapshot_modal.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('📸 Captured:', modalPath);

    // Close the modal and wait for it to disappear
    console.log('Closing modal...');
    await page.click('button[aria-label="Cerrar modal"]');
    await page.waitForSelector('[data-testid="snapshot-inspector-modal"]', { hidden: true, timeout: 5000 });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Submit resume form
    console.log('Resuming workflow with operator override...');
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="workflow-resume-controls"] button[type="submit"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Button clicked in page evaluation:', clicked);

    // Wait 2000ms for state update
    await new Promise((r) => setTimeout(r, 2000));

    // Check body text
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Body includes completion message:', text.includes('Flujo Multi-Agente Completado Exitosamente'));
    console.log('Body snippet around completion/error:', text.slice(0, 500));

    const completedPath = path.join(ASSETS_DIR, 'cu09_workflow_resumed_completed.png');
    await page.screenshot({ path: completedPath, fullPage: false });
    console.log('📸 Captured:', completedPath);

    console.log('✅ All CU-09 screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
