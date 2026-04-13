import sql from 'mssql';

const globalPool = global as typeof globalThis & {
  connectionPoolPromise: Promise<sql.ConnectionPool> | null;
};

export async function dbConnect(): Promise<sql.ConnectionPool> {
  const connectionString = process.env.MSSQL_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('Please define the MSSQL_CONNECTION_STRING environment variable inside .env.local');
  }

  if (!globalPool.connectionPoolPromise) {
    globalPool.connectionPoolPromise = sql.connect(connectionString);
  }
  
  return globalPool.connectionPoolPromise;
}

export default dbConnect;
