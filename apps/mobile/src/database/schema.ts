import * as SQLite from 'expo-sqlite';

const DB_NAME = 'justfuel.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Cars Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      initial_odometer REAL DEFAULT 0,
      mileage_input_preference TEXT DEFAULT 'odometer',
      created_at TEXT NOT NULL
    );
  `);

  // Fillups Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS fillups (
      id TEXT PRIMARY KEY NOT NULL,
      car_id TEXT NOT NULL,
      date TEXT NOT NULL,
      fuel_amount REAL NOT NULL,
      total_price REAL NOT NULL,
      odometer REAL NOT NULL,
      distance_traveled REAL,
      fuel_consumption REAL,
      price_per_liter REAL NOT NULL,
      created_at TEXT NOT NULL,
    );
    CREATE INDEX IF NOT EXISTS idx_fillups_car_id ON fillups(car_id);
    CREATE INDEX IF NOT EXISTS idx_fillups_date ON fillups(date);
  `);

};
