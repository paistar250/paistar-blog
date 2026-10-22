import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.TEST_BASE_URL||'https://localhost:8443';
const origin=new URL(base).origin;
const credentials=JSON.parse(readFileSync(process.env.QA_CREDENTIALS_FILE,'utf8'));
const {run}=credentials;
const email=`qa-reader-${run}@example.test`;
const password=credentials.readerPassword||randomBytes(20).toString('hex');
const newAdminPassword=credentials.nextPassword||randomBytes(20).toString('hex');
const slug=`qa-${run}-article`;
const title='迁移验证文章 '+run;
const output=process.env.QA_SCREENSHOTS||'.qa/server-review';
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const create=options=>browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:960},...options});
const errors=[];
const contexts=[];
async function context(options){const value=await create(options);contexts.push(value);value.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));return value}
async function token(context){const response=await context.request.get(base+'/api/auth/session');assert.equal(response.status(),200);return(await response.json()).csrfToken}
async function mutate(context,path,data,method='POST',extra={}){
 return context.request.fetch(base+path,{method,headers:{Origin:origin,'X-CSRF-Token':await token(context)},data,...extra});
}
async function images(page){
 await page.locator('img').evaluateAll(images=>images.forEach(image=>image.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0),null,{timeout:30000});
 await page.evaluate(()=>document.fonts.ready);
}
async function screenshot(page,name){await images(page);await page.screenshot({path:output+'/'+name+'.png',fullPage:true})}
async function login(page,login,password,remember=false){
 await page.goto(base+'/login/',{waitUntil:'networkidle'});
 await page.locator('[name=login]').fill(login);
 await page.locator('[name=password]').fill(password);
 if(remember)await page.locator('[name=remember]').check();
 await page.locator('[data-login] [type=submit]').click();
}

try{
 const anonymous=await context({colorScheme:'dark'});
 const publicPage=await anonymous.newPage();
 await publicPage.goto(base+'/',{waitUntil:'networkidle'});
 assert.ok(await publicPage.locator('[data-login]').isVisible());
 assert.equal(await publicPage.locator('[data-secret-entry]').count(),0);
 await screenshot(publicPage,'login-desktop-dark');
 await publicPage.getByRole('button',{name:'切换白天或黑夜模式'}).click();
 await publicPage.waitForTimeout(500);
 await screenshot(publicPage,'login-desktop-light');
 await publicPage.reload({waitUntil:'networkidle'});
 assert.equal(await publicPage.locator('html').getAttribute('data-theme'),'light');

 let response=await anonymous.request.get(base+'/api/admin/posts/');
 assert.equal(response.status(),401);
 response=await mutate(anonymous,'/api/admin/posts/',{});
 assert.equal(response.status(),401);
 response=await anonymous.request.get(base+'/admin/',{maxRedirects:0});
 assert.equal(response.status(),302);
 response=await anonymous.request.post(base+'/api/auth/register',{headers:{Origin:'https://attacker.example'},data:{}});
 assert.equal(response.status(),403);

 const reader=await context({colorScheme:'dark'});
 const readerPage=await reader.newPage();
 await readerPage.route('**/api/auth/register',async route=>{
  const data=route.request().postDataJSON();
  await route.continue({postData:JSON.stringify({...data,role:'admin',mustChangePassword:false})});
 });
 await readerPage.goto(base+'/signup/',{waitUntil:'networkidle'});
 await readerPage.locator('[name=name]').fill('验证读者');
 await readerPage.locator('[name=email]').fill(email);
 await readerPage.locator('[name=password]').fill(password);
 await readerPage.locator('[name=confirm]').fill(password);
 await readerPage.locator('[data-signup] [type=submit]').click();
 await readerPage.waitForURL('**/login/?registered=1');
 await readerPage.unroute('**/api/auth/register');
 await readerPage.locator('[name=login]').fill(email);
 await readerPage.locator('[name=password]').fill('incorrect-fixture-password');
 await readerPage.locator('[data-login] [type=submit]').click();
 await readerPage.getByText('账号或密码不正确。').waitFor();
 await readerPage.locator('[name=password]').fill(password);
 await readerPage.locator('[name=remember]').check();
 await readerPage.locator('[data-login] [type=submit]').click();
 await readerPage.waitForURL('**/journal/');
 const readerSession=await(await reader.request.get(base+'/api/auth/session')).json();
 assert.equal(readerSession.user.role,'reader');
 assert.equal(readerSession.user.name,'验证读者');
 const sessionCookie=(await reader.cookies()).find(cookie=>cookie.name==='paistar_session');
 assert.ok(sessionCookie.httpOnly&&sessionCookie.secure&&sessionCookie.expires>Date.now()/1000);
 assert.ok(!(await readerPage.evaluate(()=>document.cookie)).includes('paistar_session'));
 assert.equal(await readerPage.evaluate(()=>localStorage.getItem('paistar-demo-accounts-v1')),null);
 await readerPage.evaluate(()=>localStorage.setItem('paistar-demo-session-v1',JSON.stringify({role:'admin',name:'伪造管理员'})));
 response=await reader.request.get(base+'/admin/');
 assert.equal(response.status(),403);
 for(const [path,method,data] of [['/api/admin/posts/','POST',{}],['/api/admin/import','POST',{filename:'x.md',content:'body'}],['/api/admin/preview','POST',{body:'body'}],['/api/admin/posts/hello-world','PUT',{}],['/api/admin/posts/hello-world','DELETE',{}]]){
  response=await mutate(reader,path,data,method);assert.equal(response.status(),403,path);
 }
 response=await reader.request.post(base+'/api/admin/uploads',{headers:{Origin:origin,'X-CSRF-Token':await token(reader)},multipart:{file:{name:'image.webp',mimeType:'image/webp',buffer:readFileSync('public/avatar.webp')}}});
 assert.equal(response.status(),403);

 const otherDevice=await context();
 const otherPage=await otherDevice.newPage();
 await login(otherPage,email,password);
 await otherPage.waitForURL('**/journal/');
 assert.equal((await(await otherDevice.request.get(base+'/api/auth/session')).json()).user.name,'验证读者');

 const admin=await context({colorScheme:'dark'});
 const adminPage=await admin.newPage();
 await login(adminPage,credentials.login,credentials.password);
 await adminPage.waitForURL('**/account/?welcome=1');
 response=await mutate(admin,'/api/admin/posts/',{});assert.equal(response.status(),428);
 await adminPage.locator('[name=currentPassword]').fill(credentials.password);
 await adminPage.locator('[name=password]').fill(newAdminPassword);
 await adminPage.locator('[name=confirm]').fill(newAdminPassword);
 await adminPage.locator('[data-password-form] [type=submit]').click();
 await adminPage.waitForURL('**/admin/');
 await screenshot(adminPage,'admin-desktop-dark');
 response=await admin.request.post(base+'/api/admin/posts/',{headers:{Origin:'https://attacker.example','X-CSRF-Token':await token(admin)},data:{}});
 assert.equal(response.status(),403);
 await adminPage.getByRole('link',{name:'＋ 写文章'}).click();
 await adminPage.waitForURL('**/admin/edit/');
 const markdown='---\ntitle: '+title+'\ndescription: 仅用于服务器迁移验证的临时文章。\ndate: 2026-10-22\ncategory: 技术札记\ntags: [验证, Markdown]\ncover: coding\ndraft: true\n---\n\n## 第一节\n\n这是一篇临时验证文章。\n\n<script>window.__paistarXss=1</script>\n\n```js\nconst migrated = true;\n```\n';
 await adminPage.locator('[data-import-file]').setInputFiles({name:slug+'.md',mimeType:'text/markdown',buffer:Buffer.from(markdown)});
 await adminPage.getByText('文章已导入，检查信息后保存或发布。').waitFor();
 assert.equal(await adminPage.locator('[name=title]').inputValue(),title);
 await adminPage.locator('[data-image-file]').setInputFiles('public/avatar.webp');
 await adminPage.getByText('图片已插入，可修改图片描述。').waitFor();
 const uploadedImage=(await adminPage.locator('[name=body]').inputValue()).match(/\]\((\/uploads\/[^)]+)\)/)?.[1];
 assert.ok(uploadedImage,'Uploaded image URL missing');
 response=await anonymous.request.get(base+uploadedImage);assert.equal(response.status(),200,'Uploaded image cannot be read');
 assert.match(response.headers()['content-type'],/^image\/webp/);
 await adminPage.locator('[data-toggle-preview]').click();
 await adminPage.locator('[data-preview]').waitFor({state:'visible'});
 assert.equal(await adminPage.evaluate(()=>window.__paistarXss),undefined);
 assert.equal(await adminPage.locator('[data-preview] script').count(),0);
 assert.ok(await adminPage.locator('[data-preview] .shiki').count());
 await adminPage.locator('[data-toggle-preview]').click();
 await adminPage.getByRole('button',{name:'存为草稿',exact:true}).click();
 await adminPage.getByText('草稿已保存。',{exact:true}).waitFor();
 response=await anonymous.request.get(base+'/posts/'+slug+'/');assert.equal(response.status(),404);
 await adminPage.getByRole('button',{name:'发布文章 →',exact:true}).click();
 await adminPage.getByText('文章已发布，博客首页与搜索已更新。',{exact:true}).waitFor();
 response=await anonymous.request.get(base+'/posts/'+slug+'/');assert.equal(response.status(),200);
 assert.ok((await response.text()).includes(title));
 assert.match(response.headers()['cache-control'],/no-store/);
 response=await anonymous.request.get(base+'/api/search?q='+encodeURIComponent(run));
 assert.ok((await response.json()).results.some(item=>item.url.includes(slug)));
 for(const path of ['/rss.xml','/sitemap.xml']){response=await anonymous.request.get(base+path);assert.ok((await response.text()).includes(slug),path)}
 response=await anonymous.request.get(base+'/tags/'+encodeURIComponent('验证')+'/');assert.equal(response.status(),200);
 const prior=(await(await admin.request.get(base+'/api/admin/posts/'+slug)).json()).post;
 await adminPage.locator('[name=title]').fill(title+'（修订）');
 await adminPage.getByRole('button',{name:'发布文章 →',exact:true}).click();
 await adminPage.getByText('文章已发布，博客首页与搜索已更新。',{exact:true}).waitFor();
 response=await mutate(admin,'/api/admin/posts/'+slug,{...prior.data,slug,body:prior.body,date:prior.data.date,version:prior.data.updated},'PUT');
 assert.equal(response.status(),409);
 response=await admin.request.post(base+'/api/admin/uploads',{headers:{Origin:origin,'X-CSRF-Token':await token(admin)},multipart:{file:{name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg onload="alert(1)"></svg>')}}});
 assert.equal(response.status(),400);
 await screenshot(adminPage,'editor-desktop-dark');
 await adminPage.getByRole('button',{name:'切换白天或黑夜模式'}).click();
 await adminPage.waitForTimeout(500);
 await screenshot(adminPage,'editor-desktop-light');

 await publicPage.goto(base+'/journal/',{waitUntil:'networkidle'});
 await screenshot(publicPage,'home-desktop-light');
 const links=new Set(await publicPage.locator('a[href]').evaluateAll(links=>links.map(link=>link.getAttribute('href')).filter(href=>href?.startsWith('/')&&!href.startsWith('//'))));
 for(const path of links){response=await anonymous.request.get(base+path);assert.ok(response.status()<400,'Broken homepage link: '+path)}
 for(const article of ['hello-world','astro-static-site','a-place-to-return','design-details','read-and-remember','weekend-walk',slug]){
  response=await anonymous.request.get(base+'/posts/'+article+'/');assert.equal(response.status(),200,article);
  assert.ok((await response.text()).includes('article-prose'),article);
 }
 await readerPage.goto(base+'/journal/',{waitUntil:'networkidle'});
 assert.equal(await readerPage.locator('.admin-nav-link').count(),0);
 const priorCookie=(await reader.cookies()).find(cookie=>cookie.name==='paistar_session');
 await readerPage.getByRole('button',{name:'退出',exact:true}).click();
 await readerPage.waitForURL('**/login/');
 const replay=await context();await replay.addCookies([priorCookie]);
 assert.equal((await(await replay.request.get(base+'/api/auth/session')).json()).user,null);

 const phone=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
 const mobile=await phone.newPage();
 await mobile.goto(base+'/',{waitUntil:'networkidle'});
 await screenshot(mobile,'login-mobile');
 await login(mobile,credentials.login,newAdminPassword);
 await mobile.waitForURL('**/admin/');
 await screenshot(mobile,'admin-mobile');
 await mobile.goto(base+'/admin/edit/?post='+slug,{waitUntil:'networkidle'});
 await screenshot(mobile,'editor-mobile');
 for(const width of [390,320]){
  await mobile.setViewportSize({width,height:844});
  for(const path of ['/journal/','/admin/','/admin/edit/?post='+slug,'/account/','/archive/','/categories/','/tags/','/search/','/posts/hello-world/']){
   response=await mobile.goto(base+path,{waitUntil:'networkidle'});assert.equal(response.status(),200,path);
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow at '+width+': '+path);
  }
 }
 await mobile.setViewportSize({width:390,height:844});
 await screenshot(mobile,'article-mobile');
 await mobile.goto(base+'/journal/',{waitUntil:'networkidle'});
 await mobile.getByRole('button',{name:'展开菜单'}).click();
 assert.ok(await mobile.locator('#mobile-nav').isVisible());
 await mobile.emulateMedia({reducedMotion:'reduce'});
 assert.ok(await mobile.locator('[data-pointer-effects]').evaluate(element=>element.hidden));
 assert.deepEqual(errors,[]);
 writeFileSync(output+'/result.json',JSON.stringify({ok:true,run,checks:['registration','cross-device-login','HttpOnly-and-Secure-cookies','logout-revocation','reader-write-denial','role-injection-denial','CSRF','admin-first-password-change','markdown-import','image-upload','XSS-sanitization','draft-privacy','publish-edit-search-rss-sitemap','edit-conflict','all-article-links','desktop-and-mobile-390-320','themes','reduced-motion']},null,2));
 console.log('Server browser and authorization checks passed. Screenshots: '+output);
}catch(error){
 for(const item of contexts)for(const page of item.pages())if(page.url().includes('/admin/edit/')){
  console.log('Editor status:',await page.locator('.form-status').allTextContents());
  await page.screenshot({path:output+'/failure-editor.png',fullPage:true}).catch(()=>{});
 }
 if(errors.length)console.log('Browser errors:',errors);
 throw error;
}finally{for(const item of contexts)await item.close();await browser.close()}
