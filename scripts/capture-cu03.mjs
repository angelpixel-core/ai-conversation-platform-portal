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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1050'],
    defaultViewport: { width: 1280, height: 1050 },
  });

  try {
    const page = await browser.newPage();
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait until tenant selector is ready
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('button[aria-label="Seleccionar espacio corporativo"]');
        return btn && !btn.hasAttribute('disabled') && !btn.textContent.includes('Cargando');
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll chat console into view
    const chatConsole = await page.waitForSelector('input[type="text"]:not([disabled])', { timeout: 10000 });
    await chatConsole.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await new Promise((r) => setTimeout(r, 800));

    // 1. Capture Initial Console Overview
    console.log('📸 Step 1: Capturing Chat Console Overview...');
    const overviewPath = path.join(ASSETS_DIR, 'cu03_chat_console_overview.png');
    await page.screenshot({ path: overviewPath });
    console.log('✅ Captured:', overviewPath);

    // 2. Type message and click send -> Immediately capture in-flight Turn Protection Guard
    console.log('💬 Step 2: Typing message and capturing In-Flight Turn Guard...');
    await chatConsole.type('Quiero un café espresso doble con leche de avena');
    await new Promise((r) => setTimeout(r, 300));

    const sendBtn = await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    await sendBtn.click();

    // Fast capture while mutation is in-flight (simulated delay is ~600-1200ms)
    await new Promise((r) => setTimeout(r, 150));
    const turnGuardPath = path.join(ASSETS_DIR, 'cu03_turn_protection_guard.png');
    await page.screenshot({ path: turnGuardPath });
    console.log('✅ Captured:', turnGuardPath);

    // Wait for assistant turn to finalize
    console.log('⏳ Waiting for assistant turn completion...');
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Click a quick prompt button to trigger a second turn
    console.log('🥐 Step 3: Triggering quick suggestion prompt...');
    const quickPrompt = await page.waitForSelector('button:has-text("Carta de Pastelería"), button:has-text("Pastelería")', { timeout: 5000 }).catch(async () => {
      const btns = await page.$$('button');
      for (const b of btns) {
        const text = await page.evaluate((el) => el.textContent, b);
        if (text && text.includes('Pastelería')) return b;
      }
      return null;
    });

    if (quickPrompt) {
      await quickPrompt.click();
      console.log('⏳ Waiting for second response turn...');
      await new Promise((r) => setTimeout(r, 2200));
    }

    // 4. Capture Completed Multi-turn Conversation with Delivery Status
    console.log('📸 Step 4: Capturing Completed Multi-turn Conversation...');
    const multiTurnPath = path.join(ASSETS_DIR, 'cu03_conversation_completed.png');
    await page.screenshot({ path: multiTurnPath });
    console.log('✅ Captured:', multiTurnPath);

    console.log('🎉 All CU-03 manual test screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Error executing CU-03 capture script:', err);
  process.exit(1);
});
