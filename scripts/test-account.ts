import {randomBytes} from 'node:crypto';
import {ensureDatabase,execute,rows,database} from '../src/server/database.ts';
import {hashPassword} from '../src/server/auth.ts';

const [mode,run]=process.argv.slice(2);
if(!['create','cleanup'].includes(mode)||!/^[a-f0-9]{12}$/.test(run||''))throw new Error('Invalid isolated QA run');
try{
 await ensureDatabase();
 const username=`qa-admin-${run}`;
 if(mode==='create'){
  const password=randomBytes(24).toString('hex');
  await execute("INSERT INTO blog_users(username,name,password_hash,role,must_change_password) VALUES (?,?,?,'admin',TRUE)",[username,'验证管理员',await hashPassword(password)]);
  console.log(JSON.stringify({login:username,password,run}));
 }else{
  const posts=await rows('SELECT slug FROM blog_posts WHERE slug LIKE ?',[`qa-${run}-%`]);
  for(const post of posts)await execute('DELETE FROM blog_posts WHERE slug=?',[post.slug]);
  await execute('DELETE FROM blog_post_revisions WHERE slug LIKE ?',[`qa-${run}-%`]);
  await execute('UPDATE blog_posts SET author_id=NULL WHERE author_id IN (SELECT id FROM blog_users WHERE username=?)',[username]);
  await execute('DELETE FROM blog_users WHERE username=? OR email=?',[username,`qa-reader-${run}@example.test`]);
  console.log('Isolated QA fixtures removed.');
 }
}finally{await database().end();}
