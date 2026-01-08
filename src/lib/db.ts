import mysql from 'mysql2/promise';

type Pool = mysql.Pool;

type GlobalWithPool = typeof globalThis & {
  mysqlPool?: Pool;
};

const globalWithPool = globalThis as GlobalWithPool;
let pool: Pool | null = globalWithPool.mysqlPool ?? null;

function getPool(): Pool {
  if (pool) return pool;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    throw new Error(
      'Missing MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE',
    );
  }

  const rawLimit = Number(process.env.MYSQL_CONNECTION_LIMIT || '2');
  const connectionLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.trunc(rawLimit) : 2;
  const rawMaxIdle = Number(process.env.MYSQL_MAX_IDLE || '');
  const maxIdle =
    Number.isFinite(rawMaxIdle) && rawMaxIdle > 0
      ? Math.min(Math.trunc(rawMaxIdle), connectionLimit)
      : Math.min(2, connectionLimit);
  const rawIdleTimeout = Number(process.env.MYSQL_IDLE_TIMEOUT || '60000');
  const idleTimeout =
    Number.isFinite(rawIdleTimeout) && rawIdleTimeout > 0 ? Math.trunc(rawIdleTimeout) : 60000;

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port: Number(process.env.MYSQL_PORT || '3306'),
    connectionLimit,
    maxIdle,
    idleTimeout,
    waitForConnections: true,
    queueLimit: 0,
    timezone: '+00:00',
  });

  globalWithPool.mysqlPool = pool;
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params: Array<string | number | null> = [],
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params: Array<string | number | null> = [],
): Promise<void> {
  await getPool().execute(sql, params);
}
