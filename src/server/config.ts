import { readFileSync } from 'node:fs';

export function secret(name: string): string {
  const filename = process.env[`${name}_FILE`];
  const value = filename ? readFileSync(filename, 'utf8').trim() : process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

export const appOrigin = () => new URL(process.env.APP_ORIGIN || 'http://localhost:4321').origin;
export const secureCookies = () => appOrigin().startsWith('https://');
export const uploadDirectory = () => process.env.UPLOAD_DIR || '/data/uploads';
