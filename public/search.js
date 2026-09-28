const root = document.querySelector('.search-panel');
const input = document.querySelector('#search-input');
const searchStatus = document.querySelector('#search-status');
const results = document.querySelector('#search-results');
let timer;
let sequence = 0;
async function search() {
  if (!input || !searchStatus || !results || !root) return;
  const query = input.value.trim();
  const current = ++sequence;
  results.replaceChildren();
  if (!query) { searchStatus.textContent = '开始输入关键词。'; return; }
  searchStatus.textContent = '正在搜索…';
  try {
    const base = root.dataset.base || '/';
    const path = `${base.replace(/\/$/, '')}/pagefind/pagefind.js`;
    const pagefind = await import(path);
    const response = await pagefind.search(query);
    if (current !== sequence) return;
    searchStatus.textContent = response.results.length ? `找到 ${response.results.length} 条结果` : '没有找到匹配的文章，换个词试试。';
    const items = await Promise.all(response.results.slice(0, 20).map((item) => item.data()));
    if (current !== sequence) return;
    for (const item of items) {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = base.replace(/\/$/, '') + item.url;
      const title = document.createElement('strong');
      title.textContent = item.meta.title || '未命名文章';
      const excerpt = document.createElement('span');
      excerpt.textContent = (item.excerpt || '').replace(/<[^>]*>/g, '');
      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(title, excerpt, arrow);
      results.append(link);
    }
  } catch (error) {
    console.error('Search index failed', error);
    searchStatus.textContent = '搜索索引暂时不可用，请稍后重试。';
  }
}
input?.addEventListener('input', () => {
  clearTimeout(timer);
  timer = window.setTimeout(search, 180);
});
