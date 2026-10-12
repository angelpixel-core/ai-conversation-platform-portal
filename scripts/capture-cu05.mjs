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

    // 1. Locate and click CU-05 tab
    console.log('🔘 Locating and clicking CU-05 tab...');
    const buttons = await page.$$('button');
    let govTabBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('CU-05')) {
        govTabBtn = btn;
        break;
      }
    }

    if (!govTabBtn) {
      throw new Error('CU-05 tab button not found in page');
    }

    await govTabBtn.click();
    console.log('⏳ Waiting for Governance dashboard rendering...');
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('gobernanza de tokens'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll Governance panel into view
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2')).find((h) =>
        h.textContent.toLowerCase().includes('gobernanza')
      );
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise((r) => setTimeout(r, 600));

    // 2. Capture CU-05 Overview (Budget Meter + Policy Form)
    console.log('📸 Step 1: Capturing CU-05 Governance Dashboard Overview...');
    const overviewPath = path.join(ASSETS_DIR, 'cu05_governance_budget_meter_overview.png');
    await page.screenshot({ path: overviewPath });
    console.log('✅ Captured:', overviewPath);

    // 3. Trigger HTTP 402 Simulation
    console.log('🚨 Step 2: Triggering HTTP 402 Quota Exceeded Simulation...');
    const exceedBtn = await page.waitForSelector('button:has-text("Simular Exceso (HTTP 402)")', {
      timeout: 10000,
    }).catch(async () => {
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await page.evaluate((el) => el.textContent, b);
        if (text && text.includes('Simular Exceso')) return b;
      }
      return null;
    });

    if (exceedBtn) {
      await exceedBtn.click();
      console.log('⏳ Waiting for QuotaExceededModal to display...');
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 800));

      console.log('📸 Step 2: Capturing CU-05 Quota Exceeded Modal (HTTP 402)...');
      const modalPath = path.join(ASSETS_DIR, 'cu05_governance_quota_402_modal.png');
      await page.screenshot({ path: modalPath });
      console.log('✅ Captured:', modalPath);

      // Close modal
      const closeBtn = await page.waitForSelector('button[aria-label="Cerrar modal de cuota"]', {
        timeout: 5000,
      });
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // 4. Update Policy and Capture Success Banner
    console.log('⚙️ Step 3: Modifying Policy and submitting changes...');
    const proTierBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Pro Business'));
    });
    if (proTierBtn) {
      await proTierBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 400));
    }

    const savePolicyBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Guardar Cambios de Política'));
    });
    if (savePolicyBtn) {
      await savePolicyBtn.asElement().click();
      console.log('⏳ Waiting for policy updated status banner...');
      await page.waitForSelector('div[role="status"]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 600));

      console.log('📸 Step 3: Capturing CU-05 Policy Updated Confirmation...');
      const updatedPath = path.join(ASSETS_DIR, 'cu05_governance_policy_updated.png');
      await page.screenshot({ path: updatedPath });
      console.log('✅ Captured:', updatedPath);
    }

    console.log('🎉 All CU-05 manual test screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Error executing CU-05 capture script:', err);
  process.exit(1);
});
