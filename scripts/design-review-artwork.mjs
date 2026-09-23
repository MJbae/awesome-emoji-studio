/**
 * Deterministic artwork for the design review only. These are local mock
 * outputs, not images returned by Gemini. Run: node scripts/design-review-artwork.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(projectRoot, 'docs/process-design/fixtures');
const brown = '#513F35';
const orange = '#F4A25F';
const coral = '#D77E77';
const green = '#7D9361';
const definitions = [
  ['반가워요', 'happy', 'wave'], ['사랑해요', 'heart', 'hearts'],
  ['커피 충전', 'calm', 'coffee'], ['열일 중', 'focus', 'laptop'],
  ['퇴근이다!', 'happy', 'bag'], ['오늘도 파이팅', 'happy', 'cheer'],
  ['고마워요', 'calm', 'flower'], ['잘 자요', 'sleep', 'sleep'],
  ['배고파요', 'sad', 'food'], ['완전 좋아', 'happy', 'thumb'],
  ['미안해요', 'sad', 'sorry'], ['눈물 뚝뚝', 'cry', 'tears'],
  ['조금 화났어', 'angry', 'anger'], ['우와!', 'surprise', 'stars'],
  ['부끄러워', 'shy', 'blush'], ['축하해요', 'happy', 'party'],
  ['선물이에요', 'heart', 'gift'], ['잠깐만요', 'focus', 'stop'],
  ['알겠어요', 'calm', 'check'], ['좋은 아침', 'happy', 'sun'],
  ['월요일이라니', 'tired', 'cloud'], ['드디어 금요일', 'happy', 'music'],
  ['충전이 필요해', 'tired', 'battery'], ['나 지금 가는 중', 'focus', 'run'],
  ['밥 먹었어요?', 'happy', 'rice'], ['답장 기다리는 중', 'sad', 'phone'],
  ['괜찮아요', 'calm', 'pat'], ['멋져요!', 'heart', 'sparkle'],
  ['회의 중이에요', 'focus', 'notes'], ['살려 주세요', 'cry', 'deadline'],
  ['휴가 갑니다', 'happy', 'holiday'], ['비 오는 날', 'calm', 'umbrella'],
  ['따뜻하게 입어요', 'calm', 'scarf'], ['더워요', 'tired', 'fan'],
  ['간식 시간', 'happy', 'cookie'], ['진짜요?', 'surprise', 'question'],
  ['생각하는 중', 'focus', 'think'], ['응원할게요', 'happy', 'flag'],
  ['오늘은 쉬어요', 'sleep', 'pillow'], ['보고 싶어요', 'sad', 'heart'],
  ['약속해요', 'calm', 'promise'], ['정말 최고야', 'happy', 'medal'],
  ['수고했어요', 'calm', 'tea'], ['내일 또 만나요', 'happy', 'bye'],
  ['퇴근요정 출동', 'happy', 'cape'],
];

const heart = (x, y, size = 1, color = coral) => `<path transform="translate(${x} ${y}) scale(${size})" d="M0 12C-28-4-17-25-2-12C14-28 29-5 0 12Z" fill="${color}"/>`;
const star = (x, y, size = 1, color = '#D5B76D') => `<path transform="translate(${x} ${y}) scale(${size})" d="M0-14 4-4 14 0 4 4 0 14-4 4-14 0-4-4Z" fill="${color}"/>`;
const strokes = (d, color = brown, width = 4.5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const text = (value, x, y, size = 26, color = brown) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,Apple SD Gothic Neo,Noto Sans KR,sans-serif" font-weight="800" font-size="${size}" fill="${color}">${value}</text>`;

function face(mood) {
  const cheeks = '<ellipse cx="-42" cy="16" rx="14" ry="8" fill="#E68A77" opacity=".78"/><ellipse cx="42" cy="16" rx="14" ry="8" fill="#E68A77" opacity=".78"/>';
  const eyes = {
    happy: strokes('M-38-8Q-26-27-14-8M14-8Q26-27 38-8'),
    calm: '<ellipse cx="-25" cy="-8" rx="5.3" ry="8" fill="#513F35"/><ellipse cx="25" cy="-8" rx="5.3" ry="8" fill="#513F35"/>',
    heart: heart(-25, -11, .65, '#B85E59') + heart(25, -11, .65, '#B85E59'),
    focus: strokes('M-38-18-15-13M15-13 38-18') + '<circle cx="-24" cy="-6" r="5" fill="#513F35"/><circle cx="24" cy="-6" r="5" fill="#513F35"/>',
    sleep: strokes('M-38-7Q-26 3-14-7M14-7Q26 3 38-7'),
    sad: strokes('M-39-20-18-26M18-26 39-20') + '<ellipse cx="-25" cy="-6" rx="5" ry="7" fill="#513F35"/><ellipse cx="25" cy="-6" rx="5" ry="7" fill="#513F35"/>',
    cry: strokes('M-37-17-17-8-37 0M37-17 17-8 37 0'),
    angry: strokes('M-39-25-16-15M16-15 39-25') + '<ellipse cx="-25" cy="-5" rx="5" ry="7" fill="#513F35"/><ellipse cx="25" cy="-5" rx="5" ry="7" fill="#513F35"/>',
    surprise: '<ellipse cx="-26" cy="-10" rx="7" ry="12" fill="#513F35"/><ellipse cx="26" cy="-10" rx="7" ry="12" fill="#513F35"/>',
    shy: strokes('M-36-6-16-6M16-6 36-6'),
    tired: strokes('M-39-10-13-10M13-10 39-10M-35 0-19 0M19 0 35 0', brown, 3.5),
  }[mood];
  const mouth = ['happy', 'heart'].includes(mood)
    ? '<path d="M-17 15Q0 52 17 15Z" fill="#694536"/><path d="M-9 29Q0 21 9 29Q0 41-9 29Z" fill="#EEAEA0"/>'
    : ['sleep', 'surprise'].includes(mood)
      ? '<ellipse cx="0" cy="22" rx="7" ry="10" fill="#694536"/>'
      : ['sad', 'cry', 'angry', 'tired'].includes(mood)
        ? strokes('M-13 26Q0 16 13 26', brown, 3.8)
        : strokes('M-14 19Q0 33 14 19', brown, 3.8);
  return cheeks + eyes + mouth;
}

function props(kind) {
  const rain = '<path d="M-31 8C-43 31-44 42-33 43C-23 43-26 29-31 8ZM32 8C22 29 18 42 29 43C42 42 39 29 32 8Z" fill="#90B8CA"/>';
  const cup = '<path d="M-29 36H26L20 72Q-3 85-23 72Z" fill="#F9EBD6" stroke="#7D6853" stroke-width="3"/><path d="M26 43Q53 42 42 60Q38 66 25 63" fill="none" stroke="#7D6853" stroke-width="4"/><ellipse cx="-2" cy="36" rx="27" ry="6" fill="#8E6751"/>';
  switch (kind) {
    case 'wave': return strokes('M-75 19Q-108 4-99-28M75 20Q93 9 89-6', orange, 12) + strokes('M-116-22-119-38M-106-42-101-52', green, 3.5) + star(97, -64, .6);
    case 'hearts': return heart(-98, -57, .8) + heart(98, -72, 1) + heart(106, -18, .5);
    case 'coffee': return cup + strokes('M-16 20Q-25 9-15-2M8 20Q-1 9 9-2', '#BBA78C', 3) + strokes('M-74 32-37 54M73 30 31 55', orange, 12);
    case 'laptop': return '<path d="M-75 28H75L64 90H-64Z" fill="#90A39A" stroke="#596C65" stroke-width="3"/><path d="M-89 90H89L80 100H-80Z" fill="#C0CEC6"/><circle cx="0" cy="62" r="9" fill="#E6EBE2"/>' + star(104, -19, .6);
    case 'bag': return strokes('M-70 11-91-19M70 11 89-18', orange, 12) + '<path d="M64 51H105V91H64Z" fill="#B78E66" stroke="#846849" stroke-width="3"/><path d="M74 50V40Q85 28 96 40V50" fill="none" stroke="#846849" stroke-width="4"/>' + star(-102, -49, .8);
    case 'cheer': return strokes('M-74 4-98-34M74 4 98-34', orange, 13) + star(-106, -61, .8) + star(109, -61, .8) + strokes('M-120-12-127-25M121-12 128-25', coral, 4);
    case 'flower': return '<path d="M0 76V37M0 63Q-23 43-26 60Q-18 75 0 68M0 60Q25 40 27 56Q20 70 0 66" fill="#8EA26A" stroke="#748757" stroke-width="3"/><g transform="translate(0 30)"><circle cx="-13" cy="-10" r="14" fill="#D18C91"/><circle cx="13" cy="-10" r="14" fill="#D18C91"/><circle cx="-15" cy="13" r="14" fill="#D18C91"/><circle cx="15" cy="13" r="14" fill="#D18C91"/><circle cx="0" cy="0" r="12" fill="#F5D181"/></g>';
    case 'sleep': return '<path d="M-105 72Q-75 45-38 72L-55 94H-103Z" fill="#D5DEE2"/>' + text('z', 92, -46, 25, '#879AAB') + text('Z', 117, -77, 33, '#879AAB');
    case 'food': return '<ellipse cx="0" cy="67" rx="55" ry="16" fill="#E7DDD0"/><path d="M-37 58Q-37 18 0 21Q37 18 37 58Z" fill="#F1D6AC" stroke="#B7966D" stroke-width="3"/>' + strokes('M-13 31-18 46M5 29 0 44M22 34 17 46', '#B7966D', 3);
    case 'thumb': return '<path d="M75 37V-2Q84-12 87 1L90 13H111Q120 20 111 43Z" fill="#F4A25F" stroke="#CC864F" stroke-width="3"/>' + star(-98, -51, .7);
    case 'sorry': return '<path d="M-24 45-4 18Q0 14 3 21L9 43 20 66H-24Z" fill="#F5BC87" stroke="#CE8B54" stroke-width="3"/>' + strokes('M-8 33 2 58', '#CE8B54', 2.5) + '<path d="M87-42Q108-13 87-12Q71-14 87-42" fill="#A3C5D5"/>';
    case 'tears': return rain + '<path d="M-96-29Q-115-4-98-2Q-85-4-96-29M100-28Q85-3 100-3Q114-3 100-28" fill="#A3C5D5"/>';
    case 'anger': return strokes('M84-52V-40H97M86-27V-36H100M72-52V-40H60', '#B56555', 5) + '<path d="M-101 36Q-126 17-108 0Q-99-10-105-19Q-70 8-101 36Z" fill="#EAC181"/>';
    case 'stars': return star(-102, -38, .9) + star(100, -50, 1) + star(112, 15, .5);
    case 'blush': return '<path d="M-52 8-57 20M-43 10-48 22M-34 11-39 23M36 11 31 23M45 10 40 22M54 8 49 20" stroke="#BD6A65" stroke-width="2.5"/>' + heart(92, -42, .7);
    case 'party': return '<path d="M-41-60-10-122 19-64Z" fill="#B8ACCE"/><path d="M-31-80-1-92M-22-99 7-79" stroke="#E9DEEF" stroke-width="8"/><circle cx="-11" cy="-122" r="8" fill="#D19C93"/>' + star(105, -60, .7) + strokes('M-108-23-116-39M107 0 117-13', '#D29B7B', 5);
    case 'gift': return '<rect x="-43" y="26" width="86" height="60" rx="5" fill="#D99791"/><rect x="-48" y="20" width="96" height="18" rx="4" fill="#E9B1A8"/><path d="M-7 20H8V86H-7Z" fill="#F4DBC3"/><path d="M0 19Q-35 14-21-4Q-6-9 0 19Q8-8 24-1Q36 15 0 19" fill="none" stroke="#F4DBC3" stroke-width="7"/>';
    case 'stop': return '<path d="M81 34V-12Q85-21 89-12V4-22Q94-30 99-22V4-15Q104-23 109-15V9-6Q114-13 119-6V26Q112 50 90 47Z" fill="#F4B77F" stroke="#CE8B54" stroke-width="3"/>';
    case 'check': return '<circle cx="98" cy="-34" r="25" fill="#DEE5D3"/>' + strokes('M85-34 95-24 112-45', '#7C925F', 5);
    case 'sun': return '<circle cx="96" cy="-52" r="20" fill="#E7C97F"/>' + strokes('M96-84V-79M96-25V-20M64-52H69M123-52H128M74-74 79-69M115-33 120-28', '#D1B26E', 4);
    case 'cloud': return '<path d="M-35-93Q-54-117-31-130Q-12-144 0-127Q18-144 34-123Q57-122 48-103Q20-91-35-93Z" fill="#BCC7CB"/>' + strokes('M-25-83-29-74M0-87-4-78M24-82 20-73', '#8DABBA', 3);
    case 'music': return strokes('M92-68V-31M92-66 114-72V-39', '#889E7C', 5) + '<ellipse cx="84" cy="-28" rx="10" ry="7" fill="#889E7C"/><ellipse cx="106" cy="-35" rx="10" ry="7" fill="#889E7C"/>' + star(-101, -38, .7);
    case 'battery': return '<rect x="62" y="-61" width="63" height="30" rx="5" fill="#F2ECE2" stroke="#B39D83" stroke-width="3"/><path d="M125-50H131V-41H125Z" fill="#B39D83"/><path d="M68-55H79V-37H68Z" fill="#D79A8B"/>' + strokes('M-38 75-61 90M38 75 65 91', orange, 10);
    case 'run': return strokes('M-78 13-109 4M74 25 104 6M-35 73-72 100M34 72 65 95', orange, 11) + strokes('M-114 48H-88M-122 62H-96', '#ADBB9C', 4);
    case 'rice': return '<path d="M-39 45Q0 27 39 45Q32 87 0 85Q-32 87-39 45" fill="#B6C8CF"/><ellipse cx="0" cy="44" rx="38" ry="12" fill="#FBF4E6"/><path d="M-30 41Q-27 18-11 26Q0 7 15 25Q35 16 33 43" fill="#FBF4E6" stroke="#E4DACA" stroke-width="2"/>' + strokes('M50 35 67-10M58 40 77-5', '#917259', 3);
    case 'phone': return '<rect x="-23" y="21" width="46" height="68" rx="8" fill="#7D928C"/><rect x="-17" y="28" width="34" height="48" rx="3" fill="#E5EBDC"/><circle cx="0" cy="82" r="3" fill="#C0CDC2"/>' + '<circle cx="78" cy="-45" r="4" fill="#B4A18A"/><circle cx="94" cy="-45" r="4" fill="#B4A18A"/><circle cx="110" cy="-45" r="4" fill="#B4A18A"/>';
    case 'pat': return strokes('M73 16Q104-15 87-37', orange, 13) + heart(-100, -39, .7, '#A2B587');
    case 'sparkle': return star(-99, -45, 1) + star(99, -60, 1.2) + star(115, 1, .5) + star(-107, 10, .5);
    case 'notes': return '<rect x="-41" y="28" width="70" height="62" rx="4" fill="#F1E7CE" stroke="#B6A77F" stroke-width="3"/>' + strokes('M-29 44H16M-29 56H16M-29 68H5', '#C3B58D', 3) + strokes('M40 64 61 20', '#79938A', 7);
    case 'deadline': return rain + '<circle cx="101" cy="-40" r="25" fill="#ECE5D7" stroke="#AA967B" stroke-width="3"/>' + strokes('M101-57V-40L113-34', '#AA967B', 3) + strokes('M-99-43-94-27M-85-48-81-31', coral, 4);
    case 'holiday': return '<path d="M-86-46Q-63-90 1-91Q66-90 88-43Z" fill="#D7BE8B"/><ellipse cx="0" cy="-43" rx="105" ry="13" fill="#E3D1AA"/><path d="M-79-58Q0-38 79-58" fill="none" stroke="#A9B596" stroke-width="12"/>' + '<rect x="66" y="49" width="45" height="49" rx="5" fill="#C7957E"/>';
    case 'umbrella': return '<path d="M78-72Q112-111 146-72Z" fill="#AEC1CA" stroke="#7F9FAC" stroke-width="3"/><path d="M112-72V24Q109 39 98 30" fill="none" stroke="#7F9FAC" stroke-width="4"/>' + strokes('M-96-52-100-40M-109-15-113-3M65-105 61-93', '#9BB9C8', 3);
    case 'scarf': return '<path d="M-60 39Q0 74 61 39L63 61Q0 90-63 60Z" fill="#C38F89"/><path d="M28 64H51L59 102H31Z" fill="#D5A39B"/>' + strokes('M35 85H53M34 94H56', '#B9847E', 3);
    case 'fan': return '<path d="M78 52Q43 8 85-2Q130 1 104 52Z" fill="#BCD1CC" stroke="#8CAAA3" stroke-width="3"/>' + strokes('M90 46 94 87', '#A48C72', 7) + '<path d="M-75-30Q-94-4-78-3Q-64-2-75-30" fill="#A3C5D5"/>';
    case 'cookie': return '<circle cx="0" cy="51" r="34" fill="#DDB57D" stroke="#BE955D" stroke-width="3"/><circle cx="-13" cy="35" r="4" fill="#967152"/><circle cx="13" cy="45" r="5" fill="#967152"/><circle cx="-8" cy="62" r="5" fill="#967152"/><circle cx="15" cy="67" r="3" fill="#967152"/>';
    case 'question': return text('?', 99, -28, 62, '#8FA18A');
    case 'think': return '<circle cx="93" cy="-28" r="5" fill="#D9DED0"/><circle cx="107" cy="-47" r="8" fill="#D9DED0"/><ellipse cx="97" cy="-81" rx="28" ry="20" fill="#D9DED0"/>' + text('…', 96, -75, 28, '#8B9A7E');
    case 'flag': return strokes('M91 48V-65', '#A38D70', 5) + '<path d="M94-65H132L125-45 132-25H94Z" fill="#A6B890"/>' + star(-100, -35, .8);
    case 'pillow': return '<rect x="-107" y="51" width="92" height="44" rx="15" fill="#D8DFD0" stroke="#B7C2AA" stroke-width="2"/>' + text('Z', 95, -37, 30, '#9EAC95');
    case 'heart': return heart(0, 55, 2, '#CB8D8B') + heart(98, -55, .5, '#DFC0B8');
    case 'promise': return strokes('M73 27 104 5 105-17', orange, 13) + '<path d="M-112-45Q-108-66-88-55Q-84-34-104-33" fill="none" stroke="#9DAC89" stroke-width="3"/>';
    case 'medal': return '<path d="M-27 39-11 82H10L27 39" fill="#A7BACB"/><circle cx="0" cy="77" r="24" fill="#E5C579" stroke="#C9A65B" stroke-width="3"/>' + star(0, 77, 1, '#F7E3A3') + star(104, -45, .7);
    case 'tea': return cup + '<path d="M-15 35Q-2 20 11 34Q0 46-15 35Z" fill="#9BAE7D"/>' + heart(98, -45, .6, '#AAB88D');
    case 'bye': return strokes('M-74 23-95-4M74 13Q108-9 92-32', orange, 12) + strokes('M109-38 116-48M121-24 132-29', green, 3.5) + heart(-101, -52, .7);
    case 'cape': return '<path d="M-56 30-111 88-34 75M56 30 111 88 34 75" fill="#B2C09A"/>' + star(0, 39, 1.2, '#F4DE9A') + strokes('M-73 8-96-22M73 8 96-22', orange, 13) + star(111, -52, .7);
    default: return '';
  }
}

function svgFor(mood, kind, label, index, character = false) {
  const angle = character ? -3 : [-4, 3, -2, 0, 4][index % 5];
  const body = `<path d="M-73 4C-85-42-56-78-12-72C23-91 80-66 78-18C91 24 66 69 25 76C-19 91-76 59-73 4Z" fill="${orange}" stroke="#DF9558" stroke-width="2.5"/>`;
  const leaf = '<path d="M-6-72C-5-101 15-114 43-108C38-82 18-69-6-72Z" fill="#829965"/><path d="M-3-74 24-98" fill="none" stroke="#6E8354" stroke-width="2.5" stroke-linecap="round"/><path d="M-9-72-16-92" stroke="#806443" stroke-width="5" stroke-linecap="round"/>';
  const limbs = strokes('M-38 69-47 87M36 69 46 86', orange, 13)
    + strokes('M-74 15-91 35M75 15 91 35', orange, 12);
  const mark = '<ellipse cx="-44" cy="-47" rx="12" ry="5" transform="rotate(-35 -44 -47)" fill="#FAD19E" opacity=".8"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <rect width="320" height="320" fill="#fff"/>
    <g transform="translate(156 ${character ? 177 : 162}) rotate(${angle}) scale(${character ? 1.08 : .95})">${limbs}${body}${leaf}${mark}${face(mood)}${props(kind)}</g>
    ${character ? '' : text(label, 160, 291, label.length > 8 ? 21 : 24)}
  </svg>`;
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const render = async (svg, fileName, size) => {
    const dataUrl = await page.evaluate(async ({ source, pixelSize }) => {
      const image = new Image();
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = pixelSize;
        canvas.height = pixelSize;
        canvas.getContext('2d').drawImage(image, 0, 0, pixelSize, pixelSize);
        return canvas.toDataURL('image/png').split(',')[1];
      } finally {
        URL.revokeObjectURL(url);
      }
    }, { source: svg, pixelSize: size });
    await writeFile(path.join(outputDirectory, fileName), Buffer.from(dataUrl, 'base64'));
  };
  await render(svgFor('happy', 'wave', '', 0, true), 'character.png', 512);
  for (let index = 0; index < definitions.length; index += 1) {
    const [label, mood, kind] = definitions[index];
    await render(svgFor(mood, kind, label, index), `sticker-${String(index + 1).padStart(2, '0')}.png`, 320);
  }
} finally {
  await browser.close();
}

const fixtures = {
  mock: true,
  provenance: '로컬 SVG를 PNG로 렌더링한 결정적 디자인 검토용 모의 산출물. 실제 Gemini 생성 결과가 아닙니다.',
  concept: '퇴근요정 귤리는 따뜻한 주황색 몸과 초록 잎을 가진 작고 동글동글한 귤 요정입니다. 커피 한 잔으로 힘을 내고 퇴근을 기다리는 직장인의 하루를 포근한 미소와 솔직한 표정으로 전합니다.',
  description: '작은 기쁨으로 하루를 버티는 직장인 귤 요정. 커피 한 잔부터 퇴근의 환호까지, 매일의 기분을 포근하고 솔직하게 전해요.',
  characterSpecification: {
    physicalDescription: '따뜻한 살구빛 주황색의 동글동글한 귤 캐릭터. 몸과 머리가 하나인 말랑한 실루엣에 짧고 작은 팔다리를 가진다.',
    facialFeatures: '짙은 갈색의 단순하고 또렷한 눈, 작은 입, 복숭아빛 볼. 모든 표정에서 눈과 볼의 위치 및 얼굴 비율을 일정하게 유지한다.',
    colorPalette: '몸 #F4A25F, 잎 #829965, 눈과 입 #513F35, 볼 #E68A77, 배경 #FFFFFF.',
    distinguishingFeatures: '머리에 올리브빛 초록 잎 한 장과 짧은 갈색 줄기가 있으며 이마 왼쪽에 작은 살구빛 반사광이 있다.',
    artStyle: '간결한 선과 평면적인 색면으로 표현한 포근한 스티커 일러스트. 흰 배경, 부드러운 곡선, 또렷한 실루엣, 그림자와 질감은 최소화한다.',
  },
  characterImage: 'character.png',
  stickers: definitions.map(([label, mood, prop], index) => ({
    id: index + 1,
    label,
    mood,
    prop,
    image: `sticker-${String(index + 1).padStart(2, '0')}.png`,
  })),
};
await writeFile(path.join(outputDirectory, 'fixtures.json'), `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(`Created character.png, ${definitions.length} stickers, and fixtures.json in ${outputDirectory}`);
