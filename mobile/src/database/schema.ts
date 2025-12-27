import * as SQLite from 'expo-sqlite';

const DB_NAME = 'justfuel.db';

export const getDBConnection = async () => {
  return SQLite.openDatabaseAsync(DB_NAME);
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
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );
  `);
  
  console.log('Tables created successfully');
};
