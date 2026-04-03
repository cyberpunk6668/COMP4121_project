import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import initSqlJs from 'sql.js';

type BindParams = initSqlJs.BindParams;
type SqlDatabase = initSqlJs.Database;
type SqlJsStatic = initSqlJs.SqlJsStatic;
type SqlValue = initSqlJs.SqlValue;

type SqlRow = Record<string, SqlValue>;

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

let sqliteModule: SqlJsStatic | undefined;
let database: SqlDatabase | undefined;
let databasePath: string | undefined;
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

async function getSqliteModule() {
  if (sqliteModule) {
    return sqliteModule;
  }

  const wasmFilePath = require.resolve('sql.js/dist/sql-wasm.wasm');
  sqliteModule = await initSqlJs({ locateFile: () => wasmFilePath });
  return sqliteModule;
}

function getDatabase() {
  if (!database) {
    throw new Error('Account database has not been initialized yet.');
  }

  return database;
}

function writeDatabaseToDisk() {
  if (!database) {
    return;
  }

  const targetPath = databasePath ?? resolveDatabasePath();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, Buffer.from(database.export()));
}

function queryAll(sql: string, params?: BindParams) {
  const statement = getDatabase().prepare(sql, params);

  try {
    const rows: SqlRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

function queryOne(sql: string, params?: BindParams) {
  return queryAll(sql, params)[0];
}

function readTableCount(tableName: 'users' | 'engineers') {
  const result = queryOne(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(result?.count ?? 0);
}

function readLastInsertId() {
  const result = queryOne('SELECT last_insert_rowid() AS id');
  return Number(result?.id ?? 0);
}

function mapUserRow(row: SqlRow): PersistedUserRecord {
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

function mapEngineerRow(row: SqlRow): PersistedEngineerRecord {
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

export function isAuthDatabaseInitialized() {
  return Boolean(database);
}

export async function initializeAuthDatabase(seedData: SeedAuthData) {
  if (database) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const SQL = await getSqliteModule();
      databasePath = resolveDatabasePath();

      const existingBytes = fs.existsSync(databasePath) ? fs.readFileSync(databasePath) : undefined;
      database = new SQL.Database(existingBytes ? new Uint8Array(existingBytes) : undefined);

      getDatabase().run('PRAGMA foreign_keys = ON;');
      getDatabase().run(`
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

      if (readTableCount('users') === 0) {
        getDatabase().run('BEGIN TRANSACTION');

        try {
          for (const user of seedData.users) {
            getDatabase().run(
              `
                INSERT INTO users (id, phone, nickname, role, passwordHash, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `,
              [user.id, user.phone, user.nickname, user.role, user.passwordHash, user.status, user.createdAt]
            );
          }

          for (const engineer of seedData.engineers) {
            getDatabase().run(
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

          getDatabase().run('COMMIT');
        } catch (error) {
          getDatabase().run('ROLLBACK');
          throw error;
        }
      }

      writeDatabaseToDisk();
    } catch (error) {
      database?.close();
      database = undefined;
      throw error;
    }
  })();

  return initializationPromise;
}

export function loadUsersFromDatabase() {
  return queryAll(
    `
      SELECT id, phone, nickname, role, passwordHash, status, createdAt
      FROM users
      ORDER BY id ASC
    `
  ).map((row) => mapUserRow(row));
}

export function loadEngineersFromDatabase() {
  return queryAll(
    `
      SELECT id, userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar
      FROM engineers
      ORDER BY id ASC
    `
  ).map((row) => mapEngineerRow(row));
}

export function insertUserRecord(input: Omit<PersistedUserRecord, 'id'>) {
  getDatabase().run(
    `
      INSERT INTO users (phone, nickname, role, passwordHash, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [input.phone, input.nickname, input.role, input.passwordHash, input.status, input.createdAt]
  );

  const user: PersistedUserRecord = {
    id: readLastInsertId(),
    ...input
  };

  writeDatabaseToDisk();
  return user;
}

export function insertEngineerRecord(input: Omit<PersistedEngineerRecord, 'id'>) {
  getDatabase().run(
    `
      INSERT INTO engineers (userId, realName, skillDesc, serviceArea, avgRating, totalOrders, status, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [input.userId, input.realName, input.skillDesc, input.serviceArea, input.avgRating, input.totalOrders, input.status, input.avatar]
  );

  const engineer: PersistedEngineerRecord = {
    id: readLastInsertId(),
    ...input
  };

  writeDatabaseToDisk();
  return engineer;
}