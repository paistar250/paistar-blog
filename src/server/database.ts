import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';
import seeds from '../../.generated/seed-posts.json' with { type: 'json' };
import { secret } from './config.ts';

let pool: Pool | undefined;
let ready: Promise<void> | undefined;

export function database(): Pool {
  if (!pool) pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'paistar',
    database: process.env.DB_NAME || 'paistar',
    password: secret('DB_PASSWORD'),
    connectionLimit: 8, timezone: 'Z', charset: 'utf8mb4',
    supportBigNumbers: true, bigNumberStrings: true,
    multipleStatements: false,
  });
  return pool;
}

export async function rows<T extends RowDataPacket = RowDataPacket>(sql: string, values: ExecuteValues[] = []): Promise<T[]> {
  const [result] = await database().execute<T[]>(sql, values);
  return result;
}

export async function execute(sql: string, values: ExecuteValues[] = []): Promise<ResultSetHeader> {
  const [result] = await database().execute<ResultSetHeader>(sql, values);
  return result;
}

export async function ensureDatabase(): Promise<void> {
  if (!ready) ready = initialize().catch(error => { ready = undefined; throw error; });
  return ready;
}

async function initialize(): Promise<void> {
  const definitions = [
    `CREATE TABLE IF NOT EXISTS blog_migrations (name VARCHAR(80) PRIMARY KEY, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3))`,
    `CREATE TABLE IF NOT EXISTS blog_users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NULL UNIQUE, email VARCHAR(254) NULL UNIQUE,
      name VARCHAR(48) NOT NULL, password_hash VARCHAR(255) NOT NULL,
      role ENUM('reader','admin') NOT NULL DEFAULT 'reader',
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    )`,
    `CREATE TABLE IF NOT EXISTS blog_sessions (
      token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL, expires_at DATETIME(3) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES blog_users(id) ON DELETE CASCADE,
      INDEX session_expiry (expires_at)
    )`,
    `CREATE TABLE IF NOT EXISTS blog_rate_limits (
      bucket CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      hits INT UNSIGNED NOT NULL, resets_at DATETIME(3) NOT NULL,
      INDEX rate_expiry (resets_at)
    )`,
    `CREATE TABLE IF NOT EXISTS blog_posts (
      slug VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      title VARCHAR(160) NOT NULL, description VARCHAR(500) NOT NULL,
      body MEDIUMTEXT NOT NULL, category VARCHAR(48) NOT NULL,
      tags JSON NOT NULL, cover VARCHAR(20) NOT NULL DEFAULT 'notes',
      featured BOOLEAN NOT NULL DEFAULT FALSE, pinned BOOLEAN NOT NULL DEFAULT FALSE,
      draft BOOLEAN NOT NULL DEFAULT TRUE, reading_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
      published_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      author_id INT UNSIGNED NULL,
      FOREIGN KEY (author_id) REFERENCES blog_users(id) ON DELETE SET NULL,
      INDEX published_order (draft, published_at)
    )`,
    `CREATE TABLE IF NOT EXISTS blog_post_revisions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(120) NOT NULL, snapshot JSON NOT NULL,
      editor_id INT UNSIGNED NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX revision_post (slug, created_at)
    )`,
  ];
  for (const sql of definitions) await database().query(sql);
  const connection = await database().getConnection();
  try {
    await connection.query(`SELECT GET_LOCK('paistar-blog-seed', 30)`);
    const [migrations] = await connection.query<RowDataPacket[]>(`SELECT name FROM blog_migrations WHERE name='seed-existing-posts-v1'`);
    if (!migrations.length) {
      await connection.beginTransaction();
      for (const post of seeds) {
        const data = post as Record<string, unknown>;
        await connection.execute(`INSERT IGNORE INTO blog_posts
          (slug,title,description,body,category,tags,cover,featured,pinned,draft,reading_minutes,published_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [
          String(data.slug), String(data.title), String(data.description), String(data.body), String(data.category),
          JSON.stringify(data.tags || []), String(data.cover || 'notes'), Boolean(data.featured),
          Boolean(data.pinned), Boolean(data.draft), Number(data.readingMinutes || 5), new Date(String(data.date)),
        ]);
      }
      await connection.execute(`INSERT INTO blog_migrations(name) VALUES ('seed-existing-posts-v1')`);
      await connection.commit();
    }
    await connection.execute('DELETE FROM blog_sessions WHERE expires_at < UTC_TIMESTAMP(3)');
    await connection.execute('DELETE FROM blog_rate_limits WHERE resets_at < UTC_TIMESTAMP(3)');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query(`SELECT RELEASE_LOCK('paistar-blog-seed')`);
    connection.release();
  }
}
