import { ConnectionPool, config } from 'mssql';

const dbConfig: config = {
  user: 'readonlyuser',
  password: 'Caltrans2018',
  server: 'sv03tmcswridb',
  database: 'SGDB',
  port : 8009
};

const pool = new ConnectionPool(dbConfig);

async function connectToDatabase() {
  try {
    await pool.connect();
    console.log('Connected to SQL Server');
  } catch (error) {
    console.error('SQL Server connection error:', error);
  }
}

connectToDatabase();
export default pool;
