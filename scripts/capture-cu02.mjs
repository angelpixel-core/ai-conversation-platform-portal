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

    // Wait until tenant selector is enabled (not loading)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-label="Seleccionar espacio corporativo"]');
        return btn && !btn.hasAttribute('disabled') && !btn.textContent.includes('Cargando');
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture Tenant Selector Dropdown Open
    console.log('📸 Step 1: Opening Tenant Selector Dropdown...');
    const selectorButton = await page.$('button[aria-label="Seleccionar espacio corporativo"]');
    await selectorButton.click();
    await page.waitForSelector('div[role="listbox"]', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 800));

    const dropdownPath = path.join(ASSETS_DIR, 'cu02_tenant_selector_dropdown.png');
    await page.screenshot({ path: dropdownPath });
    console.log('✅ Captured:', dropdownPath);

    // Close dropdown
    await selectorButton.click();
    await new Promise((r) => setTimeout(r, 600));

    // 2. Type & Send a chat message to create an active conversation turn
    console.log('💬 Step 2: Sending a chat message...');
    const chatInput = await page.waitForSelector('input[type="text"]:not([disabled])', { timeout: 10000 });
    await chatInput.type('Consulta de inventario para Acme Corporation');
    await new Promise((r) => setTimeout(r, 400));

    const sendButton = await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 10000 });
    await sendButton.click();
    console.log('⏳ Waiting for turn and message to render in timeline...');
    await new Promise((r) => setTimeout(r, 2000));

    const activeChatPath = path.join(ASSETS_DIR, 'cu02_active_conversation.png');
    await page.screenshot({ path: activeChatPath });
    console.log('✅ Captured:', activeChatPath);

    // 3. Click Tenant Selector and pick Globex Industries -> Triggers TenantSwitchGuardModal!
    console.log('🛡️ Step 3: Triggering Tenant Switch Guard Modal...');
    await selectorButton.click();
    await page.waitForSelector('div[role="listbox"]', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 600));

    // Click on Globex Industries option
    const globexOption = await page.waitForSelector('button[aria-label="Globex Industries"]', { timeout: 5000 });
    await globexOption.click();
    console.log('⏳ Waiting for TenantSwitchGuardModal...');
    await new Promise((r) => setTimeout(r, 1000));

    const guardModalPath = path.join(ASSETS_DIR, 'cu02_tenant_switch_guard_modal.png');
    await page.screenshot({ path: guardModalPath });
    console.log('✅ Captured:', guardModalPath);

    // 4. Confirm Tenant Switch & Clean Context
    console.log('🔄 Step 4: Confirming tenant switch...');
    const buttons = await page.$$('button');
    let confirmBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.toLowerCase().includes('confirmar cambio')) {
        confirmBtn = btn;
        break;
      }
    }

    if (confirmBtn) {
      await confirmBtn.click();
      console.log('⏳ Waiting for context reset and active tenant switch...');
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.warn('⚠️ Could not find Confirmar Cambio button');
    }

    const cleanContextPath = path.join(ASSETS_DIR, 'cu02_tenant_switched_clean.png');
    await page.screenshot({ path: cleanContextPath });
    console.log('✅ Captured:', cleanContextPath);

    console.log('🎉 All CU-02 manual test screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Error executing CU-02 capture script:', err);
  process.exit(1);
});
