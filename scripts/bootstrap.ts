import { ensureDatabase, execute, rows, database } from '../src/server/database.ts';
import { hashPassword, validPassword } from '../src/server/auth.ts';
import { secret } from '../src/server/config.ts';

try {
  await ensureDatabase();
  const username=process.env.ADMIN_USERNAME || 'admin';
  if(!/^[a-z][a-z0-9-]{2,31}$/.test(username))throw new Error('Invalid ADMIN_USERNAME');
  const existing=await rows('SELECT id,role FROM blog_users WHERE username=?',[username]);
  if(!existing.length){
    const password=secret('ADMIN_PASSWORD');
    if(!validPassword(password))throw new Error('Initial admin password is too short');
    await execute("INSERT INTO blog_users(username,name,password_hash,role,must_change_password) VALUES (?,? ,?,'admin',TRUE)",[username,'Paistar',await hashPassword(password)]);
    console.log('Administrator created; initial password must be changed on first login.');
  }else{
    if(existing[0].role!=='admin')throw new Error('Administrator username is occupied');
    console.log('Existing administrator retained.');
  }
  console.log('Database migration complete.');
}catch(error){
  console.error('Bootstrap failed:',error instanceof Error?error.message:'Unknown error');
  process.exitCode=1;
}finally{await database().end();}
