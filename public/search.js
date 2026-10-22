const input=document.querySelector('#search-input');
const searchStatus=document.querySelector('#search-status');
const results=document.querySelector('#search-results');
let timer;
let sequence=0;
async function search(){
  const current=++sequence;
  const query=input.value.trim();
  results.replaceChildren();
  if(!query){searchStatus.textContent='开始输入关键词。';return}
  searchStatus.textContent='正在搜索…';
  try{
    const response=await fetch('/api/search?q='+encodeURIComponent(query),{cache:'no-store'});
    if(!response.ok)throw new Error();
    const data=await response.json();
    if(current!==sequence)return;
    searchStatus.textContent=data.results.length?'找到 '+data.results.length+' 条结果':'没有找到匹配的文章，换个词试试。';
    for(const item of data.results){
      const link=document.createElement('a');link.className='search-result';link.href=item.url;
      const title=document.createElement('strong');title.textContent=item.title;
      const excerpt=document.createElement('span');excerpt.textContent=item.excerpt;
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
      link.append(title,excerpt,arrow);results.append(link);
    }
  }catch{if(current===sequence)searchStatus.textContent='搜索暂时不可用，请稍后重试。'}
}
input?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,180)});
