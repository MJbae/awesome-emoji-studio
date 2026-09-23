import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'docs/process-design');
const fixtureDir = path.join(destination, 'fixtures');
const fixture = JSON.parse(await readFile(path.join(fixtureDir, 'fixtures.json'), 'utf8'));
for (const key of ['physicalDescription', 'facialFeatures', 'colorPalette', 'distinguishingFeatures', 'artStyle']) {
  if (typeof fixture.characterSpecification?.[key] !== 'string') throw new Error(`Fixture characterSpecification.${key} is required.`);
}
if (fixture.stickers.length !== 45) throw new Error('Exactly 45 mock stickers are required.');
const character = (await readFile(path.join(fixtureDir, fixture.characterImage))).toString('base64');
const stickers = await Promise.all(fixture.stickers.map(async (sticker) => ({ ...sticker, imageData: (await readFile(path.join(fixtureDir, sticker.image))).toString('base64') })));
const fixtureId = createHash('sha256').update(JSON.stringify(fixture)).update(character).update(stickers.map(s => s.imageData).join('')).digest('hex');
const audit = { mockData: true, method: 'Actual application UI journey with Gemini HTTP responses replaced; no store mutation or stage skipping', originalRevision: '3a4eb67', uiLanguage: 'ko', fixtureSha256: fixtureId, stickerCount: 45, metadataLanguages: ['ko', 'en'], viewports: { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } }, versions: [] };
const images = [];

const analyses = {
  market: '20~30대 직장인의 일상 대화에 어울리는 따뜻한 공감형 캐릭터입니다. 출근, 커피, 회의, 퇴근처럼 자주 쓰는 상황을 중심으로 45개 표정을 구성합니다. 작은 화면에서도 감정이 즉시 읽히는 얼굴과 선명한 실루엣으로 일상 사용성을 높입니다.',
  art: '동그란 귤의 몸, 작은 초록 잎, 짧은 팔다리를 일관되게 유지합니다. 살구색 볼과 짙은 갈색 눈으로 감정을 표현하고, 커피잔·노트북·하트 같은 소품으로 상황을 구분합니다. 선명한 주황색과 간결한 면 위주의 스타일을 추천합니다.',
  culture: '고개를 살짝 숙인 감사, 힘을 내라는 응원, 함께 기뻐하는 축하처럼 부담 없이 보낼 수 있는 표현을 담습니다. 직장 대화에 쓰기 어려운 공격적인 몸짓은 피하고, 친근한 과장과 가벼운 유머로 감정을 전합니다.',
};
const strategy = { selectedVisualStyleIndex: 0, culturalNotes: '출근부터 퇴근까지, 직장인의 작은 감정에 공감하는 45가지 일상 표현입니다. 감사·응원·인사를 따뜻하게 담고, 과한 비속어나 공격적인 몸짓 없이 편하게 사용할 수 있게 구성합니다.', salesReasoning: '귤리의 둥근 실루엣과 초록 잎을 모든 이미지에 일관되게 유지합니다. 커피 한 잔의 여유, 회의 중 멍한 표정, 퇴근의 설렘을 담아 반복해서 쓰기 좋은 일상형 이모지 세트로 제안합니다.' };
const metadata = {
  ko: [
    { title: '퇴근요정 귤리의 하루', description: '출근은 졸리고, 커피는 소중하고, 퇴근은 행복해! 작은 귤리가 당신의 하루를 다정하게 대신 말해요.', tags: ['귤리', '직장인', '출근', '퇴근', '커피', '일상', '귀여움', '공감', '응원', '인사'] },
    { title: '귤리와 매일 한마디', description: '고마워요부터 수고했어요까지. 회사에서도 친구에게도 가볍게 건네는 귤리의 45가지 일상 인사.', tags: ['귤', '감사', '인사', '수고', '대화', '직장', '친구', '축하', '사랑', '일상'] },
    { title: '오늘도 귤러가는 중', description: '회의엔 멍, 커피엔 반짝, 퇴근엔 활짝. 오늘도 자기 속도로 귤러가는 작은 친구를 만나보세요.', tags: ['귤리', '유머', '퇴근요정', '회사생활', '공감', '커피타임', '힐링', '휴식', '표정', '귀여운'] },
  ],
  en: [
    { title: "Gyulli's Tiny Office", description: 'Sleepy mornings, precious coffee, happy home time. Let a little tangerine share the small feelings in your day.', tags: ['gyulli', 'tangerine', 'office', 'coffee', 'daily', 'cute', 'hello', 'thanks', 'cheer', 'work'] },
    { title: 'A Little Hello from Gyulli', description: 'From thank you to you got this, 45 warm reactions for work chats, close friends, and everyday moments.', tags: ['hello', 'thanks', 'support', 'friend', 'chat', 'work', 'reaction', 'orange', 'warm', 'daily'] },
    { title: 'One More Sip, Then Home', description: 'Meetings can wait a moment. Gyulli is here with tiny cheers, big yawns, and a well-earned coffee break.', tags: ['coffee', 'office life', 'break', 'happy', 'sleepy', 'funny', 'relatable', 'rest', 'cheer', 'gyulli'] },
  ],
};
await writeFile(path.join(fixtureDir, 'scenario.json'), JSON.stringify({mock: true, analyses, strategy, metadata}, null, 2)+'\n');
const browser = await chromium.launch();
try {
  for (const [version, origin] of [['before', process.env.DESIGN_BEFORE_URL || 'http://127.0.0.1:5195'], ['after', process.env.DESIGN_AFTER_URL || 'http://127.0.0.1:5190']]) {
    const context = await browser.newContext({ viewport: audit.viewports.desktop, locale: 'ko-KR', reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    const calls = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(60_000);
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'ko'));
    await page.route('https://generativelanguage.googleapis.com/**', async route => {
      const body = route.request().postDataJSON() || {};
      const schema = body.generationConfig?.responseSchema?.properties || {};
      const prompt = JSON.stringify(body.contents || '');
      let kind = 'analysis';
      let value;
      let parts;
      if (route.request().method() === 'GET') {
        calls.push('validate');
        await route.fulfill({json:{models:[{name:'models/gemini-fixture', displayName:'Mock model for visual review'}]}});
        return;
      }
      if (schema.selectedVisualStyleIndex) { kind='strategy'; value=strategy; }
      else if (schema.physicalDescription) { kind='spec'; value=fixture.characterSpecification; }
      else if (schema.ideas) { kind='ideas'; value={ideas: stickers.map(s => ({id:s.id,label:s.label,category:s.category || '일상',imagePrompt:`MOCK_STICKER_${String(s.id).padStart(2,'0')}: ${s.label}. Gyulli the tangerine ${s.mood}.`}))}; }
      else if (schema.options) {
        kind='metadata';
        const instruction = JSON.stringify(body.systemInstruction || body.generationConfig?.systemInstruction || '');
        const lang = /Native-level fluency in Korean/.test(instruction) ? 'ko' : 'en';
        value={options:metadata[lang].map((entry,i) => ({...entry,optionType:['personality','utility','creative'][i],evaluation:[{naturalness:5,tone:5,searchability:4,creativity:4},{naturalness:5,tone:4,searchability:5,creativity:4},{naturalness:5,tone:5,searchability:4,creativity:5}][i],reasoning:lang==='ko'?'일상의 감정과 캐릭터의 개성을 함께 담은 소개입니다.':'A warm title tied to everyday reactions and the character identity.'}))};
      } else if (body.generationConfig?.imageConfig) {
        const id=prompt.match(/MOCK_STICKER_(\d+)/)?.[1];
        kind=id?'sticker':'character';
        parts=[{text:'Deterministic artwork fixture for visual design review.'},{inlineData:{mimeType:'image/png',data:id?stickers[Number(id)-1].imageData:character}}];
      } else { value=/Creative Art Director/.test(prompt)?analyses.art:/Cultural Marketing Expert/.test(prompt)?analyses.culture:analyses.market; }
      calls.push(kind);
      await route.fulfill({json:{candidates:[{content:{role:'model',parts:parts || [{text:typeof value==='string'?value:JSON.stringify(value)}]},finishReason:'STOP'}]}});
    });
    await page.clock.install();
    const capture = async stage => {
      for (const [device,viewport] of Object.entries(audit.viewports)) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => window.scrollTo(0,0));
        await page.mouse.move(0,0);
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, img => img.decode().catch(()=>{}))); });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const imagePath=path.join(destination,'screenshots',version,device,`${stage}.png`);
        await mkdir(path.dirname(imagePath),{recursive:true});
        await page.screenshot({path:imagePath,fullPage:true,animations:'disabled',caret:'hide'});
        const bytes=await readFile(imagePath);
        const geometry=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
        if(geometry.scrollWidth>geometry.viewport) throw new Error(`${version}/${device}/${stage} overflows ${JSON.stringify(geometry)}`);
        images.push({version,device,stage,path:path.relative(destination,imagePath),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
        console.log(`Captured ${version}/${device}/${stage}`);
      }
      await page.setViewportSize(audit.viewports.desktop);
    };
    await page.goto(origin);
    await expect(page.getByTestId('api-key-modal')).toBeVisible();
    await capture('setup');
    await page.getByTestId('api-key-input').fill('AIza-MOCK-DESIGN-REVIEW-NOT-A-REAL-KEY');
    await page.getByTestId('save-api-key-btn').click();
    await expect(page.getByTestId('concept-textarea')).toBeVisible();
    await page.getByTestId('concept-textarea').fill(fixture.concept);
    await page.getByTestId('reference-image-input').setInputFiles(path.join(fixtureDir,fixture.characterImage));
    await expect(page.getByRole('img',{name:'Reference preview',exact:true})).toBeVisible();
    await capture('input');
    await page.getByTestId('analyze-btn').click();
    await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
    for(const button of await page.locator('section[data-stage="strategy"] button[aria-expanded]').all()) { if(await button.getAttribute('aria-expanded')==='false') await button.click(); }
    await capture('strategy');
    await page.getByTestId('continue-btn').click();
    await expect(page.locator('section[data-stage="character"][data-phase="complete"]')).toBeVisible();
    await page.getByTestId('toggle-spec-btn').click();
    await capture('character');
    await page.getByTestId('continue-btn').click();
    for(let completed=3;completed<=45;completed+=3) {
      await expect(page.locator('[data-job-status="done"]')).toHaveCount(completed);
      if(completed<45) await page.clock.fastForward(10_001);
    }
    await expect(page.locator('section[data-stage="stickers"][data-phase="complete"]')).toBeVisible();
    await expect(page.getByTestId('continue-btn')).toBeEnabled();
    await capture('stickers');
    await page.getByTestId('continue-btn').click();
    const preview=page.getByRole('img',{name:'Processing preview',exact:true});
    await expect(preview).toBeVisible();
    const switches=page.locator('section[data-stage="postprocess"]').getByRole('switch');
    await switches.nth(1).click();
    await page.getByTestId('outline-style-white').click();
    await page.getByRole('slider',{name:/Outline thickness/}).fill('6');
    await page.getByRole('radio',{name:'Black background',exact:true}).click();
    await expect(preview).toHaveAttribute('src',/^data:image\/png;base64,/);
    await capture('postprocess');
    await page.getByTestId('continue-btn').click();
    await expect(page.getByTestId('generate-metadata-btn')).toBeVisible({timeout:120_000});
    for(const lang of ['en','ja','zh-TW','zh-CN','th']) await page.getByTestId(`meta-lang-${lang}`).click();
    await page.getByTestId('meta-lang-en').click();
    await capture('metadata-languages');
    await page.getByTestId('generate-metadata-btn').click();
    await expect(page.getByTestId('select-meta-creative')).toHaveCount(2);
    await expect(page.getByText('오늘도 귤러가는 중',{exact:true})).toBeVisible();
    await capture('metadata');
    await page.getByTestId('continue-to-export-btn').click();
    await page.getByRole('button',{name:'전체 선택',exact:true}).click();
    const downloadPromise=page.waitForEvent('download',{timeout:120_000});
    await page.getByTestId('export-combined-btn').click();
    const download=await downloadPromise;
    const zipPath=path.join(destination,'outputs',`${version}-gyulli-6-platforms.zip`);
    await download.saveAs(zipPath);
    const zip=await JSZip.loadAsync(await readFile(zipPath));
    const platformFolders=['ogq_sticker','line_sticker','line_emoji','kakaotalk_emoticon','kakaotalk_mini','telegram_static'];
    const zipEntries=Object.keys(zip.files);
    for(const folder of platformFolders) if(zipEntries.filter(name=>name.startsWith(`${folder}/`)&&name.endsWith('.png')).length<46) throw new Error(`Incomplete ZIP: ${folder}`);
    await expect(page.locator('section[data-stage="export"] progress')).toHaveCount(6);
    for(const progress of await page.locator('section[data-stage="export"] progress').all()) await expect(progress).toHaveAttribute('value','100');
    await capture('export');
    const outputs=await page.evaluate(()=>{
      const s=window.useAppStore.getState();
      return {strategy:s.strategy,characterSpec:s.characterSpec,stickers:s.stickers.map(({id,idea,status,imageUrl})=>({id,idea,status,imageSize:imageUrl.length})),processedImages:s.processedImages,metadata:s.metadata,exportJobs:s.exportJobs};
    });
    const processedDir=path.join(destination,'outputs',version);
    await mkdir(processedDir,{recursive:true});
    for(const item of outputs.processedImages) await writeFile(path.join(processedDir,`processed-${String(item.id).padStart(2,'0')}.png`),Buffer.from(item.data.split(',')[1],'base64'));
    await writeFile(path.join(processedDir,'metadata.json'),JSON.stringify(outputs.metadata,null,2)+'\n');
    await writeFile(path.join(processedDir,'strategy.json'),JSON.stringify(outputs.strategy,null,2)+'\n');
    const record={version,origin,counts:{stickers:outputs.stickers.length,processed:outputs.processedImages.length,metadata:outputs.metadata.length,exportPlatforms:outputs.exportJobs.length,zipFiles:zipEntries.filter(name=>!zip.files[name].dir).length},requests:Object.fromEntries([...new Set(calls)].map(kind=>[kind,calls.filter(v=>v===kind).length])),outputsDigest:createHash('sha256').update(JSON.stringify({strategy:outputs.strategy,characterSpec:outputs.characterSpec,stickers:outputs.stickers,processedImages:outputs.processedImages,metadata:outputs.metadata})).digest('hex'),pageErrors:errors,zip:path.relative(destination,zipPath)};
    if(errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
    audit.versions.push(record);
    await writeFile(path.join(destination,'manifest.json'),JSON.stringify({...audit,images},null,2)+'\n');
    console.log(`${version} finished: ${JSON.stringify(record.counts)}`);
    await context.close();
  }
  if(audit.versions[0].outputsDigest!==audit.versions[1].outputsDigest) throw new Error('Before and after output data differs.');
  console.log('Both versions produced identical data; all screenshots recorded.');
} finally { await browser.close(); }
