import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'docs/process-design');
const gallery=pathToFileURL(path.join(dir,'index.html')).href;
const stages=['setup','input','strategy','character','stickers','postprocess','metadata-languages','metadata','export'];
const browser=await chromium.launch();
try {
  const page=await browser.newPage({reducedMotion:'reduce',deviceScaleFactor:1});
  for(const device of ['desktop','mobile']) {
    await page.setViewportSize({width:device==='desktop'?3000:1000,height:1200});
    await mkdir(path.join(dir,'comparisons',device),{recursive:true});
    for(const stage of stages) {
      await page.goto(`${gallery}?stage=${stage}&device=${device}&presentation=1`);
      await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([document.getElementById('image-before').decode(),document.getElementById('image-after').decode()]);});
      // This only lays out existing screenshot images on the review sheet.
      // It does not change or crop any application screenshot.
      await page.addStyleTag({content:`.presentation .page{max-width:none!important;padding:24px!important}.presentation .image-scroll{height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}.presentation .comparison[data-device="mobile"] .image-scroll{padding:16px 0 0}.presentation .section-head h2{font-size:28px}.presentation .section-description,.presentation .change-note{font-size:14px}.presentation .capture-title h3{font-size:16px}.presentation .open-original,.presentation .capture-meta a{display:none}.presentation .presentation-note{font-size:13px}`});
      await page.locator('.page').screenshot({path:path.join(dir,'comparisons',device,`${stage}.png`),animations:'disabled'});
      console.log(`Comparison ${device}/${stage}`);
    }
  }
  for(const device of ['desktop','mobile']) {
    await page.setViewportSize({width:1600,height:1250});
    await page.goto(`${gallery}?overview=${device}`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.querySelectorAll('#overview img'),image=>image.decode()));});
    await page.screenshot({path:path.join(dir,`overview-${device}.png`),fullPage:true,animations:'disabled'});
  }
  // A compact comparison preview is convenient to view directly in chat.
  await page.setViewportSize({width:1600,height:1250});
  await page.goto(`${gallery}?stage=character&device=desktop&presentation=1`);
  await page.evaluate(async()=>{await Promise.all([document.getElementById('image-before').decode(),document.getElementById('image-after').decode()]);});
  await page.locator('.page').screenshot({path:path.join(dir,'preview-desktop.png'),animations:'disabled'});
  await page.setViewportSize({width:1000,height:1800});
  await page.goto(`${gallery}?stage=postprocess&device=mobile&presentation=1`);
  await page.evaluate(async()=>{await Promise.all([document.getElementById('image-before').decode(),document.getElementById('image-after').decode()]);});
  await page.locator('.page').screenshot({path:path.join(dir,'preview-mobile.png'),animations:'disabled'});
  const manifest=JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
  manifest.comparisons=Object.fromEntries(['desktop','mobile'].map(device=>[device,stages.map(stage=>({stage,path:`comparisons/${device}/${stage}.png`}))]));
  await writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
} finally {await browser.close();}
