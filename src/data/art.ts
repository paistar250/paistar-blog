import hello from '../assets/scenes/hello.jpg';
import coding from '../assets/scenes/coding.jpg';
import reading from '../assets/scenes/reading.jpg';
import life from '../assets/scenes/life.jpg';
import design from '../assets/scenes/design.jpg';
import notes from '../assets/scenes/notes.jpg';
import hero from '../assets/scenes/hero.jpg';

export const art = { hello,coding,reading,life,design,notes,hero };
export type ArtKey = keyof typeof art;
export const artAlts: Record<ArtKey,string> = {
  hello:'夕阳映照湖面上的小船',coding:'温暖安静的木质工作室',
  reading:'灯光下的书桌与阅读空间',life:'夕阳中的山坡与房屋',
  design:'阳光穿过绿意盎然的庭院',notes:'草地与海边的灯塔',
  hero:'云霞与水面之间行驶的列车',
};
export const categoryArt: Record<string,ArtKey> = { 技术札记:'coding',生活随笔:'life',读书笔记:'reading' };
export const categoryEmojis: Record<string,string> = { 技术札记:'💻',生活随笔:'🌿',读书笔记:'📖' };
