export const site = {
  title: 'Paistar 手记',
  author: 'Paistar',
  description: '技术、阅读与日常。',
  email: '', // 发布前替换为自己的公开联系邮箱；也可以留空。
  github: 'https://github.com/paistar250',
  nav: [
    { label: '首页', href: '/journal/' },
    { label: '归档', href: '/archive/' },
    { label: '分类', href: '/categories/' },
    { label: '标签', href: '/tags/' },
    { label: '关于', href: '/about/' },
  ],
} as const;
