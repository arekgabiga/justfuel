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
      odometer REAL,
      distance_traveled REAL,
      fuel_consumption REAL,
      price_per_liter REAL NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fillups_car_id ON fillups(car_id);
    CREATE INDEX IF NOT EXISTS idx_fillups_date ON fillups(date);
  `);

  
  // Migration: Check if odometer column is nullable. If not (notnull=1), migrate.
  try {
    const tableInfo = await db.getAllAsync<{ name: string, notnull: number }>('PRAGMA table_info(fillups)');
    const odometerCol = tableInfo.find(c => c.name === 'odometer');
    
    if (odometerCol && odometerCol.notnull === 1) {
        // console.log('Migrating fillups table to make odometer nullable...');
        await db.runAsync('PRAGMA foreign_keys=OFF');
        await db.runAsync('BEGIN TRANSACTION');
        
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS fillups_new (
            id TEXT PRIMARY KEY NOT NULL,
            car_id TEXT NOT NULL,
            date TEXT NOT NULL,
            fuel_amount REAL NOT NULL,
            total_price REAL NOT NULL,
            odometer REAL,
            distance_traveled REAL,
            fuel_consumption REAL,
            price_per_liter REAL NOT NULL,
            created_at TEXT NOT NULL
            )
        `);
        
        // Copy data. Note: columns must match order or be explicit. New table matches old except constraint.
        await db.runAsync(`
            INSERT INTO fillups_new (id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter, created_at)
            SELECT id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter, created_at FROM fillups
        `);
        
        await db.runAsync('DROP TABLE fillups');
        await db.runAsync('ALTER TABLE fillups_new RENAME TO fillups');
        
        // Recreate indexes
        await db.runAsync('CREATE INDEX IF NOT EXISTS idx_fillups_car_id ON fillups(car_id)');
        await db.runAsync('CREATE INDEX IF NOT EXISTS idx_fillups_date ON fillups(date)');
        
        await db.runAsync('COMMIT');
        await db.runAsync('PRAGMA foreign_keys=ON');
        // console.log('Migration completed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    try {
        await db.runAsync('ROLLBACK');
    } catch (e) {
        // ignore rollback error if no transaction
    }
  }
};
