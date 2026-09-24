import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('src/assets', { recursive: true });
await mkdir('public', { recursive: true });

const desk = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#e5e9dc"/><stop offset="1" stop-color="#adcab9"/></linearGradient><linearGradient id="window" x2="0" y2="1"><stop stop-color="#eaf4ed"/><stop offset="1" stop-color="#cde5d4"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#bg)"/><circle cx="1330" cy="160" r="290" fill="#f4e6c7" opacity=".55"/><rect x="120" y="80" width="640" height="580" rx="24" fill="#f8f6ea"/><rect x="154" y="114" width="572" height="512" fill="url(#window)"/><path d="M440 114v512M154 385h572" stroke="#d2d8c7" stroke-width="21"/>
<path d="M0 700h1600v200H0z" fill="#315d54"/><path d="M0 700h1600v35H0z" fill="#597e6c"/><path d="M940 690c-150-72-155-200 8-265 116-47 263-25 350 54 80 71 30 164-84 211z" fill="#e9e0c9"/><path d="M940 690c-76-52-62-150 36-192 98-43 211-24 288 28" fill="none" stroke="#b8aa8f" stroke-width="7"/><path d="M1020 525c72 45 111 108 115 165" fill="none" stroke="#b8aa8f" stroke-width="6"/>
<path d="M260 700V498c-76-65-98-165-46-251 59 45 93 108 88 176 14-120 91-188 167-191-12 118-70 205-166 230 87-29 173-7 227 72-85 44-164 35-226-26v192z" fill="#557d65"/><path d="M260 700V442" stroke="#315d54" stroke-width="12"/><path d="M1250 700c-20-140 12-220 109-282-3 98-32 159-82 197 50-67 116-91 191-83-45 94-105 134-205 138" fill="#779682"/>
<rect x="610" y="570" width="235" height="126" rx="15" fill="#c57956"/><path d="M650 590h155M650 618h136M650 646h110" stroke="#f2d5b7" stroke-width="11" stroke-linecap="round"/><rect x="760" y="643" width="160" height="53" rx="10" fill="#f2e9d6"/>
</svg>`;
await sharp(Buffer.from(desk)).png({ compressionLevel: 9 }).toFile('src/assets/desk.png');

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#173b35"/><circle cx="1050" cy="86" r="335" fill="#2f6f61"/><circle cx="1000" cy="125" r="180" fill="#e7d8ae"/><path d="M0 600c335-160 530-195 766-40 141 93 256 54 434-90v160H0z" fill="#4e8c77"/><path d="M0 570c285-89 508-80 744 32H0z" fill="#266254"/><text x="90" y="106" font-family="Georgia,serif" font-size="32" letter-spacing="7" fill="#b9ddcc">PERSONAL JOURNAL</text><text x="84" y="315" font-family="Microsoft YaHei,Arial,sans-serif" font-weight="bold" font-size="98" fill="#f6f5e9">Paistar 手记</text><text x="92" y="398" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" fill="#d3e8da">技术 · 阅读 · 生活</text><path d="M90 454h190" stroke="#e5aa7e" stroke-width="8" stroke-linecap="round"/><text x="92" y="537" font-family="Georgia,serif" font-size="27" fill="#c6ded0">Collect moments. Make meaning.</text></svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og.png');

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="118" fill="#276d63"/><path d="M140 386V126h112c70 0 116 35 116 95 0 59-46 96-116 96h-44v69h-68zm68-127h43c34 0 52-13 52-38 0-24-18-38-52-38h-43v76z" fill="#f7f6f2"/><circle cx="378" cy="369" r="30" fill="#f3bd91"/></svg>`;
for (const size of [192, 512]) await sharp(Buffer.from(icon)).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/icon-${size}.png`);
console.log('Generated article illustration, social card, and PWA icons.');
