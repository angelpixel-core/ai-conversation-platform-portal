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

    // Wait for Knowledge panel elements to appear
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('catálogo de documentos indexados'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Capture Overview
    const overviewPath = path.join(ASSETS_DIR, 'cu07_rag_knowledge_catalog_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: false });
    console.log('📸 Captured:', overviewPath);

    // 2. Click "+ Subir Manual de Mantenimiento"
    console.log('Clicking quick upload button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const uploadBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('subir manual de mantenimiento'));
      if (uploadBtn) uploadBtn.click();
    });

    await new Promise((r) => setTimeout(r, 600));

    // 2. Capture Document Upload / Ingested State
    const uploadPath = path.join(ASSETS_DIR, 'cu07_rag_document_upload_ingested.png');
    await page.screenshot({ path: uploadPath, fullPage: false });
    console.log('📸 Captured:', uploadPath);

    // 3. Click "🔍 Simular Cita"
    console.log('Clicking Simular Cita button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const simBtn = btns.find((b) => b.textContent && b.textContent.toLowerCase().includes('simular cita'));
      if (simBtn) simBtn.click();
    });

    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Capture Citation Drawer
    const citationPath = path.join(ASSETS_DIR, 'cu07_rag_citation_drawer_inspection.png');
    await page.screenshot({ path: citationPath, fullPage: false });
    console.log('📸 Captured:', citationPath);

    console.log('✅ All CU-07 captures completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture error:', err);
  process.exit(1);
});
