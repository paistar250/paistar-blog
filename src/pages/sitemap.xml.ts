import type { APIRoute } from 'astro';
import { getPosts,postUrl,categories,tags } from '../lib/blog';
const escapeXml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export const GET:APIRoute=async context=>{
  const posts=await getPosts();
  const paths=['/journal/','/archive/','/categories/','/tags/','/search/','/about/','/contact/',...posts.map(postUrl),...categories(posts).map(item=>'/categories/'+item.slug+'/'),...tags(posts).map(item=>'/tags/'+item.slug+'/')];
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(path=>'<url><loc>'+escapeXml(new URL(path,context.site).href)+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
