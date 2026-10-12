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
    defaultViewport: { width: 1280, height: 1150 },
  });

  try {
    const page = await browser.newPage();
    console.log('🌐 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait until full React hydration (tenant selector ready and loaded)
    console.log('⏳ Waiting for React hydration and tenant state...');
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-label="Seleccionar espacio corporativo"]');
        return btn && !btn.hasAttribute('disabled') && !btn.textContent.includes('Cargando');
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 800));

    // 1. Find and click CU-04 tab
    console.log('🔘 Locating and clicking CU-04 tab...');
    const buttons = await page.$$('button');
    let outboxTabBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('CU-04')) {
        outboxTabBtn = btn;
        break;
      }
    }

    if (!outboxTabBtn) {
      throw new Error('CU-04 tab button not found in page');
    }

    await outboxTabBtn.click();
    console.log('⏳ Waiting for Outbox panel rendering...');
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('despacho as'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll Outbox panel into view
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.toLowerCase().includes('despacho'));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise((r) => setTimeout(r, 600));

    // 2. Capture CU-04 Outbox Pipeline Overview
    console.log('📸 Step 1: Capturing CU-04 Outbox Pipeline Overview...');
    const overviewPath = path.join(ASSETS_DIR, 'cu04_outbox_pipeline_overview.png');
    await page.screenshot({ path: overviewPath });
    console.log('✅ Captured:', overviewPath);

    // 3. Trigger Full Flow Simulation
    console.log('⚡ Step 2: Triggering Full Flow Simulation...');
    const simFlowBtn = await page.waitForSelector('button[aria-label="Simular Flujo Completo"]', { timeout: 10000 });
    await simFlowBtn.click();
    console.log('⏳ Waiting for event transitions (Pending -> Broker -> Worker -> Completed)...');
    await new Promise((r) => setTimeout(r, 2600));

    // 4. Trigger DLQ Incident Simulation
    console.log('🚨 Step 3: Triggering Simulated DLQ Incident...');
    const dlqBtn = await page.waitForSelector('button[aria-label="Simular Incidente DLQ"]', { timeout: 10000 });
    await dlqBtn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // 5. Capture DLQ Incident and Manual Retry Button
    console.log('📸 Step 4: Capturing CU-04 DLQ Incident and Retry Badge...');
    const dlqPath = path.join(ASSETS_DIR, 'cu04_outbox_dlq_incident_retry.png');
    await page.screenshot({ path: dlqPath });
    console.log('✅ Captured:', dlqPath);

    console.log('🎉 All CU-04 manual test screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Error executing CU-04 capture script:', err);
  process.exit(1);
});
