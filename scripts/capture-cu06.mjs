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

    // Wait for cards to appear
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('inspeccionar argumentos'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture Overview
    const overviewPath = path.join(ASSETS_DIR, 'cu06_approvals_inbox_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log('📸 Captured:', overviewPath);

    // 2. Click "Inspeccionar Argumentos"
    console.log('Clicking Inspect button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const inspect = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('inspeccionar argumentos'));
      if (inspect) inspect.click();
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    // 2. Capture Inspector Modal
    const modalPath = path.join(ASSETS_DIR, 'cu06_tool_arguments_inspector_modal.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('📸 Captured:', modalPath);

    // 3. Fill justification and approve
    console.log('Submitting approval decision...');
    await page.type('textarea#audit-reason', 'Aprobado tras validación formal con el equipo de auditoría financiera.');
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const approve = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('aprobar ejecución'));
      if (approve) approve.click();
    });

    await new Promise((r) => setTimeout(r, 1200));

    // 3. Capture Resolved State
    const resolvedPath = path.join(ASSETS_DIR, 'cu06_approval_decision_resolved.png');
    await page.screenshot({ path: resolvedPath, fullPage: false });
    console.log('📸 Captured:', resolvedPath);

    console.log('✅ All CU-06 captures completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture error:', err);
  process.exit(1);
});
