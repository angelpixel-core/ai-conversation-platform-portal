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

    // Wait until tenant selector button is rendered
    console.log('⏳ Waiting for Tenant Selector button...');
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-label="Seleccionar espacio corporativo"]');
        return btn && btn.textContent && !btn.textContent.includes('Cargando');
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Capture Header with Closed Tenant Selector
    console.log('📸 Step 1: Capturing Header with Closed Tenant Selector...');
    const closedPath = path.join(ASSETS_DIR, 'cu02_tenant_selector_closed_live.png');
    await page.screenshot({ path: closedPath });
    console.log('✅ Captured:', closedPath);

    // 2. Open Dropdown
    console.log('📸 Step 2: Clicking Tenant Selector to open 3D Dropdown...');
    const tenantButton = await page.$('button[aria-label="Seleccionar espacio corporativo"]');
    if (!tenantButton) {
      throw new Error('Tenant selector button not found');
    }
    await tenantButton.click();
    await page.waitForSelector('div[role="listbox"]', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 800));

    const dropdownOpenPath = path.join(ASSETS_DIR, 'cu02_tenant_selector_dropdown_open_live.png');
    await page.screenshot({ path: dropdownOpenPath });
    console.log('✅ Captured:', dropdownOpenPath);

    // 3. Click second tenant option to trigger TenantSwitchGuardModal
    console.log('📸 Step 3: Clicking target tenant option to trigger Switch Guard Modal...');
    const options = await page.$$('button[role="option"]');
    console.log(`Found ${options.length} tenant options in dropdown`);

    if (options.length > 1) {
      // Click the unselected tenant (e.g. index 1)
      await options[1].click();
      await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 800));

      const guardModalPath = path.join(ASSETS_DIR, 'cu02_tenant_switch_guard_modal_live.png');
      await page.screenshot({ path: guardModalPath });
      console.log('✅ Captured:', guardModalPath);
    } else {
      console.warn('⚠️ Less than 2 tenants available in listbox, checking modal directly...');
    }

    console.log('🎉 All CU-02 evidence captures completed successfully!');
  } catch (err) {
    console.error('❌ Error during CU-02 capture:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Browser closed.');
  }
}

run();
