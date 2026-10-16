import sharp from 'sharp';
const icon='public/avatar.webp';
await sharp(icon).resize(48,48).png().toFile('public/favicon.png');
for(const size of [192,512]) await sharp(icon).resize(size,size).png().toFile('public/icon-'+size+'.png');
const overlay='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#132a3a" opacity=".35"/><text x="600" y="260" text-anchor="middle" fill="white" font-family="Georgia,serif" font-size="23" letter-spacing="7">PAISTAR JOURNAL</text><text x="600" y="365" text-anchor="middle" fill="white" font-family="Microsoft YaHei,sans-serif" font-weight="bold" font-size="75">Paistar 手记</text><text x="600" y="430" text-anchor="middle" fill="#edf3f5" font-family="Microsoft YaHei,sans-serif" font-size="25">技术 · 阅读 · 日常</text></svg>';
await sharp('src/assets/scenes/hero.jpg').resize(1200,630,{fit:'cover'}).composite([{input:Buffer.from(overlay)}]).png().toFile('public/og.png');
