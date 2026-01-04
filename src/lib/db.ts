import mysql from 'mysql2/promise';

type Pool = mysql.Pool;

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    throw new Error('Missing MySQL env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  }

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port: Number(process.env.MYSQL_PORT || '3306'),
    connectionLimit: 10,
    waitForConnections: true,
    timezone: '+00:00'
  });

  return pool;
}

export async function query<T = unknown>(sql: string, params: Array<string | number | null> = []): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: Array<string | number | null> = []): Promise<void> {
  await getPool().execute(sql, params);
}
