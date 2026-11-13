import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ASSETS_DIR = path.resolve(process.cwd(), 'docs/assets');
const BASE_URL = process.env.PORTAL_URL || 'http://localhost:3005';

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
    console.log(`🌐 Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Set MOCK mode in sessionStorage for deterministic capture
    console.log('⚡ Ensuring MOCK mode in sessionStorage for deterministic capture...');
    await page.evaluate(() => {
      sessionStorage.setItem('chatbot_portal_env_mode', 'MOCK');
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Ensure CU-03 Chat Tab is active
    console.log('📌 Verifying CU-03 Chat tab is active...');
    await page.waitForFunction(() => {
      const chatInput = document.querySelector('input[placeholder*="Escribe tu consulta"]');
      if (chatInput) return true;
      const btns = Array.from(document.querySelectorAll('button'));
      const tabBtn = btns.find((b) => b.textContent && b.textContent.includes('CU-03'));
      if (tabBtn) {
        tabBtn.click();
        return true;
      }
      return false;
    }, { timeout: 10000 });

    // Wait until Chat Console input is available
    console.log('⏳ Waiting for Chat Console input...');
    const chatInput = await page.waitForSelector('input[placeholder*="Escribe tu consulta"]', { timeout: 15000 });
    if (!chatInput) {
      throw new Error('Chat input not found');
    }

    // Scroll chat console into view
    await chatInput.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture Initial Console Overview
    console.log('📸 Step 1: Capturing Chat Console Overview with Enterprise Suggestions...');
    const overviewPath = path.join(ASSETS_DIR, 'cu03_chat_console_overview.png');
    await page.screenshot({ path: overviewPath });
    console.log('✅ Captured:', overviewPath);

    // 2. Open Nueva Conversación Modal
    console.log('📸 Step 2: Opening Nueva Conversación Modal...');
    const newConvBtn = await page.waitForSelector('button[aria-label="Nueva Conversación"]', { timeout: 5000 });
    await newConvBtn.click();
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 600));

    const titleInput = await page.$('input#conversation-title-input');
    if (titleInput) {
      await titleInput.type('Migración Cloud Enterprise 2026');
      await new Promise((r) => setTimeout(r, 500));
    }

    const modalPath = path.join(ASSETS_DIR, 'cu03_create_conversation_modal.png');
    await page.screenshot({ path: modalPath });
    console.log('✅ Captured:', modalPath);

    // Submit modal to create new thread
    const createThreadBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await createThreadBtn.click();
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Type enterprise message and click send -> Immediately capture in-flight Turn Protection Guard
    console.log('💬 Step 3: Typing message and capturing In-Flight Turn Guard...');
    const activeInput = await page.waitForSelector('input[placeholder*="Escribe tu consulta"]:not([disabled])', { timeout: 5000 });
    await activeInput.type('Calcular presupuesto de infraestructura cloud.');
    await new Promise((r) => setTimeout(r, 400));

    const sendBtn = await page.waitForSelector('button[aria-label="Enviar mensaje"]:not([disabled])', { timeout: 5000 });
    await sendBtn.click();

    // Fast capture while mutation is in-flight (~100-250ms)
    await new Promise((r) => setTimeout(r, 200));
    const turnGuardPath = path.join(ASSETS_DIR, 'cu03_turn_protection_guard.png');
    await page.screenshot({ path: turnGuardPath });
    console.log('✅ Captured:', turnGuardPath);

    // Wait for assistant response to finalize
    console.log('⏳ Waiting for assistant turn completion...');
    await new Promise((r) => setTimeout(r, 2500));

    // 4. Click a quick prompt button to trigger a second turn
    console.log('⚡ Step 4: Triggering quick suggestion prompt...');
    const clickedPrompt = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.textContent && b.textContent.includes('política de seguridad'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (clickedPrompt) {
      console.log('⏳ Waiting for second response turn...');
      await new Promise((r) => setTimeout(r, 2500));
    }

    // 5. Capture Completed Multi-turn Conversation with Idempotency Badges
    console.log('📸 Step 5: Capturing Completed Multi-turn Conversation...');
    const multiTurnPath = path.join(ASSETS_DIR, 'cu03_conversation_completed.png');
    await page.screenshot({ path: multiTurnPath });
    console.log('✅ Captured:', multiTurnPath);

    console.log('🎉 All CU-03 evidence screenshots captured successfully!');
  } finally {
    await browser.close();
    console.log('🏁 Browser closed.');
  }
}

run().catch((err) => {
  console.error('❌ Error executing CU-03 capture script:', err);
  process.exit(1);
});
