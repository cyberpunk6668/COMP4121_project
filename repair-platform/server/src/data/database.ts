import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import initSqlJs from 'sql.js';

type SqliteBindParams = initSqlJs.BindParams;
type SqliteDatabase = initSqlJs.Database;
type SqlJsStatic = initSqlJs.SqlJsStatic;
type SqlValue = initSqlJs.SqlValue;

type SqliteRow = Record<string, SqlValue>;
type DatabaseProvider = 'sqlite' | 'mysql';

export type PersistedUserRole = 'customer' | 'engineer' | 'admin';
export type PersistedUserStatus = 'active' | 'disabled';

export interface PersistedUserRecord {
  id: number;
  phone: string;
  nickname: string;
  role: PersistedUserRole;
  passwordHash: string;
  status: PersistedUserStatus;
  createdAt: string;
}

export interface PersistedEngineerRecord {
  id: number;
  userId: number;
  realName: string;
  skillDesc: string;
  serviceArea: string;
  avgRating: number;
  totalOrders: number;
  status: number;
  avatar: string;
}

interface SeedAuthData {
  users: PersistedUserRecord[];
  engineers: PersistedEngineerRecord[];
}

interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  createDatabaseIfNotExists: boolean;
  connectionLimit: number;
}

let sqliteModule: SqlJsStatic | undefined;
let sqliteDatabase: SqliteDatabase | undefined;
let sqliteDatabasePath: string | undefined;
let mysqlPool: Pool | undefined;
let activeProvider: DatabaseProvider | undefined;
let initializationPromise: Promise<void> | undefined;

function resolveServerRoot() {
  return path.resolve(__dirname, '..', '..');
}

function ensureEnvironmentLoaded() {
  dotenv.config({ path: path.resolve(resolveServerRoot(), '.env') });
}

function resolveDatabasePath() {
  ensureEnvironmentLoaded();
  return path.resolve(resolveServerRoot(), process.env.DATABASE_PATH || 'storage/repair-platform.sqlite');
}

function resolveConfiguredProvider(): DatabaseProvider {
  ensureEnvironmentLoaded();

  const configuredProvider = (process.env.AUTH_DATABASE_PROVIDER || 'sqlite').trim().toLowerCase();
  return configuredProvider === 'mysql' ? 'mysql' : 'sqlite';
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function getMySqlConfig(): MySqlConfig {
  ensureEnvironmentLoaded();

  const port = Number(process.env.MYSQL_PORT || 3306);
  const connectionLimit = Number(process.env.MYSQL_CONNECTION_LIMIT || 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('MYSQL_PORT must be a positive number.');
  }

  if (!Number.isFinite(connectionLimit) || connectionLimit <= 0) {
    throw new Error('MYSQL_CONNECTION_LIMIT must be a positive number.');
  }

  return {
    host: (process.env.MYSQL_HOST || '127.0.0.1').trim(),
    port,
    user: (process.env.MYSQL_USER || 'root').trim(),
    password: process.env.MYSQL_PASSWORD || '',
    database: (process.env.MYSQL_DATABASE || 'repair_platform').trim(),
    ssl: parseBoolean(process.env.MYSQL_SSL, false),
    createDatabaseIfNotExists: parseBoolean(process.env.MYSQL_CREATE_DATABASE_IF_NOT_EXISTS, true),
    connectionLimit
  };
}

function buildMySqlConnectionOptions(config: MySqlConfig) {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? {} : undefined
  };
}

async function getSqliteModule() {
  if (sqliteModule) {
    return sqliteModule;
  }

  const wasmFilePath = require.resolve('sql.js/dist/sql-wasm.wasm');
  sqliteModule = await initSqlJs({ locateFile: () => wasmFilePath });
  return sqliteModule;
}

function getSqliteDatabase() {
  if (!sqliteDatabase) {
    throw new Error('SQLite account database has not been initialized yet.');
  }

  return sqliteDatabase;
}

function getMySqlPool() {
  if (!mysqlPool) {
    throw new Error('MySQL account database has not been initialized yet.');
  }

  return mysqlPool;
}

function writeSqliteDatabaseToDisk() {
  if (!sqliteDatabase) {
    return;
  }

  const targetPath = sqliteDatabasePath ?? resolveDatabasePath();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, Buffer.from(sqliteDatabase.export()));
}

function querySqliteAll(sql: string, params?: SqliteBindParams) {
  const statement = getSqliteDatabase().prepare(sql, params);

  try {
    const rows: SqliteRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

function querySqliteOne(sql: string, params?: SqliteBindParams) {
  return querySqliteAll(sql, params)[0];
}

function readSqliteTableCount(tableName: 'users' | 'engineers') {
  const result = querySqliteOne(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result?.count ?? 0);
}

function readSqliteLastInsertId() {
  const result = querySqliteOne('SELECT last_insert_rowid() AS id');
  return Number(result?.id ?? 0);
}

function mapUserRow(row: Record<string, unknown>): PersistedUserRecord {
  return {
    id: Number(row.id),
    phone: String(row.phone ?? ''),
    nickname: String(row.nickname ?? ''),
    role: row.role as PersistedUserRole,
    passwordHash: String(row.passwordHash ?? ''),
    status: row.status as PersistedUserStatus,
    createdAt: String(row.createdAt ?? '')
  };
}

function mapEngineerRow(row: Record<string, unknown>): PersistedEngineerRecord {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    realName: String(row.realName ?? ''),
    skillDesc: String(row.skillDesc ?? ''),
    serviceArea: String(row.serviceArea ?? ''),
    avgRating: Number(row.avgRating ?? 0),
    totalOrders: Number(row.totalOrders ?? 0),
    status: Number(row.status ?? 0),
    avatar: String(row.avatar ?? '')
  };
}

async function initializeSqliteAuthDatabase(seedData: SeedAuthData) {
  const SQL = await getSqliteModule();
  sqliteDatabasePath = resolveDatabasePath();

  const existingBytes = fs.existsSync(sqliteDatabasePath) ? fs.readFileSync(sqliteDatabasePath) : undefined;
  sqliteDatabase = new SQL.Database(existingBytes ? new Uint8Array(existingBytes) : undefined);

  getSqliteDatabase().run('PRAGMA foreign_keys = ON;');
  getSqliteDatabase().run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS engineers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      realName TEXT NOT NULL,
      skillDesc TEXT NOT NULL,
      serviceArea TEXT NOT NULL,
      avgRating REAL NOT NULL DEFAULT 5,
      totalOrders INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 0,
      avatar TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  if (readSqliteTableCount('users') === 0) {
    getSqliteDatabase().run('BEGIN TRANSACTION');

    try {
      for (const user of seedData.users) {
        getSqliteDatabase().run(
          `
            INSERT INTO users (id, phone, nickname, role, passwordHash, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [user.id, user.phone, user.nickname, user.role, user.passwordHash, user.status, user.createdAt]
        );
      }

      for (const engineer of seedData.engineers) {
        getSqliteDatabase().run(
          `
            INSERT INTO engineers (id, userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            engineer.id,
            engineer.userId,
            engineer.realName,
            engineer.skillDesc,
            engineer.serviceArea,
            engineer.avgRating,
            engineer.totalOrders,
            engineer.status,
            engineer.avatar
          ]
        );
      }

      getSqliteDatabase().run('COMMIT');
    } catch (error) {
      getSqliteDatabase().run('ROLLBACK');
      throw error;
    }
  }

  writeSqliteDatabaseToDisk();
}

async function initializeMySqlAuthDatabase(seedData: SeedAuthData) {
  const config = getMySqlConfig();
  const bootstrapConnection = await mysql.createConnection(buildMySqlConnectionOptions(config));

  try {
    if (config.createDatabaseIfNotExists) {
      await bootstrapConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
  } finally {
    await bootstrapConnection.end();
  }

  mysqlPool = mysql.createPool({
    ...buildMySqlConnectionOptions(config),
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  await getMySqlPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(32) NOT NULL UNIQUE,
      nickname VARCHAR(120) NOT NULL,
      role ENUM('customer', 'engineer', 'admin') NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      status ENUM('active', 'disabled') NOT NULL,
      createdAt DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getMySqlPool().query(`
    CREATE TABLE IF NOT EXISTS engineers (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      realName VARCHAR(120) NOT NULL,
      skillDesc TEXT NOT NULL,
      serviceArea VARCHAR(255) NOT NULL,
      avgRating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
      totalOrders INT NOT NULL DEFAULT 0,
      status INT NOT NULL DEFAULT 0,
      avatar TEXT NOT NULL,
      CONSTRAINT fk_engineers_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [userCountRows] = await getMySqlPool().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM users');
  const userCount = Number(userCountRows[0]?.count ?? 0);

  if (userCount === 0) {
    const connection = await getMySqlPool().getConnection();

    try {
      await connection.beginTransaction();

      for (const user of seedData.users) {
        await connection.execute(
          `
            INSERT INTO users (id, phone, nickname, role, passwordHash, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [user.id, user.phone, user.nickname, user.role, user.passwordHash, user.status, user.createdAt]
        );
      }

      for (const engineer of seedData.engineers) {
        await connection.execute(
          `
            INSERT INTO engineers (id, userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            engineer.id,
            engineer.userId,
            engineer.realName,
            engineer.skillDesc,
            engineer.serviceArea,
            engineer.avgRating,
            engineer.totalOrders,
            engineer.status,
            engineer.avatar
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export function isAuthDatabaseInitialized() {
  return Boolean(sqliteDatabase || mysqlPool);
}

export async function initializeAuthDatabase(seedData: SeedAuthData) {
  if (isAuthDatabaseInitialized()) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  const setupPromise = (async () => {
    try {
      activeProvider = resolveConfiguredProvider();

      if (activeProvider === 'mysql') {
        await initializeMySqlAuthDatabase(seedData);
      } else {
        await initializeSqliteAuthDatabase(seedData);
      }
    } catch (error) {
      sqliteDatabase?.close();
      sqliteDatabase = undefined;

      if (mysqlPool) {
        await mysqlPool.end();
        mysqlPool = undefined;
      }

      activeProvider = undefined;
      throw error;
    }
  })();

  initializationPromise = setupPromise.finally(() => {
    initializationPromise = undefined;
  });

  return initializationPromise;
}

export async function loadUsersFromDatabase() {
  if (activeProvider === 'mysql') {
    const [rows] = await getMySqlPool().query<RowDataPacket[]>(`
      SELECT id, phone, nickname, role, passwordHash, status, createdAt
      FROM users
      ORDER BY id ASC
    `);

    return rows.map((row) => mapUserRow(row as unknown as Record<string, unknown>));
  }

  return querySqliteAll(
    `
      SELECT id, phone, nickname, role, passwordHash, status, createdAt
      FROM users
      ORDER BY id ASC
    `
  ).map((row) => mapUserRow(row));
}

export async function loadEngineersFromDatabase() {
  if (activeProvider === 'mysql') {
    const [rows] = await getMySqlPool().query<RowDataPacket[]>(`
      SELECT id, userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar
      FROM engineers
      ORDER BY id ASC
    `);

    return rows.map((row) => mapEngineerRow(row as unknown as Record<string, unknown>));
  }

  return querySqliteAll(
    `
      SELECT id, userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar
      FROM engineers
      ORDER BY id ASC
    `
  ).map((row) => mapEngineerRow(row));
}

export async function insertUserRecord(input: Omit<PersistedUserRecord, 'id'>) {
  if (activeProvider === 'mysql') {
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      `
        INSERT INTO users (phone, nickname, role, passwordHash, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [input.phone, input.nickname, input.role, input.passwordHash, input.status, input.createdAt]
    );

    return {
      id: Number(result.insertId),
      ...input
    };
  }

  getSqliteDatabase().run(
    `
      INSERT INTO users (phone, nickname, role, passwordHash, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [input.phone, input.nickname, input.role, input.passwordHash, input.status, input.createdAt]
  );

  const user: PersistedUserRecord = {
    id: readSqliteLastInsertId(),
    ...input
  };

  writeSqliteDatabaseToDisk();
  return user;
}

export async function insertEngineerRecord(input: Omit<PersistedEngineerRecord, 'id'>) {
  if (activeProvider === 'mysql') {
    const [result] = await getMySqlPool().execute<ResultSetHeader>(
      `
        INSERT INTO engineers (userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [input.userId, input.realName, input.skillDesc, input.serviceArea, input.avgRating, input.totalOrders, input.status, input.avatar]
    );

    return {
      id: Number(result.insertId),
      ...input
    };
  }

  getSqliteDatabase().run(
    `
      INSERT INTO engineers (userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [input.userId, input.realName, input.skillDesc, input.serviceArea, input.avgRating, input.totalOrders, input.status, input.avatar]
  );

  const engineer: PersistedEngineerRecord = {
    id: readSqliteLastInsertId(),
    ...input
  };

  writeSqliteDatabaseToDisk();
  return engineer;
}